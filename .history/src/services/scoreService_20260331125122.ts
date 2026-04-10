import { prisma } from '../prisma';
import { smartFetch } from '../utils/fetcher';

export async function updateMatchScore(matchId: string) {
  const liveUrl = `https://www.cricbuzz.com/api/mcenter/comm/${matchId}`;
  const scorecardUrl = `https://www.cricbuzz.com/api/mcenter/scorecard/${matchId}`;

  const [live, scorecard] = await Promise.all([
    smartFetch(liveUrl),
    smartFetch(scorecardUrl)
  ]);

  const match = await prisma.match.upsert({
    where: { cricbuzzMatchId: matchId },
    update: {},
    create: { cricbuzzMatchId: matchId }
  });

  await prisma.score.create({
    data: {
      matchId: match.id,
      data: { live, scorecard }
    }
  });

  return { live, scorecard };
}

export async function getLatestScore(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { cricbuzzMatchId: matchId },
    include: {
      scores: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  return match?.scores[0]?.data;
}