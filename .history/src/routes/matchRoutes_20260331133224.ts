import express from 'express';
import { updateMatchScore, getLatestScore } from '../services/scoreService';
import { prisma } from '../prisma';

const router = express.Router();

// Create match
router.post('/match', async (req, res) => {
  const { matchId } = req.body;

  const match = await prisma.match.create({
    data: { cricbuzzMatchId: matchId }
  });

  res.json(match);
});

// Get match
router.get('/match/:id', async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: Number(req.params.id) }
  });

  res.json(match);
});

// Fetch live score
router.get('/match/:id/live', async (req, res) => {
  const data = await updateMatchScore(req.params.id);
  res.json(data.live);
});

// Fetch scorecard
router.get('/match/:id/scorecard', async (req, res) => {
  const data = await updateMatchScore(req.params.id);
  res.json(data.scorecard);
});

export default router;