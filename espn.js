// ESPN API Integration
import { ESPN_CONFIG, TEAM_ALIASES, PLAYERS } from './config.js';

// Build a lookup map of all team names to their player
const teamToPlayerMap = new Map();
for (const [playerName, playerData] of Object.entries(PLAYERS)) {
  for (const team of playerData.teams) {
    teamToPlayerMap.set(team.name.toLowerCase(), {
      player: playerName,
      team: team.name,
      seed: team.seed
    });
  }
}

// Add aliases to the map
for (const [alias, canonical] of Object.entries(TEAM_ALIASES)) {
  const existing = teamToPlayerMap.get(canonical.toLowerCase());
  if (existing) {
    teamToPlayerMap.set(alias.toLowerCase(), existing);
  }
}

/**
 * Normalize a team name for matching
 */
function normalizeTeamName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find which player owns a team (if any)
 */
export function findTeamOwner(espnTeamName) {
  // Try exact match first
  const lower = espnTeamName.toLowerCase();
  if (teamToPlayerMap.has(lower)) {
    return teamToPlayerMap.get(lower);
  }

  // Try normalized match
  const normalized = normalizeTeamName(espnTeamName);
  for (const [key, value] of teamToPlayerMap.entries()) {
    if (normalizeTeamName(key) === normalized) {
      return value;
    }
  }

  // Try partial match (team name contains or is contained by)
  for (const [key, value] of teamToPlayerMap.entries()) {
    const keyNorm = normalizeTeamName(key);
    if (keyNorm.includes(normalized) || normalized.includes(keyNorm)) {
      return value;
    }
  }

  // Try matching just the first word (school name)
  const firstWord = normalized.split(' ')[0];
  if (firstWord.length > 3) {
    for (const [key, value] of teamToPlayerMap.entries()) {
      if (normalizeTeamName(key).startsWith(firstWord)) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Fetch today's tournament games from ESPN
 */
/**
 * Get local date string in YYYYMMDD format
 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function fetchTodaysGames() {
  const today = getLocalDateString();
  const url = `${ESPN_CONFIG.baseUrl}${ESPN_CONFIG.scoreboardEndpoint}?dates=${today}&groups=${ESPN_CONFIG.tournamentGroup}&limit=100`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }
    const data = await response.json();
    return parseGamesResponse(data);
  } catch (error) {
    console.error('Failed to fetch games:', error);
    throw error;
  }
}

/**
 * Fetch all tournament games (for tracking eliminations across multiple days)
 */
export async function fetchAllTournamentGames() {
  // Fetch games from the past week to capture all tournament games
  const games = [];
  const today = new Date();

  // Fetch last 7 days of games
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = getLocalDateString(date);

    try {
      const url = `${ESPN_CONFIG.baseUrl}${ESPN_CONFIG.scoreboardEndpoint}?dates=${dateStr}&groups=${ESPN_CONFIG.tournamentGroup}&limit=100`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const dayGames = parseGamesResponse(data);
        games.push(...dayGames);
      }
    } catch (error) {
      console.warn(`Failed to fetch games for ${dateStr}:`, error);
    }
  }

  // Deduplicate games by ID
  const uniqueGames = new Map();
  for (const game of games) {
    uniqueGames.set(game.id, game);
  }

  return Array.from(uniqueGames.values());
}

/**
 * Parse ESPN API response into our game format
 */
function parseGamesResponse(data) {
  if (!data.events || !Array.isArray(data.events)) {
    return [];
  }

  return data.events.map(event => {
    const competition = event.competitions?.[0];
    if (!competition) return null;

    const competitors = competition.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home');
    const awayTeam = competitors.find(c => c.homeAway === 'away');

    const status = event.status?.type?.name || 'STATUS_SCHEDULED';
    const statusState = event.status?.type?.state || '';
    const isLive = status === 'STATUS_IN_PROGRESS' || status === 'STATUS_HALFTIME' || statusState === 'in';
    const isFinal = status === 'STATUS_FINAL' || statusState === 'post';
    const isScheduled = !isLive && !isFinal;

    // Get round info from notes
    const roundNote = event.competitions?.[0]?.notes?.find(n => n.type === 'event')?.headline || '';
    const round = roundNote || 'Tournament Game';

    // Get win probability for live games
    const situation = competition.situation || {};
    const probability = situation.lastPlay?.probability || null;

    return {
      id: event.id,
      status: status,
      isLive,
      isFinal,
      isScheduled,
      displayClock: event.status?.displayClock || '',
      period: event.status?.period || 0,
      round,
      startTime: event.date,
      homeTeam: homeTeam ? parseTeam(homeTeam) : null,
      awayTeam: awayTeam ? parseTeam(awayTeam) : null,
      probability: probability ? {
        home: probability.homeWinPercentage,
        away: probability.awayWinPercentage
      } : null
    };
  }).filter(Boolean);
}

/**
 * Parse a team from the ESPN response
 */
function parseTeam(competitor) {
  const team = competitor.team || {};
  const teamName = team.displayName || team.name || 'Unknown';
  const owner = findTeamOwner(teamName);

  // Log when we find a pool team
  if (owner) {
    console.log(`Team matched: ESPN "${teamName}" -> Config "${owner.team}" (${owner.player})`);
  }

  return {
    id: team.id,
    name: teamName,
    abbreviation: team.abbreviation || '',
    logo: team.logo || '',
    seed: competitor.curatedRank?.current || extractSeedFromName(teamName) || null,
    score: parseInt(competitor.score, 10) || 0,
    isWinner: competitor.winner === true,
    owner: owner ? owner.player : null,
    ownerTeamName: owner ? owner.team : null
  };
}

/**
 * Extract seed from team display if available
 */
function extractSeedFromName(name) {
  const match = name.match(/^#?(\d{1,2})\s/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get the current tournament round description
 */
export function getTournamentRound(games) {
  if (!games || games.length === 0) {
    return 'Tournament';
  }

  // Find the most recent/current round from games
  const rounds = games.map(g => g.round).filter(Boolean);
  const roundCounts = {};
  for (const round of rounds) {
    roundCounts[round] = (roundCounts[round] || 0) + 1;
  }

  // Return the most common round (current round)
  const sortedRounds = Object.entries(roundCounts).sort((a, b) => b[1] - a[1]);
  return sortedRounds[0]?.[0] || 'Tournament';
}

/**
 * Check if any games are currently live
 */
export function hasLiveGames(games) {
  return games.some(g => g.isLive);
}

/**
 * Extract short round name from ESPN's full round string
 */
function getShortRoundName(fullRound) {
  if (!fullRound) return 'Tournament';

  if (fullRound.includes('1st Round') || fullRound.includes('First Round')) return 'Round 1';
  if (fullRound.includes('2nd Round') || fullRound.includes('Second Round')) return 'Round 2';
  if (fullRound.includes('Sweet 16') || fullRound.includes('Sweet Sixteen')) return 'Sweet 16';
  if (fullRound.includes('Elite Eight') || fullRound.includes('Elite 8')) return 'Elite 8';
  if (fullRound.includes('Final Four')) return 'Final Four';
  if (fullRound.includes('Championship')) return 'Championship';

  return 'Tournament';
}

/**
 * Process games to determine team eliminations
 */
export function processEliminations(games) {
  const eliminations = [];

  for (const game of games) {
    if (!game.isFinal) continue;

    const loser = game.homeTeam?.isWinner === false ? game.homeTeam :
                  game.awayTeam?.isWinner === false ? game.awayTeam : null;
    const winner = game.homeTeam?.isWinner === true ? game.homeTeam :
                   game.awayTeam?.isWinner === true ? game.awayTeam : null;

    if (loser && loser.owner) {
      eliminations.push({
        team: loser.ownerTeamName || loser.name,
        player: loser.owner,
        round: getShortRoundName(game.round),
        score: `${loser.score}-${winner?.score || '?'}`,
        opponent: winner?.name || 'Unknown',
        gameId: game.id,
        date: game.startTime
      });
    }
  }

  // Sort by date, most recent first
  eliminations.sort((a, b) => new Date(b.date) - new Date(a.date));

  return eliminations;
}
