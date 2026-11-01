/* ==========================================================
   triage-rules.js - Every triage rule lives here.

   HOW A RULE WORKS
   A rule has a level (emergency, urgent or routine) and a list
   of conditions. The rule fires only when ALL its conditions
   are true. The final result is the HIGHEST level that fired.

   CONDITION TYPES
     cAnswer("question_id", "yes")   a follow-up answer (see data/symptoms.js)
     cSymptom("symptom_id", {...})   symptom selected, optional filters
                                     severity / trend / duration (lists)
     cHistory("history_id")          health-background item selected
     cAge(min, max)                  age range (inclusive)
     cAnySymptom({...})              ANY selected symptom matches the filters

   IMPORTANT: These are simple, readable rules written for a
   student project. They are NOT clinically validated. A
   medical professional must review them before any real use.
   To add a rule, copy a line and change it.
   ========================================================== */

// ---------- Small helpers that build conditions ----------
const cAnswer = (id, is) => ({ type: "answer", id: id, is: is });
const cSymptom = (id, filters) => Object.assign({ type: "symptom", id: id }, filters || {});
const cHistory = (id) => ({ type: "history", id: id });
const cAge = (min, max) => ({ type: "age", min: min, max: max });
const cAnySymptom = (filters) => Object.assign({ type: "anySymptom" }, filters || {});

function makeRule(id, level, title, why, conditions) {
  return { id: id, level: level, title: title, why: why, conditions: conditions };
}

const MODERATE_UP = ["moderate", "severe"];

// ---------- The rules ----------
const TRIAGE_RULES = [

  // ===== EMERGENCY: red-flag rules =====
  makeRule("E01", "emergency", "Chest pain spreading to the arm, jaw, neck or back",
    "Chest pain that spreads like this can be a sign of a serious heart problem and needs immediate assessment.",
    [cAnswer("chest_spread", "yes")]),
  makeRule("E02", "emergency", "Chest pain with sweating, nausea or feeling faint",
    "Chest pain together with these symptoms can be a sign of a serious heart problem.",
    [cAnswer("chest_sweat", "yes")]),
  makeRule("E03", "emergency", "Chest pain in a person with a heart condition",
    "Chest pain in someone with a known heart condition needs immediate assessment.",
    [cSymptom("chest_pain"), cHistory("heart")]),
  makeRule("E04", "emergency", "Blue or grey lips or face",
    "This can mean the body is not getting enough oxygen.",
    [cAnswer("sob_blue", "yes")]),
  makeRule("E05", "emergency", "Breathlessness that limits speech to a few words",
    "Being unable to speak full sentences because of breathlessness is a warning sign of serious breathing difficulty.",
    [cAnswer("sob_words", "yes")]),
  makeRule("E06", "emergency", "Severe breathlessness at rest",
    "Severe breathlessness while resting needs immediate medical help.",
    [cAnswer("sob_rest", "yes"), cSymptom("shortness_of_breath", { severity: ["severe"] })]),
  makeRule("E07", "emergency", "Face drooping or slurred speech",
    "These can be signs of a stroke, where getting treatment quickly matters.",
    [cAnswer("weak_face", "yes")]),
  makeRule("E08", "emergency", "Sudden weakness or numbness on one side",
    "Sudden one-sided weakness can be a sign of a stroke.",
    [cAnswer("weak_sudden", "yes")]),
  makeRule("E09", "emergency", "Sudden, very severe headache",
    "A headache that starts suddenly and is the worst you have had can be a sign of a serious problem in the head.",
    [cAnswer("head_sudden", "yes")]),
  makeRule("E10", "emergency", "Fever with confusion, severe drowsiness or a stiff neck",
    "This combination can be a sign of a serious infection.",
    [cAnswer("fever_neuro", "yes")]),
  makeRule("E11", "emergency", "Fever with a rash that does not fade when pressed",
    "A rash that does not fade, together with fever, can be a sign of a serious infection.",
    [cAnswer("fever_rash", "yes")]),
  makeRule("E12", "emergency", "Sudden confusion",
    "New confusion that starts within hours needs urgent medical assessment.",
    [cAnswer("conf_sudden", "yes")]),
  makeRule("E13", "emergency", "Confusion with a high fever",
    "Confusion together with a high fever can be a sign of a serious illness.",
    [cAnswer("conf_fever", "yes")]),
  makeRule("E14", "emergency", "Fainting after chest pain or palpitations",
    "Fainting after chest pain or a racing heartbeat can be a sign of a heart problem.",
    [cAnswer("faint_heart", "yes")]),
  makeRule("E15", "emergency", "Sudden change in vision",
    "A sudden change in vision needs immediate assessment.",
    [cAnswer("vision_sudden", "yes")]),
  makeRule("E16", "emergency", "Blood or coffee-ground material in vomit",
    "This can be a sign of bleeding in the digestive system.",
    [cAnswer("vomit_blood", "yes")]),
  makeRule("E17", "emergency", "Hard or extremely tender abdomen",
    "A hard, very tender abdomen can be a sign of a serious problem inside the abdomen.",
    [cAnswer("abd_rigid", "yes")]),
  makeRule("E18", "emergency", "Sudden, severe abdominal pain",
    "Abdominal pain that starts suddenly and is severe needs immediate assessment.",
    [cAnswer("abd_sudden", "yes"), cSymptom("abdominal_pain", { severity: ["severe"] })]),
  makeRule("E19", "emergency", "Back pain with leg weakness or loss of bladder or bowel control",
    "These symptoms can be a sign of pressure on the nerves of the spine and need immediate assessment.",
    [cAnswer("back_numb", "yes")]),
  makeRule("E20", "emergency", "Bleeding that will not stop",
    "Bleeding that continues despite firm pressure needs immediate medical help.",
    [cAnswer("injury_bleeding", "yes")]),
  makeRule("E21", "emergency", "Blow to the head with drowsiness or vomiting",
    "These symptoms after a head injury can be a sign of a serious head injury.",
    [cAnswer("injury_head", "yes")]),
  makeRule("E22", "emergency", "Rash with facial or throat swelling or trouble breathing",
    "These can be signs of a severe allergic reaction.",
    [cAnswer("rash_breath", "yes")]),
  makeRule("E23", "emergency", "Swelling with breathlessness",
    "Swelling together with breathlessness can be a sign of a serious heart, lung or allergic problem.",
    [cAnswer("swell_breath", "yes")]),
  makeRule("E24", "emergency", "Difficulty swallowing saliva or breathing with a sore throat",
    "This can mean the airway is becoming blocked.",
    [cAnswer("throat_swallow", "yes")]),
  makeRule("E25", "emergency", "Severe cough with blood",
    "Coughing up blood with a severe cough needs immediate assessment.",
    [cAnswer("cough_blood", "yes"), cSymptom("cough", { severity: ["severe"] })]),
  makeRule("E26", "emergency", "Severe headache after a blow to the head",
    "A severe headache after a head injury needs immediate assessment.",
    [cAnswer("head_injury", "yes"), cSymptom("headache", { severity: ["severe"] })]),

  // ===== URGENT: should be seen today =====
  makeRule("U01", "urgent", "Breathlessness while resting",
    "Breathlessness at rest should be assessed by a healthcare professional promptly.",
    [cAnswer("sob_rest", "yes")]),
  makeRule("U02", "urgent", "Moderate or severe shortness of breath",
    "Breathlessness that limits daily activity should be assessed promptly.",
    [cSymptom("shortness_of_breath", { severity: MODERATE_UP })]),
  makeRule("U03", "urgent", "Chest pain",
    "Chest pain can have serious causes and should be assessed promptly.",
    [cSymptom("chest_pain")]),
  makeRule("U04", "urgent", "Headache with stiff neck, fever or light sensitivity",
    "This combination needs prompt assessment.",
    [cAnswer("head_neck", "yes")]),
  makeRule("U05", "urgent", "Headache after a blow to the head",
    "A headache after a head injury should be assessed promptly.",
    [cAnswer("head_injury", "yes")]),
  makeRule("U06", "urgent", "Confusion",
    "Confusion needs prompt medical assessment.",
    [cSymptom("confusion")]),
  makeRule("U07", "urgent", "Weakness or numbness on one side",
    "One-sided weakness or numbness should be assessed promptly.",
    [cSymptom("weakness_one_side")]),
  makeRule("U08", "urgent", "Feeling like you might faint",
    "Feeling faint right now should be assessed promptly.",
    [cAnswer("dizzy_faint", "yes")]),
  makeRule("U09", "urgent", "Dizziness with chest pain, racing heartbeat or breathlessness",
    "This combination can be related to the heart and should be assessed promptly.",
    [cAnswer("dizzy_heart", "yes")]),
  makeRule("U10", "urgent", "Fainting or blackout",
    "Fainting should be assessed by a healthcare professional promptly.",
    [cSymptom("fainting")]),
  makeRule("U11", "urgent", "Vision change with eye pain or severe headache",
    "This combination needs prompt assessment.",
    [cAnswer("vision_pain", "yes")]),
  makeRule("U12", "urgent", "Change in vision",
    "A change in vision should be checked promptly.",
    [cSymptom("vision_changes")]),
  makeRule("U13", "urgent", "Coughing up blood",
    "Blood in the cough should be assessed promptly.",
    [cAnswer("cough_blood", "yes")]),
  makeRule("U14", "urgent", "Blood in the stool or black stool",
    "This can be a sign of bleeding in the digestive system.",
    [cAnswer("diar_blood", "yes")]),
  makeRule("U15", "urgent", "Unable to keep fluids down (vomiting)",
    "Not being able to keep fluids down can quickly lead to dehydration.",
    [cAnswer("vomit_fluids", "yes")]),
  makeRule("U16", "urgent", "Unable to keep fluids down (dehydration)",
    "Dehydration with an inability to drink needs prompt care.",
    [cAnswer("dehy_fluids", "yes")]),
  makeRule("U17", "urgent", "Passing very little urine",
    "Passing little urine can be a sign of dehydration.",
    [cAnswer("dehy_urine", "yes")]),
  makeRule("U18", "urgent", "Passing very little urine with diarrhoea",
    "Passing little urine with moderate or severe diarrhoea can be a sign of dehydration.",
    [cAnswer("diar_urine", "yes")]),
  makeRule("U19", "urgent", "Sudden, severe-feeling abdominal pain",
    "Abdominal pain that starts suddenly should be assessed promptly.",
    [cAnswer("abd_sudden", "yes")]),
  makeRule("U20", "urgent", "Moderate or severe pain in the lower right abdomen",
    "Pain in this area can need same-day assessment.",
    [cAnswer("abd_location", "lower-right"), cSymptom("abdominal_pain", { severity: MODERATE_UP })]),
  makeRule("U21", "urgent", "Red, hot and swollen joint",
    "A red, hot, swollen joint can be a sign of infection or inflammation and should be seen promptly.",
    [cAnswer("joint_hot", "yes")]),
  makeRule("U22", "urgent", "Swelling in one leg with pain or warmth",
    "One-sided leg swelling with pain or warmth should be assessed promptly.",
    [cAnswer("swell_leg", "yes")]),
  makeRule("U23", "urgent", "Rapidly spreading rash",
    "A rash that spreads quickly should be assessed promptly.",
    [cAnswer("rash_spread", "yes")]),
  makeRule("U24", "urgent", "Rash with fever",
    "A rash together with a fever should be assessed promptly.",
    [cAnswer("rash_fever", "yes")]),
  makeRule("U25", "urgent", "Deformity, or unable to move or put weight on an injured area",
    "These can be signs of a broken bone or serious injury.",
    [cAnswer("injury_deform", "yes")]),
  makeRule("U26", "urgent", "Back pain after a fall or injury",
    "Moderate or severe back pain after an injury should be checked promptly.",
    [cAnswer("back_injury", "yes"), cSymptom("back_pain", { severity: MODERATE_UP })]),
  makeRule("U27", "urgent", "High fever (39.5°C or above)",
    "A very high fever should be assessed promptly.",
    [cAnswer("fever_temp", "39plus")]),
  makeRule("U28", "urgent", "Fever lasting several days",
    "A fever that lasts for several days should be assessed.",
    [cAnswer("fever_prolonged", "yes")]),
  makeRule("U29", "urgent", "Fever in an infant",
    "Infants and very young children can become unwell quickly.",
    [cSymptom("fever"), cAge(0, 1)]),
  makeRule("U30", "urgent", "Symptoms in an infant",
    "Infants and very young children can become unwell quickly, so symptoms should be checked promptly.",
    [cAnySymptom(), cAge(0, 1)]),
  makeRule("U31", "urgent", "Fever with a weakened immune system",
    "People with a weakened immune system can become seriously ill from infections.",
    [cSymptom("fever"), cHistory("immune")]),
  makeRule("U32", "urgent", "Abdominal pain during pregnancy",
    "Abdominal pain during pregnancy should be assessed promptly.",
    [cSymptom("abdominal_pain"), cHistory("pregnant")]),
  makeRule("U33", "urgent", "Headache during pregnancy",
    "Headache during pregnancy should be assessed promptly.",
    [cSymptom("headache"), cHistory("pregnant")]),
  makeRule("U34", "urgent", "Shortness of breath with a chronic lung condition",
    "Breathlessness in someone with a lung condition should be assessed promptly.",
    [cSymptom("shortness_of_breath"), cHistory("lung")]),
  makeRule("U35", "urgent", "Shortness of breath with a heart condition",
    "Breathlessness in someone with a heart condition should be assessed promptly.",
    [cSymptom("shortness_of_breath"), cHistory("heart")]),
  makeRule("U36", "urgent", "Dizziness with a heart condition",
    "Dizziness in someone with a heart condition should be assessed promptly.",
    [cSymptom("dizziness"), cHistory("heart")]),
  makeRule("U37", "urgent", "Nausea or vomiting with diabetes",
    "Vomiting can quickly affect blood sugar control in people with diabetes.",
    [cSymptom("nausea_vomiting"), cHistory("diabetes")]),
  makeRule("U38", "urgent", "Moderate or severe fever at age 65 or over",
    "Older adults can become seriously ill from infections more quickly.",
    [cSymptom("fever", { severity: MODERATE_UP }), cAge(65, 120)]),
  makeRule("U39", "urgent", "A symptom rated as severe",
    "A symptom that is severe or prevents normal activity should be assessed promptly.",
    [cAnySymptom({ severity: ["severe"] })]),
  makeRule("U40", "urgent", "A moderate or severe symptom that is getting worse",
    "Symptoms that are significant and worsening should be assessed promptly.",
    [cAnySymptom({ severity: MODERATE_UP, trend: ["worsening"] })]),

  // ===== ROUTINE notes: worth mentioning to a doctor =====
  makeRule("R01", "routine", "Symptoms lasting more than a week",
    "Symptoms that last longer than a week are worth discussing with a doctor.",
    [cAnySymptom({ duration: ["gt-week"] })]),
  makeRule("R02", "routine", "Symptoms lasting several days without improving",
    "Symptoms that are not getting better after several days are worth discussing with a doctor.",
    [cAnySymptom({ duration: ["4-7d"], trend: ["same", "worsening"] })]),
  makeRule("R03", "routine", "Unexplained weight loss",
    "Weight loss without trying is worth discussing with a doctor.",
    [cAnswer("fatigue_weight", "yes")]),
  makeRule("R04", "routine", "Night sweats or weight loss with a long-lasting cough",
    "A cough that lasts more than a week with these symptoms is worth discussing with a doctor.",
    [cAnswer("cough_weight", "yes")]),
  makeRule("R05", "routine", "Tiredness affecting daily activities",
    "Tiredness that interferes with daily life is worth discussing with a doctor.",
    [cAnswer("fatigue_daily", "yes")]),
  makeRule("R06", "routine", "White patches or swollen glands with a sore throat",
    "A sore throat with these signs is worth having checked.",
    [cAnswer("throat_patches", "yes")])
];

// ---------- Text shown for each result level ----------
const LEVEL_INFO = {
  emergency: {
    label: "Emergency",
    headline: "Seek emergency care now",
    summary: "Your answers include warning signs that can need immediate medical attention.",
    steps: [
      "Call 112 (India) or your local emergency number, or go to the nearest emergency department now.",
      "Do not drive yourself. Ask someone to take you, or wait for the ambulance.",
      "If possible, do not stay alone while you wait for help.",
      "Tell the medical team about the symptoms listed in this assessment."
    ]
  },
  urgent: {
    label: "Urgent",
    headline: "Get medical attention soon",
    summary: "Your answers suggest you should be seen by a healthcare professional today.",
    steps: [
      "Contact a doctor or visit a clinic, urgent care centre or hospital outpatient department today.",
      "If you cannot be seen within a few hours, or you feel worse, go to an emergency department.",
      "Call 112 straight away if you develop chest pain, trouble breathing, confusion, fainting or heavy bleeding.",
      "Take a list of your symptoms and any medicines you take."
    ]
  },
  routine: {
    label: "Routine",
    headline: "Book a routine appointment",
    summary: "Your answers did not show emergency or urgent warning signs.",
    steps: [
      "Book a non-urgent appointment with a doctor if your symptoms continue or you are worried.",
      "Rest and drink enough fluids unless a doctor has advised otherwise.",
      "Seek urgent care if your symptoms get worse or new symptoms appear.",
      "Call 112 straight away if you develop chest pain, trouble breathing, confusion or fainting."
    ]
  }
};