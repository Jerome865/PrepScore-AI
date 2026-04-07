import { UserDetails, FeedbackReport } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Starts the interview by sending the initial message + resume.
 * The backend creates a session and returns a sessionId.
 * Store this sessionId and pass it to every subsequent call.
 *
 * Returns: { sessionId: string, reply: string }
 */
export const sendInitialMessageWithResume = async (
  userDetails: UserDetails
): Promise<{ sessionId: string; reply: string }> => {
  const response = await fetch(`${API_BASE}/send-initial`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userDetails })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to start interview");
  }

  return response.json();
};

/**
 * Sends one message turn during the interview.
 * Pass the sessionId returned from sendInitialMessageWithResume.
 *
 * Returns: { reply: string }
 */
export const sendMessageWithVideo = async (
  sessionId: string,
  text: string,
  imageBase64?: string | null
): Promise<{ reply: string }> => {
  const response = await fetch(`${API_BASE}/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, text, imageBase64 })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to send message");
  }

  return response.json();
};

/**
 * Generates the final feedback report at the end of the session.
 *
 * Returns: FeedbackReport
 */
export const generateDetailedFeedback = async (
  transcript: { role: string; text: string }[],
  userDetails: UserDetails
): Promise<FeedbackReport> => {
  const response = await fetch(`${API_BASE}/generate-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, userDetails })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to generate feedback");
  }

  return response.json();
};
