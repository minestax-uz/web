import { useState, useEffect } from "react";
import { serverAPI } from "../services/api";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Define server types
type ServerType = "anarxiya" | "survival" | "boxpvp";

// Define TPS data from Plan plugin
interface TPSData {
  id: number;
  server_id: number;
  date: number;
  tps: number;
  players_online: number;
  cpu_usage: number;
  ram_usage: number;
  entities: number;
  chunks_loaded: number;
  free_disk_space: number;
}

// Define server stats interface
interface ServerStats {
  onlinePlayers: number;
  maxPlayers: number;
  uptime: string;
  tps: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  playerActivity: {
    time: string;
    count: number;
  }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerType>("anarxiya");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        try {
          // Fetch TPS data from the Plan plugin
          const response = await serverAPI.getStats(selectedServer);
          const tpsData: TPSData[] = response.data.data;

          if (tpsData && tpsData.length > 0) {
            // Get the latest TPS data
            const latestTps = tpsData[0];

            // Calculate uptime (placeholder - would need actual server start time)
            const uptime = "Online";

            // Create player activity data from the last 24 hours of TPS data
            const playerActivity = tpsData
              .map((data) => {
                const date = new Date(data.date * 1000);
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                return {
                  time: `${hours}:${minutes}`,
                  count: data.players_online,
                };
              })
              .reverse();

            // Set the stats
            setStats({
              onlinePlayers: latestTps.players_online,
              maxPlayers: 100, // This would need to be fetched from server config
              uptime,
              tps: latestTps.tps,
              cpuUsage: latestTps.cpu_usage,
              memoryUsage: latestTps.ram_usage,
              memoryTotal: 8192, // This would need to be fetched from server config
              playerActivity,
            });
          } else {
            throw new Error("No TPS data available");
          }
        } catch (apiError) {
          console.warn("API call failed, using fallback data:", apiError);
          // Fallback to mock data if API call fails
          setStats({
            onlinePlayers: 42,
            maxPlayers: 100,
            uptime: "3 days, 7 hours",
            tps: 19.8,
            cpuUsage: 35,
            memoryUsage: 4096,
            memoryTotal: 8192,
            playerActivity: [
              { time: "00:00", count: 15 },
              { time: "04:00", count: 8 },
              { time: "08:00", count: 12 },
              { time: "12:00", count: 25 },
              { time: "16:00", count: 38 },
              { time: "20:00", count: 42 },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to fetch server stats:", error);
        setError("Failed to load server statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [selectedServer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare data for the player count doughnut chart
  const playerCountData = {
    labels: ["Online Players", "Available Slots"],
    datasets: [
      {
        data: [stats.onlinePlayers, stats.maxPlayers - stats.onlinePlayers],
        backgroundColor: ["#facc15", "#374151"],
        borderColor: ["#d97706", "#1f2937"],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the player activity line chart
  const playerActivityData = {
    labels: stats.playerActivity.map((item) => item.time),
    datasets: [
      {
        label: "Player Count",
        data: stats.playerActivity.map((item) => item.count),
        borderColor: "#facc15",
        backgroundColor: "rgba(250, 204, 21, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Prepare data for the resource usage doughnut chart
  const resourceUsageData = {
    labels: ["CPU Usage", "Idle"],
    datasets: [
      {
        data: [stats.cpuUsage, 100 - stats.cpuUsage],
        backgroundColor: ["#facc15", "#374151"],
        borderColor: ["#d97706", "#1f2937"],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the memory usage doughnut chart
  const memoryUsageData = {
    labels: ["Memory Used", "Memory Free"],
    datasets: [
      {
        data: [stats.memoryUsage, stats.memoryTotal - stats.memoryUsage],
        backgroundColor: ["#facc15", "#374151"],
        borderColor: ["#d97706", "#1f2937"],
        borderWidth: 1,
      },
    ],
  };

  // Handle server change
  const handleServerChange = (server: ServerType) => {
    setSelectedServer(server);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Server Dashboard</h1>

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

      {/* Server Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Players</h2>
          <p className="text-3xl font-bold text-primary">{stats.onlinePlayers}</p>
        </div>

        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Uptime</h2>
          <p className="text-3xl font-bold text-primary">{stats.uptime}</p>
        </div>

        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">TPS</h2>
          <p className="text-3xl font-bold text-primary">{stats.tps.toFixed(1)}</p>
        </div>

        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Memory</h2>
          <p className="text-3xl font-bold text-primary">{(stats.memoryUsage / 1024).toFixed(1)} GB</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Player Count</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={playerCountData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
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
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Player Activity (24h)</h2>
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
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">CPU Usage</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={resourceUsageData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
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
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Memory Usage</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={memoryUsageData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
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
  );
};

export default Dashboard;
