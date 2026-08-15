import {
  addDoc,
  arrayUnion,
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
import { communityProfileWrite, mapCommunityUserProfile } from '@/lib/community-profile';
import type { UserProfile, UserRole, Volunteer } from '@/lib/types';

export type VolunteerLinkOption = 'merge' | 'delete_old' | 'keep_both';

export function isBootstrapAdminEmail(email: string) {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function isPlaceholderDisplayName(displayName: string, email: string) {
  const trimmed = displayName.trim();
  if (!trimmed) return true;

  const normalizedEmail = email.toLowerCase();
  const emailPrefix = normalizedEmail.split('@')[0] ?? '';

  return trimmed === normalizedEmail || trimmed === emailPrefix;
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
  const trimmedInput = displayName?.trim();
  const authName = user.displayName?.trim();
  const resolvedName =
    trimmedInput || authName || email.split('@')[0] || 'Member';

  if (!snapshot.exists()) {
    const profile = {
      uid: user.uid,
      email,
      ...communityProfileWrite(resolvedName, isBootstrapAdmin),
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);
    return mapCommunityUserProfile(user.uid, profile);
  }

  const data = snapshot.data();
  const mapped = mapCommunityUserProfile(user.uid, data);

  if (isBootstrapAdmin && (mapped.role !== 'admin' || !mapped.approved)) {
    await updateDoc(userRef, { ndcpcRole: 'admin', isApproved: true, 'access.ndcpc': true });
    return { ...mapped, role: 'admin', approved: true };
  }

  const preferredName = trimmedInput || authName;
  if (
    preferredName &&
    preferredName !== mapped.displayName &&
    (trimmedInput || isPlaceholderDisplayName(mapped.displayName ?? '', email))
  ) {
    const write = communityProfileWrite(preferredName, false);
    await updateDoc(userRef, {
      firstName: write.firstName,
      lastName: write.lastName,
      displayName: write.displayName,
    });
    return { ...mapped, displayName: write.displayName };
  }

  return mapped;
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
    await updateDoc(doc(firestore, 'ndcpcVolunteers', existingVolunteer.id), {
      name,
      userId: profile.uid,
      email: profile.email,
    });
    return;
  }

  if (option === 'delete_old' && existingVolunteer) {
    await deleteDoc(doc(firestore, 'ndcpcVolunteers', existingVolunteer.id));
  }

  await addDoc(collection(firestore, 'ndcpcVolunteers'), {
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
  const userRef = doc(firestore, 'users', profile.uid);
  const snap = await getDoc(userRef);
  const access = { ...(snap.data()?.access ?? {}), ndcpc: true };
  await updateDoc(userRef, {
    isApproved: true,
    access,
  });

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
  await updateDoc(doc(firestore, 'users', uid), { ndcpcRole: role });
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

  const write = communityProfileWrite(trimmed, false);
  await updateDoc(doc(firestore, 'users', uid), {
    firstName: write.firstName,
    lastName: write.lastName,
    displayName: write.displayName,
  });

  const linkedVolunteer = volunteers.find((volunteer) => volunteer.userId === uid);
  if (linkedVolunteer) {
    await updateDoc(doc(firestore, 'ndcpcVolunteers', linkedVolunteer.id), { name: trimmed });
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
    await updateDoc(doc(firestore, 'ndcpcVolunteers', existingLink.id), {
      userId: deleteField(),
      email: deleteField(),
    });
  }

  await updateDoc(doc(firestore, 'ndcpcVolunteers', volunteer.id), {
    userId: profile.uid,
    email: profile.email,
    name: profile.displayName.trim() || volunteer.name,
  });
}

export async function unlinkUserFromVolunteer(firestore: Firestore, volunteer: Volunteer) {
  await updateDoc(doc(firestore, 'ndcpcVolunteers', volunteer.id), {
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
  const userRef = doc(firestore, 'users', profile.uid);
  const snap = await getDoc(userRef);
  const access = { ...(snap.data()?.access ?? {}), ndcpc: true };
  await updateDoc(userRef, {
    isApproved: true,
    access,
  });
  await linkUserToVolunteer(firestore, profile, volunteer, volunteers);
}
