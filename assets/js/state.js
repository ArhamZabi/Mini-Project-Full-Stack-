/* ==========================================================
   state.js - Central application state
   One object remembers everything while the user moves
   between pages (views), so nothing is lost on Back/Next.
   ========================================================== */

// An empty set of questionnaire answers
function createEmptyAnswers() {
  return {
    categories: [],   // selected category ids, e.g. ["respiratory"]
    symptoms: [],     // selected symptom ids, e.g. ["cough", "fever"]
    details: {},      // per-symptom answers: { fever: { duration, severity, trend, followUps: {} } }
    history: [],      // selected health-background ids
    notes: ""         // optional free text
  };
}

const AppState = {
  currentView: "home",

  // Filled from the patient form
  patient: {
    name: "",
    age: null,
    gender: "",
    reason: "",
    consent: false
  },

  // Filled by the questionnaire
  answers: createEmptyAnswers(),

  // Which questionnaire step is showing (0 = first)
  currentStep: 0,

  // The saved case for this assessment ({ id, createdAt }).
  // Set on the first submit so that re-submitting updates the SAME record.
  currentCase: null,

  // Save validated patient details
  setPatient(data) {
    this.patient = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      reason: data.reason,
      consent: data.consent
    };
  },

  // Start a brand-new assessment
  resetAssessment() {
    this.patient = { name: "", age: null, gender: "", reason: "", consent: false };
    this.answers = createEmptyAnswers();
    this.currentStep = 0;
    this.currentCase = null;
  }
};