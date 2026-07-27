import { Router } from 'express';
import { handleAIChat } from '../controllers/aiController.js';

const router = Router();

router.post('/chat', handleAIChat);

router.get('/test', (req, res) => {
  res.json({ message: 'AI route is active!' });
});

export default router;