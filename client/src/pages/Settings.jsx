import { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Loader';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Settings() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/auth/users/${userId}`, { role });
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await api.put(`/auth/users/${userId}`, { isActive: !isActive });
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You need admin privileges to access settings.</p>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  const roleLabels = {
    admin: { label: 'Admin', variant: 'danger' },
    relationship_manager: { label: 'Manager', variant: 'primary' },
    team_member: { label: 'Team Member', variant: 'default' }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage users and system settings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400" />
            <CardTitle>User Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-white/[0.06]">
            {users.map(user => (
              <div key={user._id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={user.name} size="md" />
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    options={[
                      { value: 'admin', label: 'Admin' },
                      { value: 'relationship_manager', label: 'Relationship Manager' },
                      { value: 'team_member', label: 'Team Member' }
                    ]}
                    className="w-48"
                  />
                  
                  <Badge variant={roleLabels[user.role]?.variant}>
                    {roleLabels[user.role]?.label}
                  </Badge>

                  <button
                    onClick={() => handleToggleActive(user._id, user.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      user.isActive 
                        ? 'hover:bg-red-500/20 text-green-400 hover:text-red-400'
                        : 'hover:bg-green-500/20 text-red-400 hover:text-green-400'
                    }`}
                    title={user.isActive ? 'Deactivate user' : 'Activate user'}
                  >
                    {user.isActive ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Users</span>
                <span className="text-white">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Users</span>
                <span className="text-white">{users.filter(u => u.isActive).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                Export Data
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                View Audit Logs
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                System Health Check
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
