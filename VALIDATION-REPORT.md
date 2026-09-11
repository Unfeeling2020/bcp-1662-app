# Validation report - BCP 1662 foundation v0.1

Prepared September 11, 2026. These results apply to the new foundation files in this package, not to the existing repository's complete services.

## Source preservation

- Both attached source files match the SHA-256 values recorded in SOURCE-IMPORT-REPORT.json.
- All 1,824 lesson slots (456 records times four slots) were compared directly against their original workbook cells using openpyxl. All matched, including null cells and nonbreaking spaces.
- All 11 imported prayer bodies were compared directly against their source paragraphs in the attached Word document using python-docx. All matched after trimming paragraph-edge whitespace.
- The workbook contains 366 daily records and 90 named records. No correction was applied to Calendar!D373 or any other source reference.
- This verifies the conversion, not the historical correctness of each appointment or transcription.

## Regression checks

Node.js v22.16.0 ran all 77 included checks successfully in each of these time zones:

| Time zone | Result |
| --- | --- |
| UTC | 77/77 |
| America/Chicago | 77/77 |
| America/Los_Angeles | 77/77 |
| Europe/London | 77/77 |
| Pacific/Auckland | 77/77 |

The suite covers civil-date validation, local-date handling, leap years, daylight-saving transitions, Gregorian Easter, Advent, named appointments, per-lesson fallback, unresolved collisions, source warnings, personal prayer dates, the annual January rule, Ember periods, creed selection, Litany-related prayer selection, and structured state-prayer adaptations.

Separately, every Easter date from 1583 through 4099 inclusive (2,517 years) matched an independent calculation using python-dateutil's Gregorian Easter algorithm. This is not a claim that Gregorian civil dating is historically appropriate for every country throughout that range.

Run the included regression suite with `node bcp1662-tests.js`, or with the preview's **Sources, scope, and checks > Run code checks** button.

## Browser interactions and visual inspection

Chromium completed 25 interface checks with no uncaught JavaScript errors. Desktop dimensions were 1280 by 1000 pixels; the mobile portrait viewport was 390 by 844 pixels, with America/Chicago as the browser time zone. Full-page images were inspected for desktop, mobile light mode, and mobile dark mode. No horizontal overflow was detected at 390 pixels.

### Browser-test limitation

This environment blocked both HTTP and file-URL browser navigation with ERR_BLOCKED_BY_ADMINISTRATOR. No browser security policy was disabled. Instead, the delivered HTML and JavaScript were rendered in an isolated blank browser page, with the requested query parameters seeded by the test harness. This exercises the application logic, DOM rendering, and controls, but **does not verify live hosting or resource loading from a deployed URL**.

Not verified here: GitHub Pages deployment, external Bible links loading in a user's browser, clipboard permission behavior, preference persistence at a real page origin, Safari, Firefox, or physical mobile devices. The application guards unavailable local storage and clipboard access rather than requiring those capabilities.

### Successful interface checks

- Morning Prayer shows source-resolved first and second lessons
- Non-Ember Monday in Ember Week includes one Ember prayer
- Morning Prayer without Litany includes All Conditions
- Shifted January Sunday has no annual presidential intention
- January 21 shows annual intention
- January 21 shows one Office state prayer
- Advent 1 resolves correct lesson text
- Collision suppresses automatic lessons
- Explicit collision choice resolves lesson
- Workbook discrepancy is visible
- Thanksgiving date displays daily and harvest prayers
- Manual omission removes prayer and records a notice
- Reset restores automatic prayers
- Litany mode shows no duplicate state prayer
- Entered name is rendered as text, not HTML
- Ember alternative selection replaces the first form
- Litany personal override updates prayer selection
- communion has the second state form and no invented propers
- communion keeps Independence Day as a supplementary devotion
- ante-communion has the second state form and no invented propers
- ante-communion keeps Independence Day as a supplementary devotion
- Browser test suite runs from the preview
- 390px mobile viewport has no horizontal overflow
- Mobile preview has no load error
- Dark-mode control updates appearance

## Remaining scope

The preview is not a complete Office, Communion, or Ante-Communion service. The full service texts, Psalter, collects, Communion propers, embedded lessons, full occasional-prayer library, and final rubrical/transcription audit are not complete in this package. Coinciding appointments deliberately require a choice rather than using an unapproved precedence rule. The Sunday-through-Saturday Ember Week convention is disclosed in SOURCE-NOTES.md.

No existing repository file was replaced, and nothing was uploaded or deployed to GitHub by this work.
