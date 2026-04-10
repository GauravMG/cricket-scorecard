import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import path from "path";

import matchRoutes from './routes/matchRoutes';
import { getLatestScore, updateMatchScore } from './services/scoreService';
import { liveScoreHTML, scorecardHTML } from "./views"
import { prisma } from './prisma';

const app = express();
app.use(express.json());

app.use('/api', matchRoutes);

// Views
app.use("/live-score", express.static(path.join(process.cwd(), "views/live-score")));

app.listen(3000, () => console.log('Server running on port 3000'));

cron.schedule('*/30 * * * * *', async () => {
  const matches = await prisma.match.findMany();

  for (const m of matches) {
    console.log(`m ===`, m)
    await updateMatchScore(m.cricbuzzMatchId);
  }
});