
export type ResourceCategory = 'chants' | 'songs' | 'schedules' | 'announcements' | 'videos';

export type Resource = {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  createdAt: any; // Firestore Timestamp
};

export type Schedule = {
  id: string;
  date: any; // Firestore Timestamp or Date
  worship: string;
  offering: string;
  sermonChant: string;
  activity: string;
};

export type Volunteer = {
    id: string;
    name: string;
};
