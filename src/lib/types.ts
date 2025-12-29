
export type ResourceCategory = 'chants' | 'songs' | 'schedules' | 'announcements' | 'videos';

export type Resource = {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  categoryId?: string;
};

export type RosterMember = {
  id: string;
  name: string;
  role: string;
  week: string;
};
