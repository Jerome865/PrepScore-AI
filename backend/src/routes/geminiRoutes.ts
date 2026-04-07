import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  sendMessageWithVideo,
  sendInitialMessageWithResume,
  generateDetailedFeedback
} from "../services/geminiService";
import {
  createSession,
  getSession,
  updateSessionHistory,
} from "../config/sessionStore";

const router = Router();

/**
 * POST /api/send-initial
 * Body: { userDetails }
 * Response: { sessionId, reply }
 *
 * Starts the interview. Creates a new session with the seed history.
 */
router.post("/send-initial", async (req, res) => {
  try {
    const { userDetails } = req.body;

    if (!userDetails) {
      return res.status(400).json({ error: "userDetails is required" });
    }

    const { reply, history } = await sendInitialMessageWithResume(userDetails);

    const sessionId = uuidv4();
    createSession(sessionId, userDetails, history);

    res.json({ sessionId, reply });
  } catch (error) {
    console.error("Error in /send-initial:", error);
    res.status(500).json({ error: "Failed to start interview session" });
  }
});

/**
 * POST /api/send-message
 * Body: { sessionId, text, imageBase64? }
 * Response: { reply }
 *
 * Sends one turn. Loads history from session store, calls Gemini, saves updated history.
 */
router.post("/send-message", async (req, res) => {
  try {
    const { sessionId, text, imageBase64 } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired. Please start a new interview." });
    }

    const { reply, newHistory } = await sendMessageWithVideo(
      session.userDetails,
      session.history,
      text,
      imageBase64
    );

    updateSessionHistory(sessionId, newHistory);

    res.json({ reply });
  } catch (error) {
    console.error("Error in /send-message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * POST /api/generate-feedback
 * Body: { transcript, userDetails }
 * Response: FeedbackReport
 */
router.post("/generate-feedback", async (req, res) => {
  try {
    const { transcript, userDetails } = req.body;

    if (!transcript || !userDetails) {
      return res.status(400).json({ error: "transcript and userDetails are required" });
    }

    const result = await generateDetailedFeedback(transcript, userDetails);
    res.json(result);
  } catch (error) {
    console.error("Error in /generate-feedback:", error);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

export default router;
