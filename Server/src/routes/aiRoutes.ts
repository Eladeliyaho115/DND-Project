import { Router } from "express";
import { 
  handleAIChat, 
  handleCreateSession, 
  handleGetSessions, 
  handleGetSessionMessages, 
  handleDeleteSession 
} from "../controllers/ai/aiController.js";

const router = Router();

router.post("/chat", handleAIChat);
router.post("/sessions", handleCreateSession);
router.get("/sessions/campaign/:campaignId", handleGetSessions);
router.get("/sessions/:sessionId/messages", handleGetSessionMessages);
router.delete("/sessions/:sessionId", handleDeleteSession);

export default router;