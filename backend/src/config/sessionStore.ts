import { ConversationTurn } from "../services/geminiService";

/**
 * Simple in-memory session store.
 * Holds conversation history keyed by sessionId.
 *
 * ⚠️  This resets when the server restarts.
 * To persist across restarts, swap this out for Redis or a DB later
 * — the interface (get/set/delete) stays exactly the same.
 */

interface Session {
  history: ConversationTurn[];
  userDetails: any; // UserDetails — stored so /send-message doesn't need it in body
  createdAt: number;
}

const sessions = new Map<string, Session>();

// Auto-clean sessions older than 2 hours to avoid memory leaks
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
      console.log(`🧹 Expired session cleaned: ${id}`);
    }
  }
}, 15 * 60 * 1000); // run cleanup every 15 minutes

export const createSession = (
  sessionId: string,
  userDetails: any,
  history: ConversationTurn[]
): void => {
  sessions.set(sessionId, {
    history,
    userDetails,
    createdAt: Date.now()
  });
};

export const getSession = (sessionId: string): Session | undefined => {
  return sessions.get(sessionId);
};

export const updateSessionHistory = (
  sessionId: string,
  newHistory: ConversationTurn[]
): void => {
  const session = sessions.get(sessionId);
  if (session) {
    session.history = newHistory;
  }
};

export const deleteSession = (sessionId: string): void => {
  sessions.delete(sessionId);
};
