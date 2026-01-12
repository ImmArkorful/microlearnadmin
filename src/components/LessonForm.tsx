import { useState, useEffect } from 'react';
import type { Lesson } from '../types/admin';
import './Form.css';

interface LessonFormProps {
  lesson?: Lesson | null;
  onSubmit: (data: { topic: string; category: string; summary: string; quiz_data?: any; key_points?: string[] }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function LessonForm({ lesson, onSubmit, onCancel, loading = false }: LessonFormProps) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (lesson) {
      setTopic(lesson.topic);
      setCategory(lesson.category);
      setSummary(lesson.summary);
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!topic || !category || !summary) {
      setError('All fields are required');
      return;
    }

    try {
      await onSubmit({ topic, category, summary });
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson');
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="form__error">{error}</div>}

      <div className="form__field">
        <label htmlFor="topic">Topic *</label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form__field">
        <label htmlFor="category">Category *</label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="form__field">
        <label htmlFor="summary">Summary *</label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          disabled={loading}
          rows={6}
        />
      </div>

      <div className="form__actions">
        <button type="button" className="form__button form__button--cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="form__button form__button--submit" disabled={loading}>
          {loading ? 'Saving...' : lesson ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
