Suncor Shift Calendar (Android + Google Calendar)

This project generates `.ics` files for a `3 days / 3 nights / 6 off` rotation.

Default reference date is `2026-01-01` with known offsets:
- `I2` = cycle day 1 on 2026-01-01
- `J2` = cycle day 4 on 2026-01-01
- `K2` = cycle day 7 on 2026-01-01
- `L2` = cycle day 10 on 2026-01-01

## Generate I2 calendar

```powershell
node .\generate-shift-ics.js --shift I2 --from 2026-01-01 --to 2027-12-31 --out .\I2-2026-2027.ics
```

## Import into Google Calendar

1. Open Google Calendar on desktop browser.
2. Go to `Settings` -> `Import & export` -> `Import`.
3. Choose `I2-2026-2027.ics`.
4. Import into a new calendar named `I2 Shift`.
5. On Android, open Google Calendar app and enable that calendar.

## Choose a different shift

Generate a separate file per shift and import each into its own calendar.

```powershell
node .\generate-shift-ics.js --shift J2 --out .\J2-2026.ics
node .\generate-shift-ics.js --shift K2 --out .\K2-2026.ics
node .\generate-shift-ics.js --shift L2 --out .\L2-2026.ics
```

Then toggle calendar visibility in Google Calendar to switch between shifts.

## If your pattern starts on a different cycle day

Use `--offset 1..12` to override the shift phase on `2026-01-01`.

```powershell
node .\generate-shift-ics.js --offset 1 --out .\custom.ics
```

## PWA app (choose shift on phone)

This folder now includes a lightweight installable web app:
- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `sw.js`

Features:
- choose `I2 / J2 / K2 / L2`
- month-by-month view
- color coding for Day / Night / Off
- holiday/payday badges (2026 data from your base-plant calendar)
- tap/click any day (or the day `Edit` button) to override shift and add Training/Overtime/Note
- `Today` button and jump-to-date
- monthly summary chips (day/night/off/training/overtime/edited)
- export/import all saved edits (JSON backup/restore)
- export selected year to `.ics`
- installable on Android as a home-screen app

## Acting Hours Tracker

The app now includes an **Acting Hours Tracker** for union-limit planning.

### What it tracks

- Tracks only acting/upgrade time entries.
- Entries are stored offline on-device using IndexedDB (`localStorage` fallback if needed).
- Entry fields: `date`, `hours`, `note`, `createdAt` (source is manual entry).

### Union year rules

- Union year is fixed: **May 1 -> April 30**.
- Dashboard computes totals against the **1040-hour cap**.
- If today is May-Dec, union year starts May 1 of current year.
- If today is Jan-Apr, union year starts May 1 of previous year.

### Dashboard and warnings

- Shows:
  - `Used / 1040`
  - `Remaining`
  - `% used`
  - union-year date range
  - safe weekly pace (`remaining / weeks left`)
- In-app warning banner states:
  - warning at `75%`
  - critical warning at `90%`
  - clear `OVER LIMIT` state at `100%+`

### Day + Calendar integration

- Day editor includes `Acting Hours logged: X` and **Add Acting Hours for this day**.
- Calendar cells display an acting badge (for example `A: 10.5`) on days with logged acting entries.

### Tracker screen

- Open **Acting Hours Tracker** section from the dashboard or accordion.
- Filter by union year (default = current) and optional month.
- Entries are grouped by month and support edit/delete.
- **Export CSV** columns: `date,hours,note,createdAt`.
- `Reset Calendar` also clears acting tracker data.

## Native Android APK wrapper

If you want direct APK install (not Play Store), see:

- `android-apk/README.md`

This wrapper bundles the app offline and applies strict WebView hardening.

### Preview locally

From this folder:

```powershell
npx serve . -l 4173
```

Then open:
- Desktop: `http://localhost:4173`
- Phone on same Wi-Fi: `http://<your-computer-ip>:4173`

To find your computer IP:

```powershell
ipconfig
```

Use the `IPv4 Address` from your active Wi-Fi adapter.

### Install on Android

1. Open the app URL in Chrome on Android.
2. Tap menu -> `Add to Home screen` (or `Install app`).
3. Launch it from the home screen.

### How to test quickly

1. Select `I2`, year `2026`.
2. Check January:
   - Jan 1-3 = Day
   - Jan 4-6 = Night
   - Jan 7-12 = Off
3. Tap `Download ICS` and import that file into Google Calendar.

### Edit a specific day (touch screen)

1. Tap any day cell.
2. Choose `Shift Override`: `Default`, `Day`, `Night`, or `Off`.
3. Optional: choose `Training` or `Overtime`.
4. Optional: add a short note.
5. Tap `Save`.

Saved edits are stored on your device and included in ICS export.
