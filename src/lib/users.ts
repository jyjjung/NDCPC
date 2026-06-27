import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { ADMIN_EMAIL } from '@/lib/constants';
import { areNamesSimilar } from '@/lib/name-similarity';
import type { UserProfile, UserRole, Volunteer } from '@/lib/types';

export type VolunteerLinkOption = 'merge' | 'delete_old' | 'keep_both';

export function isBootstrapAdminEmail(email: string) {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function ensureUserProfile(
  firestore: Firestore,
  user: User,
  displayName?: string
): Promise<UserProfile> {
  const userRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  const email = user.email?.toLowerCase() ?? '';
  const isBootstrapAdmin = email === ADMIN_EMAIL.toLowerCase();
  const resolvedName = displayName?.trim() || user.displayName?.trim() || email.split('@')[0] || 'Member';

  if (!snapshot.exists()) {
    const profile = {
      uid: user.uid,
      email,
      displayName: resolvedName,
      approved: isBootstrapAdmin,
      role: isBootstrapAdmin ? 'admin' : 'member',
      notificationPrefs: { chat: true },
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);
    return { id: user.uid, ...profile } as UserProfile;
  }

  const data = snapshot.data() as Omit<UserProfile, 'id'>;
  if (isBootstrapAdmin && (data.role !== 'admin' || !data.approved)) {
    await updateDoc(userRef, { role: 'admin', approved: true });
    return { id: user.uid, ...data, role: 'admin', approved: true };
  }

  return { id: user.uid, ...data };
}

export function findSimilarVolunteers(name: string, volunteers: Volunteer[]) {
  return volunteers.filter((volunteer) => areNamesSimilar(name, volunteer.name));
}

export async function linkVolunteerForUser(
  firestore: Firestore,
  profile: UserProfile,
  option: VolunteerLinkOption,
  existingVolunteer?: Volunteer
) {
  const name = profile.displayName.trim();
  if (!name) return;

  if (option === 'merge' && existingVolunteer) {
    await updateDoc(doc(firestore, 'volunteers', existingVolunteer.id), {
      name,
      userId: profile.uid,
      email: profile.email,
    });
    return;
  }

  if (option === 'delete_old' && existingVolunteer) {
    await deleteDoc(doc(firestore, 'volunteers', existingVolunteer.id));
  }

  await addDoc(collection(firestore, 'volunteers'), {
    name,
    userId: profile.uid,
    email: profile.email,
  });
}

export async function approveUser(
  firestore: Firestore,
  profile: UserProfile,
  volunteers: Volunteer[],
  option?: VolunteerLinkOption
) {
  await updateDoc(doc(firestore, 'users', profile.uid), { approved: true });

  const similar = findSimilarVolunteers(profile.displayName, volunteers);
  const linkedVolunteer = volunteers.find((volunteer) => volunteer.userId === profile.uid);

  if (linkedVolunteer) return;

  if (similar.length === 0) {
    await linkVolunteerForUser(firestore, profile, 'keep_both');
    return;
  }

  if (!option) {
    throw new Error('Volunteer link option required');
  }

  await linkVolunteerForUser(firestore, profile, option, similar[0]);
}

export async function setUserRole(firestore: Firestore, uid: string, role: UserRole) {
  await updateDoc(doc(firestore, 'users', uid), { role });
}

export function getLinkedVolunteer(profile: UserProfile, volunteers: Volunteer[]) {
  return volunteers.find((volunteer) => volunteer.userId === profile.uid);
}

export function getUnlinkedVolunteers(volunteers: Volunteer[]) {
  return volunteers.filter((volunteer) => !volunteer.userId);
}

export async function updateMemberDisplayName(
  firestore: Firestore,
  uid: string,
  displayName: string,
  volunteers: Volunteer[]
) {
  const trimmed = displayName.trim();
  if (trimmed.length < 2) {
    throw new Error('Display name too short');
  }

  await updateDoc(doc(firestore, 'users', uid), { displayName: trimmed });

  const linkedVolunteer = volunteers.find((volunteer) => volunteer.userId === uid);
  if (linkedVolunteer) {
    await updateDoc(doc(firestore, 'volunteers', linkedVolunteer.id), { name: trimmed });
  }
}

export async function linkUserToVolunteer(
  firestore: Firestore,
  profile: UserProfile,
  volunteer: Volunteer,
  volunteers: Volunteer[]
) {
  if (volunteer.userId && volunteer.userId !== profile.uid) {
    throw new Error('Volunteer already linked to another account');
  }

  const existingLink = volunteers.find(
    (entry) => entry.userId === profile.uid && entry.id !== volunteer.id
  );
  if (existingLink) {
    await updateDoc(doc(firestore, 'volunteers', existingLink.id), {
      userId: deleteField(),
      email: deleteField(),
    });
  }

  await updateDoc(doc(firestore, 'volunteers', volunteer.id), {
    userId: profile.uid,
    email: profile.email,
    name: profile.displayName.trim() || volunteer.name,
  });
}

export async function unlinkUserFromVolunteer(firestore: Firestore, volunteer: Volunteer) {
  await updateDoc(doc(firestore, 'volunteers', volunteer.id), {
    userId: deleteField(),
    email: deleteField(),
  });
}

export async function approveAndLinkUser(
  firestore: Firestore,
  profile: UserProfile,
  volunteer: Volunteer,
  volunteers: Volunteer[]
) {
  await updateDoc(doc(firestore, 'users', profile.uid), { approved: true });
  await linkUserToVolunteer(firestore, profile, volunteer, volunteers);
}
