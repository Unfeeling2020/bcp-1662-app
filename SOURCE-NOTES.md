# Source notes and implementation decisions

## User-supplied authorities

### 1662 for SingTheOffice.xlsx

Sheet: `Calendar`.

Rows 2-367 contain 366 month/day entries, including the literal `2/29` entry at row 61. Rows 368-457 contain 90 named Sunday/holy-day entries. Only columns A-E contain lectionary data used by this package. The year 2022 is treated as a storage convention, not the app's supported liturgical year.

All 1,824 lesson slots (456 records times four) are imported. Nulls remain null. Reference strings retain their original whitespace and nonbreaking spaces in `bcp1662-data.js`; the resolver creates a normalized display/lookup copy without editing the original. Named IDs retain their original case, including `maundy-Thursday`.

A proper row replaces only its populated lesson slots. Blank proper slots fall back to the corresponding daily slot, not to another feast. When neither contains a reference, the app reports the missing lesson.

**This is source-preserving conversion, not certification that every appointment in the workbook is correct.** No alternate lectionary has been substituted.

Known discrepancy: `Calendar!D373`, St. Stephen's first Evening Prayer lesson. The workbook says `Ecclesiastes 4`. The online original-1662 holy-day table says `Ecclus. iv`, linked to Ecclesiasticus. The imported data remains unchanged and a warning is shown on that appointment.

Comparison:
https://www.eskimo.com/~lhowell/bcp1662/info/1662_day.html

The 27th Sunday after Trinity can occur under the adopted Gregorian calendar, but the workbook ends at `trinity-26`. This version flags the absent proper-lesson row instead of inventing a remapping. It does not confuse the Communion rubric about the Sunday next before Advent with the separate Office lectionary.

### Additions to the BCP 1662.docx

All 11 prayer bodies are imported directly from the file, without spelling, capitalization, or wording changes. Source headings and paragraph numbers are retained. The Mary Magdalene prayer ends with `savior Christ.` in the supplied file; an `Amen` has not been silently appended.

The dates below are the user's requested prayer schedule. They are not presented as claims about actual government meeting dates, legal holidays, or court terms.

| Intention | Annual schedule |
| --- | --- |
| Congress | January 3, without a Sunday substitution |
| State Legislature | Second Monday in January |
| President | January 20; January 21 only when January 20 is Sunday |
| Memorial Day prayer | Last Monday in May |
| Army | June 14 |
| Independence Day prayer | July 4, without a Sunday substitution |
| Mary Magdalene prayer | July 22; additional prayer only |
| Illinois Courts | First Monday in September; enabled by default, optional |
| United States Courts | First Monday in October |
| Navy | October 13 |
| Thanksgiving Day prayer | Fourth Thursday in November |

The presidential date rule and the regular use of the two presidential forms were explicitly confirmed by the user. The annual intention does not duplicate either regular form or the presidential Litany petition.

## Prayer Book material added to this foundation

Only the four prayers required for automatic Office defaults are added in `bcp1662-prayers.js`: All Conditions of Men, the General Thanksgiving, and the two alternative Ember forms. The Word-document prayers are a separate imported source. The rest of the original BCP occasional-prayer library is not included yet.

Textual reference for these BCP prayers and their rubrics:
https://www.churchofengland.org/prayer-and-worship/worship-texts-and-resources/book-common-prayer/prayers-and-thanksgivings

Reference for the Office's omission of the separate state-prayer group when the Litany is read:
https://www.eskimo.com/~lhowell/bcp1662/daily/morning.html

Reference for the Litany's Sunday/Wednesday/Friday appointment:
https://www.eskimo.com/~lhowell/bcp1662/daily/litany.html

Reference for the thirteen Athanasian-Creed occasions at Morning Prayer:
https://www.churchofengland.org/prayer-and-worship/worship-texts-and-resources/book-common-prayer/creed-s-athanasius

The Athanasian rubric is implemented as a selection rule. The full creed text is not included in this installment. Evening Prayer retains the Apostles' Creed in the plan; Communion and Ante-Communion use the Nicene selection.

General Thanksgiving is automatically selected for Evening Prayer, before the final prayers, as requested. All Conditions of Men is automatically selected for Morning Prayer when the Litany is not actually included. A manual departure from the appointed Litany schedule is labeled as a personal override, rather than presented as the printed rubric.

The conditional clauses for people specifically requesting intercession or giving thanks are off by default and can be enabled. Their surrounding prayer is otherwise retained. This is explicit rubrical conditionality, not an unexplained deletion.

## Calendar rules versus implementation conventions

The calendar uses Gregorian ecclesiastical Easter and modern civil month/day dates. It is not a reconstruction of the original English Julian calendar or historical leap-day feast transfers. Easter input is bounded to 1583-4099; the preview uses the same date range. Passing a JavaScript `Date` uses its LOCAL year, month, and day. Internal differences are calculated with UTC day numbers, so daylight-saving changes cannot introduce 23-/25-hour errors.

Calendar rule reference:
https://www.eskimo.com/~lhowell/bcp1662/info/tables/rules.html

Advent is the Sunday nearest St. Andrew's Day, implemented as the Sunday on or before December 3. The seasonal label is informational: it is deliberately not reused as a Communion Collect resolver.

Ember Days are the Wednesday, Friday, and Saturday of the groups following the First Sunday in Lent, Whitsunday, September 14, and December 13. The first Wednesday is strictly after the anchor. The prayer rubric appoints prayer every day of the Ember Weeks.

**Week-boundary convention:** this implementation treats an Ember Week as Sunday through Saturday containing the appointed Wednesday. The Prayer Book's wording quoted above does not by itself define those boundary dates; this implementation convention is therefore disclosed rather than described as a verbatim rule. It selects one Ember form, not both, and distinguishes an Ember Week from an actual Ember Day.

**Collisions and transfers:** no universal precedence or transfer policy has been invented. Fixed holy days and separately named temporal days are exposed as candidates. A collision prevents automatic lesson selection until an appointment is explicitly chosen. A change of choice does not transfer a suppressed feast to another date. The pending full liturgical audit must settle the desired comprehensive policy.

Neither a civic intention nor the Mary Magdalene addition alters the day's Office lessons. Communion readings are not derived from the Office spreadsheet. Communion/Ante-Communion supplementary prayers remain outside the rite in this preview; the code does not silently insert them into an unapproved position in the Communion text.

## Biblical sources and content not yet bundled

The preview links canonical references using `version=KJV`, not the existing project's `AKJV` setting. The links are not embedded Scripture. The Apocrypha link points to the user's specified index:
https://www.eskimo.com/~lhowell/bcp1662/apocrypha/index.html

The index lists Sirach under Ecclesiasticus. The source reference remains `Sirach`; this is an alias explanation, not a change to the reading. Exact Apocrypha passage loading is not yet implemented.

No KJV corpus, Prayer Book Psalter, full service, or Communion proper is bundled. No external proxy, API key, or unsupported browser cross-origin fetch is assumed. Text acquisition, hosting permissions/source terms, and full textual verification should be settled as the complete text layer is assembled. No claim is made here to relicense the user's text sources or a modern edition's additional material.

## Adaptation boundaries

The Office suffrage is exactly `O Lord, save the State.` The full presidential replacements remain exactly as supplied. The Litany's sovereign petition uses `thy Servant N., our President,` with a personal-name option; the Church Militant reference uses `thy servant N., our President`.

The Royal Family prayer is marked for omission. In the structured Litany helper, the Royal Family and Council/Nobility petitions are removed with their responses. All other petitions are preserved. There is no global text replacement of "King", "Lord", or "Prince".

## Technical integration

All new APIs live under `BCP1662`. None overwrites the existing project's global `bcp`, `fixedLectionary`, or `bcpCollects`. None of the five current app files is included as a replacement. The preview is a static page with relative local script URLs and no build dependency.

Dates, prayer references, and defaults are computed in the browser. Optional local storage contains only the preview preferences. Sharing includes the date, service, explicit appointment, Litany setting, Ember form, and Illinois switch; it excludes names, special-petition flags, and manual prayer changes. No account, analytics, or backend is added.

Tests validate code behavior and source conversion, not ecclesiastical authorization or a complete original-1662 transcription audit.
