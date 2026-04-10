const API_BASE_URL = "https://6vqt42ml-7001.inc1.devtunnels.ms/api";
const params = new URLSearchParams(window.location.search);
const cricbuzzMatchId = params.get("matchId");

if (!cricbuzzMatchId) {
  console.warn("No matchId provided in URL");
}

const $ = (id) => document.getElementById(id);

function safe(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function initials(text) {
  if (!text) return "-";
  const words = text.trim().split(/\s+/);
  return words.length === 1
    ? words[0].slice(0, 3).toUpperCase()
    : (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function sortObjectEntries(obj = {}, prefix = "") {
  return Object.entries(obj)
    .filter(([key]) => key.startsWith(prefix) || !prefix)
    .sort((a, b) => {
      const aNum = parseInt(a[0].split("_")[1] || "0", 10);
      const bNum = parseInt(b[0].split("_")[1] || "0", 10);
      return aNum - bNum;
    })
    .map(([, value]) => value);
}

function formatTotal(scoreDetails) {
  if (!scoreDetails) return "-";
  return `${safe(scoreDetails.runs, 0)}/${safe(scoreDetails.wickets, 0)} (${safe(scoreDetails.overs, 0)} ov)`;
}

function formatExtras(extras = {}) {
  return `${safe(extras.total, 0)} (b ${safe(extras.byes, 0)}, lb ${safe(extras.legByes, 0)}, w ${safe(extras.wides, 0)}, nb ${safe(extras.noBalls, 0)})`;
}

function buildBattingRows(batsmenData = {}) {
  const batters = sortObjectEntries(batsmenData, "bat_");

  return batters.map((batter) => {
    const didBat = Number(batter.balls || 0) > 0 || (batter.outDesc && batter.outDesc.trim());
    const status = didBat ? safe(batter.outDesc, "not out") : "did not bat";

    return `
      <tr>
        <td class="name-cell">
          <div class="player-name">${safe(batter.batName)}</div>
          <div class="player-sub">${status}</div>
        </td>
        <td>${safe(batter.runs, 0)}</td>
        <td>${safe(batter.balls, 0)}</td>
        <td>${safe(batter.fours, 0)}</td>
        <td>${safe(batter.sixes, 0)}</td>
        <td>${safe(batter.strikeRate, 0)}</td>
      </tr>
    `;
  }).join("");
}

function buildBowlingRows(bowlersData = {}) {
  const bowlers = sortObjectEntries(bowlersData, "bowl_");

  return bowlers.map((bowler) => `
    <tr>
      <td class="name-cell">
        <div class="player-name">${safe(bowler.bowlName)}</div>
      </td>
      <td>${safe(bowler.overs, 0)}</td>
      <td>${safe(bowler.maidens, 0)}</td>
      <td>${safe(bowler.runs, 0)}</td>
      <td class="stat-strong">${safe(bowler.wickets, 0)}</td>
      <td>${safe(bowler.economy, 0)}</td>
    </tr>
  `).join("");
}

function buildWickets(wicketsData = {}) {
  const wickets = sortObjectEntries(wicketsData, "wkt_");

  if (!wickets.length) {
    return `<div class="list-card"><div class="list-title">No wickets</div></div>`;
  }

  return wickets.map((w) => `
    <div class="list-card">
      <div class="list-title">${safe(w.wktNbr)}. ${safe(w.batName)}</div>
      <div class="list-sub">${safe(w.wktRuns)}/${safe(w.wktNbr)} at ${safe(w.wktOver)} ov</div>
    </div>
  `).join("");
}

function buildPartnerships(partnershipsData = {}) {
  const parts = sortObjectEntries(partnershipsData, "pat_");

  if (!parts.length) {
    return `
      <div class="partnership-card">
        <div class="partnership-title">No partnership data</div>
      </div>
    `;
  }

  return parts.map((p) => `
    <div class="partnership-card">
      <div class="partnership-title">${safe(p.bat1Name)} & ${safe(p.bat2Name)}</div>
      <div class="partnership-meta">
        ${safe(p.bat1Runs, 0)} (${safe(p.bat1balls, 0)}) + ${safe(p.bat2Runs, 0)} (${safe(p.bat2balls, 0)})
      </div>
      <div class="partnership-total">
        ${safe(p.totalRuns, 0)} runs in ${safe(p.totalBalls, 0)} balls
      </div>
    </div>
  `).join("");
}

function topPerformerText(innings, type) {
  if (type === "bat") {
    const batters = sortObjectEntries(innings?.batTeamDetails?.batsmenData, "bat_");
    const top = [...batters].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
    return top ? `${top.batName} ${top.runs} (${top.balls})` : "-";
  }

  const bowlers = sortObjectEntries(innings?.bowlTeamDetails?.bowlersData, "bowl_");
  const top = [...bowlers].sort((a, b) => {
    if ((b.wickets || 0) !== (a.wickets || 0)) return (b.wickets || 0) - (a.wickets || 0);
    return (a.economy || 999) - (b.economy || 999);
  })[0];

  return top ? `${top.bowlName} ${top.wickets}/${top.runs}` : "-";
}

function renderOverview(scoreCards = []) {
  const grid = $("overviewGrid");
  if (!grid) return;

  grid.innerHTML = scoreCards.map((innings, idx) => `
    <div class="overview-box">
      <div class="label">Innings ${idx + 1}</div>
      <div class="value">${safe(innings?.batTeamDetails?.batTeamShortName)} ${formatTotal(innings?.scoreDetails)}</div>
      <div class="player-sub" style="margin-top:8px;">Top batter: ${topPerformerText(innings, "bat")}</div>
      <div class="player-sub">Top bowler: ${topPerformerText(innings, "bowl")}</div>
    </div>
  `).join("");
}

function renderInnings(scoreCards = []) {
  const container = $("inningsContainer");
  if (!container) return;

  container.innerHTML = scoreCards.map((innings, index) => {
    const batTeam = innings?.batTeamDetails || {};
    const bowlTeam = innings?.bowlTeamDetails || {};
    const score = innings?.scoreDetails || {};
    const extras = innings?.extrasData || {};

    return `
      <section class="innings-card">
        <div class="innings-head">
          <div class="innings-head-left">
            ${safe(batTeam.batTeamName)} Innings #${index + 1}
          </div>
          <div class="innings-tag">
            ${safe(batTeam.batTeamShortName)} ${formatTotal(score)}
          </div>
        </div>

        <div class="innings-summary">
          <div class="summary-pill"><strong>RR:</strong> ${safe(score.runRate, 0)}</div>
          <div class="summary-pill"><strong>Extras:</strong> ${formatExtras(extras)}</div>
          <div class="summary-pill"><strong>Powerplay:</strong> ${safe(innings?.ppData?.pp_1?.runsScored, 0)} in ${safe(innings?.ppData?.pp_1?.ppOversTo, 0)} overs</div>
          <div class="summary-pill"><strong>Bowling Team:</strong> ${safe(bowlTeam.bowlTeamName)}</div>
        </div>

        <div class="score-layout">
          <div class="main-grid">
            <div class="block">
              <div class="block-head">Batting</div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Batter</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildBattingRows(batTeam.batsmenData)}
                    <tr>
                      <td class="name-cell">
                        <div class="player-name">Extras</div>
                      </td>
                      <td colspan="5" class="stat-strong">${formatExtras(extras)}</td>
                    </tr>
                    <tr>
                      <td class="name-cell">
                        <div class="player-name">Total</div>
                      </td>
                      <td colspan="5" class="stat-strong">${formatTotal(score)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="block" style="margin-top:18px;">
              <div class="block-head">Bowling</div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bowler</th>
                      <th>O</th>
                      <th>M</th>
                      <th>R</th>
                      <th>W</th>
                      <th>ECO</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildBowlingRows(bowlTeam.bowlersData)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside class="side-grid">
            <div class="block">
              <div class="block-head">Fall of Wickets</div>
              <div class="partnership-grid">
                ${buildWickets(innings.wicketsData)}
              </div>
            </div>

            <div class="block">
              <div class="block-head">Partnerships</div>
              <div class="partnership-grid">
                ${buildPartnerships(innings.partnershipsData)}
              </div>
            </div>
          </aside>
        </div>
      </section>
    `;
  }).join("");
}

function setHero(matchHeader, scoreCards) {
  const team1 = matchHeader?.team1 || {};
  const team2 = matchHeader?.team2 || {};
  const inningsList = matchHeader?.matchTeamInfo || [];
  const firstScore = scoreCards?.find((i) => i?.batTeamDetails?.batTeamId === team1?.id);
  const secondScore = scoreCards?.find((i) => i?.batTeamDetails?.batTeamId === team2?.id);

  $("seriesName").textContent = safe(matchHeader?.seriesName);
  // $("matchTitle").textContent = safe(matchHeader?.matchDescription, "Match Scorecard");
  $("matchStatus").textContent = safe(matchHeader?.status);

  $("team1Name").textContent = safe(team1?.name);
  $("team2Name").textContent = safe(team2?.name);
  $("team1Short").textContent = safe(team1?.shortName, initials(team1?.name));
  $("team2Short").textContent = safe(team2?.shortName, initials(team2?.name));
  $("team1Score").textContent = formatTotal(firstScore?.scoreDetails);
  $("team2Score").textContent = formatTotal(secondScore?.scoreDetails);

  const toss = matchHeader?.tossResults
    ? `${matchHeader.tossResults.tossWinnerName} chose ${matchHeader.tossResults.decision}`
    : "-";

  const pom = matchHeader?.playersOfTheMatch?.[0]?.name || "-";

  $("tossText").textContent = toss;
  $("formatText").textContent = safe(matchHeader?.matchFormat);
  $("descText").textContent = safe(matchHeader?.matchDescription);
  $("pomText").textContent = pom;
  $("resultText").textContent = safe(matchHeader?.status);
}

async function fetchScorecard() {
  try {
    const res = await fetch(`${API_BASE_URL}/match/${cricbuzzMatchId}`);
    const json = await res.json();
    renderScorecard(json.data || json);
  } catch (err) {
    console.error("Scorecard API error:", err);
  }
}

fetchScorecard();
let fetchScoreCardInterval = setInterval(fetchScorecard, 5000);

function renderScorecard(payload) {
  const scorecard = payload?.scorecard;
  const live = payload?.live;

  if (!scorecard || !live) return;

  const matchHeader = live?.matchHeader || {};
  const scoreCards = scorecard?.scoreCard || [];
  const mini = live.miniscore || {};
  const matchDetails = mini.matchScoreDetails || {};

  if (!Object.keys(matchDetails).length || matchDetails.state === "Complete") {
    clearInterval(fetchScoreCardInterval);
  }

  setHero(matchHeader, scoreCards);
  renderOverview(scoreCards);
  renderInnings(scoreCards);
}
