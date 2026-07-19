
export type ResourceCategory = 'chants' | 'songs' | 'schedules' | 'announcements';

export type Resource = {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  createdAt: any; // Firestore Timestamp
  description?: string;
  startSeconds?: number;
  endSeconds?: number;
};

export type Schedule = {
  id: string;
  date: any; // Firestore Timestamp or Date
  worship: string;
  offering: string;
  sermon: string;
  chant: string;
  activity: string;
};

export type Volunteer = {
  id: string;
  name: string;
  userId?: string;
  email?: string;
};

export type UserRole = 'admin' | 'member';

export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  approved: boolean;
  role: UserRole;
  photoURL?: string;
  notificationPrefs?: NotificationPrefs;
  createdAt?: unknown;
};

export type NotificationPrefs = {
  chat?: boolean;
};

export type Photo = {
  id: string;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt?: unknown;
  caption?: string;
};

export type ChatReplyTo = {
  messageId: string;
  authorName: string;
  text: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  authorUid: string;
  authorName: string;
  createdAt?: { seconds?: number; toDate?: () => Date };
  replyTo?: ChatReplyTo;
  reactions?: Record<string, string[]>;
  seenBy?: Record<string, { name?: string; at?: unknown }>;
  /** Soft-deleted messages stay in the timeline as a placeholder. */
  deleted?: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: any; // Firestore Timestamp
};

export type PrayerTopic = {
  id: string;
  topic: string;
  date: any; // Firestore Timestamp
};

export type Setlist = {
  id: string;
  date: any; // Firestore Timestamp
  songIds?: string[];
  chantIds?: string[];
  resourceIds?: string[]; // legacy
  createdAt?: any;
};

export type WorshipFormatItem = {
  id?: string;
  label?: string;
  timeFrom?: string;
  timeTo?: string;
  roles?: ('worship' | 'offering' | 'sermon' | 'chant' | 'activity')[];
};

export type WorshipFormat = {
  id: string;
  items: WorshipFormatItem[] | string[];
  updatedAt?: any;
};
