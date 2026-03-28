// Player rosters and configuration
// Edit team assignments here if needed

export const PLAYERS = {
  "Eric/George": {
    color: "#2563EB",
    colorLight: "#3B82F6",
    teams: [
      { seed: 1, name: "Arizona Wildcats" },
      { seed: 8, name: "Clemson Tigers" },
      { seed: 8, name: "Georgia Bulldogs" },
      { seed: 3, name: "Gonzaga Bulldogs" },
      { seed: 15, name: "Idaho Vandals" },
      { seed: 3, name: "Illinois Fighting Illini" },
      { seed: 9, name: "Iowa Hawkeyes" },
      { seed: 16, name: "LIU Sharks" },
      { seed: 11, name: "Miami (OH) RedHawks" },
      { seed: 7, name: "Miami (FL) Hurricanes" },
      { seed: 4, name: "Nebraska Cornhuskers" },
      { seed: 15, name: "Queens University Royals" },
      { seed: 6, name: "Tennessee Volunteers" },
      { seed: 14, name: "Wright State Raiders" }
    ]
  },
  "Madeline/Ellis": {
    color: "#DC2626",
    colorLight: "#EF4444",
    teams: [
      { seed: 12, name: "Akron Zips" },
      { seed: 1, name: "Florida Gators" },
      { seed: 15, name: "Furman Paladins" },
      { seed: 2, name: "Houston Cougars" },
      { seed: 16, name: "Howard Bison" },
      { seed: 10, name: "Missouri Tigers" },
      { seed: 14, name: "Penn Quakers" },
      { seed: 7, name: "Saint Mary's Gaels" },
      { seed: 10, name: "Santa Clara Broncos" },
      { seed: 9, name: "TCU Horned Frogs" },
      { seed: 15, name: "Tennessee State Tigers" },
      { seed: 5, name: "Texas Tech Red Raiders" },
      { seed: 5, name: "Vanderbilt Commodores" },
      { seed: 8, name: "Villanova Wildcats" }
    ]
  },
  "Nadine": {
    color: "#16A34A",
    colorLight: "#22C55E",
    teams: [
      { seed: 4, name: "Arkansas Razorbacks" },
      { seed: 6, name: "BYU Cougars" },
      { seed: 1, name: "Duke Blue Devils" },
      { seed: 12, name: "High Point Panthers" },
      { seed: 13, name: "Hofstra Pride" },
      { seed: 7, name: "Kentucky Wildcats" },
      { seed: 6, name: "Louisville Cardinals" },
      { seed: 3, name: "Michigan State Spartans" },
      { seed: 5, name: "St. John's Red Storm" },
      { seed: 11, name: "Texas Longhorns" },
      { seed: 2, name: "UConn Huskies" },
      { seed: 9, name: "Utah State Aggies" },
      { seed: 11, name: "VCU Rams" }
    ]
  },
  "Tony": {
    color: "#F59E0B",
    colorLight: "#FBBF24",
    teams: [
      { seed: 4, name: "Alabama Crimson Tide" },
      { seed: 13, name: "California Baptist Lancers" },
      { seed: 2, name: "Iowa State Cyclones" },
      { seed: 4, name: "Kansas Jayhawks" },
      { seed: 14, name: "Kennesaw State Owls" },
      { seed: 1, name: "Michigan Wolverines" },
      { seed: 12, name: "Northern Iowa Panthers" },
      { seed: 16, name: "Prairie View A&M Panthers" },
      { seed: 2, name: "Purdue Boilermakers" },
      { seed: 14, name: "Saint Louis Billikens" },
      { seed: 10, name: "Texas A&M Aggies" },
      { seed: 10, name: "UCF Knights" },
      { seed: 7, name: "UCLA Bruins" },
      { seed: 3, name: "Virginia Cavaliers" }
    ]
  }
};

// Team name aliases for ESPN matching
// Maps ESPN names to our config names
export const TEAM_ALIASES = {
  // ESPN sometimes uses shorter names
  "Miami Hurricanes": "Miami (FL) Hurricanes",
  "Miami": "Miami (FL) Hurricanes",
  "Miami FL Hurricanes": "Miami (FL) Hurricanes",
  "Miami Ohio RedHawks": "Miami (OH) RedHawks",
  "Miami OH RedHawks": "Miami (OH) RedHawks",
  "Miami RedHawks": "Miami (OH) RedHawks",
  "UConn": "UConn Huskies",
  "Connecticut Huskies": "UConn Huskies",
  "St. John's": "St. John's Red Storm",
  "Saint John's Red Storm": "St. John's Red Storm",
  "LIU": "LIU Sharks",
  "Long Island Sharks": "LIU Sharks",
  "Long Island University Sharks": "LIU Sharks",
  "TCU": "TCU Horned Frogs",
  "Texas Christian Horned Frogs": "TCU Horned Frogs",
  "UCF": "UCF Knights",
  "Central Florida Knights": "UCF Knights",
  "BYU": "BYU Cougars",
  "Brigham Young Cougars": "BYU Cougars",
  "VCU": "VCU Rams",
  "Virginia Commonwealth Rams": "VCU Rams",
  "Queens Royals": "Queens University Royals",
  "Prairie View Panthers": "Prairie View A&M Panthers",
  "Prairie View": "Prairie View A&M Panthers",
  "Cal Baptist Lancers": "California Baptist Lancers",
  "CBU Lancers": "California Baptist Lancers",
  "Pennsylvania Quakers": "Penn Quakers"
};

// ESPN API configuration
export const ESPN_CONFIG = {
  baseUrl: "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball",
  scoreboardEndpoint: "/scoreboard",
  tournamentGroup: 100, // NCAA Tournament
  pollIntervalLive: 30000,    // 30 seconds when games are live
  pollIntervalIdle: 300000    // 5 minutes when no live games
};
