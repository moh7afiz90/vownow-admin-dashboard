'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Mail, Shield, Ban, MoreVertical, Eye } from 'lucide-react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  signedUp: string;
  lastActive: string;
  questionnairesCompleted: number;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  onViewDetails: (user: User) => void;
  onBanUser: (userId: string) => void;
  onUnbanUser: (userId: string) => void;
  onChangeRole: (userId: string, role: 'user' | 'admin') => void;
  onEmailUser: (userId: string) => void;
  searchTerm: string;
  filterStatus: string;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

type SortField = 'name' | 'email' | 'signedUp' | 'lastActive' | 'questionnairesCompleted';
type SortOrder = 'asc' | 'desc';

export default function UserTable({
  users,
  loading,
  onViewDetails,
  onBanUser,
  onUnbanUser,
  onChangeRole,
  onEmailUser,
  searchTerm,
  filterStatus,
  currentPage,
  itemsPerPage,
  onPageChange,
}: UserTableProps) {
  const [sortField, setSortField] = useState<SortField>('signedUp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.name?.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'admin') {
        filtered = filtered.filter(user => user.role === 'admin');
      } else {
        filtered = filtered.filter(user => user.status === filterStatus);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'name') {
        aVal = a.name || a.email;
        bVal = b.name || b.email;
      }

      if (sortField === 'signedUp' || sortField === 'lastActive') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, filterStatus, sortField, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, endIndex);
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const getStatusBadge = (status: User['status']) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-yellow-500/20 text-yellow-400',
      banned: 'bg-red-500/20 text-red-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: User['role']) => {
    const styles = {
      user: 'bg-gray-500/20 text-gray-400',
      admin: 'bg-indigo-500/20 text-indigo-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {role}
      </span>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>User</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('signedUp')}
              >
                <div className="flex items-center space-x-1">
                  <span>Signed Up</span>
                  <SortIcon field="signedUp" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('lastActive')}
              >
                <div className="flex items-center space-x-1">
                  <span>Last Active</span>
                  <SortIcon field="lastActive" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('questionnairesCompleted')}
              >
                <div className="flex items-center space-x-1">
                  <span>Questionnaires</span>
                  <SortIcon field="questionnairesCompleted" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                  No users found matching your criteria
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{user.name || 'No name'}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {new Date(user.signedUp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {new Date(user.lastActive).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {user.questionnairesCompleted}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewDetails(user)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEmailUser(user.id)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onChangeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        className="p-1 text-gray-400 hover:text-white"
                        title="Toggle Admin Role"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      {user.status === 'banned' ? (
                        <button
                          onClick={() => onUnbanUser(user.id)}
                          className="p-1 text-green-400 hover:text-green-300"
                          title="Unban User"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onBanUser(user.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Ban User"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of{' '}
            {filteredAndSortedUsers.length} results
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="text-gray-500">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="px-6 py-3 bg-gray-900/50 border-t border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">
              Send Email
            </button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">
              Change Role
            </button>
            <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
              Ban Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}