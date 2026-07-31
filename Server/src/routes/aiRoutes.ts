import { Router } from "express";
import { 
  handleAIChat, 
  handleCreateSession, 
  handleGetSessions, 
  handleGetSessionMessages, 
  handleDeleteSession,
  handleUpdateSessionTitleController,
  handleUpdateSessionMessagesController
} from "../controllers/ai/aiController.js";

const router = Router();

router.post("/chat", handleAIChat);
router.post("/sessions", handleCreateSession);
router.get("/sessions/campaign/:campaignId", handleGetSessions);
router.get("/sessions/:sessionId/messages", handleGetSessionMessages);
router.delete("/sessions/:sessionId", handleDeleteSession);
router.patch("/sessions/:sessionId/title", handleUpdateSessionTitleController);
router.put("/sessions/:sessionId/messages", handleUpdateSessionMessagesController); // 👈 נתיב חדש לעדכון/עריכת הודעות

export default router;