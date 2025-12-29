
import type { Resource, RosterMember, ResourceCategory } from './types';

// In a real app, this would come from a database.
// For this demo, we'll manage it in-memory.
let resources: Resource[] = [
  { id: 'song-1', title: 'Jesus Loves Me', url: 'https://www.youtube.com/watch?v=5zSZnz3pkoY', category: 'songs' },
  { id: 'song-2', title: 'This Little Light of Mine', url: 'https://www.youtube.com/watch?v=cKkbIZtqhyQ', category: 'songs' },
  { id: 'song-3', title: 'Father Abraham', url: 'https://www.youtube.com/watch?v=v_j2i3B1-A4', category: 'songs' },
  { id: 'chant-1', title: 'We will, we will, praise you!', url: 'https://example.com/chant1', category: 'chants' },
  { id: 'schedule-1', title: 'July 2024 Sunday Schedule', url: '/july_2024_schedule.pdf', category: 'schedules' },
  { id: 'announce-1', title: 'Summer Picnic Day', url: 'https://example.com/picnic-announcement', category: 'announcements' },
  { id: 'announce-2', title: 'Volunteer Sign-up', url: 'https://example.com/volunteer-signup', category: 'announcements' },
  { id: 'video-1', title: 'The Story of Noah\'s Ark', url: 'https://www.youtube.com/watch?v=FmGgDk2pr6c', category: 'videos' },
];

export const getResources = (category?: ResourceCategory) => {
  if (category) {
    return resources.filter(r => r.category === category);
  }
  return resources;
}

export const addResource = (resource: Resource) => {
  resources.unshift(resource); // Add to the beginning of the list
  return resource;
}


export const roster: RosterMember[] = [
  { id: 'roster-1', name: 'Alice Johnson', role: 'Lead Teacher', week: 'July 1-7' },
  { id: 'roster-2', name: 'Bob Williams', role: 'Assistant', week: 'July 1-7' },
  { id: 'roster-3', name: 'Charlie Brown', role: 'Music Leader', week: 'July 1-7' },
  { id: 'roster-4', name: 'Diana Miller', role: 'Lead Teacher', week: 'July 8-14' },
  { id: 'roster-5', name: 'Ethan Davis', role: 'Assistant', week: 'July 8-14' },
  { id: 'roster-6', name: 'Fiona Garcia', role: 'Check-in', week: 'July 8-14' },
];
