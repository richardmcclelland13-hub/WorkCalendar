'use strict';

(function attachActingHoursTracker(global) {
  const MAX_HOURS = 1040;
  const WARNING_75 = 0.75;
  const WARNING_90 = 0.9;

  function roundHours(value) {
    return Math.round(value * 100) / 100;
  }

  function utcDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
  }

  function dateOnlyUtc(input) {
    const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  function toIsoDate(dateUtc) {
    const year = dateUtc.getUTCFullYear();
    const month = String(dateUtc.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateUtc.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseIsoDate(isoDate) {
    if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return null;
    }
    const [year, month, day] = isoDate.split('-').map((value) => Number(value));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    return utcDate(year, month - 1, day);
  }

  function daysBetween(start, end) {
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }

  function formatHours(value) {
    const n = roundHours(Number(value) || 0);
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2).replace(/\.?0+$/, '');
  }

  function unionYearForDate(inputDate) {
    const date = dateOnlyUtc(inputDate) || dateOnlyUtc(new Date());
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const startYear = month >= 4 ? year : year - 1;
    const endYear = startYear + 1;
    const start = utcDate(startYear, 4, 1);
    const end = utcDate(endYear, 3, 30);
    return {
      startYear,
      endYear,
      start,
      end,
      startIso: toIsoDate(start),
      endIso: toIsoDate(end),
      label: `${startYear}-${endYear}`,
    };
  }

  function unionYearForIso(isoDate) {
    const parsed = parseIsoDate(isoDate);
    if (!parsed) return null;
    return unionYearForDate(parsed);
  }

  function normalizeEntry(rawEntry, nowIso) {
    if (!rawEntry || typeof rawEntry !== 'object') return null;
    const date = typeof rawEntry.date === 'string' ? rawEntry.date.trim() : '';
    if (!parseIsoDate(date)) return null;
    const hours = Number(rawEntry.hours);
    if (!Number.isFinite(hours) || hours <= 0) return null;
    const id = String(rawEntry.id || '').trim();
    if (!id) return null;
    return {
      id,
      date,
      hours: roundHours(hours),
      note: String(rawEntry.note || '').trim(),
      createdAt: String(rawEntry.createdAt || nowIso),
      updatedAt: String(rawEntry.updatedAt || nowIso),
    };
  }

  function sanitizeEntries(entries) {
    const nowIso = new Date().toISOString();
    const source = Array.isArray(entries) ? entries : [];
    return source
      .map((entry) => normalizeEntry(entry, nowIso))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
        return b.date.localeCompare(a.date);
      });
  }

  function computeWarningLevel(percentUsed) {
    if (percentUsed >= 1) return 'over';
    if (percentUsed >= WARNING_90) return 'danger';
    if (percentUsed >= WARNING_75) return 'warning';
    return 'normal';
  }

  function calculateUsage(entries, nowInput) {
    const nowDate = dateOnlyUtc(nowInput) || dateOnlyUtc(new Date());
    const unionYear = unionYearForDate(nowDate);
    const safeEntries = sanitizeEntries(entries);
    const inYearEntries = safeEntries.filter((entry) => entry.date >= unionYear.startIso && entry.date <= unionYear.endIso);
    const usedHours = roundHours(inYearEntries.reduce((sum, entry) => sum + entry.hours, 0));
    const remainingHours = roundHours(MAX_HOURS - usedHours);
    const percentUsed = MAX_HOURS > 0 ? usedHours / MAX_HOURS : 0;

    const daysRemaining = nowDate <= unionYear.end ? daysBetween(nowDate, unionYear.end) + 1 : 0;
    const weeksLeft = roundHours(daysRemaining / 7);
    const safeWeeklyPace = weeksLeft > 0 && remainingHours > 0 ? roundHours(remainingHours / weeksLeft) : 0;

    return {
      unionYear,
      usedHours,
      remainingHours,
      percentUsed,
      warningLevel: computeWarningLevel(percentUsed),
      daysRemaining,
      weeksLeft,
      safeWeeklyPace,
      inYearEntries,
    };
  }

  function buildDateTotals(entries) {
    const totals = {};
    const safeEntries = sanitizeEntries(entries);
    for (const entry of safeEntries) {
      totals[entry.date] = roundHours((totals[entry.date] || 0) + entry.hours);
    }
    return totals;
  }

  function buildUnionYearOptions(entries, nowInput) {
    const safeEntries = sanitizeEntries(entries);
    const current = unionYearForDate(nowInput || new Date());
    const starts = new Set([current.startYear]);
    for (const entry of safeEntries) {
      const unionYear = unionYearForIso(entry.date);
      if (unionYear) {
        starts.add(unionYear.startYear);
      }
    }
    return [...starts]
      .sort((a, b) => b - a)
      .map((startYear) => {
        const start = utcDate(startYear, 4, 1);
        const end = utcDate(startYear + 1, 3, 30);
        return {
          value: String(startYear),
          startYear,
          label: `${toIsoDate(start)} to ${toIsoDate(end)}`,
          startIso: toIsoDate(start),
          endIso: toIsoDate(end),
        };
      });
  }

  function buildUnionYearMonthOptions(startYear) {
    const months = [];
    const start = utcDate(startYear, 4, 1);
    for (let i = 0; i < 12; i++) {
      const current = utcDate(start.getUTCFullYear(), start.getUTCMonth() + i, 1);
      const value = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = current.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      months.push({ value, label });
    }
    return months;
  }

  function filterEntries(entries, startYear, monthFilter) {
    if (!Number.isInteger(startYear)) {
      return [];
    }
    const safeEntries = sanitizeEntries(entries);
    const startIso = toIsoDate(utcDate(startYear, 4, 1));
    const endIso = toIsoDate(utcDate(startYear + 1, 3, 30));
    const monthValue = typeof monthFilter === 'string' ? monthFilter.trim() : '';
    return safeEntries.filter((entry) => {
      if (entry.date < startIso || entry.date > endIso) return false;
      if (!monthValue || monthValue === 'ALL') return true;
      return entry.date.startsWith(`${monthValue}-`);
    });
  }

  function groupEntriesByMonth(entries) {
    const safeEntries = sanitizeEntries(entries);
    const groups = new Map();
    for (const entry of safeEntries) {
      const monthKey = entry.date.slice(0, 7);
      if (!groups.has(monthKey)) {
        const date = parseIsoDate(`${monthKey}-01`);
        const title = date
          ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
          : monthKey;
        groups.set(monthKey, { key: monthKey, title, entries: [] });
      }
      groups.get(monthKey).entries.push(entry);
    }
    return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
  }

  function csvEscape(value) {
    const raw = String(value ?? '');
    if (/[",\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  }

  function toCsv(entries) {
    const safeEntries = sanitizeEntries(entries);
    const lines = ['date,hours,note,createdAt'];
    for (const entry of safeEntries) {
      lines.push([
        csvEscape(entry.date),
        csvEscape(formatHours(entry.hours)),
        csvEscape(entry.note || ''),
        csvEscape(entry.createdAt || ''),
      ].join(','));
    }
    return lines.join('\n');
  }

  function runDevBoundarySelfCheck() {
    const isDevHost = global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1';
    if (!isDevHost) return;
    const aprilBoundary = unionYearForDate(parseIsoDate('2026-04-30'));
    const mayBoundary = unionYearForDate(parseIsoDate('2026-05-01'));
    const checks = [
      aprilBoundary.startIso === '2025-05-01' && aprilBoundary.endIso === '2026-04-30',
      mayBoundary.startIso === '2026-05-01' && mayBoundary.endIso === '2027-04-30',
    ];
    if (checks.every(Boolean)) {
      console.info('[ActingHoursTracker] unionYearCalculator self-check passed.');
    } else {
      console.error('[ActingHoursTracker] unionYearCalculator self-check FAILED.', {
        aprilBoundary,
        mayBoundary,
      });
    }
  }

  runDevBoundarySelfCheck();

  global.ActingHoursTracker = {
    MAX_HOURS,
    WARNING_75,
    WARNING_90,
    unionYearCalculator: {
      forDate: unionYearForDate,
      forIso: unionYearForIso,
    },
    formatHours,
    toIsoDate,
    parseIsoDate,
    calculateUsage,
    buildDateTotals,
    buildUnionYearOptions,
    buildUnionYearMonthOptions,
    filterEntries,
    groupEntriesByMonth,
    toCsv,
    createStore() {
      if (global.ActingHoursTrackerDb && typeof global.ActingHoursTrackerDb.createStore === 'function') {
        return global.ActingHoursTrackerDb.createStore();
      }
      throw new Error('ActingHoursTrackerDb.createStore is unavailable.');
    },
  };
})(window);
