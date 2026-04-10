const data = {};

const map = {
  teamA: true,
  teamB: true,
  badgeA: true,
  badgeB: true,
  scoreA: true,
  oversA: true,
  scoreB: true,
  oversB: true,
  matchTitle: true,
  matchState: true,
  matchDescription: true,
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
  batNote2: true,
  bowl1Name: true,
  bowl1Stat: true,
  bowl2Name: true,
  bowl2Stat: true,
  bowlNote: true,
  inn1: true,
  fmt: true,
  status: true,
  overInfo: true,
  ticker: true,
  momentText: true
};

for (const k in map) {
  const el = document.getElementById(k);
  if (el) el.textContent = "-";
}

window.updateScoreboard = (patch) => {
  Object.assign(data, patch);

  for (const k in patch) {
    if (map[k]) {
      const el = document.getElementById(k);
      if (el) el.textContent = patch[k] ?? "-";
    }
  }
};

const API_BASE_URL = "https://6vqt42ml-7001.inc1.devtunnels.ms/api";
const params = new URLSearchParams(window.location.search);
const cricbuzzMatchId = params.get("matchId");

if (!cricbuzzMatchId) {
  console.warn("No matchId provided in URL");
}

function setInitial(elId, text, fallback = "?") {
  const el = document.getElementById(elId);
  if (!el) return;
  const value = (text || "").trim();
  el.textContent = value ? value.charAt(0).toUpperCase() : fallback;
}

function setMeter(id, value, max = 100) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct = Math.max(8, Math.min(100, Math.round((value / max) * 100)));
  el.style.width = `${pct}%`;
}

function getTicker(mini, header, matchDetails) {
  const statusText = (header?.status || mini?.status || "").toLowerCase();
  const lastWicket = mini?.lastWicket || "";
  const recentBalls = getRecentBalls(mini);

  if (statusText.includes("won")) return header.status || mini.status || "Result confirmed";
  if (matchDetails?.state === "Complete") return header.status || mini.status || "Match complete";
  if (recentBalls.includes("W")) return "Wicket pressure building";
  if (recentBalls.includes("6")) return "Big hit into the stands";
  if (recentBalls.includes("4")) return "Boundary keeps momentum alive";
  if (lastWicket && lastWicket !== "-") return "New batter under pressure";
  return header.status || mini.status || "Play in progress";
}

function classifyBall(ball) {
  const value = String(ball).trim().toUpperCase();

  if (value === "W") return "dot-w";
  if (value === "4") return "dot-4";
  if (value === "6") return "dot-6";
  if (value === "WD") return "dot-wd";
  if (value === "NB") return "dot-nb";
  if (["0", "1", "2", "3"].includes(value)) return `dot-${value}`;
  return "dot-0";
}

function getRecentBalls(mini) {
  const raw =
    mini?.recentOvsStats ||
    mini?.recentOvers ||
    mini?.thisOver ||
    "";

  if (Array.isArray(raw)) return raw.slice(-6).map(String);

  if (typeof raw === "string" && raw.trim()) {
    return raw
      .replace(/\|/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(-6);
  }

  return ["0", "1", "4", "0", "6", "W"];
}

function renderBalls(mini) {
  const track = document.getElementById("ballsTrack");
  if (!track) return;

  const balls = getRecentBalls(mini);
  track.innerHTML = "";

  balls.forEach((ball) => {
    const span = document.createElement("span");
    span.className = `ball ${classifyBall(ball)}`;
    span.textContent = ball;
    track.appendChild(span);
  });
}

async function fetchScore() {
  if (!cricbuzzMatchId) return;

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

function renderScore(api) {
  const live = api?.data?.live;
  const scorecard = api?.data?.scorecard;

  if (!live || !scorecard) return;

  const mini = live.miniscore || {};
  const header = live.matchHeader || {};
  const matchDetails = mini.matchScoreDetails || {};
  const scorecardHeader = scorecard.matchHeader || {};
  const matchCommentary = live.matchCommentary || {};

  if (!Object.keys(matchDetails).length || matchDetails.state === "Complete") {
    clearInterval(fetchScoreInterval);
  }

  const teamA = header.team1?.name || "-";
  const teamB = header.team2?.name || "-";
  const badgeA = header.team1?.shortName || "-";
  const badgeB = header.team2?.shortName || "-";

  const inningsList = matchDetails.inningsScoreList || [];

  let scoreA = "-";
  let scoreB = "-";
  let oversA = "-";
  let oversB = "-";

  if (inningsList.length) {
    const t1 = inningsList.find((i) => i.batTeamId === header.team1?.id);
    const t2 = inningsList.find((i) => i.batTeamId === header.team2?.id);

    if (t1) {
      scoreA = `${t1.score ?? 0}/${t1.wickets ?? 0}`;
      oversA = `${t1.overs ?? 0} OV`;
    }

    if (t2) {
      scoreB = `${t2.score ?? 0}/${t2.wickets ?? 0}`;
      oversB = `${t2.overs ?? 0} OV`;
    }
  }

  const striker = mini.batsmanStriker || {};
  const nonStriker = mini.batsmanNonStriker || {};
  const bowler1 = mini.bowlerStriker || {};
  const bowler2 = mini.bowlerNonStriker || {};

  const lastWicket = mini.lastWicket || "-";

  const partnershipRuns = mini?.partnerShip?.runs || 0;
  const partnershipBalls = mini?.partnerShip?.balls || 0;
  const partnership =
    mini?.partnerShip
      ? `Partnership ${partnershipRuns} (${partnershipBalls})`
      : "-";

  const reqRate = matchDetails.state === "Complete"
    ? "-"
    : (mini.requiredRunRate || "-");

  const crr = mini.currentRunRate || mini.runRate || "-";
  const target = mini.target;
  const battingHint = crr !== "-" ? `Current Run Rate ${crr}` : "-";
  const chaseHint = target
    ? `Target ${target}${reqRate !== "-" ? ` • RR ${reqRate}` : ""}`
    : "Awaiting chase";

  const tickerText = getTicker(mini, header, matchDetails);

  const matchCommentaryKeys = Object.keys(matchCommentary)
  const momentText = matchCommentaryKeys?.length ? matchCommentary[matchCommentaryKeys[matchCommentaryKeys.length - 1]].commText : ""

  if (!scorecard?.isMatchComplete) {
    document.getElementById("liveRibbon").style.display = "none"
  }

  updateScoreboard({
    teamA,
    teamB,
    badgeA,
    badgeB,
    scoreA,
    oversA,
    scoreB,
    oversB,
    batA: battingHint,
    batB: chaseHint,
    matchTitle: header.seriesName || "-",
    matchDescription: header.matchDescription || "-",
    matchSub:
      matchDetails.state === "Complete"
        ? (header.status || "-")
        : (mini.status || header.status || "-"),
    venue:
      `${scorecardHeader.venue?.name || ""}${
        scorecardHeader.venue?.city ? `, ${scorecardHeader.venue.city}` : ""
      }`.trim() || "-",
    lastWicket,
    nextBatsman: "-",
    reqRate,
    bat1Name: striker.name || "-",
    bat1Stat: `${striker.runs || 0} (${striker.balls || 0}) • SR ${striker.strikeRate || 0}`,
    bat2Name: nonStriker.name || "-",
    bat2Stat: `${nonStriker.runs || 0} (${nonStriker.balls || 0}) • SR ${nonStriker.strikeRate || 0}`,
    batNote: partnership,
    batNote2: partnership,
    bowl1Name: bowler1.name || "-",
    bowl1Stat: `${bowler1.wickets || 0}-${bowler1.runs || 0} (${bowler1.overs || 0}) • ECO ${bowler1.economy || 0}`,
    bowl2Name: bowler2.name || "-",
    bowl2Stat: `${bowler2.wickets || 0}-${bowler2.runs || 0} (${bowler2.overs || 0}) • ECO ${bowler2.economy || 0}`,
    bowlNote:
      matchDetails.state === "Complete"
        ? "Match Complete"
        : "Attacking spell in progress",
    inn1: matchDetails.inningsId === 2 ? "2nd" : "1st",
    fmt: matchDetails.matchFormat || "-",
    status: matchDetails.state || "-",
    overInfo: mini?.overNum ? `${mini.overNum}` : (oversA || "-"),
    ticker: tickerText,
    momentText
  });

  setInitial("badgeA", badgeA, "A");
  setInitial("badgeB", badgeB, "B");
  setInitial("bat1Img", striker.name, "S");
  setInitial("bat2Img", nonStriker.name, "N");
  setInitial("bowl1Img", bowler1.name, "B");
  setInitial("bowl2Img", bowler2.name, "B");

  renderBalls(mini);

  setMeter("partnershipFill", partnershipRuns, 100);
  setMeter("bowlingFill", Number(bowler1.economy || 0) * 10, 120);
}