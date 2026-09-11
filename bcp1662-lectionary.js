/* Resolves the user's original-1662 workbook one lesson at a time.
 * Scripture text is NOT bundled in this installment. References link to external sources.
 * Missing cells and conflicting appointments remain visible; no speculative repair occurs. */
(function (root) {
  "use strict";
  const node = typeof module === "object" && module.exports;
  const data = node ? require("./bcp1662-data.js") : root.BCP1662.data;
  const calendar = node ? require("./bcp1662-calendar.js") : root.BCP1662.calendar;
  if (!data || !calendar) throw new Error("Load bcp1662-data.js and bcp1662-calendar.js first.");
  const slots = Object.freeze(["mpFirst", "mpSecond", "epFirst", "epSecond"]);
  const columns = Object.freeze({ mpFirst: "B", mpSecond: "C", epFirst: "D", epSecond: "E" });
  const APOCRYPHA = /^(1\s+Esdras|2\s+Esdras|Tobit|Judith|Wisdom|Sirach|Ecclesiasticus|Baruch|Susanna|Bel\b|Prayer of|Epistle of Jeremiah|[12]\s+Maccabees)\b/i;
  function normalizeReference(raw) {
    if (typeof raw !== "string") throw new TypeError("A Scripture reference must be a string.");
    return raw.replace(/\s+/gu, " ").trim();
  }
  function referenceLink(raw) {
    const ref = normalizeReference(raw);
    if (APOCRYPHA.test(ref)) {
      return { url: "https://www.eskimo.com/~lhowell/bcp1662/apocrypha/index.html",
        label: "Open the Apocrypha source", exactPassage: false };
    }
    return { url: "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(ref) + "&version=KJV",
      label: "Read " + ref + " (KJV)", exactPassage: true };
  }
  function resolve(value, options = {}) {
    const info = calendar.describe(value, options);
    const appointment = calendar.chooseAppointment(info, options.appointment);
    const daily = data.daily[info.date.slice(5)];
    if (!daily) throw new Error("No month/day record exists for " + info.date + ".");
    if (appointment == null) return {
      date: info.date, appointment: null, status: "needs-choice", complete: false,
      candidates: info.candidates, lessons: null,
      warnings: ["Two appointments coincide. Choose explicitly; this version does not invent precedence or transfer either feast."]
    };
    const proper = appointment === "daily" ? null : data.proper[appointment];
    const warnings = [];
    // These two Holy Week days have no named proper-lesson row in the supplied workbook.
    const intentionallyDaily = ["monday-before-easter", "tuesday-before-easter"].includes(appointment);
    if (appointment !== "daily" && !proper && !intentionallyDaily) {
      warnings.push("The workbook has no named lesson row for " + calendar.label(appointment) + ". Daily references are shown for review, not certified as the proper lessons.");
    }
    if (options.appointment === "daily" && info.candidates.length) {
      warnings.push("Manual choice: using only the month/day row instead of a named appointment.");
    }
    const lessons = {};
    for (const slot of slots) {
      // A null override falls back only for THAT slot. Preserve unassigned daily lessons.
      const useProper = Boolean(proper && proper[slot] != null && proper[slot] !== "");
      const record = useProper ? proper : daily;
      const raw = record[slot];
      lessons[slot] = raw == null || raw === "" ? null : {
        reference: normalizeReference(raw), rawReference: raw,
        source: useProper ? "proper" : "daily",
        sourceFile: data.sources.lectionary.file,
        sourceCell: "Calendar!" + columns[slot] + record.sourceRow,
        link: referenceLink(raw)
      };
      if (!lessons[slot]) warnings.push("No reference resolves for " + slot + "; the source cell is blank. No reading has been invented.");
    }
    for (const issue of data.issues) {
      if (issue.appointment === appointment) warnings.push(issue.sourceCell + ": " + issue.message);
    }
    const complete = slots.every(slot => lessons[slot] != null);
    return { date: info.date, appointment, candidates: info.candidates, lessons, complete,
      status: warnings.length ? "review" : "resolved", warnings };
  }
  const api = Object.freeze({ slots, normalizeReference, referenceLink, resolve });
  root.BCP1662 = root.BCP1662 || {}; root.BCP1662.lectionary = api;
  if (node) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
