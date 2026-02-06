import { useEffect, useState, useRef } from 'react';
import { adminService } from '../services/adminService';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { QuizAttempt } from '../types/admin';
import './QuizAnswersPage.css';

export function QuizAnswersPage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [quizIdFilter, setQuizIdFilter] = useState('');
  const [correctFilter, setCorrectFilter] = useState('');
  const [deleteAttempt, setDeleteAttempt] = useState<QuizAttempt | null>(null);
  const [viewAttempt, setViewAttempt] = useState<QuizAttempt | null>(null);
  const [selectedAttempts, setSelectedAttempts] = useState<Set<number>>(new Set());
  const userIdDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const quizIdDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced user ID filter
  useEffect(() => {
    if (userIdDebounceRef.current) {
      clearTimeout(userIdDebounceRef.current);
    }

    userIdDebounceRef.current = setTimeout(() => {
      setPage(1);
    }, 500);

    return () => {
      if (userIdDebounceRef.current) {
        clearTimeout(userIdDebounceRef.current);
      }
    };
  }, [userIdFilter]);

  // Debounced quiz ID filter
  useEffect(() => {
    if (quizIdDebounceRef.current) {
      clearTimeout(quizIdDebounceRef.current);
    }

    quizIdDebounceRef.current = setTimeout(() => {
      setPage(1);
    }, 500);

    return () => {
      if (quizIdDebounceRef.current) {
        clearTimeout(quizIdDebounceRef.current);
      }
    };
  }, [quizIdFilter]);

  // Load attempts when page, userIdFilter, quizIdFilter, or correctFilter changes
  useEffect(() => {
    loadAttempts();
  }, [page, pageSize, userIdFilter, quizIdFilter, correctFilter]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getQuizAttempts({
        page,
        limit: pageSize,
        user_id: userIdFilter.trim() ? parseInt(userIdFilter.trim()) : undefined,
        quiz_id: quizIdFilter.trim() ? parseInt(quizIdFilter.trim()) : undefined,
        is_correct: correctFilter || undefined,
      });
      setAttempts(response.attempts || []);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (attempt: QuizAttempt) => {
    setDeleteAttempt(attempt);
  };

  const handleView = (attempt: QuizAttempt) => {
    setViewAttempt(attempt);
  };

  const confirmDelete = async () => {
    if (!deleteAttempt) return;

    try {
      await adminService.deleteQuizAttempt(deleteAttempt.id);
      setDeleteAttempt(null);
      loadAttempts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz attempt');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedAttempts.size === 0) return;

    try {
      await adminService.batchDeleteQuizAttempts(Array.from(selectedAttempts));
      setSelectedAttempts(new Set());
      loadAttempts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz attempts');
    }
  };

  const toggleAttemptSelection = (attemptId: number) => {
    const newSelected = new Set(selectedAttempts);
    if (newSelected.has(attemptId)) {
      newSelected.delete(attemptId);
    } else {
      newSelected.add(attemptId);
    }
    setSelectedAttempts(newSelected);
  };

  const selectAllAttempts = () => {
    if (selectedAttempts.size === attempts.length) {
      setSelectedAttempts(new Set());
    } else {
      setSelectedAttempts(new Set(attempts.map(a => a.id)));
    }
  };

  const calculateStats = () => {
    const total = attempts.length;
    const correct = attempts.filter(a => a.is_correct).length;
    const successRate = total > 0 ? ((correct / total) * 100).toFixed(2) : '0.00';
    return { total, correct, successRate };
  };

  const stats = calculateStats();

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'user_email', label: 'User', sortable: true },
    {
      key: 'quiz_question',
      label: 'Question',
      sortable: true,
      render: (value: string) => (
        <span className="quiz-answers-page__question">{value?.substring(0, 60)}...</span>
      ),
    },
    { key: 'selected_answer', label: 'Selected Answer', sortable: true },
    { key: 'correct_answer', label: 'Correct Answer', sortable: true },
    {
      key: 'is_correct',
      label: 'Result',
      sortable: true,
      render: (value: boolean) => (
        <span className={value ? 'quiz-answers-page__correct' : 'quiz-answers-page__incorrect'}>
          {value ? '✓ Correct' : '✗ Incorrect'}
        </span>
      ),
    },
    {
      key: 'attempted_at',
      label: 'Attempted At',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <div className="quiz-answers-page">
      <div className="quiz-answers-page__header">
        <div>
          <h1 className="quiz-answers-page__title">Quiz Answers Management</h1>
          {selectedAttempts.size > 0 && (
            <button
              className="quiz-answers-page__batch-delete-button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedAttempts.size} quiz attempt(s)?`)) {
                  handleBatchDelete();
                }
              }}
            >
              Delete Selected ({selectedAttempts.size})
            </button>
          )}
        </div>
        <div className="quiz-answers-page__stats">
          <div className="quiz-answers-page__stat">
            <span className="quiz-answers-page__stat-label">Total:</span>
            <span className="quiz-answers-page__stat-value">{stats.total}</span>
          </div>
          <div className="quiz-answers-page__stat">
            <span className="quiz-answers-page__stat-label">Success Rate:</span>
            <span className="quiz-answers-page__stat-value">{stats.successRate}%</span>
          </div>
        </div>
      </div>

      <div className="quiz-answers-page__filters">
        <input
          type="number"
          placeholder="Filter by User ID..."
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          className="quiz-answers-page__filter"
        />
        <input
          type="number"
          placeholder="Filter by Quiz ID..."
          value={quizIdFilter}
          onChange={(e) => setQuizIdFilter(e.target.value)}
          className="quiz-answers-page__filter"
        />
        <select
          value={correctFilter}
          onChange={(e) => {
            setCorrectFilter(e.target.value);
            setPage(1);
          }}
          className="quiz-answers-page__filter"
        >
          <option value="">All Results</option>
          <option value="true">Correct Only</option>
          <option value="false">Incorrect Only</option>
        </select>
      </div>

      {error && <div className="quiz-answers-page__error">{error}</div>}

      <div className="quiz-answers-page__table-container">
        <div className="quiz-answers-page__table-header">
          <label className="quiz-answers-page__select-all">
            <input
              type="checkbox"
              checked={selectedAttempts.size === attempts.length && attempts.length > 0}
              onChange={selectAllAttempts}
            />
            Select All
          </label>
        </div>
        <DataTable
          data={attempts}
          columns={[
            {
              key: 'id',
              label: '',
              sortable: false,
              render: (value: number) => (
                <input
                  type="checkbox"
                  checked={selectedAttempts.has(value)}
                  onChange={() => toggleAttemptSelection(value)}
                />
              ),
            },
            ...columns,
          ]}
          onView={handleView}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <div className="quiz-answers-page__pagination">
        <label className="quiz-answers-page__rows">
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

      {viewAttempt && (
        <div className="quiz-answers-page__modal" onClick={() => setViewAttempt(null)}>
          <div className="quiz-answers-page__modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Quiz Attempt Details</h2>
            <div className="quiz-answers-page__details">
              <div className="quiz-answers-page__detail">
                <strong>User:</strong> {viewAttempt.user_email}
              </div>
              <div className="quiz-answers-page__detail">
                <strong>Question:</strong> {viewAttempt.quiz_question}
              </div>
              <div className="quiz-answers-page__detail">
                <strong>Selected Answer:</strong> {viewAttempt.selected_answer}
              </div>
              <div className="quiz-answers-page__detail">
                <strong>Correct Answer:</strong> {viewAttempt.correct_answer}
              </div>
              <div className="quiz-answers-page__detail">
                <strong>Result:</strong>{' '}
                <span className={viewAttempt.is_correct ? 'quiz-answers-page__correct' : 'quiz-answers-page__incorrect'}>
                  {viewAttempt.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <div className="quiz-answers-page__detail">
                <strong>Attempted At:</strong> {new Date(viewAttempt.attempted_at).toLocaleString()}
              </div>
            </div>
            <button
              className="quiz-answers-page__close-button"
              onClick={() => setViewAttempt(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteAttempt}
        title="Delete Quiz Attempt"
        message="Are you sure you want to delete this quiz attempt? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAttempt(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
