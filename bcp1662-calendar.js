/* BCP 1662 calendar foundation. Modern Gregorian dates, not historical Julian reconstruction.
 * No implied feast-transfer or universal precedence policy: collisions are returned for review.
 * Ember Week convention: Sunday through Saturday containing its appointed Wednesday.
 * Sources and decisions: SOURCE-NOTES.md. No external library or network is required. */
(function (root) {
  "use strict";
  const DAY = 86400000;
  const pad = n => String(n).padStart(2, "0");
  function requireInteger(n, name) {
    if (!Number.isInteger(n)) throw new TypeError(name + " must be an integer.");
    return n;
  }
  function civil(value) {
    let year, month, day;
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) throw new RangeError("Invalid Date.");
      // A Date represents the viewer's local calendar date, not its UTC date.
      year = value.getFullYear(); month = value.getMonth() + 1; day = value.getDate();
    } else if (typeof value === "string") {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!m) throw new TypeError("Use a date-only YYYY-MM-DD value, not a timestamp.");
      [, year, month, day] = m.map(Number);
    } else if (value && typeof value === "object") {
      ({ year, month, day } = value);
    } else {
      throw new TypeError("A date string, Date, or {year, month, day} is required.");
    }
    [year, month, day].forEach((n, i) => requireInteger(n, ["year", "month", "day"][i]));
    if (year < 1000 || year > 9999) throw new RangeError("Date year must be 1000-9999.");
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
      throw new RangeError("That calendar date does not exist.");
    }
    return { year, month, day };
  }
  function iso(value) {
    const d = civil(value);
    return String(d.year).padStart(4, "0") + "-" + pad(d.month) + "-" + pad(d.day);
  }
  function dayNumber(value) {
    const d = civil(value);
    return Date.UTC(d.year, d.month - 1, d.day) / DAY;
  }
  function addDays(value, days) {
    requireInteger(days, "days");
    const d = new Date((dayNumber(value) + days) * DAY);
    return iso({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
  }
  function difference(later, earlier) { return dayNumber(later) - dayNumber(earlier); }
  function weekday(value) { return new Date(dayNumber(value) * DAY).getUTCDay(); }
  function makeDate(year, month, day) { return iso({ year, month, day }); }
  function nthWeekday(year, month, wantedDay, occurrence) {
    requireInteger(wantedDay, "weekday"); requireInteger(occurrence, "occurrence");
    if (wantedDay < 0 || wantedDay > 6 || occurrence < 1 || occurrence > 5) throw new RangeError("Invalid weekday or occurrence.");
    const first = makeDate(year, month, 1);
    const result = addDays(first, (wantedDay - weekday(first) + 7) % 7 + 7 * (occurrence - 1));
    if (civil(result).month !== month) throw new RangeError("That weekday occurrence does not exist in the month.");
    return result;
  }
  function lastWeekday(year, month, wantedDay) {
    requireInteger(wantedDay, "weekday");
    if (wantedDay < 0 || wantedDay > 6) throw new RangeError("Invalid weekday.");
    const first = makeDate(year, month, 1);
    const next = month === 12 ? makeDate(year + 1, 1, 1) : makeDate(year, month + 1, 1);
    const last = addDays(next, -1);
    return addDays(last, -((weekday(last) - wantedDay + 7) % 7));
  }
  function nextWeekday(value, wantedDay) {
    requireInteger(wantedDay, "weekday");
    if (wantedDay < 0 || wantedDay > 6) throw new RangeError("Invalid weekday.");
    return addDays(value, ((wantedDay - weekday(value) + 7) % 7) || 7);
  }
  function easterSunday(year) {
    requireInteger(year, "year");
    if (year < 1583 || year > 4099) throw new RangeError("Gregorian Easter is supported for 1583-4099.");
    // Gregorian ecclesiastical computus (not an astronomical full-moon calculation).
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = h + l - 7 * m + 114;
    return makeDate(year, Math.floor(n / 31), (n % 31) + 1);
  }
  function adventSunday(year) {
    const december3 = makeDate(year, 12, 3);
    return addDays(december3, -weekday(december3));
  }
  // The approved annual observance: move ONLY when January 20 is a Sunday.
  function presidentialObservance(year) {
    const january20 = makeDate(year, 1, 20);
    return weekday(january20) === 0 ? addDays(january20, 1) : january20;
  }
  const FIXED = Object.freeze({
    "01-01": "circumcision", "01-06": "epiphany", "01-25": "conversion-of-st-paul",
    "02-02": "presentation", "02-24": "st-matthias", "03-25": "annunciation",
    "04-25": "st-mark", "05-01": "st-philip-and-st-james", "06-11": "st-barnabas",
    "06-24": "st-john-baptist", "06-29": "st-peter", "07-25": "st-james",
    "08-24": "st-bartholomew", "09-21": "st-matthew", "09-29": "st-michael-and-all-angels",
    "10-18": "st-luke", "10-28": "st-simon-and-st-jude", "11-01": "all-saints",
    "11-30": "st-andrew", "12-21": "st-thomas", "12-25": "christmas-day",
    "12-26": "st-stephen", "12-27": "st-john", "12-28": "holy-innocents"
  });
  const LABELS = Object.freeze({
    "circumcision": "The Circumcision of Christ", "epiphany": "The Epiphany",
    "conversion-of-st-paul": "The Conversion of St. Paul", "presentation": "The Purification of the Blessed Virgin Mary",
    "st-matthias": "St. Matthias", "annunciation": "The Annunciation", "st-mark": "St. Mark",
    "st-philip-and-st-james": "St. Philip and St. James", "st-barnabas": "St. Barnabas",
    "st-john-baptist": "The Nativity of St. John Baptist", "st-peter": "St. Peter", "st-james": "St. James",
    "st-bartholomew": "St. Bartholomew", "st-matthew": "St. Matthew",
    "st-michael-and-all-angels": "St. Michael and All Angels", "st-luke": "St. Luke",
    "st-simon-and-st-jude": "St. Simon and St. Jude", "all-saints": "All Saints",
    "st-andrew": "St. Andrew", "st-thomas": "St. Thomas", "christmas-day": "Christmas Day",
    "st-stephen": "St. Stephen", "st-john": "St. John the Evangelist", "holy-innocents": "The Holy Innocents",
    "septuagesima": "Septuagesima", "sexagesima": "Sexagesima", "quinquagesima": "Quinquagesima",
    "ash-wednesday": "Ash Wednesday", "lent-6": "The Sunday next before Easter",
    "monday-before-easter": "Monday before Easter", "tuesday-before-easter": "Tuesday before Easter",
    "wed-before-easter": "Wednesday before Easter", "maundy-Thursday": "Thursday before Easter",
    "good-friday": "Good Friday", "holy-saturday": "Easter Even", "easter-day": "Easter Day",
    "easter-monday": "Monday in Easter Week", "easter-tuesday": "Tuesday in Easter Week",
    "ascension": "Ascension Day", "easter-6": "The Sunday after Ascension Day", "whitsun": "Whitsunday",
    "monday-after-whitsun": "Monday in Whitsun Week", "tuesday-after-whitsun": "Tuesday in Whitsun Week",
    "trinity-sunday": "Trinity Sunday"
  });
  const MOVABLE = Object.freeze({
    "-63": "septuagesima", "-56": "sexagesima", "-49": "quinquagesima", "-46": "ash-wednesday",
    "-6": "monday-before-easter", "-5": "tuesday-before-easter", "-4": "wed-before-easter",
    "-3": "maundy-Thursday", "-2": "good-friday", "-1": "holy-saturday", "0": "easter-day",
    "1": "easter-monday", "2": "easter-tuesday", "39": "ascension", "49": "whitsun",
    "50": "monday-after-whitsun", "51": "tuesday-after-whitsun", "56": "trinity-sunday"
  });
  const ATHANASIAN = new Set([
    "christmas-day", "epiphany", "st-matthias", "easter-day", "ascension", "whitsun",
    "st-john-baptist", "st-james", "st-bartholomew", "st-matthew", "st-simon-and-st-jude",
    "st-andrew", "trinity-sunday"
  ]);
  function label(key) {
    if (!key || key === "daily") return "The daily calendar";
    if (LABELS[key]) return LABELS[key];
    const m = /^(advent|christmas|epiphany|lent|easter|trinity)-(\d+)$/.exec(key);
    if (!m) return key;
    const n = Number(m[2]);
    const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
    const phrases = { advent: "in Advent", christmas: "after Christmas", epiphany: "after the Epiphany", lent: "in Lent", easter: "after Easter", trinity: "after Trinity" };
    return n + suffix + " Sunday " + phrases[m[1]];
  }
  function season(value) {
    const date = iso(value), d = civil(date), e = difference(date, easterSunday(d.year));
    if (date >= adventSunday(d.year) && date < makeDate(d.year, 12, 25)) return "Advent";
    if (d.month === 12 && d.day >= 25 || d.month === 1 && d.day < 6) return "Christmas";
    if (e < -63) return "Epiphany";
    if (e < -46) return "Pre-Lent";
    if (e < 0) return "Lent";
    if (e < 39) return "Easter";
    if (e < 49) return "Ascensiontide";
    if (e < 56) return "Whitsuntide";
    return "Trinity season";
  }
  function temporalAppointment(value) {
    const date = iso(value), d = civil(date), diff = difference(date, easterSunday(d.year));
    if (MOVABLE[String(diff)]) return MOVABLE[String(diff)];
    if (weekday(date) !== 0) return null;
    const a = adventSunday(d.year), christmas = makeDate(d.year, 12, 25);
    if (date >= a && date < christmas) return "advent-" + (1 + Math.floor(difference(date, a) / 7));
    if (date === christmas || date === makeDate(d.year, 1, 6)) return null;
    if (d.month === 12 && d.day > 25 || d.month === 1 && d.day < 6) {
      const previousChristmas = makeDate(d.month === 1 ? d.year - 1 : d.year, 12, 25);
      const firstSunday = nextWeekday(previousChristmas, 0);
      return "christmas-" + (1 + Math.floor(difference(date, firstSunday) / 7));
    }
    if (diff < -63) {
      const firstSunday = nextWeekday(makeDate(d.year, 1, 6), 0);
      return "epiphany-" + (1 + Math.floor(difference(date, firstSunday) / 7));
    }
    if (diff >= -42 && diff < 0) return "lent-" + (7 + diff / 7);
    if (diff > 0 && diff < 49) return "easter-" + diff / 7;
    if (diff > 56) return "trinity-" + (diff / 7 - 8);
    return null;
  }
  const emberCache = new Map();
  function emberWeeks(year) {
    if (!emberCache.has(year)) {
      const e = easterSunday(year);
      const anchors = [
        ["lent", addDays(e, -42)], ["whitsun", addDays(e, 49)],
        ["september", makeDate(year, 9, 14)], ["december", makeDate(year, 12, 13)]
      ];
      const records = anchors.map(([name, anchor]) => {
        const wednesday = nextWeekday(anchor, 3);
        return Object.freeze({ name, anchor, start: addDays(wednesday, -3), end: addDays(wednesday, 3),
          days: Object.freeze([wednesday, addDays(wednesday, 2), addDays(wednesday, 3)]) });
      });
      emberCache.set(year, Object.freeze(records));
    }
    return emberCache.get(year);
  }
  function litanyAppointed(value) { return [0, 3, 5].includes(weekday(value)); }
  function personalObservances(value, options = {}) {
    const date = iso(value), { year } = civil(date);
    const scheduled = [
      ["congress", "Prayer for Congress", makeDate(year, 1, 3), "congress"],
      ["state-legislature", "Prayer for the State Legislature", nthWeekday(year, 1, 1, 2), "state-legislature"],
      ["president", "Annual presidential observance", presidentialObservance(year), null],
      ["memorial-day", "Memorial Day prayer", lastWeekday(year, 5, 1), "memorial-day"],
      ["army", "Prayer for the Army", makeDate(year, 6, 14), "army"],
      ["independence-day", "Independence Day prayer", makeDate(year, 7, 4), "independence-day"],
      ["mary-magdalene", "St. Mary Magdalene prayer", makeDate(year, 7, 22), "mary-magdalene"],
      ["courts-us", "Courts of Justice: United States prayer date", nthWeekday(year, 10, 1, 1), "courts"],
      ["navy", "Prayer for the Navy", makeDate(year, 10, 13), "navy"],
      ["thanksgiving-day", "Thanksgiving Day prayer", nthWeekday(year, 11, 4, 4), "harvest-thanksgiving"]
    ];
    if (options.includeIllinois !== false) scheduled.push(["courts-il", "Courts of Justice: Illinois prayer date", nthWeekday(year, 9, 1, 1), "courts"]);
    return scheduled.filter(item => item[2] === date).map(([id, title, on, prayerId]) => ({ id, title, date: on, prayerId }));
  }
  function describe(value, options = {}) {
    const date = iso(value), d = civil(date);
    const easter = easterSunday(d.year), advent = adventSunday(d.year);
    const fixed = FIXED[date.slice(5)] || null, temporal = temporalAppointment(date);
    const candidates = Array.from(new Set([fixed, temporal].filter(Boolean))).map(key => ({ key, label: label(key) }));
    const emberWeek = emberWeeks(d.year).find(w => date >= w.start && date <= w.end) || null;
    return {
      date, weekday: weekday(date), easter, advent, season: season(date),
      fixedAppointment: fixed, temporalAppointment: temporal, candidates,
      requiresChoice: candidates.length > 1,
      defaultAppointment: candidates.length === 1 ? candidates[0].key : candidates.length === 0 ? "daily" : null,
      emberWeek, isEmberDay: Boolean(emberWeek && emberWeek.days.includes(date)),
      isRogationDay: [36, 37, 38].includes(difference(date, easter)),
      litanyAppointed: litanyAppointed(date),
      personalObservances: personalObservances(date, options)
    };
  }
  function chooseAppointment(info, selected) {
    if (selected == null || selected === "auto") return info.defaultAppointment;
    if (selected === "daily") return selected; // An explicit diagnostic/manual choice, never a silent fallback.
    if (!info.candidates.some(c => c.key === selected)) throw new RangeError("That appointment is not a candidate for this date.");
    return selected;
  }
  function creed(value, service = "mp", appointment = "auto") {
    if (!["mp", "ep", "communion", "ante-communion"].includes(service)) throw new RangeError("Unknown service.");
    if (service === "communion" || service === "ante-communion") return "nicene";
    if (service === "ep") return "apostles";
    const chosen = chooseAppointment(describe(value), appointment);
    if (chosen == null) return "unresolved";
    return ATHANASIAN.has(chosen) ? "athanasian" : "apostles";
  }
  const api = Object.freeze({ civil, iso, dayNumber, addDays, difference, weekday, makeDate, nthWeekday, lastWeekday,
    nextWeekday, easterSunday, adventSunday, presidentialObservance, season, temporalAppointment,
    emberWeeks, litanyAppointed, personalObservances, describe, chooseAppointment, creed, label, fixedDates: FIXED });
  root.BCP1662 = root.BCP1662 || {}; root.BCP1662.calendar = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
