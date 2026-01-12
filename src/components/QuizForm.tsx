import { useState, useEffect } from 'react';
import type { Quiz } from '../types/admin';
import './Form.css';

interface QuizFormProps {
  quiz?: Quiz | null;
  onSubmit: (data: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function QuizForm({ quiz, onSubmit, onCancel, loading = false }: QuizFormProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState('');

  useEffect(() => {
    if (quiz) {
      setQuestion(quiz.question);
      setOptions(quiz.options || ['', '', '', '']);
      setCorrectAnswer(quiz.correct_answer);
      setExplanation(quiz.explanation || '');
      setCategory(quiz.category || '');
      setDifficulty(quiz.difficulty);
    }
  }, [quiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question) {
      setError('Question is required');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    if (!correctAnswer || !validOptions.includes(correctAnswer)) {
      setError('Correct answer must be one of the options');
      return;
    }

    try {
      await onSubmit({
        question,
        options: validOptions,
        correct_answer: correctAnswer,
        explanation: explanation || undefined,
        category: category || undefined,
        difficulty,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz');
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="form__error">{error}</div>}

      <div className="form__field">
        <label htmlFor="question">Question *</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="form__field">
        <label>Options *</label>
        {options.map((option, index) => (
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index] = e.target.value;
                setOptions(newOptions);
              }}
              placeholder={`Option ${index + 1}`}
              disabled={loading}
            />
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === option}
              onChange={() => setCorrectAnswer(option)}
              disabled={loading || !option.trim()}
              style={{ marginLeft: '0.5rem' }}
            />
            <label style={{ marginLeft: '0.25rem', fontSize: '0.875rem' }}>Correct</label>
          </div>
        ))}
      </div>

      <div className="form__field">
        <label htmlFor="explanation">Explanation</label>
        <textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="form__field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form__field">
        <label htmlFor="difficulty">Difficulty *</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          required
          disabled={loading}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="form__actions">
        <button type="button" className="form__button form__button--cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="form__button form__button--submit" disabled={loading}>
          {loading ? 'Saving...' : quiz ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
