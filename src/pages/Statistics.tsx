import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface PlayerStats {
  username: string;
  uuid: string;
  playtime: number; // in hours
  kills: number;
  deaths: number;
  blocksPlaced: number;
  blocksBroken: number;
  itemsCrafted: number;
  mobsKilled: number;
  distanceTraveled: number; // in kilometers
  lastSeen: string;
}

interface LeaderboardEntry {
  username: string;
  uuid: string;
  value: number;
}

const Statistics = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [topPlayers, setTopPlayers] = useState<{
    playtime: LeaderboardEntry[];
    kills: LeaderboardEntry[];
    mobsKilled: LeaderboardEntry[];
  }>({
    playtime: [],
    kills: [],
    mobsKilled: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ username: string; uuid: string }[]>([]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true);
        
        // Mock data for demonstration
        const mockTopPlaytime: LeaderboardEntry[] = [
          { username: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', value: 127.5 },
          { username: 'Dinnerbone', uuid: '61699b2e-d327-4a01-9f1e-0ea8c3f06bc6', value: 98.2 },
          { username: 'Jeb_', uuid: '853c80ef-3c37-49fd-aa49-938b674adae6', value: 89.7 },
          { username: 'Marc', uuid: '7125ba93-cef2-4243-88a6-c130f5cd7a8d', value: 76.3 },
          { username: 'Grum', uuid: 'c4d3a6f4-8bd9-4e5a-9d5e-69758e8c1e2c', value: 65.1 },
        ];
        
        const mockTopKills: LeaderboardEntry[] = [
          { username: 'Dinnerbone', uuid: '61699b2e-d327-4a01-9f1e-0ea8c3f06bc6', value: 1245 },
          { username: 'Grum', uuid: 'c4d3a6f4-8bd9-4e5a-9d5e-69758e8c1e2c', value: 987 },
          { username: 'Marc', uuid: '7125ba93-cef2-4243-88a6-c130f5cd7a8d', value: 856 },
          { username: 'Jeb_', uuid: '853c80ef-3c37-49fd-aa49-938b674adae6', value: 743 },
          { username: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', value: 621 },
        ];
        
        const mockTopMobsKilled: LeaderboardEntry[] = [
          { username: 'Marc', uuid: '7125ba93-cef2-4243-88a6-c130f5cd7a8d', value: 5432 },
          { username: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', value: 4321 },
          { username: 'Grum', uuid: 'c4d3a6f4-8bd9-4e5a-9d5e-69758e8c1e2c', value: 3456 },
          { username: 'Jeb_', uuid: '853c80ef-3c37-49fd-aa49-938b674adae6', value: 2345 },
          { username: 'Dinnerbone', uuid: '61699b2e-d327-4a01-9f1e-0ea8c3f06bc6', value: 1987 },
        ];
        
        setTopPlayers({
          playtime: mockTopPlaytime,
          kills: mockTopKills,
          mobsKilled: mockTopMobsKilled,
        });
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      const fetchPlayerStats = async () => {
        try {
          setLoading(true);
          
          // Mock data for demonstration
          const mockPlayerStats: PlayerStats = {
            username: selectedPlayer,
            uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', // Example UUID
            playtime: 127.5,
            kills: 621,
            deaths: 198,
            blocksPlaced: 45678,
            blocksBroken: 56789,
            itemsCrafted: 12345,
            mobsKilled: 4321,
            distanceTraveled: 876.5,
            lastSeen: '2023-05-18 10:15',
          };
          
          setPlayerStats(mockPlayerStats);
        } catch (error) {
          console.error('Failed to fetch player stats:', error);
          setError('Failed to load player statistics. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchPlayerStats();
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Mock search results
      const mockSearchResults = [
        { username: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5' },
        { username: 'Dinnerbone', uuid: '61699b2e-d327-4a01-9f1e-0ea8c3f06bc6' },
        { username: 'Jeb_', uuid: '853c80ef-3c37-49fd-aa49-938b674adae6' },
        { username: 'Marc', uuid: '7125ba93-cef2-4243-88a6-c130f5cd7a8d' },
        { username: 'Grum', uuid: 'c4d3a6f4-8bd9-4e5a-9d5e-69758e8c1e2c' },
      ].filter(player => 
        player.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(mockSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handlePlayerSelect = (username: string) => {
    setSelectedPlayer(username);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Prepare data for player activity chart
  const playerActivityData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    datasets: [
      {
        label: 'Playtime (hours)',
        data: [2.5, 3.2, 1.8, 4.5, 2.7, 3.9, 2.1],
        borderColor: '#facc15',
        backgroundColor: 'rgba(250, 204, 21, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Prepare data for player stats chart
  const playerStatsData = {
    labels: ['Kills', 'Deaths', 'Mobs Killed'],
    datasets: [
      {
        label: 'Player Stats',
        data: playerStats ? [playerStats.kills, playerStats.deaths, playerStats.mobsKilled] : [0, 0, 0],
        backgroundColor: [
          'rgba(250, 204, 21, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgba(217, 119, 6, 1)',
          'rgba(185, 28, 28, 1)',
          'rgba(29, 78, 216, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Player Statistics</h1>
      
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
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-dark-200 rounded-md shadow-lg border border-dark-100">
              <ul className="max-h-60 overflow-auto">
                {searchResults.map((player) => (
                  <li
                    key={player.uuid}
                    className="px-4 py-2 hover:bg-dark-100 cursor-pointer flex items-center"
                    onClick={() => handlePlayerSelect(player.username)}
                  >
                    <img
                      className="h-8 w-8 rounded-md mr-2"
                      src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                      alt={player.username}
                    />
                    <span className="text-white">{player.username}</span>
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
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            Statistics for {playerStats.username}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Playtime</h3>
              <p className="text-3xl font-bold text-primary">{playerStats.playtime.toFixed(1)} hours</p>
            </div>
            
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">K/D Ratio</h3>
              <p className="text-3xl font-bold text-primary">
                {(playerStats.kills / Math.max(1, playerStats.deaths)).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Blocks Placed</h3>
              <p className="text-3xl font-bold text-primary">{playerStats.blocksPlaced.toLocaleString()}</p>
            </div>
            
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Distance Traveled</h3>
              <p className="text-3xl font-bold text-primary">{playerStats.distanceTraveled.toFixed(1)} km</p>
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
                          color: 'rgba(75, 85, 99, 0.2)',
                        },
                        ticks: {
                          color: '#d1d5db',
                        },
                      },
                      x: {
                        grid: {
                          color: 'rgba(75, 85, 99, 0.2)',
                        },
                        ticks: {
                          color: '#d1d5db',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: '#d1d5db',
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
                          color: 'rgba(75, 85, 99, 0.2)',
                        },
                        ticks: {
                          color: '#d1d5db',
                        },
                      },
                      x: {
                        grid: {
                          color: 'rgba(75, 85, 99, 0.2)',
                        },
                        ticks: {
                          color: '#d1d5db',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: '#d1d5db',
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
          <p>{error || 'Failed to load player statistics'}</p>
        </div>
      )}
      
      {/* Leaderboards */}
      <h2 className="text-xl font-semibold text-gray-300 mb-4">Leaderboards</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Playtime Leaderboard */}
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
          <div className="bg-dark-300 px-4 py-3">
            <h3 className="text-lg font-semibold text-primary">Top Playtime</h3>
          </div>
          <ul className="divide-y divide-dark-100">
            {topPlayers.playtime.map((player, index) => (
              <li
                key={player.uuid}
                className="p-4 hover:bg-dark-100 cursor-pointer"
                onClick={() => handlePlayerSelect(player.username)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 text-center font-bold text-primary">
                    #{index + 1}
                  </div>
                  <img
                    className="h-8 w-8 rounded-md mx-2"
                    src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                    alt={player.username}
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-white">{player.username}</div>
                    <div className="text-xs text-gray-400">{player.value.toFixed(1)} hours</div>
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
              <li
                key={player.uuid}
                className="p-4 hover:bg-dark-100 cursor-pointer"
                onClick={() => handlePlayerSelect(player.username)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 text-center font-bold text-primary">
                    #{index + 1}
                  </div>
                  <img
                    className="h-8 w-8 rounded-md mx-2"
                    src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                    alt={player.username}
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-white">{player.username}</div>
                    <div className="text-xs text-gray-400">{player.value} kills</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Mobs Killed Leaderboard */}
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
          <div className="bg-dark-300 px-4 py-3">
            <h3 className="text-lg font-semibold text-primary">Top Mobs Killed</h3>
          </div>
          <ul className="divide-y divide-dark-100">
            {topPlayers.mobsKilled.map((player, index) => (
              <li
                key={player.uuid}
                className="p-4 hover:bg-dark-100 cursor-pointer"
                onClick={() => handlePlayerSelect(player.username)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 text-center font-bold text-primary">
                    #{index + 1}
                  </div>
                  <img
                    className="h-8 w-8 rounded-md mx-2"
                    src={`https://mc-heads.net/avatar/${player.uuid}/32`}
                    alt={player.username}
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-white">{player.username}</div>
                    <div className="text-xs text-gray-400">{player.value} mobs</div>
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
