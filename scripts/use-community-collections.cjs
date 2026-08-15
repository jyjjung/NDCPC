#!/usr/bin/env node
/** Rewrites legacy Firestore collection names to cell-abca4 ndcpc* names in NDCPC-main src. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

const COLLECTIONS = {
  volunteers: 'ndcpcVolunteers',
  schedules: 'ndcpcSchedules',
  announcements: 'ndcpcAnnouncements',
  prayerTopics: 'ndcpcPrayerTopics',
  resources: 'ndcpcResources',
  setlists: 'ndcpcSetlists',
  photos: 'ndcpcPhotos',
  chatMessages: 'ndcpcChatMessages',
  worshipFormats: 'ndcpcWorshipFormats',
  rosterReminders: 'ndcpcRosterReminders',
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function rewrite(content) {
  let out = content;
  for (const [legacy, namespaced] of Object.entries(COLLECTIONS)) {
    out = out.replaceAll(`'${legacy}'`, `'${namespaced}'`);
    out = out.replaceAll(`"${legacy}"`, `"${namespaced}"`);
    out = out.replaceAll(`.collection('${legacy}')`, `.collection('${namespaced}')`);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = rewrite(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed += 1;
    console.log('updated', path.relative(ROOT, file));
  }
}

// functions source
const fnPath = path.join(__dirname, '..', 'functions', 'src', 'index.ts');
if (fs.existsSync(fnPath)) {
  const before = fs.readFileSync(fnPath, 'utf8');
  const after = rewrite(before);
  if (after !== before) {
    fs.writeFileSync(fnPath, after);
    changed += 1;
    console.log('updated functions/src/index.ts');
  }
}

console.log(`Done. ${changed} file(s) updated.`);
