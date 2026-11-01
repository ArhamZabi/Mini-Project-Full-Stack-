/* ==========================================================
   app.js - Starts the app, validates the patient form and
   shows the results page. Loaded LAST.
   ========================================================== */

(function () {

  // ---------- Patient form validation ----------
  function validatePatientForm() {
    const form = document.getElementById("patientForm");
    UI.clearFieldErrors(form);

    const name = document.getElementById("patientName").value.trim();
    const ageText = document.getElementById("patientAge").value.trim();
    const gender = document.getElementById("patientGender").value;
    const reason = document.getElementById("patientReason").value.trim();
    const consent = document.getElementById("patientConsent").checked;

    let valid = true;

    // Name: required, 2-60 characters, letters / spaces / . ' -
    if (name === "") {
      UI.showFieldError("name", "Please enter the patient's full name.", "patientName");
      valid = false;
    } else if (!/^[\p{L}][\p{L} .'\-]{1,59}$/u.test(name)) {
      UI.showFieldError("name", "Use 2 to 60 letters. Spaces, . ' and - are allowed.", "patientName");
      valid = false;
    }

    // Age: required, whole number 0-120
    const age = Number(ageText);
    if (ageText === "") {
      UI.showFieldError("age", "Please enter the age.", "patientAge");
      valid = false;
    } else if (!Number.isInteger(age) || age < 0 || age > 120) {
      UI.showFieldError("age", "Age must be a whole number from 0 to 120.", "patientAge");
      valid = false;
    }

    // Reason: required, at least 5 characters
    if (reason === "") {
      UI.showFieldError("reason", "Please describe the main reason for the visit.", "patientReason");
      valid = false;
    } else if (reason.length < 5) {
      UI.showFieldError("reason", "Please enter at least 5 characters.", "patientReason");
      valid = false;
    }

    // Consent must be ticked
    if (!consent) {
      UI.showFieldError("consent", "Please tick this box to continue.", "patientConsent");
      valid = false;
    }

    return {
      valid: valid,
      data: { name: name, age: age, gender: gender, reason: reason, consent: consent }
    };
  }

  // ---------- Fill the form from saved state (when user comes Back) ----------
  function fillPatientForm() {
    const p = AppState.patient;
    document.getElementById("patientName").value = p.name;
    document.getElementById("patientAge").value = p.age === null ? "" : p.age;
    document.getElementById("patientGender").value = p.gender;
    document.getElementById("patientReason").value = p.reason;
    document.getElementById("patientConsent").checked = p.consent;
    updateReasonCount();
    UI.clearFieldErrors(document.getElementById("patientForm"));
  }

  function updateReasonCount() {
    const length = document.getElementById("patientReason").value.length;
    document.getElementById("reasonCount").textContent = length;
  }

  // ---------- Results: calculate, save, show ----------
  function createCaseId() {
    return "TR-" + Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 4).toUpperCase();
  }

  function showResults() {
    const patient = AppState.patient;
    const summary = Questionnaire.buildSummary();
    const result = TriageEngine.evaluate(patient, summary);
    const now = new Date().toISOString();

    // First submit creates an id. Submitting again updates the same record.
    if (!AppState.currentCase) {
      AppState.currentCase = { id: createCaseId(), createdAt: now };
    }

    const record = {
      id: AppState.currentCase.id,
      createdAt: AppState.currentCase.createdAt,
      updatedAt: now,
      patient: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        reason: patient.reason
      },
      mainSymptom: TriageEngine.pickMainSymptom(summary),
      summary: summary,
      result: result
    };

    const saved = Storage.saveCase(record);
    ResultView.render(document.getElementById("resultsContainer"), record, saved);
  }

  // ---------- Start a fresh assessment (used by several buttons) ----------
  function startNewAssessment() {
    if (AppState.currentView === "questionnaire") {
      const ok = window.confirm("Start over? Your current answers will be cleared.");
      if (!ok) return;
    }
    AppState.resetAssessment();
    Nav.go("patient");
  }

  // ---------- App start-up ----------
  function init() {
    Nav.bindButtons();
    Questionnaire.init();

    document.querySelectorAll('[data-action="new-assessment"]').forEach(function (btn) {
      btn.addEventListener("click", startNewAssessment);
    });

    document.getElementById("patientReason").addEventListener("input", updateReasonCount);

    document.getElementById("clearFormBtn").addEventListener("click", function () {
      AppState.resetAssessment();
      fillPatientForm();
    });

    document.getElementById("patientForm").addEventListener("submit", function (event) {
      event.preventDefault();               // stop the page from reloading
      const result = validatePatientForm();
      if (result.valid) {
        AppState.setPatient(result.data);
        Nav.go("questionnaire");
      }
    });

    // React when the view changes
    document.addEventListener("viewchange", function (event) {
      if (event.detail === "patient") fillPatientForm();
      if (event.detail === "questionnaire") Questionnaire.render();
      if (event.detail === "results") showResults();
    });

    Nav.go("home");
  }

  document.addEventListener("DOMContentLoaded", init);

})();