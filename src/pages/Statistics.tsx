import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { statisticsAPI } from "../services/api";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Define server types
type ServerType = "anarxiya" | "survival" | "boxpvp";

// Define player stats from Plan plugin
interface PlayerStats {
  username: string;
  uuid: string;
  playtime: number; // in hours
  kills: number;
  deaths: number;
  mobsKilled: number;
  lastSeen: string;
  registered: string;
  country: string;
}

interface PlaytimeLeaderboardEntry {
  name: string;
  playtime: number;
}

interface KillsLeaderboardEntry {
  name: string;
  kills: number;
}

const Statistics = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerType>("anarxiya");
  const [topPlayers, setTopPlayers] = useState<{
    playtime: PlaytimeLeaderboardEntry[];
    kills: KillsLeaderboardEntry[];
  }>({
    playtime: [],
    kills: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ name: string; uuid: string }[]>([]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true);

        // Get server stats from the Plan plugin
        const response = await statisticsAPI[`get${selectedServer.charAt(0).toUpperCase() + selectedServer.slice(1)}ServerStats`]();
        const serverStats = response.data.data;

        if (serverStats && serverStats.topPlayers) {
          setTopPlayers({
            playtime: serverStats.topPlayers.byPlaytime || [],
            kills: serverStats.topPlayers.byKills || [],
          });
        } else {
          throw new Error("No leaderboard data available");
        }
      } catch (error) {
        console.error("Failed to fetch leaderboards:", error);
        setError("Failed to load leaderboard data. Please try again later.");

        // Fallback to mock data
        setTopPlayers({
          playtime: [
            { name: "Notch", playtime: 127.5 },
            { name: "Dinnerbone", playtime: 98.2 },
            { name: "Jeb_", playtime: 89.7 },
            { name: "Marc", playtime: 76.3 },
            { name: "Grum", playtime: 65.1 },
          ],
          kills: [
            { name: "Dinnerbone", kills: 1245 },
            { name: "Grum", kills: 987 },
            { name: "Marc", kills: 856 },
            { name: "Jeb_", kills: 743 },
            { name: "Notch", kills: 621 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [selectedServer]);

  useEffect(() => {
    if (selectedPlayer) {
      const fetchPlayerStats = async () => {
        try {
          setLoading(true);

          // Get player stats from the server
          const response = await statisticsAPI[`get${selectedServer.charAt(0).toUpperCase() + selectedServer.slice(1)}PlayerStats`](selectedPlayer);
          const playerData = response.data.data;

          if (playerData) {
            // Convert the data to our PlayerStats format
            const stats: PlayerStats = {
              username: selectedPlayer,
              uuid: playerData.uuid || "unknown",
              playtime: playerData.total.playtime / 3600, // Convert seconds to hours
              kills: playerData.total.kills || 0,
              deaths: playerData.total.deaths || 0,
              mobsKilled: playerData.total.mob_kills || 0,
              lastSeen: new Date(playerData.lastSeen * 1000).toLocaleString(),
              registered: new Date(playerData.registered * 1000).toLocaleString(),
              country: playerData.country || "Unknown",
            };

            setPlayerStats(stats);
          } else {
            throw new Error("No player data available");
          }
        } catch (error) {
          console.error("Failed to fetch player stats:", error);
          setError("Failed to load player statistics. Please try again later.");

          // Fallback to mock data
          setPlayerStats({
            username: selectedPlayer,
            uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5", // Example UUID
            playtime: 127.5,
            kills: 621,
            deaths: 198,
            mobsKilled: 4321,
            lastSeen: "2023-05-18 10:15",
            registered: "2022-01-10 08:30",
            country: "Unknown",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchPlayerStats();
    }
  }, [selectedPlayer, selectedServer]);

  useEffect(() => {
    const searchPlayers = async () => {
      if (searchQuery.length >= 2) {
        try {
          // TODO: Implement proper search API endpoint
          // For now, use mock data
          const mockSearchResults = [
            { name: "Notch", uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5" },
            { name: "Dinnerbone", uuid: "61699b2e-d327-4a01-9f1e-0ea8c3f06bc6" },
            { name: "Jeb_", uuid: "853c80ef-3c37-49fd-aa49-938b674adae6" },
            { name: "Marc", uuid: "7125ba93-cef2-4243-88a6-c130f5cd7a8d" },
            { name: "Grum", uuid: "c4d3a6f4-8bd9-4e5a-9d5e-69758e8c1e2c" },
          ].filter((player) => player.name.toLowerCase().includes(searchQuery.toLowerCase()));

          setSearchResults(mockSearchResults);
        } catch (error) {
          console.error("Failed to search players:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(searchPlayers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedServer]);

  const handlePlayerSelect = (name: string) => {
    setSelectedPlayer(name);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle server change
  const handleServerChange = (server: ServerType) => {
    setSelectedServer(server);
    setSelectedPlayer(null);
    setPlayerStats(null);
  };

  // Prepare data for player activity chart
  const playerActivityData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
    datasets: [
      {
        label: "Playtime (hours)",
        data: [2.5, 3.2, 1.8, 4.5, 2.7, 3.9, 2.1],
        borderColor: "#facc15",
        backgroundColor: "rgba(250, 204, 21, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Prepare data for player stats chart
  const playerStatsData = {
    labels: ["Kills", "Deaths", "Mobs Killed"],
    datasets: [
      {
        label: "Player Stats",
        data: playerStats ? [playerStats.kills, playerStats.deaths, playerStats.mobsKilled] : [0, 0, 0],
        backgroundColor: ["rgba(250, 204, 21, 0.8)", "rgba(239, 68, 68, 0.8)", "rgba(59, 130, 246, 0.8)"],
        borderColor: ["rgba(217, 119, 6, 1)", "rgba(185, 28, 28, 1)", "rgba(29, 78, 216, 1)"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Player Statistics</h1>

        {/* Server Selector */}
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${selectedServer === "anarxiya" ? "bg-primary text-black" : "bg-dark-200 text-gray-300 hover:bg-dark-100"}`}
            onClick={() => handleServerChange("anarxiya")}
          >
            Anarxiya
          </button>
          <button
            className={`px-4 py-2 rounded-md ${selectedServer === "survival" ? "bg-primary text-black" : "bg-dark-200 text-gray-300 hover:bg-dark-100"}`}
            onClick={() => handleServerChange("survival")}
          >
            Survival
          </button>
          <button
            className={`px-4 py-2 rounded-md ${selectedServer === "boxpvp" ? "bg-primary text-black" : "bg-dark-200 text-gray-300 hover:bg-dark-100"}`}
            onClick={() => handleServerChange("boxpvp")}
          >
            BoxPVP
          </button>
        </div>
      </div>

      {/* Player Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search player..."
            className="w-full md:w-64 px-4 py-2 rounded-md bg-dark-200 border border-dark-100 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>

          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-dark-200 rounded-md shadow-lg border border-dark-100">
              <ul className="max-h-60 overflow-auto">
                {searchResults.map((player) => (
                  <li key={player.uuid} className="px-4 py-2 hover:bg-dark-100 cursor-pointer flex items-center" onClick={() => handlePlayerSelect(player.name)}>
                    <img className="h-8 w-8 rounded-md mr-2" src={`https://mc-heads.net/avatar/${player.uuid}/32`} alt={player.name} />
                    <span className="text-white">{player.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Player Stats */}
      {selectedPlayer && playerStats ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Statistics for {playerStats.username}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Playtime</h3>
              <p className="text-3xl font-bold text-primary">{playerStats.playtime.toFixed(1)} hours</p>
            </div>

            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">K/D Ratio</h3>
              <p className="text-3xl font-bold text-primary">{(playerStats.kills / Math.max(1, playerStats.deaths)).toFixed(2)}</p>
            </div>

            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Mobs Killed</h3>
              <p className="text-3xl font-bold text-primary">{playerStats.mobsKilled.toLocaleString()}</p>
            </div>

            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Country</h3>
              <p className="text-3xl font-bold text-primary">{playerStats.country}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Weekly Activity</h3>
              <div className="h-64">
                <Line
                  data={playerActivityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(75, 85, 99, 0.2)",
                        },
                        ticks: {
                          color: "#d1d5db",
                        },
                      },
                      x: {
                        grid: {
                          color: "rgba(75, 85, 99, 0.2)",
                        },
                        ticks: {
                          color: "#d1d5db",
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d1d5db",
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Combat Statistics</h3>
              <div className="h-64">
                <Bar
                  data={playerStatsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(75, 85, 99, 0.2)",
                        },
                        ticks: {
                          color: "#d1d5db",
                        },
                      },
                      x: {
                        grid: {
                          color: "rgba(75, 85, 99, 0.2)",
                        },
                        ticks: {
                          color: "#d1d5db",
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: "#d1d5db",
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : !selectedPlayer ? (
        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100 mb-8">
          <p className="text-gray-400 text-center">Search for a player to view their statistics</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64 bg-dark-200 rounded-lg mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded-md mb-8">
          <p>{error || "Failed to load player statistics"}</p>
        </div>
      )}

      {/* Leaderboards */}
      <h2 className="text-xl font-semibold text-gray-300 mb-4">Leaderboards</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playtime Leaderboard */}
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
          <div className="bg-dark-300 px-4 py-3">
            <h3 className="text-lg font-semibold text-primary">Top Playtime</h3>
          </div>
          <ul className="divide-y divide-dark-100">
            {topPlayers.playtime.map((player, index) => (
              <li key={index} className="p-4 hover:bg-dark-100 cursor-pointer" onClick={() => handlePlayerSelect(player.name)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 text-center font-bold text-primary">#{index + 1}</div>
                  <div className="ml-2">
                    <div className="text-sm font-medium text-white">{player.name}</div>
                    <div className="text-xs text-gray-400">{player.playtime ? player.playtime.toFixed(1) : "0"} hours</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Kills Leaderboard */}
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
          <div className="bg-dark-300 px-4 py-3">
            <h3 className="text-lg font-semibold text-primary">Top Kills</h3>
          </div>
          <ul className="divide-y divide-dark-100">
            {topPlayers.kills.map((player, index) => (
              <li key={index} className="p-4 hover:bg-dark-100 cursor-pointer" onClick={() => handlePlayerSelect(player.name)}>
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 text-center font-bold text-primary">#{index + 1}</div>
                  <div className="ml-2">
                    <div className="text-sm font-medium text-white">{player.name}</div>
                    <div className="text-xs text-gray-400">{player.kills ? player.kills : "0"} kills</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
