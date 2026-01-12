import { useEffect, useState, useRef } from 'react';
import { adminService } from '../services/adminService';
import { DataTable } from '../components/DataTable';
import { UserForm } from '../components/UserForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { User } from '../types/admin';
import './UsersPage.css';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  // Load users when page, search, or roleFilter changes
  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsers({
        page,
        limit: 20,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      setUsers(response.users || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (user: User) => {
    setDeleteUser(user);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;

    try {
      await adminService.deleteUser(deleteUser.id);
      setDeleteUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUsers.size === 0) return;

    try {
      await adminService.batchDeleteUsers(Array.from(selectedUsers));
      setSelectedUsers(new Set());
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete users');
    }
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleFormSubmit = async (data: { email: string; role: 'user' | 'admin' }) => {
    try {
      setFormLoading(true);
      if (editingUser) {
        await adminService.updateUser(editingUser.id, data);
      } else {
        // Note: Creating users through admin panel would require a different endpoint
        // For now, we'll just show an error
        throw new Error('User creation through admin panel not yet implemented');
      }
      setShowForm(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className={`users-page__role users-page__role--${value}`}>{value}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'lessons_count',
      label: 'Lessons',
      sortable: true,
      render: (value: number) => value || 0,
    },
    {
      key: 'quiz_attempts_count',
      label: 'Quiz Attempts',
      sortable: true,
      render: (value: number) => value || 0,
    },
  ];

  return (
    <div className="users-page">
      <div className="users-page__header">
        <h1 className="users-page__title">Users Management</h1>
        <div className="users-page__header-actions">
          {selectedUsers.size > 0 && (
            <button
              className="users-page__batch-delete-button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?`)) {
                  handleBatchDelete();
                }
              }}
            >
              Delete Selected ({selectedUsers.size})
            </button>
          )}
          <button className="users-page__create-button" onClick={handleCreate}>
            + Create User
          </button>
        </div>
      </div>

      <div className="users-page__filters">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="users-page__search"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="users-page__filter"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <div className="users-page__error">{error}</div>}

      {showForm && (
        <div className="users-page__modal">
          <div className="users-page__modal-content">
            <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
            <UserForm
              user={editingUser}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingUser(null);
              }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      <div className="users-page__table-container">
        <div className="users-page__table-header">
          <label className="users-page__select-all">
            <input
              type="checkbox"
              checked={selectedUsers.size === users.length && users.length > 0}
              onChange={selectAllUsers}
            />
            Select All
          </label>
        </div>
        <DataTable
          data={users}
          columns={[
            {
              key: 'id',
              label: '',
              sortable: false,
              render: (value: number) => (
                <input
                  type="checkbox"
                  checked={selectedUsers.has(value)}
                  onChange={() => toggleUserSelection(value)}
                />
              ),
            },
            ...columns,
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <div className="users-page__pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
        >
          Next
        </button>
      </div>

      <ConfirmDialog
        isOpen={!!deleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteUser?.email}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteUser(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
