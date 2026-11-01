/* ==========================================================
   triage-engine.js - Applies the rules from data/triage-rules.js

   Input : patient details + questionnaire summary
   Output: a result object (level, reasons, evidence, next steps)

   No AI and no scoring. Each rule is a plain yes/no check, and
   the final result is the highest level of any rule that matched.
   ========================================================== */

const TriageEngine = {

  RANK: { routine: 0, urgent: 1, emergency: 2 },

  // Turn the summary into lookup tables that are easy to search
  buildContext(patient, summary) {
    const ctx = { age: patient.age, symptoms: {}, answers: {}, history: {} };
    summary.symptoms.forEach((s) => {
      ctx.symptoms[s.id] = s;
      s.followUps.forEach((f) => {
        ctx.answers[f.id] = {
          text: f.text,
          answer: f.answer,
          answerLabel: f.answerLabel,
          symptomLabel: s.label
        };
      });
    });
    summary.history.forEach((h) => { ctx.history[h.id] = h.label; });
    return ctx;
  },

  // A readable description of one symptom, used as evidence
  describeSymptom(s) {
    return s.label + ": " + s.severityLabel.toLowerCase() + ", " +
      s.trendLabel.toLowerCase() + ", for " + s.durationLabel.toLowerCase();
  },

  // Does a symptom match the optional severity / trend / duration filters?
  symptomMatches(s, c) {
    if (c.severity && !c.severity.includes(s.severity)) return false;
    if (c.trend && !c.trend.includes(s.trend)) return false;
    if (c.duration && !c.duration.includes(s.duration)) return false;
    return true;
  },

  // Returns a list of evidence text if the condition is true, or null if false
  checkCondition(c, ctx) {
    if (c.type === "answer") {
      const a = ctx.answers[c.id];
      if (!a) return null;
      const wanted = Array.isArray(c.is) ? c.is : [c.is];
      if (!wanted.includes(a.answer)) return null;
      return [a.symptomLabel + ": " + a.text + " " + a.answerLabel];
    }

    if (c.type === "symptom") {
      const s = ctx.symptoms[c.id];
      if (!s || !this.symptomMatches(s, c)) return null;
      return [this.describeSymptom(s)];
    }

    if (c.type === "history") {
      const label = ctx.history[c.id];
      if (!label) return null;
      return ["Health background: " + label];
    }

    if (c.type === "age") {
      if (c.min !== undefined && ctx.age < c.min) return null;
      if (c.max !== undefined && ctx.age > c.max) return null;
      return ["Age: " + ctx.age];
    }

    if (c.type === "anySymptom") {
      const matches = Object.values(ctx.symptoms).filter((s) => this.symptomMatches(s, c));
      if (matches.length === 0) return null;
      return matches.map((s) => this.describeSymptom(s));
    }

    return null;
  },

  // The symptom the patient rated most severe (first one wins a tie)
  pickMainSymptom(summary) {
    const rank = { mild: 1, moderate: 2, severe: 3 };
    let best = null;
    summary.symptoms.forEach((s) => {
      if (!best || (rank[s.severity] || 0) > (rank[best.severity] || 0)) best = s;
    });
    return best ? best.label : "Not specified";
  },

  // ---------- Main function ----------
  evaluate(patient, summary) {
    const ctx = this.buildContext(patient, summary);
    const counts = {
      emergency: { checked: 0, matched: 0 },
      urgent:    { checked: 0, matched: 0 },
      routine:   { checked: 0, matched: 0 }
    };
    const matched = [];

    // 1. Check every rule
    TRIAGE_RULES.forEach((rule) => {
      counts[rule.level].checked++;
      let evidence = [];
      let allMet = true;
      for (const condition of rule.conditions) {
        const found = this.checkCondition(condition, ctx);
        if (found === null) { allMet = false; break; }
        evidence = evidence.concat(found);
      }
      if (allMet) {
        counts[rule.level].matched++;
        matched.push({ id: rule.id, level: rule.level, title: rule.title, why: rule.why, evidence: evidence });
      }
    });

    // 2. The result is the highest level that matched
    let level = "routine";
    matched.forEach((m) => {
      if (this.RANK[m.level] > this.RANK[level]) level = m.level;
    });

    const decidingRules = matched.filter((m) => m.level === level);
    const otherRules = matched.filter((m) => m.level !== level);

    // 3. Collect the answers behind the deciding rules (no duplicates)
    const evidence = [];
    decidingRules.forEach((rule) => {
      rule.evidence.forEach((item) => {
        if (!evidence.includes(item)) evidence.push(item);
      });
    });

    // 4. A short explanation sentence
    const n = decidingRules.length;
    let reason;
    if (level === "emergency") {
      reason = n + " emergency warning sign" + (n === 1 ? "" : "s") + " found in your answers.";
    } else if (level === "urgent") {
      reason = n + " urgent factor" + (n === 1 ? "" : "s") + " found in your answers, and no emergency warning signs.";
    } else {
      reason = "No emergency or urgent warning signs were found in your answers.";
    }

    // 5. The decision path, shown on the results page
    const info = LEVEL_INFO[level];
    const path = [
      "Checked " + counts.emergency.checked + " emergency warning-sign rules: " + counts.emergency.matched + " matched.",
      "Checked " + counts.urgent.checked + " urgent rules: " + counts.urgent.matched + " matched.",
      "Checked " + counts.routine.checked + " routine notes: " + counts.routine.matched + " matched.",
      level === "routine"
        ? "No emergency or urgent rule matched, so the result is Routine."
        : "The highest level matched was " + info.label + ", so that is the result."
    ];

    return {
      level: level,
      label: info.label,
      headline: info.headline,
      summary: info.summary,
      reason: reason,
      decidingRules: decidingRules,
      otherRules: otherRules,
      evidence: evidence,
      nextSteps: info.steps,
      path: path,
      counts: counts
    };
  }
};