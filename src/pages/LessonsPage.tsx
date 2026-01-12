import { useEffect, useState, useRef } from 'react';
import { adminService } from '../services/adminService';
import { DataTable } from '../components/DataTable';
import { LessonForm } from '../components/LessonForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Lesson } from '../types/admin';
import './LessonsPage.css';

export function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<Set<number>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const categoryDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced category filter effect
  useEffect(() => {
    if (categoryDebounceRef.current) {
      clearTimeout(categoryDebounceRef.current);
    }

    categoryDebounceRef.current = setTimeout(() => {
      setPage(1);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (categoryDebounceRef.current) {
        clearTimeout(categoryDebounceRef.current);
      }
    };
  }, [categoryFilter]);

  // Load lessons when page, search, or categoryFilter changes
  useEffect(() => {
    loadLessons();
  }, [page, search, categoryFilter]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getLessons({
        page,
        limit: 20,
        search: search.trim() || undefined,
        category: categoryFilter.trim() || undefined,
      });
      setLessons(response.lessons || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLesson(null);
    setShowForm(true);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowForm(true);
  };

  const handleDelete = (lesson: Lesson) => {
    setDeleteLesson(lesson);
  };

  const confirmDelete = async () => {
    if (!deleteLesson) return;

    try {
      await adminService.deleteLesson(deleteLesson.id);
      setDeleteLesson(null);
      loadLessons();
    } catch (err: any) {
      setError(err.message || 'Failed to delete lesson');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedLessons.size === 0) return;

    try {
      await adminService.batchDeleteLessons(Array.from(selectedLessons));
      setSelectedLessons(new Set());
      loadLessons();
    } catch (err: any) {
      setError(err.message || 'Failed to delete lessons');
    }
  };

  const toggleLessonSelection = (lessonId: number) => {
    const newSelected = new Set(selectedLessons);
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId);
    } else {
      newSelected.add(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const selectAllLessons = () => {
    if (selectedLessons.size === lessons.length) {
      setSelectedLessons(new Set());
    } else {
      setSelectedLessons(new Set(lessons.map(l => l.id)));
    }
  };

  const handleFormSubmit = async (data: { topic: string; category: string; summary: string }) => {
    try {
      setFormLoading(true);
      if (editingLesson) {
        await adminService.updateLesson(editingLesson.id, data);
      } else {
        await adminService.createLesson(data);
      }
      setShowForm(false);
      setEditingLesson(null);
      loadLessons();
    } catch (err: any) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'topic',
      label: 'Topic',
      sortable: true,
      render: (value: string) => <span className="lessons-page__topic">{value}</span>,
    },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'summary',
      label: 'Summary',
      sortable: false,
      render: (value: string) => (
        <span className="lessons-page__summary">{value.substring(0, 100)}...</span>
      ),
    },
    { key: 'user_email', label: 'User', sortable: true },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="lessons-page">
      <div className="lessons-page__header">
        <h1 className="lessons-page__title">Lessons Management</h1>
        <div className="lessons-page__header-actions">
          {selectedLessons.size > 0 && (
            <button
              className="lessons-page__batch-delete-button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedLessons.size} lesson(s)?`)) {
                  handleBatchDelete();
                }
              }}
            >
              Delete Selected ({selectedLessons.size})
            </button>
          )}
          <button className="lessons-page__create-button" onClick={handleCreate}>
            + Create Lesson
          </button>
        </div>
      </div>

      <div className="lessons-page__filters">
        <input
          type="text"
          placeholder="Search by topic or summary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lessons-page__search"
        />
        <input
          type="text"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="lessons-page__filter"
        />
      </div>

      {error && <div className="lessons-page__error">{error}</div>}

      <div className="lessons-page__table-container">
        <div className="lessons-page__table-header">
          <label className="lessons-page__select-all">
            <input
              type="checkbox"
              checked={selectedLessons.size === lessons.length && lessons.length > 0}
              onChange={selectAllLessons}
            />
            Select All
          </label>
        </div>
        <DataTable
          data={lessons}
          columns={[
            {
              key: 'id',
              label: '',
              sortable: false,
              render: (value: number) => (
                <input
                  type="checkbox"
                  checked={selectedLessons.has(value)}
                  onChange={() => toggleLessonSelection(value)}
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

      {showForm && (
        <div className="lessons-page__modal">
          <div className="lessons-page__modal-content">
            <h2>{editingLesson ? 'Edit Lesson' : 'Create Lesson'}</h2>
            <LessonForm
              lesson={editingLesson}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingLesson(null);
              }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      <div className="lessons-page__pagination">
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
        isOpen={!!deleteLesson}
        title="Delete Lesson"
        message={`Are you sure you want to delete lesson "${deleteLesson?.topic}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteLesson(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
