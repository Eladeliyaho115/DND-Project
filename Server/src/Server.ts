import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import characterRoutes from './routes/characterRoutes.js';
import campaignRoutes from "./routes/campaignRoutes.js";


const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Healthcheck Route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/campaigns', campaignRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});