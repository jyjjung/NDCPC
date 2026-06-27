
import type { Resource, RosterMember, ResourceCategory } from './types';

// This file is now a placeholder and will be replaced by Firestore.
let resources: Resource[] = [];

export const getResources = (category?: ResourceCategory) => {
  if (category) {
    return resources.filter(r => r.category === category);
  }
  return resources;
}

export const addResource = (resource: Resource) => {
  // This is now handled by Firestore.
  return resource;
}


export const roster: RosterMember[] = [];
