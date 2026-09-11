/* Prayer data, American state-prayer adaptations, and selection logic.
 * This is a prayer PLAN, not a complete service renderer.
 * User-document bodies are imported unchanged in bcp1662-data.js.
 * Only the four BCP prayers needed for the requested automatic defaults are added here.
 * The remaining original occasional-prayer library is not yet included. */
(function (root) {
  "use strict";
  const node = typeof module === "object" && module.exports;
  const data = node ? require("./bcp1662-data.js") : root.BCP1662.data;
  const calendar = node ? require("./bcp1662-calendar.js") : root.BCP1662.calendar;
  if (!data || !calendar) throw new Error("Load the data and calendar before the prayers module.");
  const bcpSource = "https://www.churchofengland.org/prayer-and-worship/worship-texts-and-resources/book-common-prayer/prayers-and-thanksgivings";
  const core = {
    "all-conditions": {
      id: "all-conditions", title: "A Prayer for all Conditions of Men", category: "bcp",
      sourceKind: "bcp-1662", sourceUrl: bcpSource,
      rubric: "To be used at such times when the Litany is not appointed to be said. The bracketed special petition is conditional in the book; it is omitted here unless explicitly enabled.",
      text: "O God, the Creator and Preserver of all mankind, we humbly beseech thee for all sorts and conditions of men; that thou wouldest be pleased to make thy ways known unto them, thy saving health unto all nations. More especially we pray for the good estate of the Catholick Church; that it may be so guided and governed by thy good Spirit, that all who profess and call themselves Christians may be led into the way of truth, and hold the faith in unity of spirit, in the bond of peace, and in righteousness of life. Finally we commend to thy fatherly goodness all those, who are any ways afflicted or distressed in mind, body, or estate; that it may please thee to comfort and relieve them, according to their several necessities, giving them patience under their sufferings, and a happy issue out of all their afflictions. And this we beg for Jesus Christ his sake. Amen.",
      conditionalBefore: "that it may please thee to comfort", conditionalText: "especially those for whom our prayers are desired; "
    },
    "general-thanksgiving": {
      id: "general-thanksgiving", title: "A General Thanksgiving", category: "bcp",
      sourceKind: "bcp-1662", sourceUrl: bcpSource,
      rubric: "The special thanksgiving for named recipients of mercy is conditional in the book; it is omitted here unless explicitly enabled.",
      text: "Almighty God, Father of all mercies, we thine unworthy servants do give thee most humble and hearty thanks for all thy goodness and loving-kindness to us and to all men; We bless thee for our creation, preservation, and all the blessings of this life; but above all for thine inestimable love in the redemption of the world by our Lord Jesus Christ, for the means of grace, and for the hope of glory. And we beseech thee, give us that due sense of all thy mercies, that our hearts may be unfeignedly thankful, and that we shew forth thy praise, not only with our lips, but in our lives; by giving up ourselves to thy service, and by walking before thee in holiness and righteousness all our days; through Jesus Christ our Lord, to whom with thee and the Holy Ghost be all honour and glory, world without end. Amen.",
      conditionalBefore: "We bless thee", conditionalText: "particularly to those who desire now to offer up their praises and thanksgivings for thy late mercies vouchsafed unto them. "
    },
    "ember-1": {
      id: "ember-1", title: "In the Ember Weeks (first form)", category: "bcp",
      sourceKind: "bcp-1662", sourceUrl: bcpSource,
      rubric: "In the Ember Weeks, to be said every day, for those that are to be admitted into Holy Orders.",
      text: "Almighty God, our heavenly Father, who hast purchased to thyself an universal Church by the precious blood of thy dear Son: Mercifully look upon the same, and at this time so guide and govern the minds of thy servants the Bishops and Pastors of thy flock, that they may lay hands suddenly on no man, but faithfully and wisely make choice of fit persons to serve in the sacred Ministry of thy Church. And to those which shall be ordained to any holy function give thy grace and heavenly benediction; that both by their life and doctrine they may set forth thy glory, and set forward the salvation of all men; through Jesus Christ our Lord. Amen."
    },
    "ember-2": {
      id: "ember-2", title: "In the Ember Weeks (second form)", category: "bcp",
      sourceKind: "bcp-1662", sourceUrl: bcpSource,
      rubric: "Or this. An alternative to the first Ember prayer, not a second mandatory prayer.",
      text: "Almighty God, the giver of all good gifts, who of thy divine providence hast appointed divers Orders in thy Church: Give thy grace, we humbly beseech thee, to all those who are to be called to any office and administration in the same; and so replenish them with the truth of thy doctrine, and endue them with innocency of life, that they may faithfully serve before thee, to the glory of thy great Name, and the benefit of thy holy Church; through Jesus Christ our Lord. Amen."
    }
  };
  const catalog = Object.assign({}, data.additionalPrayers, core);
  Object.values(catalog).forEach(Object.freeze); Object.freeze(catalog);
  const SERVICES = Object.freeze(["mp", "ep", "communion", "ante-communion"]);
  function prayerText(id, options = {}) {
    const prayer = catalog[id];
    if (!prayer) throw new RangeError("Unknown prayer: " + id);
    if (options.includeSpecialPetitions && prayer.conditionalBefore) {
      return prayer.text.replace(prayer.conditionalBefore, prayer.conditionalText + prayer.conditionalBefore);
    }
    return prayer.text;
  }
  function presidentName(name) {
    if (name == null || String(name).trim() === "") return "N.";
    const clean = String(name).trim();
    if (clean.length > 80 || /[\r\n\u0000-\u001f]/u.test(clean)) throw new RangeError("Use a single-line presidential name of at most 80 characters.");
    return clean; // Plain text only. A renderer must use textContent, not innerHTML.
  }
  function litanyPresident(name = "N.") {
    return { id: "sovereign", text: "That it may please thee to keep and strengthen in the true worshipping of thee, in righteousness and holiness of life, thy Servant " + presidentName(name) + ", our President,",
      response: "We beseech thee to hear us, good Lord." };
  }
  function churchMilitantRuler(name = "N.") {
    return "thy servant " + presidentName(name) + ", our President";
  }
  // Adapt only identified petitions. Never globally replace 'King', which also names God.
  // Keeping each response inside its petition object prevents orphan responses on removal.
  function adaptLitany(petitions, name = "N.") {
    if (!Array.isArray(petitions)) throw new TypeError("Litany petitions must be an array of structured objects.");
    const seen = new Set();
    for (const p of petitions) {
      if (!p || typeof p.id !== "string" || typeof p.text !== "string" || typeof p.response !== "string") {
        throw new TypeError("Each petition needs id, text, and response strings.");
      }
      if (seen.has(p.id)) throw new RangeError("Duplicate Litany petition id: " + p.id);
      seen.add(p.id);
    }
    return petitions.filter(p => !["royal-family", "council-nobility"].includes(p.id))
      .map(p => p.id === "sovereign" ? Object.assign({}, p, litanyPresident(name)) : Object.assign({}, p));
  }
  const adaptations = Object.freeze({
    officeStateVersicle: "O Lord, save the State.",
    officeStateResponse: "And mercifully hear us when we call upon thee.",
    omitRoyalFamilyPrayer: true,
    omitLitanyPetitionIds: Object.freeze(["royal-family", "council-nobility"]),
    officeStatePrayerId: "president-office", communionStatePrayerId: "president-communion"
  });
  function plan(value, service = "mp", options = {}) {
    if (!SERVICES.includes(service)) throw new RangeError("Unknown service: " + service);
    const litanyMode = options.litany || "rubric";
    if (!["rubric", "always", "never"].includes(litanyMode)) throw new RangeError("Litany mode must be rubric, always, or never.");
    const emberForm = options.emberForm || "ember-1";
    if (!["ember-1", "ember-2"].includes(emberForm)) throw new RangeError("Choose one of the two Ember forms.");
    const include = options.include || [], exclude = options.exclude || [];
    if (!Array.isArray(include) || !Array.isArray(exclude)) throw new TypeError("include and exclude must be arrays of prayer IDs.");
    for (const id of [...include, ...exclude]) {
      if (!catalog[id]) throw new RangeError("Unknown prayer: " + id);
      if (catalog[id].category === "state") throw new RangeError("The regular state prayers are selected by service, not through occasional-prayer toggles.");
    }
    if (include.includes("ember-1") && include.includes("ember-2")) throw new RangeError("Choose only one Ember form.");
    const info = calendar.describe(value, options);
    const office = service === "mp" || service === "ep";
    const litany = service === "mp" && (litanyMode === "always" || litanyMode === "rubric" && info.litanyAppointed);
    const regular = office ? (litany ? [] : ["president-office"]) : ["president-communion"];
    const additions = new Map(), notices = [];
    if (service === "mp" && !litany) additions.set("all-conditions", "Your Morning Prayer default when the Litany is not said");
    if (service === "ep") additions.set("general-thanksgiving", "Your daily Evening Prayer default");
    if (office && info.emberWeek) additions.set(emberForm, "Every day in the Ember Week");
    for (const event of info.personalObservances) {
      if (event.prayerId) additions.set(event.prayerId, "Your dated addition: " + event.title);
      if (event.id === "president") notices.push("Annual presidential observance today. Its intention is covered by the regular state prayer or the presidential Litany petition; no duplicate is inserted.");
    }
    for (const id of include) {
      if (id === "ember-1") additions.delete("ember-2");
      if (id === "ember-2") additions.delete("ember-1");
      additions.set(id, "Manually selected for this date and service");
    }
    for (const id of exclude) {
      if (additions.has(id)) notices.push("Personal omission: " + catalog[id].title + ".");
      additions.delete(id);
    }
    if (service === "mp" && litany !== info.litanyAppointed) {
      notices.push("Personal Litany override: this selection differs from the Sunday/Wednesday/Friday schedule.");
    }
    if (litany && additions.has("all-conditions")) notices.push("Personal addition: All Conditions of Men has been selected even though the Litany is included.");
    if (!office && additions.size) notices.push("These additional devotions have NOT been inserted into the Communion order. Their placement is deliberately left outside the rite in this preview.");
    const ids = Array.from(additions.keys());
    const entry = (id, reason) => ({ id, title: catalog[id].title, text: prayerText(id, options),
      category: catalog[id].category, reason,
      sourceFile: catalog[id].sourceFile || null, sourceUrl: catalog[id].sourceUrl || null,
      sourceParagraph: catalog[id].sourceParagraph || null, rubric: catalog[id].rubric || null });
    return {
      date: info.date, service, litany, litanyAppointed: info.litanyAppointed,
      creed: calendar.creed(value, service, options.appointment || "auto"),
      stateVersicle: office ? adaptations.officeStateVersicle : null,
      stateResponse: office ? adaptations.officeStateResponse : null,
      litanyPetition: litany ? litanyPresident(options.presidentName) : null,
      churchMilitantRuler: office ? null : churchMilitantRuler(options.presidentName),
      regular: regular.map(id => entry(id, "Approved regular state-prayer replacement")),
      occasional: office ? ids.map(id => entry(id, additions.get(id))) : [],
      supplementary: office ? [] : ids.map(id => entry(id, additions.get(id))),
      selectedIds: ids, notices, observances: info.personalObservances,
      occasionalPlacement: office ? "Before the two final prayers of the Office or Litany" : "Outside the rite; placement not implemented"
    };
  }
  const api = Object.freeze({ catalog, prayerText, presidentName, litanyPresident, churchMilitantRuler, adaptLitany, adaptations, plan, services: SERVICES });
  root.BCP1662 = root.BCP1662 || {}; root.BCP1662.prayers = api;
  if (node) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
