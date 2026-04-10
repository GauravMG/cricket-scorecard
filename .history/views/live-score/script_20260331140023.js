const data = {
    teamA: "India Captains",
    teamB: "Mumbai Spartans",
    scoreA: "46/1",
    oversA: "5.1 OV",
    scoreB: "Bowling",
    matchTitle: "CRICKET LIVE",
    matchState: "0",
    matchSub: "ICN opt to bat",
    lastWicket: "Hashim Amla 1(6)",
    nextBatsman: "S Tiwary",
    reqRate: "8.90",
    venue: "Stadium",
    bat1Name: "U Tharan...",
    bat1Stat: "16 (11) • 145.45",
    bat2Name: "S Jackso...",
    bat2Stat: "24 (14) • 171.43",
    batNote: "4s: 3 • 6s: 0 • Current partnership active",
    bowl1Name: "KC Caria...",
    bowl1Stat: "0-0 (0.1) • 0.00",
    bowl2Name: "Support",
    bowl2Stat: "0-0 (0.0) • 0.00",
    bowlNote: "Powerplay | New ball | Field up",
    inn1: "1st",
    fmt: "T20",
    status: "Live",
    overInfo: "5.1",
    ticker: "WICKET! Hashim Amla departs. New batter walks in."
};

const map = {
    teamA, teamB, scoreA, oversA, scoreB, matchTitle, matchState, matchSub,
    lastWicket, nextBatsman, reqRate, venue, bat1Name, bat1Stat, bat2Name,
    bat2Stat, batNote, bowl1Name, bowl1Stat, bowl2Name, bowl2Stat, bowlNote,
    inn1, fmt, status, overInfo, ticker
};

for (const k in map) document.getElementById(k).textContent = data[k];

window.updateScoreboard = (patch) => {
    Object.assign(data, patch);
    for (const k in patch) if (map[k]) document.getElementById(k).textContent = patch[k];
};

const API_BASE_URL = "https://6vqt42ml-3000.inc1.devtunnels.ms/api"

const params = new URLSearchParams(window.location.search)
const cricbuzzMatchId = params.get("matchId")

async function fetchScore() {
    const res = await fetch(`${API_BASE_URL}/match/${cricbuzzMatchId}`);
    const json = await res.json();

    renderScore(json);
}

// call initially
fetchScore();

// optional polling
setInterval(fetchScore, 5000);

function renderScore(api) {
    const header = api.scorecard.matchHeader;
    const innings = api.scorecard.scoreCard;
    const current = innings[innings.length - 1]; // latest innings

    const batTeam = current.batTeamDetails;
    const bowlTeam = current.bowlTeamDetails;
    const score = current.scoreDetails;

    // -------- TEAM INFO --------
    const teamA = header.team1.shortName;
    const teamB = header.team2.shortName;

    const isChasing = innings.length === 2;

    const scoreA = `${score.runs}/${score.wickets}`;
    const oversA = `${score.overs} OV`;

    // -------- BATSMEN (TOP 2 NOT OUT) --------
    const batsmen = Object.values(batTeam.batsmenData);

    const activeBatsmen = batsmen
        .filter(b => b.outDesc === "not out" || b.wicketCode === "")
        .slice(0, 2);

    const b1 = activeBatsmen[0] || batsmen[0];
    const b2 = activeBatsmen[1] || batsmen[1];

    // -------- BOWLERS --------
    const bowlers = Object.values(bowlTeam.bowlersData);
    const bowler1 = bowlers[0];
    const bowler2 = bowlers[1];

    // -------- LAST WICKET --------
    const wickets = Object.values(current.wicketsData || {});
    const lastWkt = wickets[wickets.length - 1];

    // -------- TARGET / REQ RATE --------
    let targetText = "";
    let reqRate = "";

    if (isChasing) {
        const firstInningsRuns = innings[0].scoreDetails.runs;
        const target = firstInningsRuns + 1;

        const ballsLeft = (20 * 6) - score.ballNbr;
        const runsNeeded = target - score.runs;

        const rrate = (runsNeeded / (ballsLeft / 6)).toFixed(2);

        targetText = `Target ${target} • Need ${runsNeeded} from ${Math.floor(ballsLeft/6)}.${ballsLeft%6}`;
        reqRate = rrate;
    }

    // -------- UPDATE UI --------
    updateScoreboard({
        teamA: header.team1.name,
        teamB: header.team2.name,

        scoreA,
        oversA,
        scoreB: isChasing ? "Batting" : "Bowling",

        matchTitle: header.seriesName,
        matchState: header.matchDescription,
        matchSub: header.status,

        venue: `${header.venue.name}, ${header.venue.city}`,

        lastWicket: lastWkt
            ? `${lastWkt.batName} ${lastWkt.wktRuns}`
            : "-",

        nextBatsman: "—",

        reqRate: reqRate || "-",

        bat1Name: b1?.batShortName || "-",
        bat1Stat: `${b1?.runs} (${b1?.balls}) • ${b1?.strikeRate}`,

        bat2Name: b2?.batShortName || "-",
        bat2Stat: `${b2?.runs} (${b2?.balls}) • ${b2?.strikeRate}`,

        bowl1Name: bowler1?.bowlShortName || "-",
        bowl1Stat: `${bowler1?.wickets}-${bowler1?.runs} (${bowler1?.overs}) • ${bowler1?.economy}`,

        bowl2Name: bowler2?.bowlShortName || "-",
        bowl2Stat: `${bowler2?.wickets}-${bowler2?.runs} (${bowler2?.overs}) • ${bowler2?.economy}`,

        bowlNote: "Live Bowling",

        inn1: innings.length === 2 ? "2nd" : "1st",
        fmt: header.matchFormat,
        status: header.state,

        overInfo: score.overs,

        ticker: header.status
    });
}
