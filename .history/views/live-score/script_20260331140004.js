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
    const res = await fetch(`${API_BASE_URL}/match/${cricbuzzMatchId}`); // change this
    const json = await res.json();

    renderScore(json);
}

// call initially
fetchScore();

// optional polling
setInterval(fetchScore, 5000);