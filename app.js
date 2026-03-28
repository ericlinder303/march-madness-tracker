// Main Application Logic
import { PLAYERS, ESPN_CONFIG } from './config.js';
import {
  fetchTodaysGames,
  fetchAllTournamentGames,
  getTournamentRound,
  hasLiveGames,
  processEliminations,
  findTeamOwner
} from './espn.js';
import { renderBracket, getBracketStats } from './bracket.js';
import { initSound, toggleSound, isSoundEnabled, checkNewEliminations } from './sound.js';

// LocalStorage key
const STORAGE_KEY = 'march-madness-tracker-2026';

// Application State
const state = {
  players: PLAYERS,
  todaysGames: [],
  allGames: [],
  eliminations: [],
  teamStatus: {}, // { teamName: { alive: true/false, eliminatedIn, finalScore, opponent } }
  lastUpdated: null,
  currentRound: 'Loading...',
  isLoading: true,
  error: null,
  pollInterval: null,
  isOffline: false,
  bracketVisible: false
};

// DOM Elements
const elements = {
  tournamentRound: document.getElementById('tournament-round'),
  lastUpdated: document.getElementById('last-updated'),
  refreshBtn: document.getElementById('refresh-btn'),
  scoreboardGames: document.getElementById('scoreboard-games'),
  playerGrid: document.getElementById('player-grid'),
  timelineList: document.getElementById('timeline-list'),
  bracketToggle: document.getElementById('bracket-toggle'),
  bracketContent: document.getElementById('bracket-content'),
  soundToggle: document.getElementById('sound-toggle')
};

/**
 * Save state to localStorage
 */
function saveToCache() {
  try {
    const cacheData = {
      todaysGames: state.todaysGames,
      allGames: state.allGames,
      eliminations: state.eliminations,
      teamStatus: state.teamStatus,
      currentRound: state.currentRound,
      lastUpdated: state.lastUpdated?.toISOString(),
      cachedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    console.log('State saved to cache');
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Load state from localStorage
 */
function loadFromCache() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return false;

    const cacheData = JSON.parse(cached);

    state.todaysGames = cacheData.todaysGames || [];
    state.allGames = cacheData.allGames || [];
    state.eliminations = cacheData.eliminations || [];
    state.teamStatus = cacheData.teamStatus || {};
    state.currentRound = cacheData.currentRound || 'Tournament';
    state.lastUpdated = cacheData.lastUpdated ? new Date(cacheData.lastUpdated) : null;

    console.log('Loaded from cache, cached at:', cacheData.cachedAt);
    return true;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return false;
  }
}

/**
 * Toggle bracket visibility
 */
function toggleBracket() {
  state.bracketVisible = !state.bracketVisible;
  elements.bracketContent.classList.toggle('hidden', !state.bracketVisible);
  elements.bracketToggle.textContent = state.bracketVisible ? 'Hide Bracket' : 'Show Bracket';

  if (state.bracketVisible) {
    renderBracketView();
  }
}

/**
 * Handle sound toggle
 */
function handleSoundToggle() {
  const enabled = toggleSound();
  updateSoundButton(enabled);
}

/**
 * Update sound button appearance
 */
function updateSoundButton(enabled) {
  elements.soundToggle.classList.toggle('enabled', enabled);
  elements.soundToggle.textContent = enabled ? '🔊 Sound' : '🔇 Sound';
}

/**
 * Render the bracket visualization
 */
function renderBracketView() {
  if (!state.bracketVisible) return;

  const bracketHtml = renderBracket(state.allGames, state.eliminations);
  elements.bracketContent.innerHTML = bracketHtml;
}

/**
 * Initialize the application
 */
async function init() {
  console.log('Initializing March Madness Pool Tracker...');

  try {
    // Set up refresh button
    elements.refreshBtn.addEventListener('click', () => refreshData());

    // Set up bracket toggle
    elements.bracketToggle.addEventListener('click', toggleBracket);

    // Set up sound toggle
    const soundEnabled = initSound();
    updateSoundButton(soundEnabled);
    elements.soundToggle.addEventListener('click', handleSoundToggle);

    // Initialize team status (all alive by default)
    initializeTeamStatus();

    // Try to load cached data first for instant display
    const hasCachedData = loadFromCache();
    if (hasCachedData) {
      console.log('Rendering cached data...');
      renderAll();
    } else {
      // Render initial player cards
      renderPlayerCards();
    }

    // Fetch fresh data (will update cache)
    await refreshData();

    // Start polling
    startPolling();
  } catch (error) {
    console.error('Init error:', error);
    renderError();
  }
}

/**
 * Initialize all teams as alive
 */
function initializeTeamStatus() {
  for (const [playerName, playerData] of Object.entries(PLAYERS)) {
    for (const team of playerData.teams) {
      state.teamStatus[team.name] = {
        alive: true,
        eliminatedIn: null,
        finalScore: null,
        opponent: null,
        currentGame: null
      };
    }
  }
}

/**
 * Refresh all data from ESPN
 */
async function refreshData() {
  console.log('Refreshing data...');
  state.isLoading = true;
  state.error = null;
  state.isOffline = false;
  elements.refreshBtn.disabled = true;

  try {
    // Fetch today's games and all tournament games in parallel
    console.log('Fetching games from ESPN...');
    const [todaysGames, allGames] = await Promise.all([
      fetchTodaysGames(),
      fetchAllTournamentGames()
    ]);

    console.log('Today\'s games:', todaysGames.length);
    console.log('All games:', allGames.length);

    state.todaysGames = todaysGames;
    state.allGames = allGames;
    state.currentRound = getTournamentRound(todaysGames.length > 0 ? todaysGames : allGames);
    state.lastUpdated = new Date();

    // Process eliminations
    state.eliminations = processEliminations(allGames);

    // Check for new eliminations and play sound
    const newEliminations = checkNewEliminations(state.eliminations);
    if (newEliminations.length > 0) {
      console.log('New eliminations:', newEliminations.map(e => e.team));
    }

    updateTeamStatusFromEliminations();

    // Update live game info for teams
    updateLiveGameStatus();

    // Save to cache for offline use
    saveToCache();

    // Render everything
    console.log('Rendering...');
    renderAll();
    console.log('Done!');

  } catch (error) {
    console.error('Failed to refresh data:', error);
    state.error = error.message;
    state.isOffline = true;

    // If we have cached data, show it with offline indicator
    if (state.todaysGames.length > 0 || state.allGames.length > 0) {
      console.log('Using cached data (offline mode)');
      renderAll();
    } else {
      renderError();
    }
  } finally {
    state.isLoading = false;
    elements.refreshBtn.disabled = false;
  }
}

/**
 * Update team status based on eliminations
 */
function updateTeamStatusFromEliminations() {
  // Always reinitialize from config to ensure correct team names
  initializeTeamStatus();

  // Mark eliminated teams
  for (const elim of state.eliminations) {
    if (state.teamStatus[elim.team]) {
      state.teamStatus[elim.team].alive = false;
      state.teamStatus[elim.team].eliminatedIn = elim.round;
      state.teamStatus[elim.team].finalScore = elim.score;
      state.teamStatus[elim.team].opponent = elim.opponent;
    }
  }
}

/**
 * Update live game status for teams currently playing
 */
function updateLiveGameStatus() {
  // Clear all current game info
  for (const teamName of Object.keys(state.teamStatus)) {
    state.teamStatus[teamName].currentGame = null;
  }

  // Set current game info for teams in live games
  for (const game of state.todaysGames) {
    if (game.isLive) {
      if (game.homeTeam?.ownerTeamName && state.teamStatus[game.homeTeam.ownerTeamName]) {
        state.teamStatus[game.homeTeam.ownerTeamName].currentGame = {
          score: game.homeTeam.score,
          opponent: game.awayTeam?.name,
          opponentScore: game.awayTeam?.score,
          clock: game.displayClock,
          period: game.period,
          winProb: game.probability?.home || null
        };
      }
      if (game.awayTeam?.ownerTeamName && state.teamStatus[game.awayTeam.ownerTeamName]) {
        state.teamStatus[game.awayTeam.ownerTeamName].currentGame = {
          score: game.awayTeam.score,
          opponent: game.homeTeam?.name,
          opponentScore: game.homeTeam?.score,
          clock: game.displayClock,
          period: game.period,
          winProb: game.probability?.away || null
        };
      }
    }
  }
}

/**
 * Start polling for updates
 */
function startPolling() {
  // Clear existing interval
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
  }

  // Determine poll interval based on live games
  const interval = hasLiveGames(state.todaysGames)
    ? ESPN_CONFIG.pollIntervalLive
    : ESPN_CONFIG.pollIntervalIdle;

  console.log(`Polling every ${interval / 1000} seconds`);

  state.pollInterval = setInterval(() => {
    refreshData();
  }, interval);
}

/**
 * Render all UI components
 */
function renderAll() {
  renderHeader();
  renderScoreboard();
  renderPlayerCards();
  renderBracketView();
  renderTimeline();
}

/**
 * Render header with round and timestamp
 */
function renderHeader() {
  elements.tournamentRound.textContent = state.currentRound;

  if (state.lastUpdated) {
    const timeStr = state.lastUpdated.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
    const offlineIndicator = state.isOffline ? ' (offline)' : '';
    elements.lastUpdated.textContent = `Last updated: ${timeStr}${offlineIndicator}`;
  }
}

/**
 * Render the scoreboard strip with today's games
 */
function renderScoreboard() {
  if (state.todaysGames.length === 0) {
    elements.scoreboardGames.innerHTML = `
      <p class="no-games">No tournament games scheduled for today</p>
    `;
    return;
  }

  const gamesHtml = state.todaysGames.map(game => {
    const statusClass = game.isLive ? 'live' : game.isFinal ? 'final' : 'scheduled';
    const statusText = game.isLive
      ? `${game.displayClock} - ${game.period === 1 ? '1st' : '2nd'}`
      : game.isFinal
        ? 'FINAL'
        : formatTime(game.startTime);

    // Get win probabilities for live games
    const awayProb = game.isLive && game.probability ? game.probability.away : null;
    const homeProb = game.isLive && game.probability ? game.probability.home : null;

    return `
      <div class="game-card ${game.isLive ? 'live' : ''}">
        <div class="game-status">
          <span class="status-${statusClass}">
            ${game.isLive ? '<span class="status-live">LIVE</span>' : statusText}
          </span>
        </div>
        <div class="game-teams">
          ${renderGameTeam(game.awayTeam, game.isFinal, awayProb)}
          ${renderGameTeam(game.homeTeam, game.isFinal, homeProb)}
        </div>
        <div class="game-round">${game.round}</div>
      </div>
    `;
  }).join('');

  elements.scoreboardGames.innerHTML = gamesHtml;
}

/**
 * Render a team in a game card
 */
function renderGameTeam(team, isFinal, winProb = null) {
  if (!team) return '';

  const ownerColor = team.owner ? PLAYERS[team.owner]?.color : null;
  const teamStyle = ownerColor ? `color: ${ownerColor}` : '';
  const winnerClass = isFinal && team.isWinner ? 'team-winner' : '';
  const loserClass = isFinal && !team.isWinner ? 'team-loser' : '';

  // Format win probability
  let probHtml = '';
  if (winProb !== null && winProb !== undefined) {
    const probPct = Math.round(winProb * 100);
    const probClass = probPct >= 50 ? 'prob-favored' : 'prob-underdog';
    probHtml = `<span class="win-prob ${probClass}">${probPct}%</span>`;
  }

  return `
    <div class="game-team ${winnerClass} ${loserClass}">
      <div class="team-info">
        ${team.logo ? `<img src="${team.logo}" alt="" class="team-logo">` : ''}
        <span class="team-seed">#${team.seed || '?'}</span>
        <span class="team-name" style="${teamStyle}">${team.abbreviation || team.name}</span>
      </div>
      <div class="team-score-wrap">
        ${probHtml}
        <span class="team-score">${team.score !== undefined ? team.score : '-'}</span>
      </div>
    </div>
  `;
}

/**
 * Render player cards
 */
function renderPlayerCards() {
  const cardsHtml = Object.entries(PLAYERS).map(([playerName, playerData]) => {
    const teams = playerData.teams.map(team => ({
      ...team,
      status: state.teamStatus[team.name] || { alive: true }
    }));

    const aliveTeams = teams.filter(t => t.status.alive).sort((a, b) => a.seed - b.seed);
    const eliminatedTeams = teams.filter(t => !t.status.alive);
    const aliveCount = aliveTeams.length;
    const totalCount = teams.length;

    return `
      <div class="player-card">
        <div class="player-header" style="background-color: ${playerData.color}">
          <div class="player-name">${playerName}</div>
          <div class="player-stats">
            <span class="alive-count">${aliveCount} / ${totalCount} alive</span>
          </div>
        </div>
        <div class="teams-list">
          ${aliveTeams.length > 0 ? `
            <div class="teams-section-title">Still Alive</div>
            ${aliveTeams.map(team => renderTeamItem(team, playerData.color, true)).join('')}
          ` : ''}
          ${eliminatedTeams.length > 0 ? `
            <div class="teams-section-title eliminated-title">Eliminated</div>
            ${eliminatedTeams.map(team => renderTeamItem(team, playerData.color, false)).join('')}
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  elements.playerGrid.innerHTML = cardsHtml;
}

/**
 * Render a team item in a player card
 */
function renderTeamItem(team, playerColor, isAlive) {
  const status = team.status;
  const isPlaying = isAlive && status.currentGame;
  const playingClass = isPlaying ? 'playing' : '';
  const aliveClass = isAlive ? 'alive' : 'eliminated';

  let statusHtml = '';
  if (isPlaying) {
    const game = status.currentGame;
    const probHtml = game.winProb !== null ? (() => {
      const probPct = Math.round(game.winProb * 100);
      const probClass = probPct >= 50 ? 'prob-favored' : 'prob-underdog';
      return `<span class="win-prob ${probClass}">${probPct}%</span>`;
    })() : '';
    statusHtml = `
      <span class="live-score">
        ${probHtml}
        ${game.score} - ${game.opponentScore}
      </span>
    `;
  } else if (!isAlive && status.eliminatedIn) {
    // Round names are already clean from espn.js
    const shortRound = status.eliminatedIn
      .replace('Round 1', 'R1')
      .replace('Round 2', 'R2')
      .replace('Sweet 16', 'S16')
      .replace('Elite 8', 'E8')
      .replace('Final Four', 'F4')
      .replace('Championship', 'Final');
    statusHtml = `<span class="team-item-status">${shortRound}: ${status.finalScore}</span>`;
  }

  return `
    <div class="team-item ${aliveClass} ${playingClass}">
      <span class="team-item-seed">#${team.seed}</span>
      <span class="team-item-name" style="${isAlive ? `color: ${playerColor}` : ''}">${team.name}</span>
      ${statusHtml}
    </div>
  `;
}

/**
 * Render the elimination timeline
 */
function renderTimeline() {
  if (state.eliminations.length === 0) {
    elements.timelineList.innerHTML = `
      <p class="timeline-empty">No eliminations yet. Good luck everyone!</p>
    `;
    return;
  }

  const timelineHtml = state.eliminations.map(elim => {
    const playerColor = PLAYERS[elim.player]?.color || '#6B7280';

    return `
      <div class="timeline-item">
        <span class="timeline-icon">❌</span>
        <div class="timeline-content">
          <div class="timeline-team" style="color: ${playerColor}">
            ${elim.team} (${elim.player})
          </div>
          <div class="timeline-details">
            Lost ${elim.score} vs ${elim.opponent} — ${elim.round}
          </div>
        </div>
      </div>
    `;
  }).join('');

  elements.timelineList.innerHTML = timelineHtml;
}

/**
 * Render error state
 */
function renderError() {
  elements.scoreboardGames.innerHTML = `
    <div class="error-message">
      Failed to load games: ${state.error}
      <br><br>
      <button class="refresh-btn" onclick="location.reload()">Try Again</button>
    </div>
  `;
}

/**
 * Format a date string to time
 */
function formatTime(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
