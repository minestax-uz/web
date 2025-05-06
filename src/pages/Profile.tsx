import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setError(null);
    setSuccess(null);
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      // In a real application, this would be an API call
      // await api.post('/api/auth/change-password', {
      //   currentPassword,
      //   newPassword,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSuccess('Password changed successfully');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error) {
      console.error('Failed to change password:', error);
      setError('Failed to change password. Please check your current password and try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-dark-300 flex items-center justify-center mb-4">
                <img
                  src={`https://mc-heads.net/avatar/${user.username}/96`}
                  alt={user.username}
                  className="h-24 w-24 rounded-full"
                />
              </div>
              <h2 className="text-xl font-semibold text-white">{user.username}</h2>
              <p className="text-gray-400 mt-1">
                {user.role === 'admin' ? 'Administrator' : user.role === 'moder' ? 'Moderator' : 'Player'}
              </p>
              
              <div className="mt-6 w-full">
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="w-full px-4 py-2 bg-dark-300 text-gray-300 rounded-md hover:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Change Password
                </button>
                
                <button
                  onClick={logout}
                  className="w-full mt-4 px-4 py-2 bg-red-900/30 text-red-300 border border-red-800 rounded-md hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Password Change Form */}
        <div className="lg:col-span-2">
          {isChangingPassword ? (
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Change Password</h2>
              
              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded-md mb-4">
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-900/20 border border-green-800 text-green-200 px-4 py-3 rounded-md mb-4">
                  <p>{success}</p>
                </div>
              )}
              
              <form onSubmit={handlePasswordChange}>
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-dark-300 border border-dark-100 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="px-4 py-2 bg-dark-300 text-gray-300 rounded-md hover:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-black rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Account Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Username</h3>
                  <p className="text-white">{user.username}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">User ID</h3>
                  <p className="text-white">{user.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Role</h3>
                  <p className="text-white">
                    {user.role === 'admin' ? 'Administrator' : user.role === 'moder' ? 'Moderator' : 'Player'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Account Status</h3>
                  <p className="text-green-400">Active</p>
                </div>
              </div>
              
              <div className="mt-6 border-t border-dark-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Security Recommendations</h3>
                
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mr-2 mt-0.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Use a strong, unique password for your Minecraft account
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mr-2 mt-0.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Enable two-factor authentication if available
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mr-2 mt-0.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Never share your account credentials with others
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
