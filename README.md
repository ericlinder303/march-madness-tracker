# March Madness Pool Tracker 2026

A lightweight, single-page web app that tracks a 4-player NCAA Men's Basketball Tournament pool.

## Features

- **Live Scoreboard**: Today's tournament games with real-time scores
- **Player Dashboard**: Track each player's teams (alive vs eliminated)
- **Elimination Timeline**: Reverse-chronological feed of team eliminations
- **Auto-Refresh**: Polls ESPN every 30 seconds during live games, 5 minutes otherwise
- **Responsive Design**: Works on desktop, tablet, and mobile

## Players

| Player | Color | Teams |
|--------|-------|-------|
| Eric/George | Blue | 14 teams |
| Madeline/Ellis | Red | 14 teams |
| Nadine | Green | 13 teams |
| Tony | Amber | 14 teams |

## Setup

1. Open `index.html` in a web browser
2. That's it! No build tools, no server required

### Local Development

For the best experience during development, use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if you have npx)
npx serve .
```

Then open http://localhost:8000

## Hosting on GitHub Pages

1. Create a GitHub repository
2. Push all files to the `main` branch
3. Go to Settings > Pages
4. Select "Deploy from a branch" > `main` > `/ (root)`
5. Your tracker will be live at `https://yourusername.github.io/repo-name`

## File Structure

```
├── index.html   # Main HTML page
├── style.css    # All styles (dark theme, responsive)
├── config.js    # Player rosters and team colors
├── app.js       # Main application logic
├── espn.js      # ESPN API integration
└── README.md    # This file
```

## Editing Team Rosters

Edit `config.js` to change team assignments:

```js
"Eric/George": {
  color: "#2563EB",
  teams: [
    { seed: 1, name: "Arizona Wildcats" },
    // ... more teams
  ]
}
```

## Data Source

Uses ESPN's public scoreboard API (no API key required):
- `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard`

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
