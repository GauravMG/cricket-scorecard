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
    where: { cricbuzzMatchId: req.params.id }
  });

  res.json(match);
});

export default router;