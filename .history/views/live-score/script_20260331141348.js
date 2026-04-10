const data = {};

const map = {
    teamA: true,
    teamB: true,
    scoreA: true,
    oversA: true,
    scoreB: true,
    matchTitle: true,
    matchState: true,
    matchSub: true,
    lastWicket: true,
    nextBatsman: true,
    reqRate: true,
    venue: true,
    bat1Name: true,
    bat1Stat: true,
    bat2Name: true,
    bat2Stat: true,
    batNote: true,
    bowl1Name: true,
    bowl1Stat: true,
    bowl2Name: true,
    bowl2Stat: true,
    bowlNote: true,
    inn1: true,
    fmt: true,
    status: true,
    overInfo: true,
    ticker: true
};

// Initial render (empty-safe)
for (const k in map) {
    const el = document.getElementById(k);
    if (el) el.textContent = "-";
}

window.updateScoreboard = (patch) => {
    Object.assign(data, patch);

    for (const k in patch) {
        if (map[k]) {
            const el = document.getElementById(k);
            if (el) el.textContent = patch[k];
        }
    }
};

// ---------------- API ----------------

const API_BASE_URL = "https://6vqt42ml-3000.inc1.devtunnels.ms/api";

// const params = new URLSearchParams(window.location.search);
// const cricbuzzMatchId = params.get("matchId");
const params = new URLSearchParams(window.location.search);
const cricbuzzMatchId = params.get("matchId");

// fallback if not passed
if (!cricbuzzMatchId) {
    console.warn("No matchId provided in URL");
}

async function fetchScore() {
    try {
        const res = await fetch(`${API_BASE_URL}/match/${cricbuzzMatchId}`);
        const json = await res.json();

        renderScore(json);
    } catch (err) {
        console.error("API error:", err);
    }
}

fetchScore();
let fetchScoreInterval = setInterval(fetchScore, 5000);

// ---------------- RENDER ----------------

function renderScore(api) {
    const scorecard = api.data.scorecard
    if (!scorecard) return;

    if (scorecard.isMatchComplete) {
        clearInterval(fetchScoreInterval)
    }

    const header = scorecard.matchHeader;
    const innings = scorecard.scoreCard || [];

    if (!innings.length) return;

    const current = innings[innings.length - 1];

    const batTeam = current.batTeamDetails || {};
    const bowlTeam = current.bowlTeamDetails || {};
    const score = current.scoreDetails || {};

    const isChasing = innings.length === 2;
    const isComplete = header.state === "Complete";

    // -------- SCORE --------
    const scoreA = `${score.runs || 0}/${score.wickets || 0}`;
    const oversA = `${score.overs || 0} OV`;

    // -------- BATSMEN --------
    const batsmen = Object.values(batTeam.batsmenData || {});

    const activeBatsmen = batsmen.filter(
        b => b.outDesc === "not out" || (!b.wicketCode && b.balls > 0)
    );

    const b1 = activeBatsmen[0] || batsmen[0] || {};
    const b2 = activeBatsmen[1] || batsmen[1] || {};

    // -------- NEXT BATSMAN --------
    const nextBat = batsmen.find(b => b.balls === 0 && !b.outDesc);

    // -------- BOWLERS --------
    const bowlers = Object.values(bowlTeam.bowlersData || {});
    const bowler1 = bowlers[0] || {};
    const bowler2 = bowlers[1] || {};

    // -------- LAST WICKET --------
    const wickets = Object.values(current.wicketsData || {});
    const lastWkt = wickets[wickets.length - 1];

    // -------- TARGET / REQ RATE --------
    let reqRate = "-";
    let targetText = "";

    if (isChasing && innings[0]) {
        const firstRuns = innings[0].scoreDetails.runs;
        const target = firstRuns + 1;

        const ballsLeft = (20 * 6) - (score.ballNbr || 0);
        const runsNeeded = target - (score.runs || 0);

        if (ballsLeft > 0 && runsNeeded > 0) {
            reqRate = (runsNeeded / (ballsLeft / 6)).toFixed(2);
        }

        targetText = `Target ${target}`;
    }

    // -------- PARTNERSHIP --------
    const partnerships = Object.values(current.partnershipsData || {});
    const lastPartnership = partnerships[partnerships.length - 1];

    const partnershipText = lastPartnership
        ? `Partnership ${lastPartnership.totalRuns} (${lastPartnership.totalBalls})`
        : "";

    // -------- UPDATE --------
    updateScoreboard({
        teamA: header.team1?.name || "-",
        teamB: header.team2?.name || "-",

        scoreA,
        oversA,
        scoreB: isChasing ? "Batting" : "Bowling",

        matchTitle: header.seriesName || "-",
        matchState: header.matchDescription || "-",
        matchSub: header.status || "-",

        venue: `${header.venue?.name || ""}, ${header.venue?.city || ""}`,

        lastWicket: lastWkt
            ? `${lastWkt.batName} ${lastWkt.wktRuns}`
            : "-",

        nextBatsman: nextBat?.batShortName || "-",

        reqRate: isComplete ? "-" : reqRate,

        bat1Name: b1.batShortName || "-",
        bat1Stat: `${b1.runs || 0} (${b1.balls || 0}) • ${b1.strikeRate || 0}`,

        bat2Name: b2.batShortName || "-",
        bat2Stat: `${b2.runs || 0} (${b2.balls || 0}) • ${b2.strikeRate || 0}`,

        batNote: partnershipText,

        bowl1Name: bowler1.bowlShortName || "-",
        bowl1Stat: `${bowler1.wickets || 0}-${bowler1.runs || 0} (${bowler1.overs || 0}) • ${bowler1.economy || 0}`,

        bowl2Name: bowler2.bowlShortName || "-",
        bowl2Stat: `${bowler2.wickets || 0}-${bowler2.runs || 0} (${bowler2.overs || 0}) • ${bowler2.economy || 0}`,

        bowlNote: isComplete ? "Match Complete" : "Live Bowling",

        inn1: innings.length === 2 ? "2nd" : "1st",
        fmt: header.matchFormat || "-",
        status: header.state || "-",

        overInfo: score.overs || "-",

        ticker: header.status || "-"
    });
}