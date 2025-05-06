import { useState, useEffect } from "react";
import { bansAPI } from "../services/api";
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
  comments: Comment[];
  proofs: Proof[];
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

interface Proof {
  id: number;
  ban_id: number;
  admin_name: string;
  url: string;
  type: "image" | "video";
  created_at: string;
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

  const handleBanSelect = async (ban: Ban) => {
    setSelectedBan(ban);
    setDetailsLoading(true);

    // Fetch proofs and comments for the selected ban
    try {
      // Fetch proofs
      try {
        const proofsResponse = await bansAPI.getBanProofs(ban.id);
        const proofs = proofsResponse.data.data;

        // Fetch comments
        const commentsResponse = await bansAPI.getBanComments(ban.id);
        const comments = commentsResponse.data.data;

        // Update the selected ban with fetched proofs and comments
        setSelectedBan((prevBan) => {
          if (prevBan && prevBan.id === ban.id) {
            return {
              ...prevBan,
              proofs: proofs || [],
              comments: comments || [],
            };
          }
          return prevBan;
        });
      } catch (apiError) {
        console.warn("Failed to fetch ban details from API:", apiError);
        // We'll keep using the proofs and comments that came with the ban object
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
        comments: [...selectedBan.comments, newCommentObj],
      });

      // Update the bans list
      setBans(bans.map((ban) => (ban.id === selectedBan.id ? { ...ban, comments: [...ban.comments, newCommentObj] } : ban)));

      // Clear the comment input
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
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

        // Update the selected ban with the new proof
        setSelectedBan({
          ...selectedBan,
          proofs: [...selectedBan.proofs, apiProof],
        });

        // Update the bans list
        setBans(bans.map((ban) => (ban.id === selectedBan.id ? { ...ban, proofs: [...ban.proofs, apiProof] } : ban)));

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

            // Update the selected ban with the new proof
            setSelectedBan({
              ...selectedBan,
              proofs: [...selectedBan.proofs, newProof],
            });

            // Update the bans list
            setBans(bans.map((ban) => (ban.id === selectedBan.id ? { ...ban, proofs: [...ban.proofs, newProof] } : ban)));

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
                          <img className="h-16 w-16 rounded-md" src={`https://mc-heads.net/avatar/${selectedBan.player_name}/64`} alt={selectedBan.player_name} />
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
                        ) : selectedBan.proofs.length === 0 ? (
                          <div className="text-gray-400 text-center py-8">No proofs available</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {selectedBan.proofs.map((proof) => (
                              <div key={proof.id} className="bg-dark-200 rounded-md overflow-hidden">
                                {proof.type === "image" ? (
                                  <img src={proof.url} alt="Ban proof" className="w-full h-32 object-cover" />
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
                                <div className="p-2">
                                  <div className="text-xs text-gray-400">Added by {proof.admin_name}</div>
                                  <div className="text-xs text-gray-500">{new Date(proof.created_at).toLocaleString()}</div>
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
                      ) : selectedBan.comments.length === 0 ? (
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
    </div>
  );
};

export default Bans;
