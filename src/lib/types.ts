export type ResourceCategory = 'chants' | 'songs' | 'schedules' | 'announcements';

export type Resource = {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
};

export type RosterMember = {
  id: string;
  name: string;
  role: string;
  week: string;
};
