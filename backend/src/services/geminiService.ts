import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserDetails, FeedbackReport } from "../types";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// PRIORITY LIST:
// 1. Flash 2.5 (Best performance)
// 2. Flash Lite 2.5 (Backup for quota)
const MODEL_PRIORITY_LIST = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

// Cache the working model so we don't probe every request
let activeModel: string | null = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

const isErrorQuotaRelated = (error: any): boolean => {
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  return (
    error.status === 429 ||
    error.code === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('exhausted')
  );
};

const getWorkingModel = async (): Promise<string> => {
  if (activeModel) return activeModel;

  console.log("Checking for available Gemini models...");

  for (const model of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Testing model: ${model}...`);
      await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: 'hi' }] }],
        config: { maxOutputTokens: 1 }
      });
      console.log(`✅ Model operational: ${model}`);
      activeModel = model;
      return model;
    } catch (error: any) {
      if (isErrorQuotaRelated(error)) {
        console.warn(`⚠️ Model ${model} QUOTA EXCEEDED. Trying next...`);
      } else {
        console.warn(`⚠️ Model ${model} failed probe.`, error);
      }
    }
  }

  console.warn("⚠️ All probes failed, defaulting to gemini-2.5-flash");
  return 'gemini-2.5-flash';
};

/**
 * Builds the system instruction string for Ava the interviewer.
 * Kept as a pure function so every stateless call can embed it.
 */
const buildSystemInstruction = (userDetails: UserDetails): string => `
You are **Ava**, an expert HR interviewer and career coach conducting a video interview.

CANDIDATE DETAILS:
- Name: ${userDetails.name || 'Candidate'}
- Role: ${userDetails.targetRole}
- Industry: ${userDetails.industry}
- Level: ${userDetails.experienceLevel}

INSTRUCTIONS:
1. Act as a professional interviewer named Ava. Be polite, encouraging, but rigorous.
2. Ask ONE question at a time.
3. LANGUAGE & SPEECH HANDLING:
   - Conduct the interview strictly in ENGLISH.
   - The candidate is using real-time voice-to-text.
   - They may have "realistic" speech patterns like fillers ("aa", "hh", "umm"), long pauses, or cut-off sentences.
   - You MUST understand the core meaning behind these disfluencies. Do not comment on fillers unless they severely impact clarity.
4. ACTIVE VISUAL MONITORING (CRITICAL):
   - You will receive a video snapshot of the candidate with each turn.
   - Actively analyze their body language, posture, and eye contact.
   - If you detect issues (looking away, slouching, bad lighting, nervous expressions):
     IMMEDIATELY mention it politely before the next question.
     Example: "I notice you are looking down quite a bit. Try to maintain eye contact with the camera. Now, regarding..."
   - If they look good, occasionally compliment it.
5. RESPONSE STYLE:
   - Keep spoken responses short (max 2-3 sentences) for conversational flow.
   - Use occasional conversational fillers ("Alright,", "I see,") to sound natural.
6. Do NOT give a full evaluation report yet. Just interview and provide real-time visual coaching.

Start by welcoming the candidate in English (introduce yourself as Ava) and asking the first question.
`.trim();

// ─── Shared error handler ────────────────────────────────────────────────────

const handleApiError = (error: any, context: string): string => {
  console.error(`Gemini API Error [${context}]:`, error);

  const message = error.message || error.error?.message || JSON.stringify(error);

  if (
    message.includes('xhr error') ||
    message.includes('Rpc failed') ||
    message.includes('fetch failed') ||
    message.includes('NetworkError')
  ) {
    return "Error: Network connection unstable. Please try sending again.";
  }

  if (isErrorQuotaRelated(error)) {
    activeModel = null; // force re-probe on next call
    return "Error: Daily quota exceeded. Please tap Retry to switch to the backup model.";
  }

  if (error.status === 404 || message.includes('404')) {
    activeModel = null;
    return "Error: AI service temporarily unavailable (404). Please try again.";
  }

  return `Error: Something went wrong. (${message.substring(0, 120)})`;
};

// ─── Conversation history type ───────────────────────────────────────────────

/**
 * A single turn in the conversation history.
 * Store this array in your database / session and pass it back on every request.
 *
 * role  – "user" | "model"
 * parts – array of text / inlineData parts (same shape as the Gemini SDK)
 */
export type ConversationTurn = {
  role: "user" | "model";
  parts: any[];
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sends the very first message that bootstraps the interview.
 * Attaches the resume (if any) and returns:
 *   - `reply`   – Ava's opening message
 *   - `history` – the two-turn seed history to store and pass on future calls
 */
export const sendInitialMessageWithResume = async (
  userDetails: UserDetails
): Promise<{ reply: string; history: ConversationTurn[] }> => {
  const model = await getWorkingModel();

  let introText = `I am ready for the interview. My name is ${userDetails.name}. Role: ${userDetails.targetRole}.`;
  if (userDetails.jobDescription) {
    introText += `\nJob Description Context: ${userDetails.jobDescription}`;
  }

  const userParts: any[] = [{ text: introText }];

  if (userDetails.resumeBase64 && userDetails.resumeMimeType) {
    userParts.push({
      inlineData: {
        mimeType: userDetails.resumeMimeType,
        data: userDetails.resumeBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction: buildSystemInstruction(userDetails)
      },
      contents: [{ role: "user", parts: userParts }]
    });

    const reply = response.text || "";

    const history: ConversationTurn[] = [
      { role: "user",  parts: userParts },
      { role: "model", parts: [{ text: reply }] }
    ];

    return { reply, history };
  } catch (error: any) {
    const msg = handleApiError(error, "sendInitialMessageWithResume");
    // Still return an empty seed history so the caller doesn't crash
    return { reply: msg, history: [] };
  }
};

/**
 * Sends one user turn (text + optional video frame) in an ongoing interview.
 *
 * @param userDetails   – candidate info (used to rebuild system instruction)
 * @param history       – the full conversation so far (load from DB, pass here)
 * @param text          – transcribed speech for this turn
 * @param imageBase64   – optional JPEG snapshot from the webcam
 *
 * Returns:
 *   - `reply`      – Ava's response text
 *   - `newHistory` – updated history array (save this back to DB)
 */
export const sendMessageWithVideo = async (
  userDetails: UserDetails,
  history: ConversationTurn[],
  text: string,
  imageBase64?: string | null
): Promise<{ reply: string; newHistory: ConversationTurn[] }> => {
  const model = await getWorkingModel();

  const userParts: any[] = [];

  if (text && text.trim().length > 0) {
    userParts.push({ text });
  } else {
    userParts.push({ text: "[User nodded or provided non-verbal input]" });
  }

  if (imageBase64) {
    userParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    });
  }

  // Append the new user turn to history before sending
  const contents: ConversationTurn[] = [
    ...history,
    { role: "user", parts: userParts }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction: buildSystemInstruction(userDetails)
      },
      contents
    });

    const reply = response.text || "";

    const newHistory: ConversationTurn[] = [
      ...contents,
      { role: "model", parts: [{ text: reply }] }
    ];

    return { reply, newHistory };
  } catch (error: any) {
    return {
      reply: handleApiError(error, "sendMessageWithVideo"),
      newHistory: history // don't corrupt history on error
    };
  }
};

/**
 * Generates a structured feedback report at the end of the session.
 * Unchanged in logic; does NOT need conversation history.
 */
export const generateDetailedFeedback = async (
  transcript: { role: string; text: string }[],
  userDetails: UserDetails
): Promise<FeedbackReport> => {
  const model = await getWorkingModel();

  const transcriptText = transcript
    .map(t => `${t.role.toUpperCase()}: ${t.text}`)
    .join('\n\n');

  const prompt = `
Analyze this mock video interview session and the candidate's resume.

Candidate: ${userDetails.name}
Role: ${userDetails.targetRole}
Experience: ${userDetails.experienceLevel}

TRANSCRIPT:
${transcriptText}

Generate a detailed structured JSON report.

IMPORTANT SCORING RULES:

1. INTERVIEW SCORE (OVERALL SCORE):
   - Calculated STRICTLY from the candidate's answers. Do NOT mix in the ATS score.
   - 0   → absolute silence / all "No Answer" / pure technical errors
   - 10-30 → one-word or irrelevant answers (never 0 if they spoke)
   - 31-50 → vague or incorrect answers
   - 51-70 → basic answers, lacking depth
   - 71-100 → strong, clear, detailed answers

2. RESUME & ATS ANALYSIS (INDEPENDENT):
   - ATS Score (0-100) based ONLY on the resume file keywords, formatting, and relevance to "${userDetails.targetRole}".
   - A bad interview does NOT lower the ATS score.

3. FEEDBACK CATEGORIES (score 0-100 each, never 0 if candidate spoke):
   1. "Communication"
   2. "Technical Knowledge"
   3. "Problem Solving & Analytical Skills"
   4. "Visual Presence & Confidence"
   5. "Resume Presentation & Elaboration"

4. OUTPUT: Strictly follow the JSON schema provided.
`.trim();

  const parts: any[] = [{ text: prompt }];

  if (userDetails.resumeBase64 && userDetails.resumeMimeType) {
    parts.push({
      inlineData: {
        mimeType: userDetails.resumeMimeType,
        data: userDetails.resumeBase64
      }
    });
  }

  const feedbackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallSummary: { type: Type.STRING },
      overallScore: { type: Type.INTEGER, description: "Interview performance only. 0 only if no answers." },
      categoryFeedback: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category:     { type: Type.STRING },
            score:        { type: Type.INTEGER, description: "Score out of 100" },
            strengths:    { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["category", "score", "strengths", "improvements"]
        }
      },
      questionFeedback: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question:        { type: Type.STRING },
            userAnswer:      { type: Type.STRING },
            goodPoints:      { type: Type.STRING },
            missingPoints:   { type: Type.STRING },
            improvedExample: { type: Type.STRING },
          },
          required: ["question", "userAnswer", "goodPoints", "missingPoints", "improvedExample"]
        }
      },
      resumeAnalysis: {
        type: Type.OBJECT,
        properties: {
          atsScore:    { type: Type.INTEGER, description: "ATS Score out of 100 based on resume only" },
          strengths:   { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses:  { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["atsScore", "strengths", "weaknesses", "suggestions"]
      },
      skillGaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            skill:    { type: Type.STRING },
            status:   { type: Type.STRING, enum: ["strong", "weak", "missing"] },
            category: { type: Type.STRING, enum: ["technical", "domain", "soft"] }
          },
          required: ["skill", "status", "category"]
        }
      },
      learningRoadmap: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            skill:        { type: Type.STRING },
            action:       { type: Type.STRING },
            resourceType: { type: Type.STRING }
          },
          required: ["skill", "action", "resourceType"]
        }
      }
    },
    required: [
      "overallSummary", "overallScore", "categoryFeedback",
      "questionFeedback", "resumeAnalysis", "skillGaps", "learningRoadmap"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: feedbackSchema
      }
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace  = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(text) as FeedbackReport;
  } catch (e) {
    console.error("Analysis failed", e);
    throw new Error("Failed to generate feedback report. Please ensure your transcript is sufficient.");
  }
};