/* ==========================================================
   symptoms.js - All questionnaire content lives here.
   To add a symptom or question later, edit this file only.

   NOTE: These are simple screening prompts written for a
   student project. They have NOT been clinically validated
   and should be reviewed by a medical professional before
   any real-world use.
   ========================================================== */

// ---------- Shared answer options ----------
const DURATION_OPTIONS = [
  { id: "lt-1h",   label: "Less than 1 hour" },
  { id: "1-24h",   label: "1 to 24 hours" },
  { id: "1-3d",    label: "1 to 3 days" },
  { id: "4-7d",    label: "4 to 7 days" },
  { id: "gt-week", label: "More than a week" }
];

const SEVERITY_OPTIONS = [
  { id: "mild",     label: "Mild",     hint: "Noticeable, but does not limit daily activity" },
  { id: "moderate", label: "Moderate", hint: "Limits some daily activity" },
  { id: "severe",   label: "Severe",   hint: "Very distressing or prevents normal activity" }
];

const TREND_OPTIONS = [
  { id: "worsening", label: "Getting worse" },
  { id: "same",      label: "About the same" },
  { id: "improving", label: "Getting better" }
];

const YES_NO = [
  { id: "yes", label: "Yes" },
  { id: "no",  label: "No" }
];

// Optional background conditions (used by triage rules in Batch 3)
const HISTORY_OPTIONS = [
  { id: "heart",    label: "Heart condition" },
  { id: "lung",     label: "Chronic lung condition (for example asthma or COPD)" },
  { id: "diabetes", label: "Diabetes" },
  { id: "immune",   label: "Weakened immune system" },
  { id: "pregnant", label: "Currently pregnant" },
  { id: "surgery",  label: "Recent surgery or hospital stay" }
];

// ---------- Helpers to write follow-up questions shortly ----------
// showIf: only ask this question when another answer matches.
//   question = "duration" | "severity" | "trend" | id of an EARLIER follow-up
//   in       = list of answer ids that make this question appear
function yesNo(id, text, showIf) {
  const q = { id: id, text: text, type: "yesno" };
  if (showIf) q.showIf = showIf;
  return q;
}

function choiceQ(id, text, options, showIf) {
  const q = { id: id, text: text, type: "choice", options: options };
  if (showIf) q.showIf = showIf;
  return q;
}

const LONG_DURATION = ["4-7d", "gt-week"];

// ---------- Categories and symptoms ----------
const SYMPTOM_CATEGORIES = [

  {
    id: "general",
    label: "General",
    description: "Fever, tiredness, dehydration",
    symptoms: [
      {
        id: "fever", label: "Fever",
        followUps: [
          choiceQ("fever_temp", "What is the highest temperature you have measured?", [
            { id: "not-measured", label: "Not measured" },
            { id: "lt-38",        label: "Below 38°C (100.4°F)" },
            { id: "38-39",        label: "38°C to 39.4°C" },
            { id: "39plus",       label: "39.5°C (103°F) or above" }
          ]),
          yesNo("fever_neuro", "Do you have confusion, severe drowsiness or a stiff neck?"),
          yesNo("fever_rash", "Is there a rash that does not fade when you press on it?"),
          yesNo("fever_prolonged", "Has the fever stayed above 38°C for most of this time?",
            { question: "duration", in: LONG_DURATION })
        ]
      },
      {
        id: "fatigue", label: "Unusual tiredness",
        followUps: [
          yesNo("fatigue_daily", "Is the tiredness stopping you from doing normal daily activities?"),
          yesNo("fatigue_weight", "Have you lost weight without trying?",
            { question: "duration", in: LONG_DURATION })
        ]
      },
      {
        id: "dehydration", label: "Signs of dehydration",
        followUps: [
          yesNo("dehy_fluids", "Are you unable to keep fluids down?"),
          yesNo("dehy_urine", "Have you passed urine fewer than three times in the last 24 hours?")
        ]
      }
    ]
  },

  {
    id: "respiratory",
    label: "Breathing and chest",
    description: "Cough, breathlessness, chest pain, sore throat",
    symptoms: [
      {
        id: "cough", label: "Cough",
        followUps: [
          yesNo("cough_blood", "Are you coughing up blood?"),
          yesNo("cough_weight", "Have you had night sweats or unexplained weight loss?",
            { question: "duration", in: ["gt-week"] })
        ]
      },
      {
        id: "shortness_of_breath", label: "Shortness of breath",
        followUps: [
          yesNo("sob_rest", "Is the breathlessness present while you are resting?"),
          yesNo("sob_words", "Can you only speak a few words at a time because of it?"),
          yesNo("sob_blue", "Are your lips or face turning blue or grey?")
        ]
      },
      {
        id: "chest_pain", label: "Chest pain",
        followUps: [
          yesNo("chest_spread", "Does the pain spread to your arm, jaw, neck or back?"),
          yesNo("chest_sweat", "Do you have sweating, nausea or feel faint with the pain?"),
          yesNo("chest_breath", "Does the pain get worse when you breathe in deeply or cough?",
            { question: "chest_spread", in: ["no"] })
        ]
      },
      {
        id: "sore_throat", label: "Sore throat",
        followUps: [
          yesNo("throat_swallow", "Do you have difficulty swallowing saliva or breathing?"),
          yesNo("throat_patches", "Do you have white patches on the throat or swollen glands in the neck?",
            { question: "duration", in: LONG_DURATION })
        ]
      }
    ]
  },

  {
    id: "neuro",
    label: "Head and nerves",
    description: "Headache, dizziness, fainting, weakness, vision",
    symptoms: [
      {
        id: "headache", label: "Headache",
        followUps: [
          yesNo("head_sudden", "Did it start suddenly and feel like the worst headache of your life?"),
          yesNo("head_neck", "Do you have a stiff neck, fever or sensitivity to light with it?"),
          yesNo("head_injury", "Did it begin after a blow to the head?")
        ]
      },
      {
        id: "dizziness", label: "Dizziness",
        followUps: [
          yesNo("dizzy_faint", "Do you feel like you might faint right now?"),
          yesNo("dizzy_heart", "Do you also have chest pain, a racing heartbeat or breathlessness?")
        ]
      },
      {
        id: "fainting", label: "Fainting or blackout",
        followUps: [
          yesNo("faint_repeat", "Has it happened more than once?"),
          yesNo("faint_heart", "Did you have chest pain or palpitations before it happened?"),
          yesNo("faint_injury", "Were you injured when you fell?")
        ]
      },
      {
        id: "confusion", label: "Confusion",
        followUps: [
          yesNo("conf_sudden", "Did it start suddenly, within the last few hours?"),
          yesNo("conf_fever", "Do you also have a high fever?")
        ]
      },
      {
        id: "weakness_one_side", label: "Weakness or numbness on one side",
        followUps: [
          yesNo("weak_face", "Is there drooping of the face or slurred speech?"),
          yesNo("weak_sudden", "Did it start suddenly?")
        ]
      },
      {
        id: "vision_changes", label: "Change in vision",
        followUps: [
          yesNo("vision_sudden", "Was the change sudden?"),
          yesNo("vision_pain", "Do you also have eye pain or a severe headache?")
        ]
      }
    ]
  },

  {
    id: "digestive",
    label: "Stomach and digestion",
    description: "Stomach pain, vomiting, diarrhoea",
    symptoms: [
      {
        id: "abdominal_pain", label: "Abdominal (stomach) pain",
        followUps: [
          choiceQ("abd_location", "Where is the pain mostly?", [
            { id: "upper",       label: "Upper abdomen" },
            { id: "lower-right", label: "Lower right" },
            { id: "lower-left",  label: "Lower left" },
            { id: "central",     label: "Around the navel or all over" }
          ]),
          yesNo("abd_sudden", "Did the pain start suddenly and feel severe?"),
          yesNo("abd_rigid", "Is your abdomen hard or extremely tender to touch?")
        ]
      },
      {
        id: "nausea_vomiting", label: "Nausea or vomiting",
        followUps: [
          yesNo("vomit_fluids", "Are you unable to keep any fluids down?"),
          yesNo("vomit_blood", "Is there blood, or dark material like coffee grounds, in the vomit?")
        ]
      },
      {
        id: "diarrhea", label: "Diarrhoea",
        followUps: [
          yesNo("diar_blood", "Is there blood in the stool, or is the stool black?"),
          yesNo("diar_urine", "Have you passed urine fewer than three times in the last 24 hours?",
            { question: "severity", in: ["moderate", "severe"] })
        ]
      }
    ]
  },

  {
    id: "musculoskeletal",
    label: "Bones, joints and injury",
    description: "Joint pain, back pain, injuries",
    symptoms: [
      {
        id: "joint_pain", label: "Joint pain or swelling",
        followUps: [
          yesNo("joint_hot", "Is a joint red, hot and swollen?"),
          yesNo("joint_fever", "Do you also have a fever?")
        ]
      },
      {
        id: "back_pain", label: "Back pain",
        followUps: [
          yesNo("back_numb", "Do you have numbness or weakness in the legs, or trouble controlling your bladder or bowels?"),
          yesNo("back_injury", "Did it begin after a fall or injury?")
        ]
      },
      {
        id: "injury", label: "Injury or wound",
        followUps: [
          yesNo("injury_bleeding", "Is there bleeding that will not stop with firm pressure?"),
          yesNo("injury_deform", "Is there a visible deformity, or can you not move or put weight on the area?"),
          yesNo("injury_head", "Was there a blow to the head with drowsiness or vomiting?")
        ]
      }
    ]
  },

  {
    id: "skin",
    label: "Skin and swelling",
    description: "Rash, swelling",
    symptoms: [
      {
        id: "rash", label: "Rash",
        followUps: [
          yesNo("rash_breath", "Do you have swelling of the face, lips or throat, or trouble breathing?"),
          yesNo("rash_spread", "Is the rash spreading quickly?"),
          yesNo("rash_fever", "Do you also have a fever?")
        ]
      },
      {
        id: "swelling", label: "Swelling in the body",
        followUps: [
          yesNo("swell_leg", "Is the swelling in one leg only, with pain or warmth?"),
          yesNo("swell_breath", "Do you also have breathlessness?")
        ]
      }
    ]
  }

];