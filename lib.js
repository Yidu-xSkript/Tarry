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

export const TAGS = ['prayer', 'burden', 'dream', 'word', 'conviction'];

export function addEntry(entries, { id, created, text, tag = null, scripture = null }) {
  return [...entries, { id, created, text, tag, scripture, answer: null }];
}

export function answerEntry(entries, id, text, date) {
  return entries.map(e => (e.id === id ? { ...e, answer: { text, date } } : e));
}

export function testimonies(entries) {
  return entries.filter(e => e.answer)
    .sort((a, b) => b.answer.date.localeCompare(a.answer.date));
}

export function byTag(entries, tag) {
  return tag ? entries.filter(e => e.tag === tag) : entries;
}

export function toPlainText(entries) {
  return entries.map(e => {
    const head = `${e.created}${e.tag ? `  [${e.tag}]` : ''}\n${e.text}`;
    const scripture = e.scripture ? `\n\n  ${e.scripture.text}\n  — ${e.scripture.ref} (${e.scripture.version})` : '';
    const answer = e.answer ? `\n\n  ANSWERED ${e.answer.date}\n  ${e.answer.text}` : '';
    return `${head}${scripture}${answer}`;
  }).join('\n\n———\n\n');
}

// ponytail: iOS gives a web app no way to schedule a local notification, so we
// hand the job to the Calendar app, which already does it reliably and offline.
// Upgrade path if this proves insufficient: a native iOS app with
// UNUserNotificationCenter — nothing short of that is more reliable.
export function icsFor(hhmm, startYYYYMMDD, { uid = 'tarry-daily@local', title = 'Tarry' } = {}) {
  const [h, m] = hhmm.split(':');
  const pad = n => String(n).padStart(2, '0');
  const start = `${startYYYYMMDD}T${pad(h)}${pad(m)}00`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tarry//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${startYYYYMMDD}T000000Z`,
    `DTSTART:${start}`,
    'DURATION:PT45M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${title}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tarry',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
