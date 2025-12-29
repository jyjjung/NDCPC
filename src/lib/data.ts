import type { Resource, RosterMember } from './types';

export const resources: Resource[] = [
  { id: 'song-1', title: 'Jesus Loves Me', url: '#', category: 'songs' },
  { id: 'song-2', title: 'This Little Light of Mine', url: '#', category: 'songs' },
  { id: 'song-3', title: 'Father Abraham', url: '#', category: 'songs' },
  { id: 'chant-1', title: 'We will, we will, praise you!', url: '#', category: 'chants' },
  { id: 'schedule-1', title: 'July 2024 Sunday Schedule', url: '#', category: 'schedules' },
  { id: 'announce-1', title: 'Summer Picnic Day', url: '#', category: 'announcements' },
  { id: 'announce-2', title: 'Volunteer Sign-up', url: '#', category: 'announcements' },
  { id: 'video-1', title: 'The Story of Noah\'s Ark', url: '#', category: 'videos' },
  { id: 'video-2', title: 'David and Goliath Animation', url: '#', category: 'videos' },
];

export const roster: RosterMember[] = [
  { id: 'roster-1', name: 'Alice Johnson', role: 'Lead Teacher', week: 'July 1-7' },
  { id: 'roster-2', name: 'Bob Williams', role: 'Assistant', week: 'July 1-7' },
  { id: 'roster-3', name: 'Charlie Brown', role: 'Music Leader', week: 'July 1-7' },
  { id: 'roster-4', name: 'Diana Miller', role: 'Lead Teacher', week: 'July 8-14' },
  { id: 'roster-5', name: 'Ethan Davis', role: 'Assistant', week: 'July 8-14' },
  { id: 'roster-6', name: 'Fiona Garcia', role: 'Check-in', week: 'July 8-14' },
];
