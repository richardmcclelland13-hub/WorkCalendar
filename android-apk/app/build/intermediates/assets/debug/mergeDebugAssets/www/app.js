'use strict';

const SHIFT_OFFSETS = {
  I2: 1,
  J2: 4,
  K2: 7,
  L2: 10,
};

const PATTERN = ['DAY', 'DAY', 'DAY', 'NIGHT', 'NIGHT', 'NIGHT', 'OFF', 'OFF', 'OFF', 'OFF', 'OFF', 'OFF'];
const REF_DATE = new Date(Date.UTC(2026, 0, 1));
const OVERRIDES_KEY = 'shiftCalendar.overrides.v1';
const THEME_KEY = 'shiftCalendar.theme.v1';
const WEEK_START_KEY = 'shiftCalendar.weekStart.v1';
const LABEL_STYLE_KEY = 'shiftCalendar.labelStyle.v1';
const ANNIVERSARY_KEY = 'shiftCalendar.anniversaryDate.v1';
const QUICK_ENTRY_TYPES_KEY = 'shiftCalendar.quickEntryTypes.v1';
const VIEW_KEY = 'shiftCalendar.view.v1';
const APP_NAME = 'Suncor Shift Calendar';
const SHIFT_IDS = Object.keys(SHIFT_OFFSETS);
const MUTUAL_SHIFT_MODES = {
  MUTI2: 'I2',
  MUTJ2: 'J2',
  MUTK2: 'K2',
  MUTL2: 'L2',
};
const LEGACY_MUT_SHIFT = 'MUT';
const YEAR_MIN = 2020;
const YEAR_MAX = 2050;
const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleDateString(undefined, { month: 'long' })
);
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ENTRY_DEFINITIONS = {
  NONE: { label: 'None', short: 'None', group: 'None', sick: false, css: '' },
  HOURS_WORKED: { label: 'Hours Worked', short: 'HW', group: 'Time Entry', sick: false, css: 'entry' },
  MEETING: { label: 'Meeting', short: 'Meet', group: 'Time Entry', sick: false, css: 'entry' },
  TRAINING: { label: 'Training', short: 'Tr', group: 'Time Entry', sick: false, css: 'training' },
  UNION_BUSINESS: { label: 'Union Business', short: 'Union', group: 'Time Entry', sick: false, css: 'entry' },
  MODIFIED_HOURS: { label: 'Modified Hours', short: 'Mod', group: 'Time Entry', sick: false, css: 'entry' },
  OVERTIME: { label: 'Overtime', short: 'OT', group: 'Time Entry', sick: false, css: 'overtime' },
  OVERTIME_REFUSED: { label: 'Overtime Refused', short: 'OTR', group: 'Time Entry', sick: false, css: 'entry' },
  ACTING_HOURS_WORKED: { label: 'Acting Hours Worked', short: 'Act', group: 'Time Entry', sick: false, css: 'entry' },
  CALL_OUT_HOURS_WORKED: { label: 'Call Out Hours Worked', short: 'Call', group: 'Time Entry', sick: false, css: 'entry' },
  SHORT_NOTICE: { label: 'Short Notice', short: 'SN', group: 'Time Entry', sick: false, css: 'entry' },
  SHORT_CHANGE: { label: 'Short Change', short: 'SC', group: 'Time Entry', sick: false, css: 'entry' },
  STAT_HOLIDAY_PAID_SHP: { label: 'Stat Holiday Paid (SHP)', short: 'SHP', group: 'Time Entry', sick: false, css: 'entry' },
  PLANTSITE_CAR_ALLOWANCE: { label: 'Plantsite Car Allowance', short: 'Car', group: 'Time Entry', sick: false, css: 'entry' },
  EVACUATION_NATURAL_DISASTER: { label: 'Evacuation- Natural Disaster', short: 'Evac', group: 'Absence', sick: false, css: 'entry' },
  MUTUAL_ABSENT: { label: 'Mutual Absent', short: 'Abs', group: 'Absence', sick: false, css: 'entry' },
  MUTUAL_SICK: { label: 'Mutual Sick', short: 'Sick', group: 'Absence', sick: true, css: 'sick' },
  REST: { label: 'Rest', short: 'Rest', group: 'Absence', sick: false, css: 'entry' },
};
const ENTRY_KEYS = Object.keys(ENTRY_DEFINITIONS);
const DEFAULT_QUICK_ENTRY_TYPES = ['NONE', 'OVERTIME', 'MUTUAL_SICK'];
const LOCKED_QUICK_ENTRY_TYPES = ['NONE', 'OVERTIME', 'MUTUAL_SICK'];
const RESET_BUTTON_DEFAULT_TEXT = 'Reset Calendar';
const RESET_BUTTON_CONFIRM_TEXT = 'Tap Again to Confirm';
const SHIFT_THEMES = {
  I2: { day: '#c0d098', night: '#709038' },
  J2: { day: '#88b0e0', night: '#103058' },
  K2: { day: '#f830c8', night: '#103058' },
  L2: { day: '#f8f800', night: '#103058' },
};
const PAYDAY_INTERVAL_DAYS = 14;
const PAYDAY_ANCHOR_ISO = '2026-01-06';
const SPECIAL_DATES = {
  '2026': {
    holidays: [
      '2026-01-01',
      '2026-02-16',
      '2026-04-03',
      '2026-05-18',
      '2026-07-01',
      '2026-09-07',
      '2026-10-12',
      '2026-11-11',
      '2026-12-25',
    ],
    paydays: [
      '2026-01-06',
      '2026-01-20',
      '2026-02-03',
      '2026-02-17',
      '2026-03-03',
      '2026-03-17',
      '2026-03-31',
      '2026-04-14',
      '2026-04-28',
      '2026-05-12',
      '2026-05-26',
      '2026-06-09',
      '2026-06-23',
      '2026-07-07',
      '2026-07-21',
      '2026-08-04',
      '2026-08-18',
      '2026-09-01',
      '2026-09-15',
      '2026-09-29',
      '2026-10-13',
      '2026-10-27',
      '2026-11-10',
      '2026-11-24',
      '2026-12-08',
      '2026-12-22',
    ],
  },
};

const monthLabel = document.getElementById('monthLabel');
const grid = document.getElementById('calendarGrid');
const weekdaysRow = document.getElementById('weekdaysRow');
const shiftSelect = document.getElementById('shiftSelect');
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const todayBtn = document.getElementById('todayBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const downloadBtn = document.getElementById('downloadBtn');
const installBtn = document.getElementById('installBtn');
const monthSummary = document.getElementById('monthSummary');
const attendanceSummary = document.getElementById('attendanceSummary');
const statsSummary = document.getElementById('statsSummary');
const jumpDateInput = document.getElementById('jumpDateInput');
const jumpDateBtn = document.getElementById('jumpDateBtn');
const exportEditsBtn = document.getElementById('exportEditsBtn');
const importEditsInput = document.getElementById('importEditsInput');
const clearAllEditsBtn = document.getElementById('clearAllEditsBtn');
const dayEditor = document.getElementById('dayEditor');
const editorBackdrop = document.getElementById('editorBackdrop');
const editorTitle = document.getElementById('editorTitle');
const editorSubtitle = document.getElementById('editorSubtitle');
const closeEditorBtn = document.getElementById('closeEditorBtn');
const stateOptions = document.getElementById('stateOptions');
const quickEntryOptions = document.getElementById('quickEntryOptions');
const quickAddPanel = document.getElementById('quickAddPanel');
const quickAddSelect = document.getElementById('quickAddSelect');
const quickAddConfirmBtn = document.getElementById('quickAddConfirmBtn');
const quickAddCancelBtn = document.getElementById('quickAddCancelBtn');
const entryTypeSelect = document.getElementById('entryTypeSelect');
const shiftOverrideDetails = document.getElementById('shiftOverrideDetails');
const noteInput = document.getElementById('noteInput');
const clearDayBtn = document.getElementById('clearDayBtn');
const saveDayBtn = document.getElementById('saveDayBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const themeSelect = document.getElementById('themeSelect');
const weekStartSelect = document.getElementById('weekStartSelect');
const shiftLabelStyleSelect = document.getElementById('shiftLabelStyleSelect');
const anniversaryDateInput = document.getElementById('anniversaryDateInput');
const clearAnniversaryBtn = document.getElementById('clearAnniversaryBtn');
const resetCalendarBtn = document.getElementById('resetCalendarBtn');
const brandLogo = document.getElementById('brandLogo');
const brandFallback = document.getElementById('brandFallback');

let state = {
  shift: 'I2',
  year: 2026,
  month: 0,
};

let overridesByShift = loadOverrides();
let deferredInstallPrompt = null;
let editingDateIso = null;
let selectedOverrideState = 'DEFAULT';
let selectedEntryType = 'NONE';
let currentThemeMode = 'system';
let weekStartsOn = 'sun';
let shiftLabelStyle = 'long';
let anniversaryDateIso = '';
let quickEntryTypes = DEFAULT_QUICK_ENTRY_TYPES.slice();
let resetCalendarArmed = false;
let resetCalendarConfirmTimer = null;

function isAndroidAppWebView() {
  return /ShiftCalendarAndroid\/1\.0/.test(navigator.userAgent || '');
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch (err) {
    return {};
  }
}

function saveOverrides() {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overridesByShift));
  } catch (err) {
    // Ignore storage write errors.
  }
}

function shiftOverrides(shift) {
  if (!overridesByShift[shift] || typeof overridesByShift[shift] !== 'object') {
    overridesByShift[shift] = {};
  }
  return overridesByShift[shift];
}

function overrideForDate(shift, dateIso) {
  return shiftOverrides(shift)[dateIso] || null;
}

function applyShiftTheme(shift) {
  const theme = SHIFT_THEMES[shift] || SHIFT_THEMES.I2;
  const root = document.documentElement;
  root.style.setProperty('--day', theme.day);
  root.style.setProperty('--night', theme.night);
}

function populateYearSelect() {
  if (!yearSelect) return;
  yearSelect.innerHTML = '';
  for (let year = YEAR_MIN; year <= YEAR_MAX; year++) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  }
}

function ensureYearOption(year) {
  if (!yearSelect) return;
  const value = String(year);
  if (yearSelect.querySelector(`option[value="${value}"]`)) return;
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  yearSelect.appendChild(option);
}

function populateMonthSelect() {
  if (!monthSelect) return;
  monthSelect.innerHTML = '';
  for (let month = 0; month < 12; month++) {
    const option = document.createElement('option');
    option.value = String(month);
    option.textContent = MONTH_NAMES[month];
    monthSelect.appendChild(option);
  }
}

function isCompactUi() {
  return window.matchMedia('(max-width: 620px)').matches;
}

function populateEntryTypeSelect() {
  if (!entryTypeSelect) return;
  entryTypeSelect.innerHTML = '';

  const noneOption = document.createElement('option');
  noneOption.value = 'NONE';
  noneOption.textContent = ENTRY_DEFINITIONS.NONE.label;
  entryTypeSelect.appendChild(noneOption);

  const groups = ['Time Entry', 'Absence'];
  for (const group of groups) {
    const optGroup = document.createElement('optgroup');
    optGroup.label = group;
    for (const key of ENTRY_KEYS) {
      if (key === 'NONE') continue;
      const definition = ENTRY_DEFINITIONS[key];
      if (definition.group !== group) continue;
      const option = document.createElement('option');
      option.value = key;
      option.textContent = definition.label;
      optGroup.appendChild(option);
    }
    entryTypeSelect.appendChild(optGroup);
  }
}

function normalizeQuickEntryTypes(input) {
  const seen = new Set();
  const lockedNonNone = [];
  const source = Array.isArray(input) ? input : [];
  for (const locked of LOCKED_QUICK_ENTRY_TYPES) {
    if (locked === 'NONE') continue;
    const key = normalizeEntryType(locked);
    if (key === 'NONE' || seen.has(key)) continue;
    seen.add(key);
    lockedNonNone.push(key);
  }
  const custom = [];
  for (const raw of source) {
    const key = normalizeEntryType(raw);
    if (key === 'NONE') continue;
    if (seen.has(key)) continue;
    seen.add(key);
    custom.push(key);
  }
  // Keep panel compact on phones.
  const trimmed = [...lockedNonNone, ...custom].slice(0, 7);
  return ['NONE', ...trimmed];
}

function loadQuickEntryTypes() {
  try {
    const raw = localStorage.getItem(QUICK_ENTRY_TYPES_KEY);
    if (!raw) return DEFAULT_QUICK_ENTRY_TYPES.slice();
    const parsed = JSON.parse(raw);
    return normalizeQuickEntryTypes(parsed);
  } catch (err) {
    return DEFAULT_QUICK_ENTRY_TYPES.slice();
  }
}

function saveQuickEntryTypes() {
  try {
    localStorage.setItem(QUICK_ENTRY_TYPES_KEY, JSON.stringify(quickEntryTypes));
  } catch (err) {
    // Ignore.
  }
}

function quickEntryButtonLabel(entryType) {
  if (entryType === 'NONE') return 'None';
  if (entryType === 'OVERTIME') return 'Overtime';
  if (entryType === 'MUTUAL_SICK') return 'Sick';
  return entryDefinition(entryType).short;
}

function isLockedQuickEntryType(entryType) {
  return LOCKED_QUICK_ENTRY_TYPES.includes(normalizeEntryType(entryType));
}

function renderQuickEntryButtons() {
  if (!quickEntryOptions) return;
  quickEntryOptions.innerHTML = '';

  for (const entryType of quickEntryTypes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-btn';
    button.dataset.group = 'quick-entry';
    button.dataset.action = 'select';
    button.dataset.value = entryType;
    button.textContent = quickEntryButtonLabel(entryType);
    if (!isLockedQuickEntryType(entryType)) {
      button.classList.add('quick-removable');
      const remove = document.createElement('span');
      remove.className = 'quick-remove';
      remove.dataset.action = 'remove';
      remove.dataset.value = entryType;
      remove.title = 'Remove favorite';
      remove.setAttribute('aria-label', `Remove ${entryDefinition(entryType).label}`);
      remove.textContent = '×';
      button.appendChild(remove);
    }
    quickEntryOptions.appendChild(button);
  }

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'choice-btn quick-add-btn';
  addButton.dataset.group = 'quick-entry';
  addButton.dataset.action = 'add';
  addButton.setAttribute('aria-label', 'Add selected entry to quick buttons');
  addButton.title = 'Add selected entry to quick buttons';
  addButton.textContent = '+';
  quickEntryOptions.appendChild(addButton);
}

function populateQuickAddSelect() {
  if (!quickAddSelect) return 0;
  quickAddSelect.innerHTML = '';
  const available = ENTRY_KEYS.filter((key) => key !== 'NONE' && !quickEntryTypes.includes(key));
  const preferred = normalizeEntryType(entryTypeSelect?.value || selectedEntryType);
  for (const key of available) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = entryDefinition(key).label;
    quickAddSelect.appendChild(option);
  }
  if (available.includes(preferred)) {
    quickAddSelect.value = preferred;
  }
  return available.length;
}

function openQuickAddPanel() {
  if (!quickAddPanel) return;
  const count = populateQuickAddSelect();
  if (!count) {
    window.alert('All entries are already added to favorites.');
    closeQuickAddPanel();
    return;
  }
  quickAddPanel.classList.remove('hidden');
}

function closeQuickAddPanel() {
  if (!quickAddPanel) return;
  quickAddPanel.classList.add('hidden');
}

function loadThemeMode() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

function loadWeekStart() {
  const saved = localStorage.getItem(WEEK_START_KEY) || 'sun';
  return saved === 'mon' ? 'mon' : 'sun';
}

function isPrimaryShift(shift) {
  return Object.prototype.hasOwnProperty.call(SHIFT_OFFSETS, shift);
}

function mutualBaseShiftForMode(shiftMode = state.shift) {
  return MUTUAL_SHIFT_MODES[shiftMode] || null;
}

function loadViewState() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    let shift = typeof parsed.shift === 'string' ? parsed.shift : null;
    if (shift === LEGACY_MUT_SHIFT) {
      shift = 'MUTI2';
    }
    if (!shift || (!isPrimaryShift(shift) && !mutualBaseShiftForMode(shift))) {
      shift = null;
    }
    const year = Number.isInteger(parsed.year) ? parsed.year : null;
    const month = Number.isInteger(parsed.month) ? parsed.month : null;
    if (!shift || year === null || month === null) return null;
    if (month < 0 || month > 11) return null;
    return { shift, year, month };
  } catch (err) {
    return null;
  }
}

function loadLabelStyle() {
  const saved = localStorage.getItem(LABEL_STYLE_KEY);
  if (saved === 'short' || saved === 'long') return saved;
  return 'long';
}

function loadAnniversaryDate() {
  const saved = localStorage.getItem(ANNIVERSARY_KEY) || '';
  return /^\d{4}-\d{2}-\d{2}$/.test(saved) ? saved : '';
}

function saveViewState() {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify({
      shift: state.shift,
      year: state.year,
      month: state.month,
    }));
  } catch (err) {
    // Ignore.
  }
}

function applyAnniversaryDate(isoDate) {
  anniversaryDateIso = /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : '';
  if (anniversaryDateInput) {
    anniversaryDateInput.value = anniversaryDateIso;
  }
  try {
    if (anniversaryDateIso) {
      localStorage.setItem(ANNIVERSARY_KEY, anniversaryDateIso);
    } else {
      localStorage.removeItem(ANNIVERSARY_KEY);
    }
  } catch (err) {
    // Ignore.
  }
}

function resolveTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  currentThemeMode = mode;
  const resolved = resolveTheme(mode);
  document.body.setAttribute('data-theme', resolved);
  if (themeSelect) {
    themeSelect.value = mode;
  }
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (err) {
    // Ignore.
  }
}

function renderWeekdayHeader() {
  if (!weekdaysRow) return;
  weekdaysRow.innerHTML = '';
  const labels = weekStartsOn === 'mon'
    ? [...WEEKDAY_LABELS.slice(1), WEEKDAY_LABELS[0]]
    : WEEKDAY_LABELS;
  for (const label of labels) {
    const cell = document.createElement('span');
    cell.textContent = label;
    weekdaysRow.appendChild(cell);
  }
}

function applyWeekStart(value) {
  weekStartsOn = value === 'mon' ? 'mon' : 'sun';
  if (weekStartSelect) {
    weekStartSelect.value = weekStartsOn;
  }
  try {
    localStorage.setItem(WEEK_START_KEY, weekStartsOn);
  } catch (err) {
    // Ignore.
  }
  renderWeekdayHeader();
}

function applyShiftLabelStyle(value) {
  shiftLabelStyle = value === 'long' ? 'long' : 'short';
  if (shiftLabelStyleSelect) {
    shiftLabelStyleSelect.value = shiftLabelStyle;
  }
  try {
    localStorage.setItem(LABEL_STYLE_KEY, shiftLabelStyle);
  } catch (err) {
    // Ignore.
  }
}

function updateVisualViewportInset() {
  const offsetTop = window.visualViewport ? Math.max(0, Math.round(window.visualViewport.offsetTop || 0)) : 0;
  document.documentElement.style.setProperty('--vv-offset-top', `${offsetTop}px`);
}

function setupBrandLogoFallback() {
  if (!brandLogo || !brandFallback) return;
  const showFallback = () => {
    brandLogo.classList.add('hidden');
    brandFallback.classList.remove('hidden');
  };
  brandLogo.addEventListener('error', showFallback);
  if (brandLogo.complete && brandLogo.naturalWidth === 0) {
    showFallback();
  }
}

function openSettings() {
  if (!settingsPanel || !editorBackdrop) return;
  closeEditor();
  settingsPanel.classList.remove('hidden');
  editorBackdrop.classList.remove('hidden');
  document.body.classList.add('settings-open');
}

function closeSettings() {
  if (!settingsPanel || !editorBackdrop) return;
  disarmResetCalendar();
  settingsPanel.classList.add('hidden');
  editorBackdrop.classList.add('hidden');
  document.body.classList.remove('settings-open');
}

function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month, day));
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function shiftStateForDate(shift, dateUtc) {
  const offset = SHIFT_OFFSETS[shift];
  if (!Number.isInteger(offset)) return 'OFF';
  const delta = daysBetween(REF_DATE, dateUtc);
  const cycleDay = ((offset - 1 + delta) % 12 + 12) % 12;
  return PATTERN[cycleDay];
}

function isMutualMode(shiftMode = state.shift) {
  return !!mutualBaseShiftForMode(shiftMode);
}

function calendarShiftForTheme() {
  return mutualBaseShiftForMode(state.shift) || state.shift;
}

function monthName(month, year) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function stateToCss(stateName) {
  if (stateName === 'DAY') return 'day';
  if (stateName === 'NIGHT') return 'night';
  return 'off';
}

function stateToShort(stateName) {
  if (shiftLabelStyle === 'short') {
    if (stateName === 'DAY') return 'D';
    if (stateName === 'NIGHT') return 'N';
    return 'Off';
  }
  if (stateName === 'DAY') return 'Day';
  if (stateName === 'NIGHT') return 'Night';
  return 'Off';
}

function isoDateKey(dateUtc) {
  const y = dateUtc.getUTCFullYear();
  const m = String(dateUtc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateUtc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDateUtc(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  return utcDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function nthWeekdayOfMonthUtc(year, month, weekday, nth) {
  const first = utcDate(year, month, 1);
  const firstWeekday = first.getUTCDay();
  const delta = (weekday - firstWeekday + 7) % 7;
  return utcDate(year, month, 1 + delta + (nth - 1) * 7);
}

function easterSundayUtc(year) {
  // Gregorian calendar algorithm (Meeus/Jones/Butcher).
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

function victoriaDayUtc(year) {
  let day = utcDate(year, 4, 24);
  while (day.getUTCDay() !== 1) {
    day = addDaysUtc(day, -1);
  }
  return day;
}

function generateHolidaysForYear(year) {
  const easter = easterSundayUtc(year);
  const holidays = [
    utcDate(year, 0, 1), // New Year's Day
    nthWeekdayOfMonthUtc(year, 1, 1, 3), // Family Day (AB): third Monday in February
    addDaysUtc(easter, -2), // Good Friday
    victoriaDayUtc(year), // Victoria Day: Monday before May 25
    utcDate(year, 6, 1), // Canada Day
    nthWeekdayOfMonthUtc(year, 8, 1, 1), // Labour Day: first Monday in September
    nthWeekdayOfMonthUtc(year, 9, 1, 2), // Thanksgiving: second Monday in October
    utcDate(year, 10, 11), // Remembrance Day
    utcDate(year, 11, 25), // Christmas Day
  ].map(isoDateKey);
  holidays.sort();
  return holidays;
}

function generatePaydaysForYear(year) {
  const anchor = parseIsoDateUtc(PAYDAY_ANCHOR_ISO);
  if (!anchor) return [];
  const start = utcDate(year, 0, 1);
  const end = utcDate(year, 11, 31);
  const paydays = [];

  let payday = new Date(anchor);
  const deltaDays = daysBetween(payday, start);
  if (deltaDays > 0) {
    payday = addDaysUtc(payday, Math.ceil(deltaDays / PAYDAY_INTERVAL_DAYS) * PAYDAY_INTERVAL_DAYS);
  } else if (deltaDays < 0) {
    payday = addDaysUtc(payday, -Math.ceil(Math.abs(deltaDays) / PAYDAY_INTERVAL_DAYS) * PAYDAY_INTERVAL_DAYS);
    while (payday < start) payday = addDaysUtc(payday, PAYDAY_INTERVAL_DAYS);
  }

  for (let day = new Date(payday); day <= end; day = addDaysUtc(day, PAYDAY_INTERVAL_DAYS)) {
    if (day < start) continue;
    paydays.push(isoDateKey(day));
  }
  return paydays;
}

function specialDatesForYear(year) {
  const key = String(year);
  if (!SPECIAL_DATES[key]) {
    SPECIAL_DATES[key] = {
      holidays: generateHolidaysForYear(year),
      paydays: generatePaydaysForYear(year),
    };
  }
  return SPECIAL_DATES[key];
}

function markersForDate(dateUtc) {
  const yearData = specialDatesForYear(dateUtc.getUTCFullYear());
  if (!yearData) return { holiday: false, payday: false };
  const key = isoDateKey(dateUtc);
  return {
    holiday: yearData.holidays.includes(key),
    payday: yearData.paydays.includes(key),
  };
}

function markerSummary(markers) {
  const tags = [];
  if (markers.holiday) tags.push('Holiday');
  if (markers.payday) tags.push('Payday');
  return tags;
}

function mutualStatusesForDate(dateUtc) {
  const out = {};
  for (const shift of SHIFT_IDS) {
    out[shift] = shiftStateForDate(shift, dateUtc);
  }
  return out;
}

function mutualOptionsForBaseShiftDate(baseShift, dateUtc) {
  const statuses = mutualStatusesForDate(dateUtc);
  const baseStatus = statuses[baseShift] || 'OFF';
  const options = [];
  if (baseStatus === 'OFF') {
    for (const shift of SHIFT_IDS) {
      if (shift === baseShift) continue;
      const status = statuses[shift];
      if (status !== 'OFF') options.push({ shift, status });
    }
  }
  return { statuses, baseShift, baseStatus, options };
}

function mutualOptionsForDate(dateUtc) {
  const baseShift = mutualBaseShiftForMode(state.shift) || 'I2';
  return mutualOptionsForBaseShiftDate(baseShift, dateUtc);
}

function effectiveStatusForDate(shift, dateUtc) {
  const baseStatus = shiftStateForDate(shift, dateUtc);
  const key = isoDateKey(dateUtc);
  const override = overrideForDate(shift, key);
  if (!override || !override.state || override.state === 'DEFAULT') {
    return { baseStatus, effectiveStatus: baseStatus, override };
  }
  return { baseStatus, effectiveStatus: override.state, override };
}

function setActiveChoice(groupElement, value) {
  if (!groupElement) return;
  const buttons = groupElement.querySelectorAll('.choice-btn');
  for (const button of buttons) {
    button.classList.toggle('active', button.dataset.value === value);
  }
}

function quickEntryValue(entryType) {
  const normalized = normalizeEntryType(entryType);
  if (quickEntryTypes.includes(normalized)) return normalized;
  return quickEntryTypes.includes('NONE') ? 'NONE' : '';
}

function normalizeOverrideState(value) {
  return ['DEFAULT', 'DAY', 'NIGHT', 'OFF'].includes(value) ? value : 'DEFAULT';
}

function normalizeEntryType(value) {
  return ENTRY_KEYS.includes(value) ? value : 'NONE';
}

function entryTypeForOverride(override) {
  if (!override || typeof override !== 'object') return 'NONE';
  return normalizeEntryType(override.entryType || override.special || 'NONE');
}

function entryDefinition(entryType) {
  return ENTRY_DEFINITIONS[normalizeEntryType(entryType)] || ENTRY_DEFINITIONS.NONE;
}

function isSickEntryType(entryType) {
  return !!entryDefinition(entryType).sick;
}

function isAnniversaryDate(dateUtc) {
  if (!anniversaryDateIso) return false;
  const anniversaryMd = anniversaryDateIso.slice(5);
  return isoDateKey(dateUtc).slice(5) === anniversaryMd;
}

function shortNote(note) {
  if (!note) return '';
  const limit = isCompactUi() ? 6 : 12;
  return note.length > limit ? `${note.slice(0, limit)}...` : note;
}

function markerLabel(full, compact) {
  return isCompactUi() ? compact : full;
}

function openEditor(dateUtc, baseStatus) {
  if (!dayEditor || !editorBackdrop || !noteInput || !editorTitle || !editorSubtitle || !stateOptions || !entryTypeSelect) {
    window.alert('Editor failed to initialize. Please hard refresh the preview.');
    return;
  }
  closeSettings();
  editingDateIso = isoDateKey(dateUtc);
  const existing = overrideForDate(state.shift, editingDateIso);
  selectedOverrideState = normalizeOverrideState(existing?.state);
  selectedEntryType = entryTypeForOverride(existing);
  noteInput.value = existing?.note || '';

  editorTitle.textContent = `Edit ${editingDateIso}`;
  editorSubtitle.textContent = `Default shift: ${baseStatus}.`;
  closeQuickAddPanel();
  renderQuickEntryButtons();
  setActiveChoice(stateOptions, selectedOverrideState);
  setActiveChoice(quickEntryOptions, quickEntryValue(selectedEntryType));
  entryTypeSelect.value = selectedEntryType;
  if (shiftOverrideDetails) {
    shiftOverrideDetails.open = selectedOverrideState !== 'DEFAULT';
  }

  editorBackdrop.classList.remove('hidden');
  dayEditor.classList.remove('hidden');
  document.body.classList.add('editor-open');
}

function closeEditor() {
  if (!dayEditor || !editorBackdrop) return;
  closeQuickAddPanel();
  editorBackdrop.classList.add('hidden');
  dayEditor.classList.add('hidden');
  document.body.classList.remove('editor-open');
  editingDateIso = null;
}

function clearCurrentOverride() {
  if (!editingDateIso) return;
  const map = shiftOverrides(state.shift);
  delete map[editingDateIso];
  if (Object.keys(map).length === 0) {
    delete overridesByShift[state.shift];
  }
  saveOverrides();
  closeEditor();
  renderMonth();
}

function saveCurrentOverride() {
  if (!editingDateIso) return;

  const stateValue = selectedOverrideState;
  const entryTypeValue = selectedEntryType;
  const noteValue = (noteInput.value || '').trim().slice(0, 50);
  const isDefault = stateValue === 'DEFAULT' && entryTypeValue === 'NONE' && !noteValue;

  const map = shiftOverrides(state.shift);
  if (isDefault) {
    delete map[editingDateIso];
  } else {
    map[editingDateIso] = {
      state: stateValue,
      entryType: entryTypeValue,
      note: noteValue,
    };
  }

  if (Object.keys(map).length === 0) {
    delete overridesByShift[state.shift];
  }
  saveOverrides();
  closeEditor();
  renderMonth();
}

function renderMonth() {
  monthLabel.textContent = monthName(state.month, state.year);
  if (monthSelect) {
    monthSelect.value = String(state.month);
  }
  if (downloadBtn) {
    downloadBtn.disabled = isMutualMode();
    downloadBtn.title = isMutualMode() ? 'Select I2, J2, K2, or L2 to download ICS.' : '';
  }
  grid.innerHTML = '';
  const now = new Date();
  const todayKey = isoDateKey(utcDate(now.getFullYear(), now.getMonth(), now.getDate()));
  const stats = isMutualMode()
    ? {
        BASE_OFF: 0,
        BASE_WORKING: 0,
        OPEN: 0,
        NO_MATCH: 0,
        HOLIDAY: 0,
        PAYDAY: 0,
      }
    : {
        DAY: 0,
        NIGHT: 0,
        OFF: 0,
        ENTRY: 0,
        SICK: 0,
        EDITED: 0,
      };

  const first = new Date(state.year, state.month, 1);
  const last = new Date(state.year, state.month + 1, 0);
  const weekStartOffset = weekStartsOn === 'mon' ? 1 : 0;
  const leading = (first.getDay() - weekStartOffset + 7) % 7;
  const daysInMonth = last.getDate();

  for (let i = 0; i < leading; i++) {
    const empty = document.createElement('article');
    empty.className = 'cell empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateUtc = utcDate(state.year, state.month, d);
    const dateKey = isoDateKey(dateUtc);
    const markers = markersForDate(dateUtc);
    const markerTags = markerSummary(markers);
    const titleDate = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (isMutualMode()) {
      const mutual = mutualOptionsForDate(dateUtc);
      const css = stateToCss(mutual.baseStatus);
      const card = document.createElement('article');
      card.className = `cell ${css} mutual mutual-${css}`;
      if (mutual.options.length) {
        card.classList.add('mutual-open');
      }
      if (dateKey === todayKey) {
        card.classList.add('today');
      }

      const top = document.createElement('div');
      top.className = 'cell-top';

      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = String(d);

      const baseTag = document.createElement('span');
      baseTag.className = `mutual-base ${css}`;
      baseTag.textContent = `${mutual.baseShift} ${stateToShort(mutual.baseStatus)}`;

      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.textContent = mutual.options.length
        ? markerLabel('Mutual Open', `MU ${mutual.options.length}`)
        : mutual.baseStatus === 'OFF'
          ? markerLabel('No Mutual', 'No MU')
          : markerLabel('Base Working', 'Busy');

      const options = document.createElement('div');
      options.className = 'mutual-options';
      if (mutual.options.length) {
        const visible = mutual.options.slice(0, 3);
        for (const item of visible) {
          const option = document.createElement('span');
          option.className = `mutual-option ${stateToCss(item.status)}`;
          option.textContent = `${item.shift} ${stateToShort(item.status)}`;
          options.appendChild(option);
        }
        if (mutual.options.length > visible.length) {
          const more = document.createElement('span');
          more.className = 'mutual-option more';
          more.textContent = `+${mutual.options.length - visible.length} more`;
          options.appendChild(more);
        }
      } else {
        const empty = document.createElement('span');
        empty.className = 'mutual-empty';
        empty.textContent = mutual.baseStatus === 'OFF'
          ? 'No matching shifts'
          : 'Your shift is already working';
        options.appendChild(empty);
      }

      const marks = document.createElement('div');
      marks.className = 'marks';
      if (markers.holiday) {
        const holiday = document.createElement('span');
        holiday.className = 'mark holiday';
        holiday.textContent = markerLabel('Holiday', 'Hol');
        marks.appendChild(holiday);
      }
      if (markers.payday) {
        const payday = document.createElement('span');
        payday.className = 'mark payday';
        payday.textContent = markerLabel('Payday', 'Pay');
        marks.appendChild(payday);
      }

      const allStatuses = SHIFT_IDS.map((shift) => `${shift} ${mutual.statuses[shift]}`).join(', ');
      const optionsText = mutual.options.length
        ? `Mutual options: ${mutual.options.map((item) => `${item.shift} ${item.status}`).join(', ')}`
        : 'No mutual options';
      const tips = [...markerTags];
      if (mutual.options.length) tips.push(optionsText);
      card.title = `${titleDate} - ${allStatuses}${tips.length ? ` (${tips.join(', ')})` : ''}`;

      top.appendChild(num);
      top.appendChild(baseTag);
      card.appendChild(top);
      card.appendChild(tag);
      card.appendChild(options);
      card.appendChild(marks);
      grid.appendChild(card);

      if (mutual.baseStatus === 'OFF') {
        stats.BASE_OFF++;
        if (mutual.options.length) {
          stats.OPEN++;
        } else {
          stats.NO_MATCH++;
        }
      } else {
        stats.BASE_WORKING++;
      }
      if (markers.holiday) stats.HOLIDAY++;
      if (markers.payday) stats.PAYDAY++;
      continue;
    }

    const effective = effectiveStatusForDate(state.shift, dateUtc);
    const status = effective.effectiveStatus;
    const baseStatus = effective.baseStatus;
    const override = effective.override;
    const css = stateToCss(status);

    const card = document.createElement('article');
    card.className = `cell ${css}`;
    card.tabIndex = 0;
    if (dateKey === todayKey) {
      card.classList.add('today');
    }

    const top = document.createElement('div');
    top.className = 'cell-top';

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = String(d);

    const editBtn = document.createElement('button');
    editBtn.className = 'cell-edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = '✎';
    editBtn.title = `Edit ${titleForEditButton(state.year, state.month, d)}`;

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = stateToShort(status);

    const entryType = entryTypeForOverride(override);
    const entryDef = entryDefinition(entryType);
    const marks = document.createElement('div');
    marks.className = 'marks';

    if (isAnniversaryDate(dateUtc)) {
      const anniversary = document.createElement('span');
      anniversary.className = 'mark anniversary';
      anniversary.textContent = markerLabel('Anniversary', '★');
      marks.appendChild(anniversary);
    }

    if (markers.holiday) {
      const holiday = document.createElement('span');
      holiday.className = 'mark holiday';
      holiday.textContent = markerLabel('Holiday', 'Hol');
      marks.appendChild(holiday);
    }

    if (markers.payday) {
      const payday = document.createElement('span');
      payday.className = 'mark payday';
      payday.textContent = markerLabel('Payday', 'Pay');
      marks.appendChild(payday);
    }

    if (entryType !== 'NONE') {
      const entry = document.createElement('span');
      entry.className = `mark ${entryDef.css || 'entry'}`;
      entry.textContent = markerLabel(entryDef.label, entryDef.short);
      marks.appendChild(entry);
      stats.ENTRY++;
      if (isSickEntryType(entryType)) {
        stats.SICK++;
      }
    }

    if (override?.note) {
      const note = document.createElement('span');
      note.className = 'mark note';
      note.textContent = shortNote(override.note);
      marks.appendChild(note);
    }

    if (override) {
      card.classList.add('edited');
      stats.EDITED++;
    }

    const tips = [...markerTags];
    if (isAnniversaryDate(dateUtc)) tips.push('Anniversary');
    if (entryType !== 'NONE') tips.push(entryDef.label);
    if (override?.note) tips.push(`Note: ${override.note}`);
    card.title = tips.length
      ? `${state.shift} ${status} - ${titleDate} (${tips.join(', ')})`
      : `${state.shift} ${status} - ${titleDate}`;

    card.addEventListener('click', () => openEditor(dateUtc, baseStatus));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openEditor(dateUtc, baseStatus);
      }
    });
    editBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      openEditor(dateUtc, baseStatus);
    });

    top.appendChild(num);
    top.appendChild(editBtn);
    card.appendChild(top);
    card.appendChild(tag);
    card.appendChild(marks);
    grid.appendChild(card);

    stats[status]++;
  }
  if (isMutualMode()) {
    renderMutualSummary(stats);
  } else {
    renderSummary(stats);
  }
  renderAttendanceSummary();
  renderStatsDashboard();
  saveViewState();
}

function titleForEditButton(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function renderSummary(stats) {
  if (!monthSummary) return;
  monthSummary.innerHTML = '';
  const dayText = shiftLabelStyle === 'short' ? 'D' : 'Day';
  const nightText = shiftLabelStyle === 'short' ? 'N' : 'Night';
  const compact = isCompactUi();
  const chips = compact
    ? [
        `${dayText} ${stats.DAY}`,
        `${nightText} ${stats.NIGHT}`,
        `Off ${stats.OFF}`,
        `Ent ${stats.ENTRY}`,
        `Sick ${stats.SICK}`,
        `Ed ${stats.EDITED}`,
      ]
    : [
        `${dayText} ${stats.DAY}`,
        `${nightText} ${stats.NIGHT}`,
        `Off ${stats.OFF}`,
        `Entries ${stats.ENTRY}`,
        `Sick ${stats.SICK}`,
        `Edited ${stats.EDITED}`,
      ];
  for (const text of chips) {
    const chip = document.createElement('span');
    chip.className = 'summary-chip';
    chip.textContent = text;
    monthSummary.appendChild(chip);
  }
}

function renderMutualSummary(stats) {
  if (!monthSummary) return;
  monthSummary.innerHTML = '';
  const baseShift = mutualBaseShiftForMode(state.shift) || 'I2';
  const compact = isCompactUi();
  const chips = compact
    ? [
        `Base ${baseShift}`,
        `Off ${stats.BASE_OFF}`,
        `Open ${stats.OPEN}`,
        `Busy ${stats.BASE_WORKING}`,
        `Hol ${stats.HOLIDAY}`,
        `Pay ${stats.PAYDAY}`,
      ]
    : [
        `Mutual Base ${baseShift}`,
        `Base Off ${stats.BASE_OFF}`,
        `Mutual Open ${stats.OPEN}`,
        `No Match ${stats.NO_MATCH}`,
        `Base Working ${stats.BASE_WORKING}`,
        `Holiday ${stats.HOLIDAY}`,
        `Payday ${stats.PAYDAY}`,
      ];
  for (const text of chips) {
    const chip = document.createElement('span');
    chip.className = 'summary-chip';
    chip.textContent = text;
    monthSummary.appendChild(chip);
  }
}

function isSickDay(shift, dateUtc) {
  const override = effectiveStatusForDate(shift, dateUtc).override;
  const entryType = entryTypeForOverride(override);
  return isSickEntryType(entryType);
}

function sickStatsForYear(shift, year) {
  const start = utcDate(year, 0, 1);
  const end = utcDate(year, 11, 31);
  let sickDays = 0;
  let occurrences = 0;
  let prevSick = isSickDay(shift, addDaysUtc(start, -1));

  for (let day = new Date(start); day <= end; day = addDaysUtc(day, 1)) {
    const sick = isSickDay(shift, day);
    if (sick) {
      sickDays++;
      if (!prevSick) occurrences++;
    }
    prevSick = sick;
  }
  return { sickDays, occurrences };
}

function computeShiftMetricsForRange(shift, start, end) {
  const entryCounts = {};
  const metrics = {
    dayShifts: 0,
    nightShifts: 0,
    offDays: 0,
    holidays: 0,
    paydays: 0,
    entries: 0,
    overtime: 0,
    mutualCodes: 0,
    training: 0,
    meetings: 0,
    sickDays: 0,
    sickOccurrences: 0,
    editedDays: 0,
    entryCounts,
  };

  let prevSick = isSickDay(shift, addDaysUtc(start, -1));
  for (let day = new Date(start); day <= end; day = addDaysUtc(day, 1)) {
    const effective = effectiveStatusForDate(shift, day);
    const status = effective.effectiveStatus;
    if (status === 'DAY') metrics.dayShifts++;
    else if (status === 'NIGHT') metrics.nightShifts++;
    else metrics.offDays++;

    const markers = markersForDate(day);
    if (markers.holiday) metrics.holidays++;
    if (markers.payday) metrics.paydays++;

    if (effective.override) {
      metrics.editedDays++;
    }

    const entryType = entryTypeForOverride(effective.override);
    const sick = isSickEntryType(entryType);
    if (entryType !== 'NONE') {
      metrics.entries++;
      entryCounts[entryType] = (entryCounts[entryType] || 0) + 1;
      if (entryType === 'OVERTIME') metrics.overtime++;
      if (entryType === 'MUTUAL_ABSENT' || entryType === 'MUTUAL_SICK') metrics.mutualCodes++;
      if (entryType === 'TRAINING') metrics.training++;
      if (entryType === 'MEETING') metrics.meetings++;
      if (sick) metrics.sickDays++;
    }
    if (sick && !prevSick) {
      metrics.sickOccurrences++;
    }
    prevSick = sick;
  }
  return metrics;
}

function computeMutualAvailabilityForRange(baseShift, start, end) {
  const byShift = {};
  for (const shift of SHIFT_IDS) {
    if (shift !== baseShift) {
      byShift[shift] = 0;
    }
  }
  const stats = {
    baseOffDays: 0,
    baseWorkingDays: 0,
    openDays: 0,
    noMatchDays: 0,
    byShift,
  };

  for (let day = new Date(start); day <= end; day = addDaysUtc(day, 1)) {
    const mutual = mutualOptionsForBaseShiftDate(baseShift, day);
    if (mutual.baseStatus === 'OFF') {
      stats.baseOffDays++;
      if (mutual.options.length) {
        stats.openDays++;
        for (const option of mutual.options) {
          if (Object.prototype.hasOwnProperty.call(byShift, option.shift)) {
            byShift[option.shift]++;
          }
        }
      } else {
        stats.noMatchDays++;
      }
    } else {
      stats.baseWorkingDays++;
    }
  }
  return stats;
}

function createStatsCard(title, lines) {
  const card = document.createElement('article');
  card.className = 'stats-card';
  const heading = document.createElement('h4');
  heading.textContent = title;
  card.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'stats-list';
  for (const line of lines) {
    const row = document.createElement('p');
    row.textContent = line;
    list.appendChild(row);
  }
  card.appendChild(list);
  return card;
}

function renderStatsDashboard() {
  if (!statsSummary) return;
  statsSummary.innerHTML = '';

  const activeShift = calendarShiftForTheme();
  const monthStart = utcDate(state.year, state.month, 1);
  const monthEnd = utcDate(state.year, state.month + 1, 0);
  const yearStart = utcDate(state.year, 0, 1);
  const yearEnd = utcDate(state.year, 11, 31);

  const monthMetrics = computeShiftMetricsForRange(activeShift, monthStart, monthEnd);
  const yearMetrics = computeShiftMetricsForRange(activeShift, yearStart, yearEnd);
  const monthMutual = computeMutualAvailabilityForRange(activeShift, monthStart, monthEnd);
  const yearMutual = computeMutualAvailabilityForRange(activeShift, yearStart, yearEnd);

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  grid.appendChild(createStatsCard(`${monthName(state.month, state.year)} - ${activeShift}`, [
    `Day Shifts: ${monthMetrics.dayShifts}`,
    `Night Shifts: ${monthMetrics.nightShifts}`,
    `Off Days: ${monthMetrics.offDays}`,
    `Overtime: ${monthMetrics.overtime}`,
    `Mutual Codes: ${monthMetrics.mutualCodes}`,
    `Sick: ${monthMetrics.sickDays} day(s), ${monthMetrics.sickOccurrences} occurrence(s)`,
    `Training: ${monthMetrics.training}`,
    `Meetings: ${monthMetrics.meetings}`,
    `Holiday Markers: ${monthMetrics.holidays}`,
    `Payday Markers: ${monthMetrics.paydays}`,
    `Edited Days: ${monthMetrics.editedDays}`,
  ]));

  grid.appendChild(createStatsCard(`${state.year} Totals - ${activeShift}`, [
    `Day Shifts: ${yearMetrics.dayShifts}`,
    `Night Shifts: ${yearMetrics.nightShifts}`,
    `Off Days: ${yearMetrics.offDays}`,
    `Entries Logged: ${yearMetrics.entries}`,
    `Overtime: ${yearMetrics.overtime}`,
    `Mutual Codes: ${yearMetrics.mutualCodes}`,
    `Sick: ${yearMetrics.sickDays} day(s), ${yearMetrics.sickOccurrences} occurrence(s)`,
    `Training: ${yearMetrics.training}`,
    `Meetings: ${yearMetrics.meetings}`,
    `Edited Days: ${yearMetrics.editedDays}`,
  ]));

  grid.appendChild(createStatsCard(`${monthName(state.month, state.year)} Mutual Availability`, [
    `Base Shift: ${activeShift}`,
    `Base Off Days: ${monthMutual.baseOffDays}`,
    `Mutual Open Days: ${monthMutual.openDays}`,
    `No Match Days: ${monthMutual.noMatchDays}`,
    ...Object.keys(monthMutual.byShift).map((shift) => `${shift} Available: ${monthMutual.byShift[shift]}`),
  ]));

  grid.appendChild(createStatsCard(`${state.year} Mutual Availability`, [
    `Base Shift: ${activeShift}`,
    `Base Off Days: ${yearMutual.baseOffDays}`,
    `Mutual Open Days: ${yearMutual.openDays}`,
    `No Match Days: ${yearMutual.noMatchDays}`,
    ...Object.keys(yearMutual.byShift).map((shift) => `${shift} Available: ${yearMutual.byShift[shift]}`),
  ]));

  statsSummary.appendChild(grid);

  const breakdownCard = document.createElement('article');
  breakdownCard.className = 'stats-card';
  const heading = document.createElement('h4');
  heading.textContent = `${state.year} Entry Breakdown`;
  breakdownCard.appendChild(heading);

  const breakdownWrap = document.createElement('div');
  breakdownWrap.className = 'stats-breakdown';
  const ranked = Object.entries(yearMetrics.entryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!ranked.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No time codes logged this year.';
    breakdownCard.appendChild(empty);
  } else {
    for (const [entryType, count] of ranked) {
      const chip = document.createElement('span');
      chip.className = 'stats-chip';
      chip.textContent = `${entryDefinition(entryType).label}: ${count}`;
      breakdownWrap.appendChild(chip);
    }
    breakdownCard.appendChild(breakdownWrap);
  }
  statsSummary.appendChild(breakdownCard);
}

function renderAttendanceSummary() {
  if (!attendanceSummary) return;
  attendanceSummary.innerHTML = '';
  if (isMutualMode()) {
    const baseShift = mutualBaseShiftForMode(state.shift) || 'I2';
    const items = [
      `Mode: ${state.shift}`,
      `Mutual Overlay: ${SHIFT_IDS.join(', ')}`,
      `Base Shift for Mutuals: ${baseShift}`,
      'Tip: Switch to I2/J2/K2/L2 to edit your own schedule.',
    ];
    for (const text of items) {
      const chip = document.createElement('span');
      chip.className = 'attendance-chip';
      chip.textContent = text;
      attendanceSummary.appendChild(chip);
    }
    return;
  }
  const yearly = sickStatsForYear(state.shift, state.year);
  const items = [
    `Sick Days (${state.year}): ${yearly.sickDays}`,
    `Sick Occurrences (${state.year}): ${yearly.occurrences}`,
  ];
  if (anniversaryDateIso) {
    items.push(`Anniversary: ${anniversaryDateIso}`);
  }
  for (const text of items) {
    const chip = document.createElement('span');
    chip.className = 'attendance-chip';
    chip.textContent = text;
    attendanceSummary.appendChild(chip);
  }
}

function addDaysUtc(dateUtc, days) {
  return new Date(dateUtc.getTime() + days * 86400000);
}

function ymd(dateUtc) {
  const y = dateUtc.getUTCFullYear();
  const m = String(dateUtc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateUtc.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function ymdFromIso(isoDate) {
  return isoDate.replace(/-/g, '');
}

function icsEscape(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function pushIcsEvent(rows, uid, summary, yyyymmdd) {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const next = ymd(utcDate(y, m - 1, d + 1));
  rows.push(
    'BEGIN:VEVENT',
    `UID:${icsEscape(uid)}`,
    `DTSTAMP:${ymd(new Date())}T000000Z`,
    `SUMMARY:${icsEscape(summary)}`,
    `DTSTART;VALUE=DATE:${yyyymmdd}`,
    `DTEND;VALUE=DATE:${next}`,
    'END:VEVENT'
  );
}

function overrideSummary(shift, override) {
  const labels = [];
  const entryType = entryTypeForOverride(override);
  if (entryType !== 'NONE') labels.push(entryDefinition(entryType).label);
  if (override.note) labels.push(override.note);
  if (!labels.length) return '';
  return `${shift} ${labels.join(' - ')}`;
}

function toIcs(shift, year) {
  const start = utcDate(year, 0, 1);
  const end = utcDate(year, 11, 31);
  const rows = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shift Calendar PWA//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${shift} ${APP_NAME} ${year}`,
  ];

  for (let d = new Date(start); d <= end; d = addDaysUtc(d, 1)) {
    const day = effectiveStatusForDate(shift, d);
    const status = day.effectiveStatus;
    const overrideEvent = day.override ? overrideSummary(shift, day.override) : '';

    if (status !== 'OFF') {
      const summary = status === 'DAY' ? `${shift} Day Shift` : `${shift} Night Shift`;
      pushIcsEvent(rows, `${shift}-${ymd(d)}-${status.toLowerCase()}@shift.local`, summary, ymd(d));
    }
    if (overrideEvent) {
      pushIcsEvent(rows, `${shift}-${ymd(d)}-override@shift.local`, overrideEvent, ymd(d));
    }
  }

  const specials = specialDatesForYear(year);
  if (specials) {
    for (const date of specials.paydays) {
      pushIcsEvent(rows, `payday-${ymdFromIso(date)}@shift.local`, 'Payday', ymdFromIso(date));
    }
    for (const date of specials.holidays) {
      pushIcsEvent(rows, `holiday-${ymdFromIso(date)}@shift.local`, 'Holiday', ymdFromIso(date));
    }
  }

  rows.push('END:VCALENDAR', '');
  return rows.join('\r\n');
}

function downloadIcs() {
  if (isMutualMode()) {
    window.alert('Select I2, J2, K2, or L2 to download an ICS file.');
    return;
  }
  const content = toIcs(state.shift, state.year);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.shift}-suncor-shift-${state.year}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportEdits() {
  const payload = {
    app: APP_NAME,
    version: 1,
    generatedAt: new Date().toISOString(),
    overridesByShift,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `suncor-shift-edits-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function sanitizeImportedOverrides(input) {
  if (!input || typeof input !== 'object') return {};
  const out = {};
  for (const shift of Object.keys(SHIFT_OFFSETS)) {
    const source = input[shift];
    if (!source || typeof source !== 'object') continue;
    out[shift] = {};
    for (const key of Object.keys(source)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
      const item = source[key];
      if (!item || typeof item !== 'object') continue;
      const state = normalizeOverrideState(item.state);
      const entryType = normalizeEntryType(item.entryType || item.special);
      const note = String(item.note || '').trim().slice(0, 50);
      if (state === 'DEFAULT' && entryType === 'NONE' && !note) continue;
      out[shift][key] = { state, entryType, note };
    }
    if (Object.keys(out[shift]).length === 0) delete out[shift];
  }
  return out;
}

function importEditsFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      const imported = sanitizeImportedOverrides(parsed.overridesByShift || parsed);
      const ok = window.confirm('Replace current saved edits with imported edits?');
      if (!ok) return;
      overridesByShift = imported;
      saveOverrides();
      closeEditor();
      renderMonth();
    } catch (err) {
      window.alert('Invalid edits file.');
    } finally {
      importEditsInput.value = '';
    }
  };
  reader.readAsText(file);
}

function clearAllEdits() {
  const ok = window.confirm('Clear all saved day edits for every shift?');
  if (!ok) return;
  overridesByShift = {};
  saveOverrides();
  closeEditor();
  renderMonth();
}

function disarmResetCalendar() {
  resetCalendarArmed = false;
  if (resetCalendarConfirmTimer) {
    clearTimeout(resetCalendarConfirmTimer);
    resetCalendarConfirmTimer = null;
  }
  if (resetCalendarBtn) {
    resetCalendarBtn.textContent = RESET_BUTTON_DEFAULT_TEXT;
  }
}

function armResetCalendar() {
  resetCalendarArmed = true;
  if (resetCalendarBtn) {
    resetCalendarBtn.textContent = RESET_BUTTON_CONFIRM_TEXT;
  }
  if (resetCalendarConfirmTimer) {
    clearTimeout(resetCalendarConfirmTimer);
  }
  resetCalendarConfirmTimer = setTimeout(() => {
    disarmResetCalendar();
  }, 4500);
}

function resetCalendar() {
  disarmResetCalendar();

  const storageKeys = [
    OVERRIDES_KEY,
    THEME_KEY,
    WEEK_START_KEY,
    LABEL_STYLE_KEY,
    ANNIVERSARY_KEY,
    QUICK_ENTRY_TYPES_KEY,
    VIEW_KEY,
  ];

  for (const key of storageKeys) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // Ignore.
    }
  }

  overridesByShift = {};
  quickEntryTypes = DEFAULT_QUICK_ENTRY_TYPES.slice();
  selectedOverrideState = 'DEFAULT';
  selectedEntryType = 'NONE';
  weekStartsOn = 'sun';
  shiftLabelStyle = 'long';
  anniversaryDateIso = '';

  state.shift = 'I2';
  const now = new Date();
  state.year = now.getFullYear();
  state.month = now.getMonth();

  if (shiftSelect) {
    shiftSelect.value = state.shift;
  }
  ensureYearOption(state.year);
  if (yearSelect) {
    yearSelect.value = String(state.year);
  }
  if (jumpDateInput) {
    jumpDateInput.value = '';
  }
  if (noteInput) {
    noteInput.value = '';
  }

  applyTheme('system');
  applyWeekStart('sun');
  applyShiftLabelStyle('long');
  applyAnniversaryDate('');
  applyShiftTheme(calendarShiftForTheme());
  renderQuickEntryButtons();
  closeQuickAddPanel();
  closeEditor();
  closeSettings();
  renderMonth();
}

function handleResetCalendarClick() {
  if (!resetCalendarArmed) {
    armResetCalendar();
    return;
  }
  resetCalendar();
}

function jumpToDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const [y, m] = isoDate.split('-').map((v) => Number(v));
  if (!y || !m) return false;
  state.year = y;
  state.month = m - 1;
  ensureYearOption(state.year);
  if (yearSelect) yearSelect.value = String(state.year);
  closeEditor();
  closeSettings();
  renderMonth();
  return true;
}

function goToToday() {
  const now = new Date();
  const todayUtc = utcDate(now.getFullYear(), now.getMonth(), now.getDate());
  state.year = todayUtc.getUTCFullYear();
  state.month = todayUtc.getUTCMonth();
  ensureYearOption(state.year);
  if (yearSelect) yearSelect.value = String(state.year);
  jumpDateInput.value = isoDateKey(todayUtc);
  closeEditor();
  closeSettings();
  renderMonth();
}

function wireEvents() {
  shiftSelect.addEventListener('change', () => {
    state.shift = shiftSelect.value;
    applyShiftTheme(calendarShiftForTheme());
    closeEditor();
    renderMonth();
  });

  if (yearSelect) {
    yearSelect.addEventListener('change', () => {
      const parsed = Number(yearSelect.value);
      if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2500) {
        yearSelect.value = String(state.year);
        return;
      }
      state.year = parsed;
      closeEditor();
      renderMonth();
    });
  }
  if (monthSelect) {
    monthSelect.addEventListener('change', () => {
      const parsed = Number(monthSelect.value);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 11) {
        monthSelect.value = String(state.month);
        return;
      }
      state.month = parsed;
      closeEditor();
      renderMonth();
    });
  }

  prevMonthBtn.addEventListener('click', () => {
    if (state.month === 0) {
      state.month = 11;
      state.year--;
      ensureYearOption(state.year);
      if (yearSelect) yearSelect.value = String(state.year);
    } else {
      state.month--;
    }
    closeEditor();
    renderMonth();
  });

  nextMonthBtn.addEventListener('click', () => {
    if (state.month === 11) {
      state.month = 0;
      state.year++;
      ensureYearOption(state.year);
      if (yearSelect) yearSelect.value = String(state.year);
    } else {
      state.month++;
    }
    closeEditor();
    renderMonth();
  });

  downloadBtn.addEventListener('click', downloadIcs);
  if (todayBtn) {
    todayBtn.addEventListener('click', goToToday);
  }
  if (jumpDateBtn && jumpDateInput) {
    jumpDateBtn.addEventListener('click', () => {
      if (!jumpToDate(jumpDateInput.value)) {
        window.alert('Enter a valid date.');
      }
    });
    jumpDateInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!jumpToDate(jumpDateInput.value)) {
          window.alert('Enter a valid date.');
        }
      }
    });
  }
  if (exportEditsBtn) {
    exportEditsBtn.addEventListener('click', exportEdits);
  }
  if (importEditsInput) {
    importEditsInput.addEventListener('change', () => {
      importEditsFile(importEditsInput.files?.[0] || null);
    });
  }
  if (clearAllEditsBtn) {
    clearAllEditsBtn.addEventListener('click', clearAllEdits);
  }
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettings);
  }
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
    });
  }
  if (weekStartSelect) {
    weekStartSelect.addEventListener('change', () => {
      applyWeekStart(weekStartSelect.value);
      closeEditor();
      renderMonth();
    });
  }
  if (shiftLabelStyleSelect) {
    shiftLabelStyleSelect.addEventListener('change', () => {
      applyShiftLabelStyle(shiftLabelStyleSelect.value);
      closeEditor();
      renderMonth();
    });
  }
  if (anniversaryDateInput) {
    anniversaryDateInput.addEventListener('change', () => {
      applyAnniversaryDate(anniversaryDateInput.value);
      closeEditor();
      renderMonth();
    });
  }
  if (clearAnniversaryBtn) {
    clearAnniversaryBtn.addEventListener('click', () => {
      applyAnniversaryDate('');
      closeEditor();
      renderMonth();
    });
  }
  if (resetCalendarBtn) {
    resetCalendarBtn.textContent = RESET_BUTTON_DEFAULT_TEXT;
    resetCalendarBtn.addEventListener('click', handleResetCalendarClick);
  }

  if (stateOptions) {
    stateOptions.addEventListener('click', (event) => {
      const button = event.target.closest('.choice-btn');
      if (!button) return;
      selectedOverrideState = button.dataset.value || 'DEFAULT';
      setActiveChoice(stateOptions, selectedOverrideState);
    });
  }

  if (entryTypeSelect) {
    entryTypeSelect.addEventListener('change', () => {
      selectedEntryType = normalizeEntryType(entryTypeSelect.value);
      entryTypeSelect.value = selectedEntryType;
      setActiveChoice(quickEntryOptions, quickEntryValue(selectedEntryType));
    });
  }
  if (quickEntryOptions) {
    quickEntryOptions.addEventListener('click', (event) => {
      const remove = event.target.closest('.quick-remove');
      if (remove) {
        const candidate = normalizeEntryType(remove.dataset.value || '');
        if (!candidate || isLockedQuickEntryType(candidate)) return;
        quickEntryTypes = normalizeQuickEntryTypes(quickEntryTypes.filter((value) => value !== candidate));
        saveQuickEntryTypes();
        if (selectedEntryType === candidate) {
          selectedEntryType = 'NONE';
        }
        if (entryTypeSelect) {
          entryTypeSelect.value = selectedEntryType;
        }
        renderQuickEntryButtons();
        setActiveChoice(quickEntryOptions, quickEntryValue(selectedEntryType));
        if (quickAddPanel && !quickAddPanel.classList.contains('hidden')) {
          populateQuickAddSelect();
        }
        return;
      }
      const button = event.target.closest('.choice-btn');
      if (!button) return;
      const action = button.dataset.action || 'select';
      if (action === 'add') {
        openQuickAddPanel();
      } else {
        selectedEntryType = normalizeEntryType(button.dataset.value || 'NONE');
        closeQuickAddPanel();
      }
      if (entryTypeSelect) {
        entryTypeSelect.value = selectedEntryType;
      }
      setActiveChoice(quickEntryOptions, quickEntryValue(selectedEntryType));
    });
  }
  if (quickAddCancelBtn) {
    quickAddCancelBtn.addEventListener('click', () => {
      closeQuickAddPanel();
    });
  }
  if (quickAddConfirmBtn) {
    quickAddConfirmBtn.addEventListener('click', () => {
      const candidate = normalizeEntryType(quickAddSelect?.value || '');
      if (candidate === 'NONE' || quickEntryTypes.includes(candidate)) {
        closeQuickAddPanel();
        return;
      }
      quickEntryTypes = normalizeQuickEntryTypes([...quickEntryTypes, candidate]);
      saveQuickEntryTypes();
      selectedEntryType = candidate;
      renderQuickEntryButtons();
      if (entryTypeSelect) {
        entryTypeSelect.value = selectedEntryType;
      }
      setActiveChoice(quickEntryOptions, quickEntryValue(selectedEntryType));
      closeQuickAddPanel();
    });
  }

  if (dayEditor) {
    dayEditor.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    dayEditor.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }
  if (settingsPanel) {
    settingsPanel.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    settingsPanel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }
  if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', closeEditor);
  }
  if (editorBackdrop) {
    editorBackdrop.addEventListener('click', () => {
      closeEditor();
      closeSettings();
    });
  }
  if (clearDayBtn) {
    clearDayBtn.addEventListener('click', clearCurrentOverride);
  }
  if (saveDayBtn) {
    saveDayBtn.addEventListener('click', saveCurrentOverride);
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dayEditor && !dayEditor.classList.contains('hidden')) {
      closeEditor();
    }
    if (event.key === 'Escape' && settingsPanel && !settingsPanel.classList.contains('hidden')) {
      closeSettings();
    }
  });
  window.addEventListener('resize', () => {
    updateVisualViewportInset();
    renderMonth();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateVisualViewportInset);
    window.visualViewport.addEventListener('scroll', updateVisualViewportInset);
  }
}

function setupInstallPrompt() {
  if (isAndroidAppWebView()) {
    if (installBtn) {
      installBtn.classList.add('hidden');
    }
    return;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installBtn) {
      installBtn.classList.remove('hidden');
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.classList.add('hidden');
    });
  }
}

function isLocalDevHost() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

async function clearLocalServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    await reg.unregister();
  }
}

async function registerServiceWorker() {
  if (isAndroidAppWebView()) return;
  if (!('serviceWorker' in navigator)) return;
  if (isLocalDevHost()) {
    await clearLocalServiceWorkers();
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js');
  } catch (err) {
    console.error('SW registration failed', err);
  }
}

function init() {
  populateYearSelect();
  populateMonthSelect();
  populateEntryTypeSelect();
  quickEntryTypes = loadQuickEntryTypes();
  renderQuickEntryButtons();
  const savedView = loadViewState();
  state.shift = savedView?.shift || shiftSelect.value;
  const defaultYear = Math.min(YEAR_MAX, Math.max(YEAR_MIN, new Date().getFullYear()));
  state.year = savedView?.year || defaultYear;
  state.month = Number.isInteger(savedView?.month) ? savedView.month : state.month;
  if (!Number.isInteger(state.month) || state.month < 0 || state.month > 11) {
    state.month = new Date().getMonth();
  }
  weekStartsOn = loadWeekStart();
  shiftLabelStyle = loadLabelStyle();
  anniversaryDateIso = loadAnniversaryDate();
  shiftSelect.value = state.shift;
  ensureYearOption(state.year);
  if (yearSelect) {
    yearSelect.value = String(state.year);
  }
  if (monthSelect) {
    monthSelect.value = String(state.month);
  }
  applyWeekStart(weekStartsOn);
  applyShiftLabelStyle(shiftLabelStyle);
  applyAnniversaryDate(anniversaryDateIso);
  applyShiftTheme(calendarShiftForTheme());
  applyTheme(loadThemeMode());
  updateVisualViewportInset();
  setupBrandLogoFallback();
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change', () => {
    if (currentThemeMode === 'system') {
      applyTheme('system');
    }
  });
  document.title = APP_NAME;
  wireEvents();
  setupInstallPrompt();
  renderMonth();
  registerServiceWorker();
}

init();
