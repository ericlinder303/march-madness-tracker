// Bracket Visualization Module
import { PLAYERS } from './config.js';

// Build team to player lookup
const teamOwnerMap = new Map();
for (const [playerName, playerData] of Object.entries(PLAYERS)) {
  for (const team of playerData.teams) {
    teamOwnerMap.set(team.name.toLowerCase(), {
      player: playerName,
      color: playerData.color,
      seed: team.seed
    });
  }
}

/**
 * Find owner info for a team
 */
function getTeamOwner(teamName) {
  if (!teamName) return null;
  const lower = teamName.toLowerCase();

  if (teamOwnerMap.has(lower)) {
    return teamOwnerMap.get(lower);
  }

  for (const [key, value] of teamOwnerMap.entries()) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }

  return null;
}

/**
 * Parse region and round from game notes
 */
function parseGameInfo(game) {
  const round = game.round || '';
  let roundNum = 0;
  let region = 'Unknown';

  // Extract region
  if (round.includes('South')) region = 'South';
  else if (round.includes('East')) region = 'East';
  else if (round.includes('West')) region = 'West';
  else if (round.includes('Midwest')) region = 'Midwest';
  else if (round.includes('Final Four')) region = 'Final Four';

  // Extract round
  if (round.includes('1st Round') || round.includes('First Round')) roundNum = 1;
  else if (round.includes('2nd Round') || round.includes('Second Round')) roundNum = 2;
  else if (round.includes('Sweet 16') || round.includes('Sweet Sixteen')) roundNum = 3;
  else if (round.includes('Elite Eight') || round.includes('Elite 8')) roundNum = 4;
  else if (round.includes('Final Four')) roundNum = 5;
  else if (round.includes('Championship') && !round.includes('Region')) roundNum = 6;

  return { roundNum, region, roundName: round };
}

/**
 * Organize games by region and round
 */
function organizeGames(allGames) {
  const regions = {
    'South': { 1: [], 2: [], 3: [], 4: [] },
    'East': { 1: [], 2: [], 3: [], 4: [] },
    'West': { 1: [], 2: [], 3: [], 4: [] },
    'Midwest': { 1: [], 2: [], 3: [], 4: [] }
  };
  const finalFour = { 5: [], 6: [] };

  for (const game of allGames) {
    const { roundNum, region } = parseGameInfo(game);

    if (roundNum === 5 || roundNum === 6) {
      if (!finalFour[roundNum]) finalFour[roundNum] = [];
      finalFour[roundNum].push(game);
    } else if (roundNum >= 1 && roundNum <= 4 && regions[region]) {
      regions[region][roundNum].push(game);
    }
  }

  return { regions, finalFour };
}

/**
 * Render the full bracket visualization
 */
export function renderBracket(allGames, eliminations) {
  const { regions, finalFour } = organizeGames(allGames);
  const eliminatedTeams = new Set(eliminations.map(e => e.team.toLowerCase()));

  let html = '<div class="bracket-wrapper">';

  // Left side: South and East regions
  html += '<div class="bracket-side bracket-left">';
  html += renderRegion('South', regions['South'], eliminatedTeams, 'left');
  html += renderRegion('East', regions['East'], eliminatedTeams, 'left');
  html += '</div>';

  // Center: Final Four and Championship
  html += '<div class="bracket-center">';
  html += renderFinalFour(finalFour, eliminatedTeams);
  html += '</div>';

  // Right side: West and Midwest regions
  html += '<div class="bracket-side bracket-right">';
  html += renderRegion('West', regions['West'], eliminatedTeams, 'right');
  html += renderRegion('Midwest', regions['Midwest'], eliminatedTeams, 'right');
  html += '</div>';

  html += '</div>';

  // Legend
  html += renderBracketLegend();

  return html;
}

/**
 * Render a single region
 */
function renderRegion(regionName, rounds, eliminatedTeams, side) {
  const roundNames = ['', 'Round 1', 'Round 2', 'Sweet 16', 'Elite 8'];
  // Left side: R1 on left, advancing right toward center
  // Right side: R1 on right, advancing left toward center (CSS handles the flip)
  const roundOrder = [1, 2, 3, 4];

  let html = `<div class="bracket-region" data-region="${regionName}">`;
  html += `<div class="region-header">${regionName}</div>`;
  html += '<div class="region-rounds">';

  for (const r of roundOrder) {
    const games = rounds[r] || [];
    html += `<div class="bracket-round" data-round="${r}">`;
    html += `<div class="round-label">${roundNames[r]}</div>`;
    html += '<div class="round-matchups">';

    if (games.length > 0) {
      for (const game of games) {
        html += renderMatchup(game, eliminatedTeams);
      }
    } else {
      // Show placeholder matchups
      const expectedGames = r === 1 ? 8 : r === 2 ? 4 : r === 3 ? 2 : 1;
      for (let i = 0; i < expectedGames; i++) {
        html += renderEmptyMatchup();
      }
    }

    html += '</div></div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Render Final Four section
 */
function renderFinalFour(finalFour, eliminatedTeams) {
  let html = '<div class="final-four-section">';
  html += '<div class="ff-label">Final Four</div>';

  // Final Four games
  html += '<div class="ff-games">';
  if (finalFour[5] && finalFour[5].length > 0) {
    for (const game of finalFour[5]) {
      html += renderMatchup(game, eliminatedTeams);
    }
  } else {
    html += renderEmptyMatchup();
    html += renderEmptyMatchup();
  }
  html += '</div>';

  // Championship
  html += '<div class="championship-section">';
  html += '<div class="ff-label">Championship</div>';
  if (finalFour[6] && finalFour[6].length > 0) {
    for (const game of finalFour[6]) {
      html += renderMatchup(game, eliminatedTeams);
    }
  } else {
    html += renderEmptyMatchup();
  }
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * Render a matchup (game)
 */
function renderMatchup(game, eliminatedTeams) {
  const team1 = game.awayTeam || {};
  const team2 = game.homeTeam || {};

  const statusClass = game.isLive ? 'live' : game.isFinal ? 'final' : 'scheduled';

  let html = `<div class="matchup ${statusClass}">`;
  html += renderMatchupTeam(team1, game.isFinal, eliminatedTeams, game.isLive);
  html += renderMatchupTeam(team2, game.isFinal, eliminatedTeams, game.isLive);
  if (game.isLive) {
    html += '<div class="matchup-live">LIVE</div>';
  }
  html += '</div>';

  return html;
}

/**
 * Render empty matchup placeholder
 */
function renderEmptyMatchup() {
  return `
    <div class="matchup empty">
      <div class="matchup-team tbd"><span class="seed">-</span><span class="name">TBD</span></div>
      <div class="matchup-team tbd"><span class="seed">-</span><span class="name">TBD</span></div>
    </div>
  `;
}

/**
 * Render a team in a matchup
 */
function renderMatchupTeam(team, isFinal, eliminatedTeams, isLive) {
  if (!team || !team.name) {
    return `<div class="matchup-team tbd"><span class="seed">-</span><span class="name">TBD</span></div>`;
  }

  const owner = getTeamOwner(team.name);
  const isEliminated = eliminatedTeams.has((team.ownerTeamName || team.name || '').toLowerCase());
  const isWinner = isFinal && team.isWinner;

  const colorStyle = owner ? `border-left-color: ${owner.color};` : '';
  const nameStyle = owner ? `color: ${owner.color};` : '';
  const classes = [
    'matchup-team',
    isWinner ? 'winner' : '',
    isEliminated ? 'eliminated' : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" style="${colorStyle}">
      <span class="seed">${team.seed || '?'}</span>
      <span class="name" style="${nameStyle}">${team.abbreviation || team.name}</span>
      ${(isLive || isFinal) && team.score !== undefined ? `<span class="score">${team.score}</span>` : ''}
    </div>
  `;
}

/**
 * Render bracket legend
 */
function renderBracketLegend() {
  let html = '<div class="bracket-legend"><span class="legend-title">Players:</span>';

  for (const [playerName, playerData] of Object.entries(PLAYERS)) {
    html += `
      <span class="legend-item">
        <span class="legend-color" style="background-color: ${playerData.color}"></span>
        ${playerName}
      </span>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Get bracket stats
 */
export function getBracketStats(allGames) {
  const { regions, finalFour } = organizeGames(allGames);
  let totalGames = 0;
  let completedGames = 0;

  for (const region of Object.values(regions)) {
    for (const games of Object.values(region)) {
      totalGames += games.length;
      completedGames += games.filter(g => g.isFinal).length;
    }
  }

  return { totalGames, completedGames };
}
