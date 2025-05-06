import { useState, useEffect } from 'react';
import { staffAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StaffMember {
  username: string;
  uuid: string;
  role: 'admin' | 'moder' | 'user';
  server: 'anarxiya' | 'survival' | 'boxpvp';
  permissions: string[];
  lastActive: string;
}

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  target?: string;
  timestamp: string;
}

const StaffPanel = () => {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<'anarxiya' | 'survival' | 'boxpvp'>('anarxiya');
  const [newPermission, setNewPermission] = useState('');
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        // In a real application, this would be API calls
        // const staffResponse = await staffAPI.getStaffMembers(selectedServer);
        // const logsResponse = await staffAPI.getActivityLogs();
        // setStaffMembers(staffResponse.data.data);
        // setActivityLogs(logsResponse.data.data);
        
        // Mock data for demonstration
        const mockStaffMembers: StaffMember[] = [
          { 
            username: 'AdminUser', 
            uuid: '7125ba93-cef2-4243-88a6-c130f5cd7a8d', 
            role: 'admin', 
            server: selectedServer, 
            permissions: ['ban.add', 'ban.remove', 'user.manage', 'staff.manage'], 
            lastActive: '2023-05-18 10:15' 
          },
          { 
            username: 'ModUser', 
            uuid: '8667ba71-b85a-4004-af54-457a9734eed7', 
            role: 'moder', 
            server: selectedServer, 
            permissions: ['ban.add', 'user.view'], 
            lastActive: '2023-05-18 09:30' 
          },
          { 
            username: 'JuniorMod', 
            uuid: '9b2e23b0-eb1a-4c16-8e89-42a37d4a0f5a', 
            role: 'moder', 
            server: selectedServer, 
            permissions: ['ban.add'], 
            lastActive: '2023-05-17 22:45' 
          },
        ];
        
        const mockActivityLogs: ActivityLog[] = [
          { id: 1, username: 'AdminUser', action: 'Banned player', target: 'Griefer123', timestamp: '2023-05-18 10:15' },
          { id: 2, username: 'ModUser', action: 'Added comment to ban', target: 'Hacker42', timestamp: '2023-05-18 09:30' },
          { id: 3, username: 'AdminUser', action: 'Added permission', target: 'JuniorMod', timestamp: '2023-05-17 22:45' },
          { id: 4, username: 'AdminUser', action: 'Removed ban', target: 'FalsePositive', timestamp: '2023-05-17 20:10' },
          { id: 5, username: 'ModUser', action: 'Added proof to ban', target: 'Griefer123', timestamp: '2023-05-17 18:30' },
        ];
        
        setStaffMembers(mockStaffMembers);
        setActivityLogs(mockActivityLogs);
      } catch (error) {
        console.error('Failed to fetch staff data:', error);
        setError('Failed to load staff data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [selectedServer]);

  const handleServerChange = (server: 'anarxiya' | 'survival' | 'boxpvp') => {
    setSelectedServer(server);
  };

  const handleAddPermission = async () => {
    if (!selectedStaffMember || !newPermission.trim()) return;
    
    try {
      // In a real application, this would be an API call
      // await staffAPI.addPermission(selectedStaffMember.username, newPermission, selectedServer);
      
      // Update the staff member with the new permission
      const updatedStaffMembers = staffMembers.map(member => 
        member.username === selectedStaffMember.username
          ? { ...member, permissions: [...member.permissions, newPermission] }
          : member
      );
      
      setStaffMembers(updatedStaffMembers);
      setSelectedStaffMember({
        ...selectedStaffMember,
        permissions: [...selectedStaffMember.permissions, newPermission],
      });
      
      // Add to activity logs
      const newLog: ActivityLog = {
        id: activityLogs.length + 1,
        username: user?.username || 'Unknown',
        action: 'Added permission',
        target: selectedStaffMember.username,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      
      setActivityLogs([newLog, ...activityLogs]);
      
      // Clear the input
      setNewPermission('');
    } catch (error) {
      console.error('Failed to add permission:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Staff Panel</h1>
      
      {/* Server Selection */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${
              selectedServer === 'anarxiya'
                ? 'bg-primary text-black'
                : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
            }`}
            onClick={() => handleServerChange('anarxiya')}
          >
            Anarxiya
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              selectedServer === 'survival'
                ? 'bg-primary text-black'
                : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
            }`}
            onClick={() => handleServerChange('survival')}
          >
            Survival
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              selectedServer === 'boxpvp'
                ? 'bg-primary text-black'
                : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
            }`}
            onClick={() => handleServerChange('boxpvp')}
          >
            BoxPVP
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Members */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Staff Members</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-dark-200 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded-md">
              <p>{error}</p>
            </div>
          ) : (
            <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
              <ul className="divide-y divide-dark-100">
                {staffMembers.map((member) => (
                  <li
                    key={member.uuid}
                    className={`p-4 cursor-pointer hover:bg-dark-100 ${
                      selectedStaffMember?.username === member.username ? 'bg-dark-100' : ''
                    }`}
                    onClick={() => setSelectedStaffMember(member)}
                  >
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-md"
                        src={`https://mc-heads.net/avatar/${member.uuid}/40`}
                        alt={member.username}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{member.username}</div>
                        <div className="text-xs text-gray-400">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Staff Member Details */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Staff Details</h2>
          
          {selectedStaffMember ? (
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100">
              <div className="flex items-center mb-6">
                <img
                  className="h-16 w-16 rounded-md"
                  src={`https://mc-heads.net/avatar/${selectedStaffMember.uuid}/64`}
                  alt={selectedStaffMember.username}
                />
                <div className="ml-4">
                  <div className="text-xl font-medium text-white">{selectedStaffMember.username}</div>
                  <div className="text-sm text-gray-400">
                    {selectedStaffMember.role.charAt(0).toUpperCase() + selectedStaffMember.role.slice(1)}
                  </div>
                  <div className="text-xs text-gray-500">Last active: {selectedStaffMember.lastActive}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Permissions</h3>
                <div className="bg-dark-300 p-4 rounded-md">
                  <div className="flex flex-wrap gap-2">
                    {selectedStaffMember.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 bg-dark-100 text-gray-300 rounded-md text-xs"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Add Permission</h3>
                  <div className="flex">
                    <input
                      type="text"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      placeholder="Enter permission name"
                      className="flex-1 px-3 py-2 bg-dark-300 border border-dark-100 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleAddPermission}
                      disabled={!newPermission.trim()}
                      className="px-4 py-2 bg-primary text-black rounded-r-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-dark-200 rounded-lg shadow-md p-6 border border-dark-100 flex items-center justify-center h-64">
              <p className="text-gray-400">Select a staff member to view details</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Activity Logs */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Activity Logs</h2>
        
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden border border-dark-100">
          <table className="min-w-full divide-y divide-dark-100">
            <thead className="bg-dark-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-200 divide-y divide-dark-100">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{log.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{log.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{log.target || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{log.timestamp}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffPanel;
