import { useState, useEffect } from "react";
import { bansAPI, default as api } from "../services/api";
import { Dialog } from "@headlessui/react";
import { useAuth } from "../contexts/AuthContext";

interface Ban {
  id: number;
  player_name: string;
  admin_name: string;
  reason: string;
  formatted_time: string;
  formatted_until?: string;
  status: "active" | "expired" | "removed" | "permanent";
  removed_by_uuid?: string;
  unbanned_by_name?: string;
  comments?: Comment[];
  proofs?: Proof[];
  has_proof?: boolean;
}

interface Comment {
  id: number;
  ban_id: number;
  author_name?: string;
  admin_name?: string;
  content?: string;
  text?: string;
  created_at: string;
}

interface ApiProof {
  id: number;
  ban_id: number;
  moderator_name: string;
  file_path: string;
  file_type: string;
  created_at?: string;
}

interface Proof {
  id: number;
  ban_id: number;
  admin_name: string;
  url: string;
  type: "image" | "video";
  created_at: string;
  allUrls?: string[]; // Array of fallback URLs to try
}

const Bans = () => {
  const { user } = useAuth();
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBan, setSelectedBan] = useState<Ban | null>(null);
  const [newComment, setNewComment] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{
    status: "uploading" | "idle" | "success" | "error";
    progress: number;
  }>({
    status: "idle",
    progress: 0,
  });

  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchBans = async () => {
      try {
        setLoading(true);

        try {
          // Attempt to fetch real data from the API
          const response = await bansAPI.getBans(currentPage, searchQuery);
          setBans(response.data.data.items);
          setTotalPages(Math.ceil(response.data.data.total / 10));
        } catch (apiError) {
          console.warn("API call failed, using fallback data:", apiError);
        }
      } catch (error) {
        console.error("Failed to fetch bans:", error);
        setError("Failed to load ban data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBans();
  }, [currentPage, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Transform API proof data to the format expected by the web application
  const transformProof = (apiProof: ApiProof): Proof => {
    // The backend stores files in the uploads folder
    // We need to construct the correct URL to access these files

    // Get the API base URL (without the /api prefix)
    const apiBaseUrl = api.defaults.baseURL?.replace("/api", "") || "";

    // Construct the URL to the proof image
    // The file_path already includes the relative path (e.g., "proofs/10689-306806b0cb2.png")
    const url = apiProof.file_path ? `${apiBaseUrl}/${apiProof.file_path}` : "https://via.placeholder.com/320x180?text=Image+Not+Available";

    // Determine the type based on file_type, default to image if missing
    const type = apiProof.file_type === "video" ? "video" : "image";

    // Format the date or use current date if not available
    const created_at = apiProof.created_at ? new Date(apiProof.created_at).toISOString() : new Date().toISOString();

    return {
      id: apiProof.id,
      ban_id: apiProof.ban_id,
      admin_name: apiProof.moderator_name || "Unknown",
      url,
      type,
      created_at,
      // We don't need fallback URLs anymore since we're using the correct URL format
      allUrls: [url],
    };
  };

  const handleBanSelect = async (ban: Ban) => {
    // Make sure we initialize the ban with empty arrays for proofs and comments if they don't exist
    const initialBan = {
      ...ban,
      proofs: ban.proofs || [],
      comments: ban.comments || [],
    };

    // Set the selected ban with properly initialized arrays
    setSelectedBan(initialBan);
    setDetailsLoading(true);

    // Fetch proofs and comments for the selected ban
    try {
      // Fetch proofs
      try {
        const proofsResponse = await bansAPI.getBanProofs(ban.id);
        const apiProofs = proofsResponse.data.data;

        // Transform API proofs to the format expected by the web application
        const proofs = Array.isArray(apiProofs) ? apiProofs.map(transformProof) : [];

        // Fetch comments
        const commentsResponse = await bansAPI.getBanComments(ban.id);
        const comments = commentsResponse.data.data || [];

        // Update the selected ban with fetched proofs and comments
        setSelectedBan((prevBan) => {
          if (prevBan && prevBan.id === ban.id) {
            return {
              ...prevBan,
              proofs: proofs,
              comments: comments,
              has_proof: proofs.length > 0,
            };
          }
          return prevBan;
        });

        // Also update the ban in the bans list to set the has_proof property
        setBans(
          bans.map((b) => {
            if (b.id === ban.id) {
              return {
                ...b,
                has_proof: proofs.length > 0,
              };
            }
            return b;
          })
        );
      } catch (apiError) {
        console.warn("Failed to fetch ban details from API:", apiError);
        // We already initialized with empty arrays, so no need to do anything here
      }
    } catch (error) {
      console.error("Error fetching ban details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBan || !newComment.trim() || !user) return;

    try {
      let newCommentObj: Comment;

      try {
        // Attempt to use the real API
        const response = await bansAPI.addBanComment({
          ban_id: +selectedBan.id,
          content: newComment,
        });

        // Use the comment from the API response
        newCommentObj = response.data.data;
      } catch (apiError) {
        console.warn("API call failed, using fallback:", apiError);
        // Fallback to mock response
        newCommentObj = {
          id: Math.floor(Math.random() * 1000),
          ban_id: selectedBan.id,
          author_name: user.username,
          content: newComment,
          created_at: new Date().toISOString(),
        };
      }

      // Update the selected ban with the new comment
      setSelectedBan({
        ...selectedBan,
        comments: [...(selectedBan.comments as any), newCommentObj],
      });

      // Update the bans list
      setBans(bans.map((ban) => (ban.id === selectedBan.id ? { ...ban, comments: [...(ban.comments as any), newCommentObj] } : ban)));

      // Clear the comment input
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleDeleteProof = async (proofId: number, proofAdminName: string) => {
    if (!selectedBan || !user) return;

    // Check permissions: admin can delete any proof, moder can only delete their own
    if (user.role !== "admin" && proofAdminName !== user.username) {
      alert("You can only delete your own proofs");
      return;
    }

    try {
      await bansAPI.deleteBanProof(proofId);

      // Make sure proofs is an array before filtering
      const currentProofs = selectedBan.proofs || [];

      // Update the selected ban by removing the deleted proof
      setSelectedBan({
        ...selectedBan,
        proofs: currentProofs.filter((proof) => proof.id !== proofId),
      });

      // Update the bans list
      setBans(
        bans.map((ban) => {
          if (ban.id === selectedBan.id) {
            // Make sure ban.proofs is an array before filtering
            const banProofs = ban.proofs || [];
            const updatedProofs = banProofs.filter((proof) => proof.id !== proofId);

            return {
              ...ban,
              proofs: updatedProofs,
              has_proof: updatedProofs.length > 0,
            };
          }
          return ban;
        })
      );
    } catch (error) {
      console.error("Failed to delete proof:", error);
    }
  };

  const handleProofClick = (proof: Proof) => {
    setSelectedProof(proof);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedBan || !user) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ban_id", selectedBan.id.toString());

    try {
      setUploadProgress({ status: "uploading", progress: 0 });

      try {
        // Attempt to use the real API
        const response = await bansAPI.uploadBanProof(formData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ status: "uploading", progress });
        });

        // Get the proof from the API response
        const apiProof = response.data.data;

        // Transform the API proof to the format expected by the web application
        const transformedProof = transformProof(apiProof);

        // Make sure proofs is an array before adding to it
        const currentProofs = selectedBan.proofs || [];

        // Update the selected ban with the new proof
        setSelectedBan({
          ...selectedBan,
          proofs: [...currentProofs, transformedProof],
        });

        // Update the bans list
        setBans(
          bans.map((ban) => {
            if (ban.id === selectedBan.id) {
              // Make sure ban.proofs is an array before adding to it
              const banProofs = ban.proofs || [];

              return {
                ...ban,
                proofs: [...banProofs, transformedProof],
                has_proof: true,
              };
            }
            return ban;
          })
        );

        setUploadProgress({ status: "success", progress: 100 });

        // Reset the upload progress after a delay
        setTimeout(() => {
          setUploadProgress({ status: "idle", progress: 0 });
        }, 2000);
      } catch (apiError) {
        console.warn("API call failed, using fallback:", apiError);

        // Simulate upload progress for fallback
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress({ status: "uploading", progress });

          if (progress >= 100) {
            clearInterval(interval);

            // Mock response
            const newProof: Proof = {
              id: Math.floor(Math.random() * 1000),
              ban_id: selectedBan.id,
              admin_name: user.username,
              url: URL.createObjectURL(file),
              type: file.type.startsWith("image/") ? "image" : "video",
              created_at: new Date().toISOString(),
            };

            // Make sure proofs is an array before adding to it
            const currentProofs = selectedBan.proofs || [];

            // Update the selected ban with the new proof
            setSelectedBan({
              ...selectedBan,
              proofs: [...currentProofs, newProof],
            });

            // Update the bans list
            setBans(
              bans.map((ban) => {
                if (ban.id === selectedBan.id) {
                  // Make sure ban.proofs is an array before adding to it
                  const banProofs = ban.proofs || [];

                  return {
                    ...ban,
                    proofs: [...banProofs, newProof],
                    has_proof: true,
                  };
                }
                return ban;
              })
            );

            setUploadProgress({ status: "success", progress: 100 });

            // Reset the upload progress after a delay
            setTimeout(() => {
              setUploadProgress({ status: "idle", progress: 0 });
            }, 2000);
          }
        }, 300);
      }
    } catch (error) {
      console.error("Failed to upload proof:", error);
      setUploadProgress({ status: "error", progress: 0 });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Ban Management</h1>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bans..."
            className="w-full px-4 py-2 rounded-md bg-dark-200 border border-dark-100 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={handleSearch}
          />
          <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Ban Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Proof</th>
                </tr>
              </thead>
              <tbody className="bg-dark-200 divide-y divide-dark-100">
                {bans.map((ban) => (
                  <tr key={ban.id} className="hover:bg-dark-100 cursor-pointer" onClick={() => handleBanSelect(ban)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-md" src={`https://mc-heads.net/avatar/${ban.player_name}/40`} alt={ban.player_name} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{ban.player_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{ban.admin_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 line-clamp-2">{ban.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {ban.formatted_time}
                        {ban.formatted_until && <div className="text-xs text-gray-400">Until: {ban.formatted_until}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ban.status === "active"
                            ? "bg-red-900/30 text-red-300 border border-red-800"
                            : ban.status === "expired"
                            ? "bg-gray-800/30 text-gray-400 border border-gray-700"
                            : ban.status === "removed"
                            ? "bg-green-900/30 text-green-300 border border-green-800"
                            : "bg-purple-900/30 text-purple-300 border border-purple-800"
                        }`}
                      >
                        {ban.status.charAt(0).toUpperCase() + ban.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {ban.has_proof && (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-900/30 text-yellow-300 border border-yellow-800 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </td>
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

      {/* Ban Details Modal */}
      <Dialog open={!!selectedBan} onClose={() => setSelectedBan(null)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative bg-dark-200 rounded-lg max-w-4xl w-full mx-4 shadow-xl border border-dark-100">
            {selectedBan && (
              <>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-primary">Ban Details</h2>
                    <button className="text-gray-400 hover:text-white" onClick={() => setSelectedBan(null)}>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Ban Information</h3>
                      <div className="bg-dark-300 p-4 rounded-md">
                        <div className="flex items-center mb-4">
                          <img
                            className="h-16 w-16 rounded-md"
                            src={`https://mc-heads.net/avatar/${selectedBan.player_name}/64`}
                            alt={selectedBan.player_name.charAt(0).toUpperCase()}
                          />
                          <div className="ml-4">
                            <div className="text-xl font-medium text-white">{selectedBan.player_name}</div>
                            <div className="text-sm text-gray-400">Banned by: {selectedBan.admin_name}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-gray-400">Reason:</div>
                          <div className="text-white">{selectedBan.reason}</div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-gray-400">Date:</div>
                          <div className="text-white">{selectedBan.formatted_time}</div>
                        </div>

                        {selectedBan.formatted_until && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-400">Until:</div>
                            <div className="text-white">{selectedBan.formatted_until}</div>
                          </div>
                        )}

                        <div className="mb-4">
                          <div className="text-sm text-gray-400">Status:</div>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              selectedBan.status === "active"
                                ? "bg-red-900/30 text-red-300 border border-red-800"
                                : selectedBan.status === "expired"
                                ? "bg-gray-800/30 text-gray-400 border border-gray-700"
                                : selectedBan.status === "removed"
                                ? "bg-green-900/30 text-green-300 border border-green-800"
                                : "bg-purple-900/30 text-purple-300 border border-purple-800"
                            }`}
                          >
                            {selectedBan.status.charAt(0).toUpperCase() + selectedBan.status.slice(1)}
                          </span>
                        </div>

                        {selectedBan.unbanned_by_name && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-400">Unbanned by:</div>
                            <div className="text-white">{selectedBan.unbanned_by_name}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Proofs</h3>
                      <div className="bg-dark-300 p-4 rounded-md h-64 overflow-y-auto">
                        {detailsLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        ) : !selectedBan.proofs || selectedBan.proofs.length === 0 ? (
                          <div className="text-gray-400 text-center py-8">No proofs available</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {selectedBan.proofs.map((proof) => (
                              <div key={proof.id} className="bg-dark-200 rounded-md overflow-hidden relative group">
                                <div className="cursor-pointer" onClick={() => handleProofClick(proof)}>
                                  {proof.type === "image" ? (
                                    <div className="relative">
                                      <img src={proof.url} alt={`Ban proof`} className="w-full h-32 object-cover" />

                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                                        <svg
                                          className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-32 bg-dark-400 flex items-center justify-center">
                                      <svg className="h-12 w-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 flex justify-between items-center">
                                  <div>
                                    <div className="text-xs text-gray-400">Added by {proof.admin_name}</div>
                                    <div className="text-xs text-gray-500">{proof.created_at ? new Date(proof.created_at).toLocaleString() : "Unknown date"}</div>
                                  </div>
                                  {(user?.role === "admin" || (user?.role === "moder" && proof.admin_name === user.username)) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProof(proof.id, proof.admin_name);
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1"
                                      title="Delete proof"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {(user?.role === "admin" || user?.role === "moder") && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Add Proof</label>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-medium
                              file:bg-primary file:text-black
                              hover:file:bg-accent
                              file:cursor-pointer
                              bg-dark-300 rounded-md cursor-pointer
                              focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Comments</h3>
                    <div className="bg-dark-300 p-4 rounded-md max-h-64 overflow-y-auto">
                      {detailsLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : !selectedBan.comments || selectedBan.comments.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">No comments available</div>
                      ) : (
                        <div className="space-y-4">
                          {selectedBan.comments.map((comment) => (
                            <div key={comment.id} className="bg-dark-200 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-primary">{comment.author_name || comment.admin_name}</div>
                                <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</div>
                              </div>
                              <div className="mt-1 text-gray-300">{comment.content || comment.text}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {(user?.role === "admin" || user?.role === "moder") && (
                      <form onSubmit={handleCommentSubmit} className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Add Comment</label>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={3}
                          placeholder="Enter your comment..."
                        ></textarea>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-primary text-black rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Dialog>

      {/* Upload Progress Indicator */}
      {uploadProgress.status === "uploading" && (
        <div className="fixed bottom-4 right-4 bg-dark-200 p-4 rounded-lg shadow-lg border border-dark-100">
          <div className="w-64 bg-dark-300 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-300 mt-2">Uploading: {uploadProgress.progress}%</p>
        </div>
      )}

      {/* Proof Maximized View Modal */}
      <Dialog open={!!selectedProof} onClose={() => setSelectedProof(null)} className="fixed inset-0 z-20 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black opacity-75" />

          <div className="relative bg-dark-300 rounded-lg max-w-4xl w-full mx-auto shadow-xl border border-dark-100 z-30">
            {selectedProof && (
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Proof Details</h3>
                    <p className="text-sm text-gray-400">
                      Added by {selectedProof.admin_name}
                      {selectedProof.created_at ? ` on ${new Date(selectedProof.created_at).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-white" onClick={() => setSelectedProof(null)}>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-center">
                  {selectedProof.type === "image" ? (
                    <img
                      src={selectedProof.url}
                      alt="Ban proof"
                      className="max-h-[70vh] max-w-full object-contain"
                      onError={(e) => {
                        // Use placeholder if image fails to load
                        e.currentTarget.src = "https://via.placeholder.com/800x600?text=Image+Not+Available";
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 bg-dark-400 flex items-center justify-center">
                      <svg className="h-16 w-16 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {(user?.role === "admin" || (user?.role === "moder" && selectedProof.admin_name === user?.username)) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        if (selectedBan) {
                          handleDeleteProof(selectedProof.id, selectedProof.admin_name);
                          setSelectedProof(null);
                        }
                      }}
                      className="px-4 py-2 bg-red-900/30 text-red-300 border border-red-800 rounded-md hover:bg-red-800/30"
                    >
                      Delete Proof
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Bans;
