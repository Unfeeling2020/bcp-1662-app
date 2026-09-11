/* Run with `node bcp1662-tests.js`, or use the preview's Run code checks button.
 * These are programming/regression tests, not a full liturgical or transcription audit. */
(function (root) {
  "use strict";
  const node = typeof module === "object" && module.exports;
  const C = node ? require("./bcp1662-calendar.js") : root.BCP1662.calendar;
  const L = node ? require("./bcp1662-lectionary.js") : root.BCP1662.lectionary;
  const P = node ? require("./bcp1662-prayers.js") : root.BCP1662.prayers;
  const D = node ? require("./bcp1662-data.js") : root.BCP1662.data;
  function run() {
    const results = [];
    function test(name, fn) {
      try { fn(); results.push({ name, pass:true }); }
      catch (error) { results.push({ name, pass:false, error:error.message }); }
    }
    function ok(value, message="Assertion failed") { if (!value) throw new Error(message); }
    function equal(actual, expected) {
      if (JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error("Expected " + JSON.stringify(expected) + "; got " + JSON.stringify(actual));
    }
    function throws(fn) { let didThrow=false; try { fn(); } catch (_) { didThrow=true; } ok(didThrow,"Expected an error"); }
    const ids = (date, service, options) => P.plan(date,service,options).selectedIds;
    const events = date => C.personalObservances(date).map(e=>e.id);
    test("All 366 daily records imported",()=>equal(Object.keys(D.daily).length,366));
    test("All 90 named records imported",()=>equal(Object.keys(D.proper).length,90));
    test("All 11 supplied prayer bodies imported",()=>equal(Object.keys(D.additionalPrayers).length,11));
    test("All lesson records retain source rows and four lesson slots",()=>{
      for(const record of [...Object.values(D.daily),...Object.values(D.proper)]) {
        ok(Number.isInteger(record.sourceRow));
        L.slots.forEach(slot=>ok(Object.hasOwn(record,slot) && (record[slot]===null || typeof record[slot]==="string")));
      }
    });
    test("Source data is frozen",()=>ok(Object.isFrozen(D.daily) && Object.isFrozen(D.proper["advent-1"])));
    test("Nonbreaking spaces retained in source, normalized only for display",()=>{
      ok(D.proper["advent-1"].mpFirst.includes("\u00a0")); equal(L.normalizeReference(D.proper["advent-1"].mpFirst),"Isaiah 1");
    });
    test("Leap-day source row preserved rather than repaired",()=>{
      equal(D.daily["02-29"].sourceRow,61); equal(L.normalizeReference(D.daily["02-29"].mpSecond),"Matthew 7");
    });
    test("Invalid dates and timestamps rejected",()=>{
      ["2026-02-29","2100-02-29","2026-04-31","2026-1-2","2026-01-01T00:00:00Z","not a date"].forEach(d=>throws(()=>C.civil(d)));
    });
    test("Gregorian leap-year validation",()=>{ equal(C.iso("2000-02-29"),"2000-02-29"); equal(C.addDays("2028-02-28",1),"2028-02-29"); });
    test("Date objects use local calendar fields",()=>equal(C.iso(new Date(2026,0,20,23,30)),"2026-01-20"));
    test("Day arithmetic is independent of spring and fall DST",()=>{
      equal(C.difference("2026-03-09","2026-03-08"),1); equal(C.difference("2026-11-02","2026-11-01"),1);
      equal(C.addDays("2026-03-08",1),"2026-03-09");
    });
    test("Year-end date arithmetic",()=>{ equal(C.addDays("2026-12-31",1),"2027-01-01"); equal(C.addDays("2026-01-01",-1),"2025-12-31"); });
    test("Easter reference fixtures, including earliest/latest limits",()=>{
      for(const [year,date] of [[1818,"1818-03-22"],[2000,"2000-04-23"],[2024,"2024-03-31"],[2025,"2025-04-20"],[2026,"2026-04-05"],[2027,"2027-03-28"],[2038,"2038-04-25"]]) equal(C.easterSunday(year),date);
    });
    test("Easter is a Sunday within March 22-April 25 for 1900-2199",()=>{
      for(let year=1900;year<=2199;year++) { const e=C.easterSunday(year); equal(C.weekday(e),0); ok(e.slice(5)>="03-22" && e.slice(5)<="04-25"); }
    });
    test("Easter rejects unsupported or noninteger years",()=>{ throws(()=>C.easterSunday(1582)); throws(()=>C.easterSunday(4100)); throws(()=>C.easterSunday("2026")); });
    test("Advent boundary fixtures",()=>{ equal(C.adventSunday(2022),"2022-11-27"); equal(C.adventSunday(2023),"2023-12-03"); equal(C.adventSunday(2026),"2026-11-29"); });
    test("Advent is never misclassified as Trinity season",()=>{
      for(let year=1900;year<=2199;year++) { const a=C.adventSunday(year); equal(C.season(a),"Advent"); equal(C.temporalAppointment(a),"advent-1"); equal(C.temporalAppointment(C.addDays(a,21)),"advent-4"); }
    });
    test("Christmas across the civil year boundary",()=>{ equal(C.season("2026-12-25"),"Christmas"); equal(C.season("2027-01-05"),"Christmas"); equal(C.season("2027-01-06"),"Epiphany"); });
    test("Pre-Lent and Lent boundary fixtures",()=>{
      equal(C.temporalAppointment("2026-02-01"),"septuagesima"); equal(C.temporalAppointment("2026-02-18"),"ash-wednesday"); equal(C.temporalAppointment("2026-02-22"),"lent-1"); equal(C.temporalAppointment("2026-03-29"),"lent-6");
    });
    test("Holy Week preserves the workbook's exact named key",()=>{
      equal(C.temporalAppointment("2026-04-01"),"wed-before-easter"); equal(C.temporalAppointment("2026-04-02"),"maundy-Thursday"); equal(C.temporalAppointment("2026-04-03"),"good-friday"); equal(C.temporalAppointment("2026-04-04"),"holy-saturday");
    });
    test("Ascension, Whitsun and Trinity offsets",()=>{
      equal(C.temporalAppointment("2026-05-14"),"ascension"); equal(C.temporalAppointment("2026-05-24"),"whitsun"); equal(C.temporalAppointment("2026-05-31"),"trinity-sunday"); equal(C.temporalAppointment("2026-06-07"),"trinity-1");
    });
    test("Annual January rule: ordinary years stay on January 20",()=>{ equal(C.presidentialObservance(2026),"2026-01-20"); equal(C.presidentialObservance(2031),"2031-01-20"); });
    test("Annual January rule: Sunday January 20 moves to January 21",()=>{ equal(C.weekday("2030-01-20"),0); equal(C.presidentialObservance(2030),"2030-01-21"); });
    test("Presidential observance happens exactly once each year, 1900-2199",()=>{
      for(let year=1900;year<=2199;year++) {
        const date=C.presidentialObservance(year); equal(date.slice(5),C.weekday(year+"-01-20")===0 ? "01-21" : "01-20");
        let count=0; for(let day=19;day<=22;day++) count+=events(year+"-01-"+day).filter(id=>id==="president").length;
        equal(count,1);
      }
    });
    test("Presidential observance is annual, including non-inauguration years",()=>ok(events("2026-01-20").includes("president")));
    test("No presidential observance remains on the shifted Sunday",()=>{ ok(!events("2030-01-20").includes("president")); ok(events("2030-01-21").includes("president")); });
    test("Other fixed additions are not silently Monday-observed",()=>{ ok(events("2027-01-03").includes("congress")); ok(events("2027-07-04").includes("independence-day")); ok(!events("2027-07-05").includes("independence-day")); });
    test("Nth- and last-weekday additions",()=>{
      ok(events("2026-01-12").includes("state-legislature")); ok(events("2026-05-25").includes("memorial-day"));
      ok(events("2026-09-07").includes("courts-il")); ok(events("2026-10-05").includes("courts-us")); ok(events("2026-11-26").includes("thanksgiving-day"));
    });
    test("Illinois optional setting does not disable the US courts date",()=>{
      equal(C.personalObservances("2026-09-07",{includeIllinois:false}).length,0); ok(C.personalObservances("2026-10-05",{includeIllinois:false}).some(e=>e.id==="courts-us"));
    });
    test("Invalid nth weekday is rejected instead of spilling into next month",()=>throws(()=>C.nthWeekday(2026,2,1,5)));
    test("Fixed military and Mary Magdalene prayer dates",()=>{
      ok(events("2026-06-14").includes("army")); ok(events("2026-10-13").includes("navy")); ok(events("2026-07-22").includes("mary-magdalene"));
    });
    test("Mary Magdalene addition does not replace the Office lectionary",()=>{
      equal(C.describe("2026-07-22").fixedAppointment,null); equal(L.resolve("2026-07-22").appointment,"daily");
    });
    test("Ember weeks have four groups of Wednesday, Friday, Saturday",()=>{
      for(let year=1900;year<=2199;year++) {
        const weeks=C.emberWeeks(year); equal(weeks.length,4);
        weeks.forEach(w=>{ equal(w.days.map(C.weekday),[3,5,6]); equal(C.weekday(w.start),0); equal(C.difference(w.end,w.start),6); ok(w.days[0]>w.anchor); });
      }
    });
    test("September anchor on Wednesday uses the following Wednesday",()=>equal(C.emberWeeks(2022).find(w=>w.name==="september").days,["2022-09-21","2022-09-23","2022-09-24"]));
    test("Ember prayer is selected on all seven days in each week",()=>{
      for(const week of C.emberWeeks(2026)) for(let day=0;day<7;day++) for(const office of ["mp","ep"]) ok(ids(C.addDays(week.start,day),office).includes("ember-1"));
    });
    test("Ember week and Ember day are separate flags",()=>{ const d=C.describe("2026-09-14"); ok(d.emberWeek); equal(d.isEmberDay,false); equal(C.describe("2026-09-16").isEmberDay,true); });
    test("Ember prayers do not leak into the following week",()=>ok(!ids("2026-09-20","ep").includes("ember-1")));
    test("Only the chosen Ember alternative is selected",()=>{
      const p=ids("2026-09-16","ep",{emberForm:"ember-2"}); ok(p.includes("ember-2")); ok(!p.includes("ember-1"));
    });
    test("Rogation weekdays calculated relative to Ascension",()=>{ ["2026-05-11","2026-05-12","2026-05-13"].forEach(d=>ok(C.describe(d).isRogationDay)); equal(C.describe("2026-05-14").isRogationDay,false); });
    test("Ordinary daily lesson resolves without invented override",()=>{ const r=L.resolve("2026-01-02"); equal(r.lessons.mpFirst.reference,"Genesis 1"); equal(r.lessons.mpFirst.source,"daily"); });
    test("Sunday first lessons override independently of daily second lessons",()=>{
      const r=L.resolve("2026-11-29"); equal(r.lessons.mpFirst.reference,"Isaiah 1"); equal(r.lessons.epFirst.reference,"Isaiah 2");
      equal(r.lessons.mpSecond.reference,"John 21"); equal(r.lessons.epSecond.reference,"Hebrews 5"); equal(r.lessons.mpSecond.source,"daily");
    });
    test("Christmas fills the blank daily row with four proper lessons",()=>{ const r=L.resolve("2026-12-25"); equal(r.complete,true); L.slots.forEach(slot=>equal(r.lessons[slot].source,"proper")); });
    test("Holy Innocents keeps daily second lessons",()=>{ const r=L.resolve("2026-12-28"); equal(r.lessons.mpSecond.reference,"Acts 25"); equal(r.lessons.epSecond.reference,"1 John 5"); });
    test("Maundy Thursday source row is reachable despite its mixed-case ID",()=>equal(L.resolve("2026-04-02").lessons.mpSecond.reference,"John 13"));
    test("Coinciding feast and Sunday require an explicit choice",()=>{ const r=L.resolve("2029-03-25"); equal(r.status,"needs-choice"); equal(r.lessons,null); ok(r.candidates.some(c=>c.key==="annunciation")); ok(r.candidates.some(c=>c.key==="lent-6")); });
    test("Explicit collision selection uses the chosen proper row",()=>equal(L.resolve("2029-03-25",{appointment:"annunciation"}).lessons.mpFirst.reference,"Sirach 2"));
    test("Off-calendar appointment injection is rejected",()=>throws(()=>L.resolve("2026-09-11",{appointment:"christmas-day"})));
    test("Manual daily-only selection keeps missing cells visible",()=>{ const r=L.resolve("2026-12-25",{appointment:"daily"}); equal(r.complete,false); equal(r.lessons.mpFirst,null); ok(r.warnings.length>0); });
    test("A missing Trinity 27 row is flagged instead of invented",()=>{ const d=C.addDays(C.adventSunday(1818),-7); equal(C.temporalAppointment(d),"trinity-27"); const r=L.resolve(d); equal(r.status,"review"); ok(r.warnings.some(s=>s.includes("no named lesson row"))); });
    test("St. Stephen discrepancy remains unchanged and flagged",()=>{ const r=L.resolve("2026-12-26"); equal(r.lessons.epFirst.reference,"Ecclesiastes 4"); ok(r.warnings.some(s=>s.includes("Calendar!D373"))); });
    test("Reference provenance points back to its source cell",()=>equal(L.resolve("2026-11-29").lessons.mpFirst.sourceCell,"Calendar!B368"));
    test("Canonical links request KJV, not AKJV",()=>{ ok(L.referenceLink("Genesis 1").url.endsWith("version=KJV")); ok(!L.referenceLink("Genesis 1").url.includes("AKJV")); });
    test("Sirach links to the supplied Apocrypha source without changing the source reference",()=>{ ok(L.referenceLink("Sirach 2").url.includes("/apocrypha/")); equal(L.referenceLink("Sirach 2").exactPassage,false); equal(L.normalizeReference(D.proper.annunciation.mpFirst),"Sirach 2"); });
    test("Athanasian Creed selected on all 13 appointed occasions in 2026",()=>{
      for(const d of ["2026-12-25","2026-01-06","2026-02-24","2026-04-05","2026-05-14","2026-05-24","2026-06-24","2026-07-25","2026-08-24","2026-09-21","2026-10-28","2026-11-30","2026-05-31"]) equal(C.creed(d,"mp"),"athanasian");
    });
    test("Creed defaults are office-specific",()=>{ equal(C.creed("2026-09-11","mp"),"apostles"); equal(C.creed("2026-12-25","ep"),"apostles"); equal(C.creed("2026-12-25","communion"),"nicene"); equal(C.creed("2026-12-25","ante-communion"),"nicene"); });
    test("An unresolved appointment does not silently choose an MP creed",()=>equal(C.creed("2029-03-25","mp"),"unresolved"));
    test("Litany defaults to Sunday, Wednesday, Friday",()=>{
      ["2026-09-13","2026-09-16","2026-09-18"].forEach(d=>equal(P.plan(d,"mp").litany,true));
      ["2026-09-14","2026-09-15","2026-09-17","2026-09-19"].forEach(d=>equal(P.plan(d,"mp").litany,false));
    });
    test("All Conditions of Men selected for MP without Litany",()=>{ ok(ids("2026-09-14","mp").includes("all-conditions")); ok(!ids("2026-09-16","mp").includes("all-conditions")); });
    test("All Conditions follows the actual personal Litany selection",()=>{ ok(ids("2026-09-16","mp",{litany:"never"}).includes("all-conditions")); ok(!ids("2026-09-14","mp",{litany:"always"}).includes("all-conditions")); });
    test("Personal Litany departures are visible",()=>ok(P.plan("2026-09-16","mp",{litany:"never"}).notices.some(n=>n.includes("Personal Litany override"))));
    test("General Thanksgiving selected daily for EP, not automatically for MP",()=>{ ok(ids("2026-09-11","ep").includes("general-thanksgiving")); ok(!ids("2026-09-11","mp").includes("general-thanksgiving")); });
    test("Office state prayer is regular except when MP uses the Litany",()=>{
      equal(P.plan("2026-09-14","mp").regular.map(p=>p.id),["president-office"]);
      equal(P.plan("2026-09-16","mp").regular.length,0);
      equal(P.plan("2026-09-16","ep").regular.map(p=>p.id),["president-office"]);
    });
    test("Both Communion modes use the second presidential form",()=>{
      for(const service of ["communion","ante-communion"]) equal(P.plan("2026-01-20",service).regular.map(p=>p.id),["president-communion"]);
    });
    test("Annual presidential intention never duplicates a state prayer",()=>{
      for(const service of P.services) {
        const p=P.plan("2030-01-21",service); equal(p.regular.length,1); ok(!p.selectedIds.some(id=>id.startsWith("president-"))); ok(p.notices.some(n=>n.includes("no duplicate")));
      }
    });
    test("State versicle uses the requested exact wording",()=>equal(P.adaptations.officeStateVersicle,"O Lord, save the State."));
    test("President placeholder and custom name stay plain text",()=>{
      ok(P.litanyPresident().text.includes("thy Servant N., our President")); ok(P.litanyPresident("A & B").text.includes("A & B")); equal(P.churchMilitantRuler(),"thy servant N., our President");
    });
    test("Royal Family and Council/Nobility responses are removed with their petitions",()=>{
      const source=[{id:"sovereign",text:"King",response:"A"},{id:"royal-family",text:"Family",response:"B"},{id:"council-nobility",text:"Council",response:"C"},{id:"other",text:"O King of kings",response:"D"}];
      const before=JSON.stringify(source),out=P.adaptLitany(source);
      equal(out.map(p=>p.id),["sovereign","other"]); equal(out[1].text,"O King of kings"); equal(JSON.stringify(source),before);
    });
    test("Duplicate/invalid Litany petition structures rejected",()=>{
      throws(()=>P.adaptLitany([{id:"x",text:"x"}])); throws(()=>P.adaptLitany([{id:"x",text:"x",response:"x"},{id:"x",text:"y",response:"y"}]));
    });
    test("Supplements do not change the Communion rite's order",()=>{
      const p=P.plan("2026-07-04","communion"); equal(p.occasional.length,0); ok(p.supplementary.some(p=>p.id==="independence-day")); ok(p.occasionalPlacement.includes("Outside the rite"));
    });
    test("Thanksgiving Day keeps both the harvest prayer and daily General Thanksgiving",()=>{
      const p=ids("2026-11-26","ep"); ok(p.includes("harvest-thanksgiving")); ok(p.includes("general-thanksgiving"));
    });
    test("Manual and automatic inclusion deduplicates by prayer ID",()=>equal(ids("2026-11-26","ep",{include:["harvest-thanksgiving","general-thanksgiving"]}).filter(id=>id==="general-thanksgiving").length,1));
    test("Manual omission is visible",()=>{ const p=P.plan("2026-09-11","ep",{exclude:["general-thanksgiving"]}); ok(!p.selectedIds.includes("general-thanksgiving")); ok(p.notices.some(n=>n.includes("Personal omission"))); });
    test("Manual alternative Ember prayer replaces the automatic alternative",()=>{
      const p=ids("2026-09-16","ep",{include:["ember-2"]}); ok(p.includes("ember-2")); ok(!p.includes("ember-1"));
    });
    test("Invalid settings fail clearly",()=>{
      throws(()=>P.plan("2026-09-11","unknown")); throws(()=>P.plan("2026-09-11","mp",{litany:"maybe"}));
      throws(()=>P.plan("2026-09-11","mp",{include:["missing"]})); throws(()=>P.plan("2026-09-11","mp",{exclude:["president-office"]}));
      throws(()=>P.plan("2026-09-11","mp",{include:["ember-1","ember-2"]})); throws(()=>P.presidentName("x".repeat(81)));
    });
    test("Conditional petitions are not silently included",()=>{
      ok(!P.prayerText("all-conditions").includes("especially those")); ok(P.prayerText("all-conditions",{includeSpecialPetitions:true}).includes("especially those"));
      ok(!P.prayerText("general-thanksgiving").includes("particularly to those")); ok(P.prayerText("general-thanksgiving",{includeSpecialPetitions:true}).includes("particularly to those"));
    });
    test("The supplied Mary Magdalene text is not silently edited or given an added Amen",()=>{
      equal(P.prayerText("mary-magdalene"),D.additionalPrayers["mary-magdalene"].text);
      ok(P.prayerText("mary-magdalene").endsWith("savior Christ."));
    });
    test("Year-range boundaries render without internal rollover errors",()=>{ equal(C.describe("1583-01-01").date,"1583-01-01"); equal(C.describe("4099-12-31").date,"4099-12-31"); });
    return { total:results.length, passed:results.filter(r=>r.pass).length, results };
  }
  root.BCP1662 = root.BCP1662 || {}; root.BCP1662.tests = Object.freeze({run});
  if (node) {
    module.exports = {run};
    if (require.main === module) {
      const report=run(); report.results.forEach(r=>console.log((r.pass?"PASS ":"FAIL ")+r.name+(r.error?": "+r.error:"")));
      console.log("\n"+report.passed+"/"+report.total+" checks passed.");
      if(report.passed!==report.total) process.exitCode=1;
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
