'use client';

import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import UserTable, { User } from '@/components/admin/users/UserTable';
import UserDetailsModal from '@/components/admin/users/UserDetailsModal';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: selectedFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: 'banned' });
        }
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: 'active' });
        }
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const handleChangeRole = async (userId: string, role: 'user' | 'admin') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, role });
        }
      }
    } catch (error) {
      console.error('Error changing user role:', error);
    }
  };

  const handleEmailUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      window.location.href = `mailto:${user.email}`;
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Name', 'Role', 'Status', 'Signed Up', 'Last Active', 'Questionnaires'],
      ...users.map(user => [
        user.email,
        user.name || '',
        user.role,
        user.status,
        user.signedUp,
        user.lastActive,
        user.questionnairesCompleted.toString(),
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1">Manage and monitor user accounts</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedFilter}
          onChange={(e) => {
            setSelectedFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
          <option value="admin">Admins</option>
        </select>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Users Table */}
      <UserTable
        users={users}
        loading={loading}
        onViewDetails={handleViewDetails}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        onChangeRole={handleChangeRole}
        onEmailUser={handleEmailUser}
        searchTerm={searchTerm}
        filterStatus={selectedFilter}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onBanUser={handleBanUser}
        onUnbanUser={handleUnbanUser}
        onChangeRole={handleChangeRole}
        onEmailUser={handleEmailUser}
      />
    </div>
  );
}