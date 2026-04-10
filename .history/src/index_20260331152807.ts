import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import path from "path";

import matchRoutes from './routes/matchRoutes';
import { getLatestScore, updateMatchScore } from './services/scoreService';
import { liveScoreHTML, scorecardHTML } from "./views"
import { prisma } from './prisma';

const PORT = process.env.PORT || 7001

const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
    res.json({
        success: true,
        message: "This is cricket-scorecard."
    })
})

app.use('/api', matchRoutes);

// Views
app.use("/live-score", express.static(path.join(process.cwd(), "views/live-score")));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

cron.schedule('*/30 * * * * *', async () => {
    const matches = await prisma.match.findMany();

    for (const m of matches) {
        try {
            let data = typeof m.data === "string" ? JSON.parse(m.data) : m.data;

            const live = data?.live;
            const header = live?.matchHeader;
            const miniscore = live?.miniscore;

            const state = miniscore?.matchScoreDetails?.state || header?.state;

            const startTime = header?.matchStartTimestamp;
            const now = Date.now();

            let shouldFetch = false;

            // ✅ Within 10 minutes before match
            if (startTime) {
                const diff = startTime - now;

                if (diff > 0 && diff <= 10 * 60 * 1000) {
                    shouldFetch = true;
                }
            }

            // ✅ After match starts → keep fetching until complete
            if (startTime && now >= startTime && state !== "Complete") {
                shouldFetch = true;
            }

            // ❌ Stop after complete
            if (state === "Complete") {
                shouldFetch = false;
            }

            if (!data) {
                shouldFetch = true;
            }

            if (shouldFetch) {
                console.log(`Fetching ${m.cricbuzzMatchId} | state=${state}`);
                await updateMatchScore(m.cricbuzzMatchId);
            } else {
                console.log(`Skipping ${m.cricbuzzMatchId} | state=${state}`);
            }

        } catch (err) {
            console.error(`Error for match ${m.cricbuzzMatchId}`, err);
        }
    }
});