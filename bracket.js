// Bracket Visualization Module
import { PLAYERS } from './config.js';

// Standard bracket matchups by seed (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
const FIRST_ROUND_MATCHUPS = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15]
];

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

  // Exact match
  if (teamOwnerMap.has(lower)) {
    return teamOwnerMap.get(lower);
  }

  // Partial match
  for (const [key, value] of teamOwnerMap.entries()) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }

  return null;
}

/**
 * Extract region and round info from game data
 */
function parseGameInfo(game) {
  const round = game.round || '';
  let roundNum = 0;

  // Check for various round name formats
  if (round.includes('1st Round') || round.includes('First Round') || round.includes('Round of 64')) {
    roundNum = 1;
  } else if (round.includes('2nd Round') || round.includes('Second Round') || round.includes('Round of 32')) {
    roundNum = 2;
  } else if (round.includes('Sweet 16') || round.includes('Sweet Sixteen')) {
    roundNum = 3;
  } else if (round.includes('Elite Eight') || round.includes('Elite 8')) {
    roundNum = 4;
  } else if (round.includes('Final Four')) {
    roundNum = 5;
  } else if (round.includes('Championship') || round.includes('National Championship')) {
    // Make sure it's the actual championship game, not just a game in the championship tournament
    if (!round.includes('1st') && !round.includes('2nd') && !round.includes('Region')) {
      roundNum = 6;
    }
  }

  return { roundNum, roundName: round };
}

/**
 * Organize games by round
 */
export function organizeGamesByRound(allGames) {
  const rounds = {
    1: [], // First Round
    2: [], // Second Round
    3: [], // Sweet 16
    4: [], // Elite 8
    5: [], // Final Four
    6: []  // Championship
  };

  for (const game of allGames) {
    const { roundNum } = parseGameInfo(game);
    if (roundNum > 0 && roundNum <= 6) {
      rounds[roundNum].push(game);
    }
  }

  return rounds;
}

/**
 * Render the bracket visualization
 */
export function renderBracket(allGames, eliminations) {
  const rounds = organizeGamesByRound(allGames);
  const eliminatedTeams = new Set(eliminations.map(e => e.team.toLowerCase()));

  const roundNames = {
    1: 'First Round',
    2: 'Second Round',
    3: 'Sweet 16',
    4: 'Elite 8',
    5: 'Final Four',
    6: 'Championship'
  };

  let html = '<div class="bracket-container">';

  // Render each round
  for (let r = 1; r <= 6; r++) {
    const games = rounds[r];
    const hasGames = games.length > 0;

    html += `
      <div class="bracket-round" data-round="${r}">
        <div class="round-header">${roundNames[r]}</div>
        <div class="round-games">
    `;

    if (hasGames) {
      for (const game of games) {
        html += renderBracketGame(game, eliminatedTeams);
      }
    } else {
      html += `<div class="round-pending">Upcoming</div>`;
    }

    html += '</div></div>';
  }

  html += '</div>';

  // Add legend
  html += renderBracketLegend();

  return html;
}

/**
 * Render a single game in the bracket
 */
function renderBracketGame(game, eliminatedTeams) {
  const team1 = game.awayTeam || {};
  const team2 = game.homeTeam || {};

  const owner1 = getTeamOwner(team1.name);
  const owner2 = getTeamOwner(team2.name);

  const isEliminated1 = eliminatedTeams.has((team1.ownerTeamName || team1.name || '').toLowerCase());
  const isEliminated2 = eliminatedTeams.has((team2.ownerTeamName || team2.name || '').toLowerCase());

  const statusClass = game.isLive ? 'live' : game.isFinal ? 'final' : 'scheduled';

  return `
    <div class="bracket-game ${statusClass}">
      ${renderBracketTeam(team1, owner1, game.isFinal && team1.isWinner, isEliminated1, game.isLive)}
      ${renderBracketTeam(team2, owner2, game.isFinal && team2.isWinner, isEliminated2, game.isLive)}
      ${game.isLive ? '<div class="bracket-live-indicator">LIVE</div>' : ''}
    </div>
  `;
}

/**
 * Render a team in a bracket game
 */
function renderBracketTeam(team, owner, isWinner, isEliminated, isLive) {
  if (!team || !team.name) {
    return `<div class="bracket-team tbd"><span class="team-seed">-</span><span class="team-name">TBD</span></div>`;
  }

  const colorStyle = owner ? `border-left: 3px solid ${owner.color};` : '';
  const nameStyle = owner ? `color: ${owner.color};` : '';
  const winnerClass = isWinner ? 'winner' : '';
  const eliminatedClass = isEliminated ? 'eliminated' : '';

  return `
    <div class="bracket-team ${winnerClass} ${eliminatedClass}" style="${colorStyle}">
      <span class="team-seed">#${team.seed || '?'}</span>
      <span class="team-name" style="${nameStyle}">${team.abbreviation || team.name}</span>
      <span class="team-score">${team.score !== undefined && (isLive || isWinner || isEliminated) ? team.score : ''}</span>
    </div>
  `;
}

/**
 * Render the bracket legend showing player colors
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
 * Get summary stats for the bracket
 */
export function getBracketStats(allGames) {
  const rounds = organizeGamesByRound(allGames);
  const stats = {
    totalGames: 0,
    completedGames: 0,
    liveGames: 0,
    currentRound: 'Not Started'
  };

  for (let r = 1; r <= 6; r++) {
    const games = rounds[r];
    stats.totalGames += games.length;
    stats.completedGames += games.filter(g => g.isFinal).length;
    stats.liveGames += games.filter(g => g.isLive).length;

    if (games.some(g => g.isLive || !g.isFinal)) {
      const roundNames = ['', 'First Round', 'Second Round', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];
      stats.currentRound = roundNames[r];
    }
  }

  return stats;
}
