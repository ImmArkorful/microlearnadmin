import { useEffect, useState, useRef } from 'react';
import { adminService } from '../services/adminService';
import { DataTable } from '../components/DataTable';
import { QuizForm } from '../components/QuizForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Quiz } from '../types/admin';
import { adminAnalytics } from '../services/adminAnalytics';
import './QuizzesPage.css';

export function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<number>>(new Set());
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

  // Load quizzes when page, search, categoryFilter, or difficultyFilter changes
  useEffect(() => {
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, categoryFilter, difficultyFilter]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getQuizzes({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        category: categoryFilter.trim() || undefined,
        difficulty: difficultyFilter || undefined,
      });
      setQuizzes(response.quizzes || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuiz(null);
    setShowForm(true);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setShowForm(true);
  };

  const handleDelete = (quiz: Quiz) => {
    setDeleteQuiz(quiz);
  };

  const handleToggleActive = async (quiz: Quiz) => {
    try {
      const nextIsActive = !quiz.is_active;
      await adminService.updateQuiz(quiz.id, { is_active: nextIsActive });
      adminAnalytics.track('admin_quiz_status_toggled', {
        quiz_id: quiz.id,
        previous_is_active: quiz.is_active,
        next_is_active: nextIsActive,
        category: quiz.category,
      });
      loadQuizzes();
    } catch (err: any) {
      setError(err.message || 'Failed to update quiz');
    }
  };

  const confirmDelete = async () => {
    if (!deleteQuiz) return;

    try {
      await adminService.deleteQuiz(deleteQuiz.id);
      setDeleteQuiz(null);
      loadQuizzes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedQuizzes.size === 0) return;

    try {
      await adminService.batchDeleteQuizzes(Array.from(selectedQuizzes));
      setSelectedQuizzes(new Set());
      loadQuizzes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quizzes');
    }
  };

  const toggleQuizSelection = (quizId: number) => {
    const newSelected = new Set(selectedQuizzes);
    if (newSelected.has(quizId)) {
      newSelected.delete(quizId);
    } else {
      newSelected.add(quizId);
    }
    setSelectedQuizzes(newSelected);
  };

  const selectAllQuizzes = () => {
    if (selectedQuizzes.size === quizzes.length) {
      setSelectedQuizzes(new Set());
    } else {
      setSelectedQuizzes(new Set(quizzes.map(q => q.id)));
    }
  };

  const handleFormSubmit = async (data: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => {
    try {
      setFormLoading(true);
      if (editingQuiz) {
        await adminService.updateQuiz(editingQuiz.id, data);
      } else {
        await adminService.createQuiz(data);
      }
      setShowForm(false);
      setEditingQuiz(null);
      loadQuizzes();
    } catch (err: any) {
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'question',
      label: 'Question',
      sortable: true,
      render: (value: string) => <span className="quizzes-page__question">{value.substring(0, 80)}...</span>,
    },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'difficulty',
      label: 'Difficulty',
      sortable: true,
      render: (value: string) => (
        <span className={`quizzes-page__difficulty quizzes-page__difficulty--${value}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'correct_answer',
      label: 'Correct Answer',
      sortable: true,
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={value ? 'quizzes-page__status--active' : 'quizzes-page__status--inactive'}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="quizzes-page">
      <div className="quizzes-page__header">
        <h1 className="quizzes-page__title">Quizzes Management</h1>
        <div className="quizzes-page__header-actions">
          {selectedQuizzes.size > 0 && (
            <button
              className="quizzes-page__batch-delete-button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedQuizzes.size} quiz(zes)?`)) {
                  handleBatchDelete();
                }
              }}
            >
              Delete Selected ({selectedQuizzes.size})
            </button>
          )}
          <button className="quizzes-page__create-button" onClick={handleCreate}>
            + Create Quiz
          </button>
        </div>
      </div>

      <div className="quizzes-page__filters">
        <input
          type="text"
          placeholder="Search by question..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="quizzes-page__search"
        />
        <input
          type="text"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="quizzes-page__filter"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => {
            setDifficultyFilter(e.target.value);
            setPage(1);
          }}
          className="quizzes-page__filter"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {error && <div className="quizzes-page__error">{error}</div>}

      <div className="quizzes-page__table-container">
        <div className="quizzes-page__table-header">
          <label className="quizzes-page__select-all">
            <input
              type="checkbox"
              checked={selectedQuizzes.size === quizzes.length && quizzes.length > 0}
              onChange={selectAllQuizzes}
            />
            Select All
          </label>
        </div>
        <DataTable
          data={quizzes}
          columns={[
            {
              key: 'id',
              label: '',
              sortable: false,
              render: (value: number) => (
                <input
                  type="checkbox"
                  checked={selectedQuizzes.has(value)}
                  onChange={() => toggleQuizSelection(value)}
                />
              ),
            },
            ...columns,
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          actions={[
            {
              label: (quiz: Quiz) => quiz.is_active ? 'Deactivate' : 'Activate',
              onClick: handleToggleActive,
              className: 'quizzes-page__toggle-action',
            },
          ]}
          loading={loading}
        />
      </div>

      {showForm && (
        <div className="quizzes-page__modal">
          <div className="quizzes-page__modal-content">
            <h2>{editingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h2>
            <QuizForm
              quiz={editingQuiz}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingQuiz(null);
              }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      <div className="quizzes-page__pagination">
        <label className="quizzes-page__rows">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
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
        isOpen={!!deleteQuiz}
        title="Delete Quiz"
        message={`Are you sure you want to delete this quiz? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteQuiz(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
