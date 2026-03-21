# NCAA March Madness Bracket Pool Tracker

## Project Overview

Build a lightweight, single-page web app (plain HTML/CSS/JS — no frameworks) that tracks a 4-player NCAA Men's Basketball Tournament pool. Each player drew ~14 tournament teams out of a hat. The app visually tracks which teams are still alive, which have been eliminated, and shows live scores for in-progress games. The player whose last-standing team wins the tournament wins the pool.

---

## Player Rosters

Hardcode these rosters in a `config.js` file so they're easy to edit.

### Eric/George (Color: `#2563EB` — Blue)
| Seed | Team |
|------|------|
| #1 | Arizona Wildcats |
| #8 | Clemson Tigers |
| #8 | Georgia Bulldogs |
| #3 | Gonzaga Bulldogs |
| #15 | Idaho Vandals |
| #3 | Illinois Fighting Illini |
| #9 | Iowa Hawkeyes |
| #16 | LIU Sharks |
| #11 | Miami (OH) RedHawks |
| #7 | Miami (FL) Hurricanes |
| #4 | Nebraska Cornhuskers |
| #15 | Queens University Royals |
| #6 | Tennessee Volunteers |
| #14 | Wright State Raiders |

### Madeline/Ellis (Color: `#DC2626` — Red)
| Seed | Team |
|------|------|
| #12 | Akron Zips |
| #1 | Florida Gators |
| #15 | Furman Paladins |
| #2 | Houston Cougars |
| #16 | Howard Bison |
| #10 | Missouri Tigers |
| #14 | Penn Quakers |
| #7 | Saint Mary's Gaels |
| #10 | Santa Clara Broncos |
| #9 | TCU Horned Frogs |
| #15 | Tennessee State Tigers |
| #5 | Texas Tech Red Raiders |
| #5 | Vanderbilt Commodores |
| #8 | Villanova Wildcats |

### Nadine (Color: `#16A34A` — Green)
| Seed | Team |
|------|------|
| #4 | Arkansas Razorbacks |
| #6 | BYU Cougars |
| #1 | Duke Blue Devils |
| #12 | High Point Panthers |
| #13 | Hofstra Pride |
| #7 | Kentucky Wildcats |
| #6 | Louisville Cardinals |
| #3 | Michigan State Spartans |
| #5 | St. John's Red Storm |
| #11 | Texas Longhorns |
| #2 | UConn Huskies |
| #9 | Utah State Aggies |
| #11 | VCU Rams |

### Tony (Color: `#F59E0B` — Amber)
| Seed | Team |
|------|------|
| #4 | Alabama Crimson Tide |
| #13 | California Baptist Lancers |
| #2 | Iowa State Cyclones |
| #4 | Kansas Jayhawks |
| #14 | Kennesaw State Owls |
| #1 | Michigan Wolverines |
| #12 | Northern Iowa Panthers |
| #16 | Prairie View A&M Panthers |
| #2 | Purdue Boilermakers |
| #14 | Saint Louis Billikens |
| #10 | Texas A&M Aggies |
| #10 | UCF Knights |
| #7 | UCLA Bruins |
| #3 | Virginia Cavaliers |

---

## Architecture

```
project/
├── index.html          # Single page app shell
├── style.css           # All styles
├── config.js           # Player rosters, team color mappings, ESPN endpoints
├── app.js              # Main app logic, rendering, state management
├── espn.js             # ESPN API integration (fetch scores, game status)
└── README.md           # Setup instructions
```

No build tools. No bundler. Just open `index.html` in a browser. Use ES modules (`<script type="module">`) for clean code organization.

---

## Data Source: ESPN API

ESPN has unofficial public JSON endpoints that don't require API keys. Use these:

### Scoreboard Endpoint
```
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard
```

Query params:
- `dates=YYYYMMDD` — filter to a specific date
- `groups=100` — NCAA Tournament games only (group 100 = March Madness)
- `limit=100` — return more results

### Example Fetch
```js
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${today}&groups=100&limit=100`;
const data = await fetch(url).then(r => r.json());
```

### Response Shape (key fields)
Each game in `data.events[]`:
```js
{
  id: "401234567",
  status: {
    type: {
      name: "STATUS_IN_PROGRESS" | "STATUS_FINAL" | "STATUS_SCHEDULED",
      completed: true/false
    },
    displayClock: "12:34",
    period: 2
  },
  competitions: [{
    competitors: [
      {
        team: {
          displayName: "Duke Blue Devils",
          abbreviation: "DUKE",
          logo: "https://a.espncdn.com/..."   // team logo URL
        },
        score: "72",
        winner: true/false,
        homeAway: "home" | "away"
      }
    ]
  }]
}
```

### Key Implementation Notes
- **Team matching**: Match ESPN's `team.displayName` against the roster names in config. Also consider matching on `team.abbreviation` or `team.shortDisplayName` as fallbacks. Build a lookup map at startup.
- **Polling**: For live games, poll every 30 seconds. For days with no live games, poll every 5 minutes. Show a "Last updated" timestamp.
- **CORS**: ESPN's API generally allows browser fetches. If CORS issues arise, add a note in the UI suggesting the user run with a local server or use a CORS proxy.
- **Tournament round detection**: The ESPN response includes `notes[]` on each event with round info (e.g., "First Round", "Sweet 16"). Use this to show the current tournament phase.

---

## UI Design

### Layout

The app should be a single responsive page with these sections:

#### 1. Header
- Title: "March Madness Pool Tracker 2026"
- Subtitle showing current tournament round (e.g., "First Round — Day 2")
- Last updated timestamp with a manual refresh button

#### 2. Scoreboard Strip (top, horizontal scroll on mobile)
- Show all of **today's games** as compact score cards
- Each card shows:
  - Team abbreviation + seed (e.g., "#1 DUKE")
  - Score (or tip-off time if not started)
  - Game status: LIVE (pulsing red dot), FINAL, or scheduled time
  - **Color-code each team name** with their player's color so you can instantly see whose teams are playing
- Live games should have a subtle pulsing border or glow in the team owner's color
- Completed games show final score with the winner bolded

#### 3. Player Dashboard (main content — 4 columns on desktop, stacked on mobile)
Each player gets a card/column:
- **Player name** as header with their color as background
- **Score summary**: "X teams alive / Y total" 
- **Teams list**, divided into two groups:
  - **Still Alive** — shown prominently with the team name, seed, and the team's ESPN logo (small, ~24px). If the team is playing RIGHT NOW, show their live score with a pulsing indicator
  - **Eliminated** — shown below in a muted/grayed-out style with strikethrough text. Show the round they were eliminated in and their final game score (e.g., "Lost R1: 58-72 vs Duke")
- Sort alive teams by seed (best seed first)
- Sort eliminated teams by most recently eliminated first

#### 4. Elimination Timeline (bottom section)
- A simple reverse-chronological feed: "❌ Wright State (Eric/George) eliminated — Lost 73-82 vs Virginia — First Round"
- Color-coded by player
- Helps everyone quickly see what happened recently

### Visual Style
- Clean, modern, sports-broadcast feel
- Dark mode default (dark gray background `#111827`, cards in `#1F2937`)
- Player colors used consistently: card headers, team name text for alive teams, timeline dots
- Use ESPN team logos where available (the API returns logo URLs)
- Responsive: 4-column grid on desktop, 2-column on tablet, single column stacked on mobile
- Smooth CSS transitions when teams move from alive to eliminated

### Color Assignments
```js
const PLAYERS = {
  "Eric/George": { color: "#2563EB", colorLight: "#3B82F6" },
  "Madeline/Ellis": { color: "#DC2626", colorLight: "#EF4444" },
  "Nadine": { color: "#16A34A", colorLight: "#22C55E" },
  "Tony": { color: "#F59E0B", colorLight: "#FBBF24" }
};
```

---

## State Management

Keep it simple — all state in a single JS object:

```js
const state = {
  players: { /* from config */ },
  games: [],           // All tournament games from ESPN
  lastUpdated: null,
  currentRound: "",
  teamStatus: {
    // Built dynamically from game results
    // "Duke Blue Devils": { alive: true, eliminatedIn: null, finalScore: null }
    // "Wright State Raiders": { alive: false, eliminatedIn: "First Round", finalScore: "73-82 vs Virginia" }
  }
};
```

### Team Status Logic
1. Start all teams as `alive: true`
2. After each ESPN fetch, loop through completed games
3. For each completed game, find the loser → mark as `alive: false`, record the round and score
4. Re-render the UI

---

## Stretch Goals (nice-to-have, implement if time allows)

1. **LocalStorage persistence** — Cache the last known state so the app loads instantly, then refreshes in the background
2. **Bracket visualization** — Show an actual bracket diagram with teams color-coded by player (complex but impressive)
3. **Win probability** — For live games, show ESPN's win probability if available in the API response (`competitions[0].situation.lastPlay.probability`)
4. **Push-style updates** — Use the browser Notification API to alert when one of "your" teams is eliminated
5. **Sound effects** — Optional buzzer sound when a team is eliminated (toggle-able)
6. **Historical results** — After the tournament, keep a record of all game results so the page works as a historical view

---

## Development Steps

Build in this order:

### Phase 1: Static Shell
1. Create `index.html` with the full layout structure
2. Create `style.css` with dark theme, responsive grid, and all component styles
3. Create `config.js` with hardcoded player rosters
4. Render the player cards with all teams showing as "alive" — verify layout looks good

### Phase 2: ESPN Integration
5. Create `espn.js` with the fetch logic
6. Wire up the scoreboard endpoint — fetch today's games and render the score strip
7. Implement team name matching (ESPN names → config names)
8. Set up polling (30s for live games, 5min otherwise)

### Phase 3: Live State
9. Implement the team status logic — process completed games to mark eliminations
10. Update player cards to split alive vs. eliminated teams
11. Build the elimination timeline feed
12. Add the "last updated" display and manual refresh

### Phase 4: Polish
13. Add ESPN team logos to team names
14. Add the pulsing live indicator for in-progress games
15. Add CSS transitions for elimination state changes
16. Test responsive layout on mobile
17. Implement localStorage caching (stretch goal)

---

## Testing Notes

- The tournament is **currently underway** (as of March 20, 2026). First round games are being played today and tomorrow.
- Test with the live ESPN endpoint to verify real data flows through correctly.
- To test elimination logic, several teams have already been eliminated in first-round games played today. The app should correctly pick up those results on first load.
- Test the team name matching carefully — ESPN sometimes uses slightly different names (e.g., "Miami Hurricanes" vs "Miami (FL) Hurricanes"). Build the matching to be fuzzy or maintain an alias map in config.

---

## Important Constraints

- **No API keys required** — ESPN's public endpoints are free
- **No server needed** — Everything runs client-side in the browser
- **No build step** — Plain HTML/CSS/JS with ES modules
- **No dependencies** — Zero npm packages, just vanilla web APIs
- **Must work on mobile** — Responsive design is critical since people will check this on their phones during games
