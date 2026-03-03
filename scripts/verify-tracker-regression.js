'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const trackerPath = path.resolve(__dirname, '..', 'tracker.js');
const trackerCode = fs.readFileSync(trackerPath, 'utf8');

function loadTrackerApi() {
  const context = {
    window: {
      location: { hostname: 'localhost' },
    },
    console,
    Date,
    Math,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(context);
  vm.runInContext(trackerCode, context, { filename: 'tracker.js' });
  if (!context.window || !context.window.ActingHoursTracker) {
    throw new Error('Failed to load ActingHoursTracker API from tracker.js');
  }
  return context.window.ActingHoursTracker;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected "${expected}", got "${actual}"`);
  }
}

function makeEntry(id, date, hours, note = '') {
  return {
    id,
    date,
    hours,
    note,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function testUnionYearBoundaries(api) {
  const april = api.unionYearCalculator.forIso('2026-04-30');
  assert(april, 'April boundary should return a union year');
  assertEqual(april.startIso, '2025-05-01', 'Apr 30 start boundary is wrong');
  assertEqual(april.endIso, '2026-04-30', 'Apr 30 end boundary is wrong');

  const may = api.unionYearCalculator.forIso('2026-05-01');
  assert(may, 'May boundary should return a union year');
  assertEqual(may.startIso, '2026-05-01', 'May 1 start boundary is wrong');
  assertEqual(may.endIso, '2027-04-30', 'May 1 end boundary is wrong');

  const january = api.unionYearCalculator.forIso('2027-01-15');
  assert(january, 'January date should return a union year');
  assertEqual(january.startIso, '2026-05-01', 'January should map to previous May start');

  const december = api.unionYearCalculator.forIso('2027-12-15');
  assert(december, 'December date should return a union year');
  assertEqual(december.startIso, '2027-05-01', 'December should map to current May start');
}

function testInclusiveRangeTotals(api) {
  const entries = [
    makeEntry('a', '2026-05-01', 10, 'Range start'),
    makeEntry('b', '2027-04-30', 20, 'Range end'),
    makeEntry('c', '2026-04-30', 100, 'Before range'),
    makeEntry('d', '2027-05-01', 100, 'After range'),
  ];
  const usage = api.calculateUsage(entries, new Date('2026-12-01T00:00:00.000Z'));
  assertEqual(usage.usedHours, 30, 'Union-year total should include both range boundaries');
}

function testWarningThresholds(api) {
  const referenceDate = '2026-06-01';
  const makeUsage = (hours) => api.calculateUsage([
    makeEntry(`id-${hours}`, '2026-05-10', hours),
  ], new Date(`${referenceDate}T00:00:00.000Z`));

  const normal = makeUsage(779.99);
  assertEqual(normal.warningLevel, 'normal', 'Below 75% should be normal');

  const warning = makeUsage(780);
  assertEqual(warning.warningLevel, 'warning', '75% should trigger warning');

  const danger = makeUsage(936);
  assertEqual(danger.warningLevel, 'danger', '90% should trigger danger');

  const atLimit = makeUsage(1040);
  assertEqual(atLimit.warningLevel, 'over', '100% should trigger over-limit state');

  const overLimit = makeUsage(1100);
  assertEqual(overLimit.warningLevel, 'over', 'Above 100% should stay over-limit');
  assert(overLimit.remainingHours < 0, 'Over-limit usage should report negative remaining hours');
}

function testMonthFilter(api) {
  const entries = [
    makeEntry('m1', '2026-05-12', 4),
    makeEntry('m2', '2026-06-03', 5),
    makeEntry('m3', '2027-04-10', 6),
  ];
  const all = api.filterEntries(entries, 2026, 'ALL');
  assertEqual(all.length, 3, 'Union-year ALL month filter is incorrect');

  const june = api.filterEntries(entries, 2026, '2026-06');
  assertEqual(june.length, 1, 'Month filter should return matching month entries only');
  assertEqual(june[0].date, '2026-06-03', 'Month filter returned the wrong entry');
}

function main() {
  const api = loadTrackerApi();

  testUnionYearBoundaries(api);
  testInclusiveRangeTotals(api);
  testWarningThresholds(api);
  testMonthFilter(api);

  console.log('Tracker regression checks passed.');
}

try {
  main();
} catch (err) {
  console.error(`Tracker regression checks failed: ${err.message}`);
  process.exitCode = 1;
}
