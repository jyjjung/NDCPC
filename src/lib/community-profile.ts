import type { UserRole, UserProfile, NotificationPrefs } from '@/lib/types';

type CommunityUserDoc = {
  uid?: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  isApproved?: boolean;
  approved?: boolean;
  access?: { cell?: boolean; ndcpc?: boolean };
  ndcpcRole?: UserRole;
  role?: UserRole;
  notificationPrefs?: NotificationPrefs;
  preferences?: {
    notifications?: {
      ndcpc?: NotificationPrefs;
    };
  };
  avatars?: {
    ndcpc?: { mode?: string; imageUrl?: string };
  };
  photoURL?: string;
  createdAt?: unknown;
};

/** Map cell-abca4 community user doc → NDCPC UI profile shape. */
export function mapCommunityUserProfile(uid: string, data: CommunityUserDoc): UserProfile {
  const email = (data.email ?? '').toLowerCase();
  const firstName = data.firstName?.trim() ?? '';
  const lastName = data.lastName?.trim() ?? '';
  const legacyDisplay = data.displayName?.trim() ?? '';
  const displayName =
    firstName ? `${firstName}${lastName ? ` ${lastName}` : ''}`.trim() : legacyDisplay || email.split('@')[0] || 'Member';

  const approved = Boolean(data.isApproved ?? data.approved) && data.access?.ndcpc === true;
  const role = (data.ndcpcRole ?? data.role ?? 'member') as UserRole;
  const chatPref =
    data.preferences?.notifications?.ndcpc?.chat ??
    data.notificationPrefs?.chat;

  const ndcpcAvatar = data.avatars?.ndcpc;
  const photoURL =
    ndcpcAvatar?.mode === 'image' && ndcpcAvatar.imageUrl?.trim()
      ? ndcpcAvatar.imageUrl.trim()
      : data.photoURL?.trim() || undefined;

  return {
    id: uid,
    uid,
    email,
    displayName,
    approved,
    role,
    photoURL,
    notificationPrefs: { chat: chatPref !== false },
    createdAt: data.createdAt,
  };
}

export function communityProfileWrite(displayName: string, isBootstrapAdmin: boolean) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? displayName.trim();
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

  return {
    firstName,
    lastName,
    displayName: displayName.trim(),
    isApproved: isBootstrapAdmin,
    access: { ndcpc: true },
    ndcpcRole: isBootstrapAdmin ? 'admin' : 'member',
    preferences: {
      notifications: {
        ndcpc: { chat: true, announcements: true, dutyReminders: true, rosterReminders: true },
      },
    },
  };
}
