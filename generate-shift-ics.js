#!/usr/bin/env node
'use strict';

const fs = require('fs');

const SHIFT_OFFSETS = {
  // From the 2026 base plant calendar pages:
  // offset = cycle day index on 2026-01-01
  I2: 1,
  J2: 4,
  K2: 7,
  L2: 10,
};

const REF_DATE = '2026-01-01';

function parseArgs(argv) {
  const args = {
    shift: 'I2',
    from: '2026-01-01',
    to: '2026-12-31',
    out: 'shift-calendar.ics',
    titlePrefix: '',
    offset: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--shift' && next) {
      args.shift = next.toUpperCase();
      i++;
    } else if (a === '--from' && next) {
      args.from = next;
      i++;
    } else if (a === '--to' && next) {
      args.to = next;
      i++;
    } else if (a === '--out' && next) {
      args.out = next;
      i++;
    } else if (a === '--title-prefix' && next) {
      args.titlePrefix = next;
      i++;
    } else if (a === '--offset' && next) {
      args.offset = Number(next);
      i++;
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return args;
}

function printHelp() {
  console.log(
    [
      'Usage:',
      '  node generate-shift-ics.js [options]',
      '',
      'Options:',
      '  --shift I2|J2|K2|L2     Shift profile (default: I2)',
      '  --offset 1..12          Override shift cycle index on 2026-01-01',
      '  --from YYYY-MM-DD       Start date (default: 2026-01-01)',
      '  --to YYYY-MM-DD         End date inclusive (default: 2026-12-31)',
      '  --out file.ics          Output path (default: shift-calendar.ics)',
      "  --title-prefix 'Text'   Optional title prefix",
      '',
      'Pattern:',
      '  3 days, 3 nights, 6 off (12-day cycle)',
      '',
      'Examples:',
      '  node generate-shift-ics.js --shift I2 --from 2026-01-01 --to 2027-12-31 --out I2-2026-2027.ics',
      '  node generate-shift-ics.js --offset 1 --out custom.ics',
    ].join('\n')
  );
}

function parseDateUtc(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Invalid date: ${iso}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d));
}

function ymdUtc(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function addDaysUtc(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function daysBetweenUtc(a, b) {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function cycleState(cycleDay1to12) {
  if (cycleDay1to12 >= 1 && cycleDay1to12 <= 3) return 'DAY';
  if (cycleDay1to12 >= 4 && cycleDay1to12 <= 6) return 'NIGHT';
  return 'OFF';
}

function icsEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function eventBlock({ uid, summary, startDate }) {
  const dtStart = ymdUtc(startDate);
  const dtEnd = ymdUtc(addDaysUtc(startDate, 1));
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${ymdUtc(new Date())}T000000Z`,
    `SUMMARY:${icsEscape(summary)}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    'END:VEVENT',
  ].join('\r\n');
}

function main() {
  const args = parseArgs(process.argv);
  const from = parseDateUtc(args.from);
  const to = parseDateUtc(args.to);
  const ref = parseDateUtc(REF_DATE);

  if (from > to) throw new Error('--from must be <= --to');

  const knownOffset = SHIFT_OFFSETS[args.shift];
  const cycleIndexOnRef = args.offset || knownOffset;
  if (!cycleIndexOnRef || cycleIndexOnRef < 1 || cycleIndexOnRef > 12) {
    throw new Error(
      `Unknown shift "${args.shift}". Use --offset 1..12 or one of: ${Object.keys(
        SHIFT_OFFSETS
      ).join(', ')}`
    );
  }

  const prefix = args.titlePrefix ? `${args.titlePrefix.trim()} ` : '';
  const calName = `${prefix}${args.shift} Suncor Shift Calendar`;
  const events = [];

  for (let d = new Date(from); d <= to; d = addDaysUtc(d, 1)) {
    const delta = daysBetweenUtc(ref, d);
    const cycleDay = ((cycleIndexOnRef - 1 + delta) % 12 + 12) % 12 + 1;
    const state = cycleState(cycleDay);
    if (state === 'OFF') continue;

    const summary =
      state === 'DAY'
        ? `${prefix}${args.shift} Day Shift`
        : `${prefix}${args.shift} Night Shift`;
    const uid = `${args.shift}-${ymdUtc(d)}-${state.toLowerCase()}@shift.local`;
    events.push(eventBlock({ uid, summary, startDate: d }));
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shift Calendar Generator//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEscape(calName)}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  fs.writeFileSync(args.out, ics, 'utf8');
  console.log(`Wrote ${args.out} with ${events.length} shift events.`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
