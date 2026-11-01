/* ==========================================================
   questionnaire.js - The multi-step symptom questionnaire

   Steps are built from the answers, so they change:
     1. Categories      -> pick body areas
     2. Symptoms        -> pick specific symptoms
     3. One page PER selected symptom (duration, severity,
        trend + follow-up questions that appear conditionally)
     4. Health background (optional)
     5. Review and submit

   Every click is saved to AppState.answers immediately,
   so Previous / Next never loses an answer.
   ========================================================== */

const Questionnaire = {
  container: null,
  validation: null,   // result of the last failed validation (shown once)

  // ---------- Setup ----------
  init() {
    this.container = document.getElementById("questionnaireContainer");
    this.container.addEventListener("click", (e) => this.handleClick(e));
    this.container.addEventListener("change", (e) => this.handleChange(e));
    this.container.addEventListener("input", (e) => this.handleInput(e));
  },

  // ---------- Looking up data ----------
  findSymptom(id) {
    for (const category of SYMPTOM_CATEGORIES) {
      for (const symptom of category.symptoms) {
        if (symptom.id === id) return { symptom: symptom, category: category };
      }
    }
    return null;
  },

  // Selected symptoms, but only from categories that are still selected
  getActiveSymptoms() {
    const a = AppState.answers;
    const result = [];
    SYMPTOM_CATEGORIES.forEach((category) => {
      if (!a.categories.includes(category.id)) return;
      category.symptoms.forEach((symptom) => {
        if (a.symptoms.includes(symptom.id)) result.push({ symptom: symptom, category: category });
      });
    });
    return result;
  },

  // Answers for one symptom (created empty the first time)
  getDetail(symptomId) {
    const details = AppState.answers.details;
    if (!details[symptomId]) {
      details[symptomId] = { duration: "", severity: "", trend: "", followUps: {} };
    }
    return details[symptomId];
  },

  // Which follow-up questions should be visible right now?
  getVisibleFollowUps(symptom, detail) {
    const visible = [];
    const visibleIds = [];
    (symptom.followUps || []).forEach((q) => {
      let show = true;
      if (q.showIf) {
        const source = q.showIf.question;
        let value;
        if (source === "duration" || source === "severity" || source === "trend") {
          value = detail[source];
        } else if (visibleIds.includes(source)) {
          value = detail.followUps[source];
        }
        show = q.showIf.in.includes(value);
      }
      if (show) {
        visible.push(q);
        visibleIds.push(q.id);
      }
    });
    return visible;
  },

  labelFor(options, id) {
    const found = options.find((o) => o.id === id);
    return found ? found.label : "";
  },

  // The list of steps for the current answers
  getSteps() {
    const steps = [{ type: "categories" }, { type: "symptoms" }];
    this.getActiveSymptoms().forEach((item) => {
      steps.push({ type: "detail", symptomId: item.symptom.id });
    });
    steps.push({ type: "history" }, { type: "review" });
    return steps;
  },

  // A clean copy of the answers (visible questions only).
  // The triage engine in Batch 3 reads this.
  buildSummary() {
    const a = AppState.answers;
    const symptoms = this.getActiveSymptoms().map((item) => {
      const detail = this.getDetail(item.symptom.id);
      return {
        id: item.symptom.id,
        label: item.symptom.label,
        category: item.category.label,
        duration: detail.duration,
        durationLabel: this.labelFor(DURATION_OPTIONS, detail.duration),
        severity: detail.severity,
        severityLabel: this.labelFor(SEVERITY_OPTIONS, detail.severity),
        trend: detail.trend,
        trendLabel: this.labelFor(TREND_OPTIONS, detail.trend),
        followUps: this.getVisibleFollowUps(item.symptom, detail).map((q) => {
          const answer = detail.followUps[q.id];
          const options = q.type === "yesno" ? YES_NO : q.options;
          return { id: q.id, text: q.text, answer: answer, answerLabel: this.labelFor(options, answer) };
        })
      };
    });
    return {
      symptoms: symptoms,
      history: a.history.map((id) => ({ id: id, label: this.labelFor(HISTORY_OPTIONS, id) })),
      notes: a.notes.trim()
    };
  },

  // ---------- Validation ----------
  validateStep(step) {
    const messages = [];
    const missing = [];
    const a = AppState.answers;

    if (step.type === "categories") {
      if (a.categories.length === 0) {
        messages.push("Select at least one category to continue.");
        missing.push("categories");
      }
    } else if (step.type === "symptoms") {
      if (this.getActiveSymptoms().length === 0) {
        messages.push("Select at least one symptom to continue.");
        missing.push("symptoms");
      }
    } else if (step.type === "detail") {
      const found = this.findSymptom(step.symptomId);
      const detail = this.getDetail(step.symptomId);
      if (!detail.duration) missing.push("duration");
      if (!detail.severity) missing.push("severity");
      if (!detail.trend) missing.push("trend");
      this.getVisibleFollowUps(found.symptom, detail).forEach((q) => {
        if (!detail.followUps[q.id]) missing.push(q.id);
      });
      if (missing.length > 0) messages.push("Please answer every question on this page to continue.");
    }
    return { messages: messages, missing: missing };
  },

  isMissing(key) {
    return this.validation !== null && this.validation.missing.includes(key);
  },

  // ---------- HTML building blocks ----------
  choice(type, name, value, label, checked, attrs, hint) {
    const hintHtml = hint ? `<span class="choice-hint">${UI.escapeHtml(hint)}</span>` : "";
    return `<label class="choice">
      <input type="${type}" name="${name}" value="${value}" ${checked ? "checked" : ""} ${attrs}>
      <span class="choice-text"><span class="choice-label">${UI.escapeHtml(label)}</span>${hintHtml}</span>
    </label>`;
  },

  radioGroup(key, title, options, selected, attrs, inline) {
    const invalid = this.isMissing(key) ? " group-invalid" : "";
    const items = options.map((o) =>
      this.choice("radio", key, o.id, o.label, selected === o.id, attrs, o.hint)
    ).join("");
    return `<fieldset class="q-group${invalid}">
      <legend>${UI.escapeHtml(title)}</legend>
      <div class="choice-list${inline ? " inline" : ""}">${items}</div>
    </fieldset>`;
  },

  renderFollowUps(symptom, detail) {
    const visible = this.getVisibleFollowUps(symptom, detail);
    if (visible.length === 0) return "";
    const groups = visible.map((q) => {
      const attrs = `data-role="followup" data-q="${q.id}"`;
      if (q.type === "yesno") {
        return this.radioGroup(q.id, q.text, YES_NO, detail.followUps[q.id], attrs, true);
      }
      return this.radioGroup(q.id, q.text, q.options, detail.followUps[q.id], attrs, false);
    }).join("");
    return `<h3 class="q-subhead">More questions</h3>${groups}`;
  },

  // ---------- Page renderers (each returns title, subtitle, body) ----------
  renderCategories() {
    const a = AppState.answers;
    const invalid = this.isMissing("categories") ? " group-invalid" : "";
    const items = SYMPTOM_CATEGORIES.map((c) =>
      this.choice("checkbox", "category", c.id, c.label, a.categories.includes(c.id),
        'data-role="category"', c.description)
    ).join("");
    return {
      title: "What are you experiencing?",
      subtitle: "Select every area that applies.",
      body: `<fieldset class="q-group${invalid}">
        <legend class="sr-only">Symptom categories</legend>
        <div class="choice-list grid-2">${items}</div>
      </fieldset>`
    };
  },

  renderSymptoms() {
    const a = AppState.answers;
    const invalid = this.isMissing("symptoms") ? " group-invalid" : "";
    const groups = SYMPTOM_CATEGORIES
      .filter((c) => a.categories.includes(c.id))
      .map((c) => {
        const items = c.symptoms.map((s) =>
          this.choice("checkbox", "symptom", s.id, s.label, a.symptoms.includes(s.id), 'data-role="symptom"')
        ).join("");
        return `<fieldset class="q-group">
          <legend>${UI.escapeHtml(c.label)}</legend>
          <div class="choice-list grid-2">${items}</div>
        </fieldset>`;
      }).join("");
    return {
      title: "Select your symptoms",
      subtitle: "Choose each symptom you currently have.",
      body: `<div class="${invalid}">${groups}</div>`
    };
  },

  renderDetail(step) {
    const found = this.findSymptom(step.symptomId);
    const detail = this.getDetail(step.symptomId);
    const all = this.getActiveSymptoms();
    const position = all.findIndex((item) => item.symptom.id === step.symptomId) + 1;

    const body =
      this.radioGroup("duration", "How long have you had this?", DURATION_OPTIONS, detail.duration,
        'data-role="detail" data-field="duration"', false) +
      this.radioGroup("severity", "How severe is it?", SEVERITY_OPTIONS, detail.severity,
        'data-role="detail" data-field="severity"', false) +
      this.radioGroup("trend", "Is it getting better or worse?", TREND_OPTIONS, detail.trend,
        'data-role="detail" data-field="trend"', false) +
      `<div id="followupArea">${this.renderFollowUps(found.symptom, detail)}</div>`;

    return {
      title: found.symptom.label,
      subtitle: `${found.category.label} · Symptom ${position} of ${all.length}`,
      body: body
    };
  },

  renderHistory() {
    const a = AppState.answers;
    const items = HISTORY_OPTIONS.map((o) =>
      this.choice("checkbox", "history", o.id, o.label, a.history.includes(o.id), 'data-role="history"')
    ).join("");
    return {
      title: "Health background",
      subtitle: "Optional. Select anything that applies.",
      body: `<fieldset class="q-group">
          <legend class="sr-only">Health background</legend>
          <div class="choice-list">${items}</div>
        </fieldset>
        <div class="form-group">
          <label for="notesInput">Anything else you would like to add? <span class="optional">(optional)</span></label>
          <textarea id="notesInput" rows="3" maxlength="300" data-role="notes"
            placeholder="Add any other details">${UI.escapeHtml(a.notes)}</textarea>
        </div>`
    };
  },

  renderReview(steps) {
    const p = AppState.patient;
    const s = this.buildSummary();
    const esc = UI.escapeHtml;

    let html = `<div class="review-block">
      <div class="review-head"><h3>Patient</h3>
        <button type="button" class="link-btn" data-action="edit-patient">Edit</button></div>
      <dl class="detail-list">
        <dt>Name</dt><dd>${esc(p.name)}</dd>
        <dt>Age</dt><dd>${esc(p.age)}</dd>
        <dt>Gender</dt><dd>${esc(p.gender || "Not specified")}</dd>
        <dt>Reason for visit</dt><dd>${esc(p.reason)}</dd>
      </dl></div>`;

    s.symptoms.forEach((sym) => {
      const stepIndex = steps.findIndex((st) => st.type === "detail" && st.symptomId === sym.id);
      const followUps = sym.followUps.map((f) =>
        `<li><span>${esc(f.text)}</span><strong>${esc(f.answerLabel)}</strong></li>`
      ).join("");
      html += `<div class="review-block">
        <div class="review-head"><h3>${esc(sym.label)}</h3>
          <button type="button" class="link-btn" data-action="goto" data-step="${stepIndex}">Edit</button></div>
        <p class="review-line">${esc(sym.durationLabel)} · ${esc(sym.severityLabel)} · ${esc(sym.trendLabel)}</p>
        <ul class="followup-list">${followUps}</ul>
      </div>`;
    });

    const historyText = s.history.length ? s.history.map((h) => h.label).join(", ") : "None selected";
    html += `<div class="review-block">
      <div class="review-head"><h3>Health background</h3>
        <button type="button" class="link-btn" data-action="goto" data-step="${steps.length - 2}">Edit</button></div>
      <dl class="detail-list">
        <dt>Conditions</dt><dd>${esc(historyText)}</dd>
        <dt>Additional notes</dt><dd>${esc(s.notes || "None")}</dd>
      </dl></div>`;

    return {
      title: "Review your answers",
      subtitle: "Check everything before submitting.",
      body: html
    };
  },

  // ---------- Draw the current step ----------
  render() {
    const steps = this.getSteps();
    if (AppState.currentStep >= steps.length) AppState.currentStep = steps.length - 1;
    if (AppState.currentStep < 0) AppState.currentStep = 0;

    const index = AppState.currentStep;
    const step = steps[index];

    let page;
    if (step.type === "categories") page = this.renderCategories();
    else if (step.type === "symptoms") page = this.renderSymptoms();
    else if (step.type === "detail") page = this.renderDetail(step);
    else if (step.type === "history") page = this.renderHistory();
    else page = this.renderReview(steps);

    const errorHtml = this.validation
      ? this.validation.messages.map((m) => `<div class="alert alert-error" role="alert">${UI.escapeHtml(m)}</div>`).join("")
      : "";

    const percent = Math.round(((index + 1) / steps.length) * 100);
    const prevLabel = index === 0 ? "Patient details" : "Previous";
    const nextIsReview = steps[index + 1] && steps[index + 1].type === "review";
    const nextButton = step.type === "review"
      ? `<button type="button" class="btn btn-primary" data-action="submit">Submit assessment</button>`
      : `<button type="button" class="btn btn-primary" data-action="next">${nextIsReview ? "Review answers" : "Next"}</button>`;

    this.container.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-label">Step ${index + 1} of ${steps.length}</div>
        <div class="progress-track"><div class="progress-bar" style="width:${percent}%"></div></div>
      </div>
      <div class="card q-card">
        <h2>${UI.escapeHtml(page.title)}</h2>
        <p class="muted">${UI.escapeHtml(page.subtitle)}</p>
        ${errorHtml}
        ${page.body}
      </div>
      <div class="button-row q-nav">
        <button type="button" class="btn btn-secondary" data-action="prev">${prevLabel}</button>
        ${nextButton}
      </div>`;

    this.validation = null;   // errors are shown only once
  },

  // ---------- Navigation ----------
  next() {
    const steps = this.getSteps();
    const result = this.validateStep(steps[AppState.currentStep]);
    if (result.messages.length > 0) {
      this.validation = result;
      this.render();
      window.scrollTo(0, 0);
      return;
    }
    AppState.currentStep++;
    this.render();
    window.scrollTo(0, 0);
  },

  prev() {
    if (AppState.currentStep === 0) {
      Nav.go("patient");
      return;
    }
    AppState.currentStep--;
    this.render();
    window.scrollTo(0, 0);
  },

  goTo(stepIndex) {
    AppState.currentStep = stepIndex;
    this.render();
    window.scrollTo(0, 0);
  },

  // Check every step again, then go to the results page
  submit() {
    const steps = this.getSteps();
    for (let i = 0; i < steps.length; i++) {
      const result = this.validateStep(steps[i]);
      if (result.messages.length > 0) {
        AppState.currentStep = i;
        this.validation = result;
        this.render();
        window.scrollTo(0, 0);
        return;
      }
    }
    // Batch 3 will calculate the urgency here; Batch 4 will save the case.
    Nav.go("results");
  },

  // ---------- Events ----------
  handleClick(e) {
    const button = e.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "next") this.next();
    else if (action === "prev") this.prev();
    else if (action === "submit") this.submit();
    else if (action === "goto") this.goTo(Number(button.dataset.step));
    else if (action === "edit-patient") Nav.go("patient");
  },

  toggle(list, value, isOn) {
    const position = list.indexOf(value);
    if (isOn && position === -1) list.push(value);
    if (!isOn && position !== -1) list.splice(position, 1);
  },

  handleChange(e) {
    const target = e.target;
    const role = target.dataset.role;
    if (!role) return;
    const a = AppState.answers;

    if (role === "category") {
      this.toggle(a.categories, target.value, target.checked);
    } else if (role === "symptom") {
      this.toggle(a.symptoms, target.value, target.checked);
    } else if (role === "history") {
      this.toggle(a.history, target.value, target.checked);
    } else if (role === "detail" || role === "followup") {
      const step = this.getSteps()[AppState.currentStep];
      const detail = this.getDetail(step.symptomId);
      if (role === "detail") detail[target.dataset.field] = target.value;
      else detail.followUps[target.dataset.q] = target.value;

      // Re-draw only the follow-up area, because new questions may appear or disappear
      const found = this.findSymptom(step.symptomId);
      const area = this.container.querySelector("#followupArea");
      if (area) area.innerHTML = this.renderFollowUps(found.symptom, detail);
    }

    // Remove error highlighting once the user answers
    const group = target.closest(".q-group");
    if (group) group.classList.remove("group-invalid");
    const alertBox = this.container.querySelector(".alert");
    if (alertBox) alertBox.remove();
  },

  handleInput(e) {
    if (e.target.dataset.role === "notes") {
      AppState.answers.notes = e.target.value;
    }
  }
};