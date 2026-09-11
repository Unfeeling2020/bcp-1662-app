# BCP 1662 - first implementation package

Version 0.1 | Calendar, imported source data, prayer selection, and a browser preview

## What this package is

These are new, working files for the calendar-and-prayer foundation of your project. They do not replace any of your existing files. The preview is deliberately labeled as a development preview, not a complete Office or Communion service.

The next implementation layer is the complete service renderer: all printed service texts, Psalter, collects and their continuation rules, Communion propers, and embedded biblical lessons. Those are **not** supplied by this installment. In particular, neither Communion mode currently displays the full rite.

## Open it locally

Extract the ZIP, keep the files together, and open `preview.html` in your browser. No installation or build command is needed. The calendar, imported references, and prayer texts work locally. The biblical passage links require an internet connection.

## Add it to your existing GitHub project

1. Open your `bcp-1662-app` repository. Keep `index.html`, `bcp.js`, `collects.js`, `lectionary.js`, and `manifest.json` unchanged.
2. Use **Add file > Upload files**. Upload the extracted files listed below into the repository root, beside `index.html`. Upload the contents, not the ZIP and not a containing folder.
3. Commit the new files to the branch used by GitHub Pages. This adds the preview without changing your current main page.
4. With the usual project-site address, the new page will be at `https://unfeeling2020.github.io/bcp-1662-app/preview.html` once deployment succeeds. That is the expected address, not a claim that this package has already been uploaded or deployed.

GitHub's upload instructions:
https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

### GitHub Pages configuration

When Pages is not already configured, use **Settings > Pages**, choose **Deploy from a branch**, select **main**, and select **/ (root)** as the source folder. Save. When Pages is already working from a different branch or folder, use that existing publishing source instead of changing it unnecessarily.

GitHub's publishing-source instructions:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

### Copy-and-paste alternative

Every JavaScript and HTML file is plain text. Open a downloaded file in a text editor, copy its entire contents, and use **Add file > Create new file** in GitHub with the identical filename. Do not paste Markdown code fences. Preserve `.js` and `.html`; do not add a final `.txt` extension.

## Files

| File | Function |
| --- | --- |
| `preview.html` | A separate mobile/desktop page for inspecting the results. |
| `bcp1662-data.js` | All 366 daily rows, 90 named rows, and 11 supplied prayers, with source locations. |
| `bcp1662-calendar.js` | Civil dates, Gregorian Easter, Advent, named occasions, Ember periods, creed selection, and your dated intentions. |
| `bcp1662-lectionary.js` | Resolves all four Office lesson slots independently; preserves missing-data and collision warnings. |
| `bcp1662-prayers.js` | The four requested automatic BCP prayers, your adaptations, and the prayer-plan API. |
| `bcp1662-tests.js` | Regression tests; also runs from the preview page. |
| `SOURCE-NOTES.md` | Source decisions, conventions, and unfinished areas. |
| `SOURCE-IMPORT-REPORT.json` | Source file hashes, record counts, and the retained discrepancy. |
| `VALIDATION-REPORT.md` | Results of source, calendar, time-zone, and browser checks performed for this package. |

The six HTML/JavaScript files make the preview work. Upload the documentation too so its explanatory links work.

## What to check in the preview

**January 20, 2026:** The annual presidential intention appears on the 20th, although this is not an inauguration year.

**January 20 and 21, 2030:** The intention is absent on Sunday the 20th and present on Monday the 21st. Other fixed prayer dates are not automatically Monday-observed.

**September 14 and 16, 2026:** Both dates get an Ember prayer in the Office plan. Only the 16th is one of that week's actual Ember Days. The adopted week boundary is documented in the source notes.

**November 29, 2026:** The calendar identifies Advent 1. The proper first lessons are Isaiah 1 and Isaiah 2; the second lessons remain the workbook's daily John 21 and Hebrews 5.

**December 26, 2026:** The source discrepancy is visible. The app has not replaced the workbook's `Ecclesiastes 4` with `Ecclesiasticus 4`.

**March 25, 2029:** Annunciation and the Sunday next before Easter coincide. The preview requests an explicit appointment rather than supplying an undocumented precedence rule.

Use **Sources, scope, and checks > Run code checks** to run the included tests in your browser.

## Approved presidential behavior

The first presidential prayer in your Word document is the ordinary Office replacement; the second is the regular replacement after the Commandments in both Communion modes. Their original bodies are retained unchanged.

At Morning Prayer when the Litany is read, the presidential Litany petition is used and the separate Office state prayer is not repeated. This follows the Office's omission rule for the group of prayers following the Anthem when the Litany is read. The January observance is a dated intention and does not add another copy of a prayer already present.

The personal name field applies only to the requested Litany petition and the Church Militant reference. It does not rewrite the supplied full presidential prayers. It defaults to `N.` and does not look up an office-holder.

## API for the later service builder

Use the new namespace; it does not redefine your existing `bcp`, `fixedLectionary`, or `bcpCollects` values.

```html
<script src="bcp1662-data.js"></script>
<script src="bcp1662-calendar.js"></script>
<script src="bcp1662-lectionary.js"></script>
<script src="bcp1662-prayers.js"></script>
```

```javascript
const date = "2026-09-14"; // Or BCP1662.calendar.iso(new Date()).
const calendar = BCP1662.calendar.describe(date);
const lessons = BCP1662.lectionary.resolve(date);
const prayers = BCP1662.prayers.plan(date, "mp", {
  litany: "rubric",          // "rubric", "always", or "never"
  emberForm: "ember-1",      // or "ember-2"
  includeIllinois: true,
  presidentName: "N."
});

// The builder must stop for a collision rather than read an arbitrary appointment.
if (lessons.status === "needs-choice") {
  console.log(lessons.candidates);
} else {
  console.log(lessons.lessons.mpFirst);
  // {reference, rawReference, source, sourceFile, sourceCell, link}, or null.
}
console.log(prayers.regular);       // The service's regular state-prayer replacement.
console.log(prayers.litanyPetition);// Presidential petition, or null.
console.log(prayers.occasional);    // Additional Office/Litany prayers.
console.log(prayers.supplementary);// Outside-the-rite devotions for Communion modes.
console.log(prayers.creed);         // apostles, athanasian, nicene, or unresolved.
```

A user-selected appointment can be passed to both APIs as `{ appointment: "annunciation" }`, but only when it is actually a candidate on that date. A `daily` appointment is available as an explicit diagnostic choice; it is not an automatic fallback for collisions.

Render prayer text with DOM `textContent`. Do not concatenate entered names into `innerHTML`. `adaptLitany()` operates on structured `{id, text, response}` objects and removes both a petition and its response together. Never globally replace the word "King": that would corrupt biblical and theological references to God.

### Running tests with Node (optional)

```sh
node bcp1662-tests.js
```

No npm packages are needed. The browser test button is the simpler option for your current GitHub-only editing workflow.

## Scope remaining before this can replace the main page

The remaining layer includes full Morning and Evening Prayer, the full Litany, full Communion and Ante-Communion orders, the Prayer Book Psalter and proper psalms, all collects and Communion Epistles/Gospels, KJV and Apocrypha text handling, the rest of the original occasional prayers, evening-collect anticipation and continuation rules, and a documented approach to collisions and transfers. A full transcription and liturgical audit is also outstanding.

Until that layer is ready, keep this as `preview.html`, not `index.html`.
