import express from 'express';
import cron from 'node-cron';
import matchRoutes from './routes/matchRoutes';
import { getLatestScore, updateMatchScore } from './services/scoreService';
import { liveScoreHTML, scorecardHTML } from "./views"
import { prisma } from './prisma';

const app = express();
app.use(express.json());

app.use('/api', matchRoutes);

// Live score view
app.get('/view/live/:id', async (req, res) => {
  const data = await getLatestScore(req.params.id);
  res.send(liveScoreHTML(data));
});

// Scorecard view
app.get('/view/scorecard/:id', async (req, res) => {
  const data = await getLatestScore(req.params.id);
  res.send(scorecardHTML(data));
});

app.listen(3000, () => console.log('Server running on port 3000'));

cron.schedule('*/30 * * * * *', async () => {
  const matches = await prisma.match.findMany();

  for (const m of matches) {
    await updateMatchScore(m.cricbuzzMatchId);
  }
});