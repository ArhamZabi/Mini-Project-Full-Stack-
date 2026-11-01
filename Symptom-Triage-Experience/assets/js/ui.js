/* ==========================================================
   ui.js - Small helpers for showing/hiding things on screen
   ========================================================== */

const UI = {
  // Show one view (section) and hide all the others
  showView(name) {
    document.querySelectorAll(".view").forEach(function (section) {
      section.hidden = true;
    });
    const target = document.getElementById("view-" + name);
    if (target) target.hidden = false;
  },

  // Show an error under a field, and highlight the input
  showFieldError(fieldKey, message, inputId) {
    const errorEl = document.getElementById("error-" + fieldKey);
    if (errorEl) errorEl.textContent = message;
    const input = document.getElementById(inputId);
    if (input) input.classList.add("invalid");
  },

  // Remove all error messages from a form
  clearFieldErrors(formEl) {
    formEl.querySelectorAll(".error-text").forEach(function (el) { el.textContent = ""; });
    formEl.querySelectorAll(".invalid").forEach(function (el) { el.classList.remove("invalid"); });
  },

  // Make text safe before putting it inside HTML
  escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  // Build a "label: value" list safely
  renderDetailList(listEl, rows) {
    listEl.innerHTML = "";
    rows.forEach(function (row) {
      const dt = document.createElement("dt");
      dt.textContent = row[0];
      const dd = document.createElement("dd");
      dd.textContent = row[1];
      listEl.appendChild(dt);
      listEl.appendChild(dd);
    });
  }
};

/* ==========================================================
   ResultView - draws the results page
   ========================================================== */

const ResultView = {

  render(container, record, saved) {
    const esc = UI.escapeHtml;
    const r = record.result;
    const p = record.patient;
    const s = record.summary;

    // Why this result
    const rulesHtml = r.decidingRules.length
      ? `<ul class="why-list">` + r.decidingRules.map((rule) =>
          `<li><strong>${esc(rule.title)}</strong><br><span class="muted">${esc(rule.why)}</span></li>`
        ).join("") + `</ul>`
      : "";

    // Answers that influenced the result
    const evidenceHtml = r.evidence.length
      ? `<ul class="evidence-list">` + r.evidence.map((e) => `<li>${esc(e)}</li>`).join("") + `</ul>`
      : `<p class="muted">No single answer triggered an emergency or urgent rule.</p>`;

    // Lower-level findings (shown only if there are any)
    const otherHtml = r.otherRules.length
      ? `<section class="result-section">
          <h3>Other factors noted</h3>
          <ul class="why-list">` + r.otherRules.map((rule) => `<li>${esc(rule.title)}</li>`).join("") + `</ul>
        </section>`
      : "";

    const stepsHtml = r.nextSteps.map((step) => `<li>${esc(step)}</li>`).join("");
    const pathHtml = r.path.map((line) => `<li>${esc(line)}</li>`).join("");

    // The patient's own answers, in a collapsible box
    const symptomLines = s.symptoms.map((sym) =>
      `<li><strong>${esc(sym.label)}</strong>: ${esc(sym.durationLabel)}, ${esc(sym.severityLabel)}, ${esc(sym.trendLabel)}</li>`
    ).join("");
    const historyText = s.history.length ? s.history.map((h) => h.label).join(", ") : "None selected";

    const when = new Date(record.createdAt).toLocaleString();

    container.innerHTML = `
      <div class="result-banner result-${r.level}">
        <span class="badge badge-${r.level}">${esc(r.label)}</span>
        <h2>${esc(r.headline)}</h2>
        <p>${esc(r.summary)}</p>
        <p class="result-ref">${esc(p.name)}, age ${esc(p.age)} &middot; ${esc(when)} &middot; Reference ${esc(record.id)}</p>
      </div>

      <section class="result-section">
        <h3>Why this result</h3>
        <p>${esc(r.reason)}</p>
        ${rulesHtml}
      </section>

      <section class="result-section">
        <h3>Answers that influenced this result</h3>
        ${evidenceHtml}
      </section>

      <section class="result-section">
        <h3>Recommended next steps</h3>
        <ol class="steps-list">${stepsHtml}</ol>
      </section>

      ${otherHtml}

      <section class="result-section">
        <h3>How this was decided</h3>
        <ol class="path-list">${pathHtml}</ol>
      </section>

      <details class="result-details">
        <summary>View submitted answers</summary>
        <dl class="detail-list">
          <dt>Reason for visit</dt><dd>${esc(p.reason)}</dd>
          <dt>Gender</dt><dd>${esc(p.gender || "Not specified")}</dd>
          <dt>Health background</dt><dd>${esc(historyText)}</dd>
          <dt>Additional notes</dt><dd>${esc(s.notes || "None")}</dd>
        </dl>
        <ul class="plain-list">${symptomLines}</ul>
      </details>

      <p class="safety-note">
        This result is based only on the answers entered. It is not a medical diagnosis and does not
        replace advice from a qualified healthcare professional. If you feel worse or are worried,
        seek medical help. ${saved ? "This assessment has been saved to the clinician dashboard." : "This assessment could not be saved on this device."}
      </p>`;
  }
};