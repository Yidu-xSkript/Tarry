// The altar. Edit this array and you edit the session. It is your altar.
export const MOVEMENTS = [
  { id: 'still', title: 'Be still',
    body: '"Be still, and know that I am God."\n— Psalm 46:10',
    floor: 60 },
  { id: 'word', title: 'The Word',
    body: 'Read it slow. Read it again. Pray it back.',
    passage: 'psalm.63.1', floor: 120 },
  { id: 'thanks', title: 'Thanksgiving',
    body: '"Enter into his gates with thanksgiving."\n— Psalm 100:4\n\nName them out loud.',
    floor: 180 },
  { id: 'search', title: 'Search me',
    body: '"Search me, O God, and know my heart."\n— Psalm 139:23\n\nDon\'t dig. Let Him bring it up.',
    floor: 180 },
  { id: 'confess', title: 'Confess & release',
    body: 'Name it plainly.\n\nThen forgive whoever is owed —\n"when ye stand praying, forgive."\n— Mark 11:25',
    floor: 180,
    release: '"If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness."\n— 1 John 1:9' },
  { id: 'intercede', title: 'Intercession',
    body: 'Your people. One at a time.',
    floor: 300 },
  { id: 'tongues', title: 'Tongues / soaking',
    body: 'Pray in the Spirit.',
    floor: 480, dark: true },
  { id: 'wait', title: 'Wait',
    body: '"They that wait upon the LORD shall renew their strength."\n— Isaiah 40:31',
    floor: null },
];

export function movementById(id) {
  const m = MOVEMENTS.find(m => m.id === id);
  if (!m) throw new Error(`no movement: ${id}`);
  return m;
}

// The inverted timer. Nothing counts down; the way out is withheld until the
// floor is stood on. `floor: null` means there is no way out at all.
export function releaseState(movement, elapsedMs) {
  if (movement.floor === null) return { released: false, label: null };
  if (elapsedMs < movement.floor * 1000) return { released: false, label: null };
  return { released: true, label: movement.release ?? 'continue' };
}
