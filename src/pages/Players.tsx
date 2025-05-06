import { useState, useEffect } from "react";
import { playersAPI } from "../services/api";

interface Player {
  username: string;
  uuid: string;
  playtime: string;
  lastLogin: string;
  firstJoin: string;
  status: "online" | "offline";
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);

        try {
          // Attempt to fetch real data from the API
          const response = await playersAPI.getPlayers(currentPage, searchQuery);

          // If we have real data from the API
          const apiPlayers = response.data.data.items;
          setPlayers(apiPlayers);
          setTotalPages(Math.ceil(response.data.data.total / 10));

          // Apply status filter if needed (if not already handled by the API)
          if (statusFilter !== "all" && !response.data.data.filtered) {
            const filteredPlayers = apiPlayers.filter((player) => player.status === statusFilter);
            setPlayers(filteredPlayers);
            setTotalPages(Math.ceil(filteredPlayers.length / 10));
          }
        } catch (apiError) {
          console.warn("API call failed, using fallback data:", apiError);
          // Fallback to mock data if API call fails
          const mockPlayers: Player[] = [
            { username: "Notch", uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5", playtime: "127h 45m", lastLogin: "2023-05-15 14:30", firstJoin: "2022-01-10", status: "offline" },
            { username: "Jeb_", uuid: "853c80ef-3c37-49fd-aa49-938b674adae6", playtime: "98h 12m", lastLogin: "2023-05-18 09:15", firstJoin: "2022-01-15", status: "online" },
            {
              username: "Dinnerbone",
              uuid: "61699b2e-d327-4a01-9f1e-0ea8c3f06bc6",
              playtime: "156h 32m",
              lastLogin: "2023-05-17 22:45",
              firstJoin: "2022-01-12",
              status: "online",
            },
            { username: "Grumm", uuid: "02d7ab65-7d71-4d0b-b910-f6c29d6c3f37", playtime: "78h 54m", lastLogin: "2023-05-16 18:20", firstJoin: "2022-02-05", status: "offline" },
            {
              username: "MojangSupport",
              uuid: "8667ba71-b85a-4004-af54-457a9734eed7",
              playtime: "42h 18m",
              lastLogin: "2023-05-14 11:10",
              firstJoin: "2022-03-20",
              status: "offline",
            },
            { username: "Marc", uuid: "7125ba93-cef2-4243-88a6-c130f5cd7a8d", playtime: "112h 05m", lastLogin: "2023-05-18 08:30", firstJoin: "2022-01-25", status: "online" },
            {
              username: "MinecraftChick",
              uuid: "9b2e23b0-eb1a-4c16-8e89-42a37d4a0f5a",
              playtime: "65h 40m",
              lastLogin: "2023-05-17 15:50",
              firstJoin: "2022-02-18",
              status: "offline",
            },
            { username: "Searge", uuid: "3b9f4b7c-0685-4a7c-9476-d9e71324e3e2", playtime: "89h 22m", lastLogin: "2023-05-18 10:05", firstJoin: "2022-02-01", status: "online" },
            { username: "EvilSeph", uuid: "5d3da959-0627-4b8d-ba5c-d5146b15a2c0", playtime: "54h 37m", lastLogin: "2023-05-15 19:25", firstJoin: "2022-03-05", status: "offline" },
            { username: "Grum", uuid: "c4d3a6f4-8bd9-4e5a-9d5e-69758e8c1e2c", playtime: "103h 15m", lastLogin: "2023-05-18 07:40", firstJoin: "2022-01-30", status: "online" },
          ];

          // Filter by search query
          let filteredPlayers = mockPlayers;
          if (searchQuery) {
            filteredPlayers = mockPlayers.filter((player) => player.username.toLowerCase().includes(searchQuery.toLowerCase()));
          }

          // Filter by status
          if (statusFilter !== "all") {
            filteredPlayers = filteredPlayers.filter((player) => player.status === statusFilter);
          }

          setPlayers(filteredPlayers);
          setTotalPages(Math.ceil(filteredPlayers.length / 10));
        }
      } catch (error) {
        console.error("Failed to fetch players:", error);
        setError("Failed to load player data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [currentPage, searchQuery, statusFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: "all" | "online" | "offline") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Player Management</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search players..."
            className="w-full md:w-64 px-4 py-2 rounded-md bg-dark-200 border border-dark-100 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={handleSearch}
          />
          <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${statusFilter === "all" ? "bg-primary text-black" : "bg-dark-200 text-gray-300 hover:bg-dark-100"}`}
            onClick={() => handleStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-md ${statusFilter === "online" ? "bg-primary text-black" : "bg-dark-200 text-gray-300 hover:bg-dark-100"}`}
            onClick={() => handleStatusFilter("online")}
          >
            Online
          </button>
          <button
            className={`px-4 py-2 rounded-md ${statusFilter === "offline" ? "bg-primary text-black" : "bg-dark-200 text-gray-300 hover:bg-dark-100"}`}
            onClick={() => handleStatusFilter("offline")}
          >
            Offline
          </button>
        </div>
      </div>

      {/* Player Table */}
      <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-100">
              <thead className="bg-dark-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Playtime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">First Join</th>
                </tr>
              </thead>
              <tbody className="bg-dark-200 divide-y divide-dark-100">
                {players.map((player) => (
                  <tr key={player.uuid} className="hover:bg-dark-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-md" src={`https://mc-heads.net/avatar/${player.uuid}/40`} alt={player.username} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{player.username}</div>
                          <div className="text-xs text-gray-400">{player.uuid}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          player.status === "online" ? "bg-green-900/30 text-green-300 border border-green-800" : "bg-gray-800/30 text-gray-400 border border-gray-700"
                        }`}
                      >
                        {player.status === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{player.playtime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{player.lastLogin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{player.firstJoin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex justify-between items-center mt-6">
          <button
            className="px-4 py-2 bg-dark-200 text-gray-300 rounded-md hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-dark-200 text-gray-300 rounded-md hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Players;
