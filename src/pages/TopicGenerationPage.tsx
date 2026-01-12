import { useState, useEffect, useRef } from 'react';
import { adminService } from '../services/adminService';
import type { Lesson } from '../types/admin';
import './TopicGenerationPage.css';

const CATEGORIES = [
  'Science',
  'Technology',
  'History',
  'Arts',
  'Business',
  'Health',
  'Education',
  'Sports',
  'Travel',
  'Food',
  'General',
];

interface PreviewTopic {
  topic: string;
  category: string;
  index: number;
}

export function TopicGenerationPage() {
  const [count, setCount] = useState(5);
  const [category, setCategory] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewTopics, setPreviewTopics] = useState<PreviewTopic[]>([]);
  const [generatedTopics, setGeneratedTopics] = useState<Lesson[]>([]);
  const [topicStatuses, setTopicStatuses] = useState<Map<string, 'pending' | 'generating' | 'completed' | 'failed'>>(new Map());
  const [generationProgress, setGenerationProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    current: string | null;
    status: 'generating' | 'completed';
  } | null>(null);
  const [previewProgress, setPreviewProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    current: string | null;
    status: 'generating' | 'completed';
  } | null>(null);
  const progressIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewProgressIdRef = useRef<string | null>(null);
  const previewProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for preview progress updates
  useEffect(() => {
    if (previewLoading && previewProgressIdRef.current) {
      previewProgressIntervalRef.current = setInterval(async () => {
        try {
          const progress = await adminService.getGenerationProgress(previewProgressIdRef.current!);
          setPreviewProgress({
            total: progress.total,
            completed: progress.completed,
            failed: progress.failed,
            current: progress.current,
            status: progress.status
          });
          
          if (progress.status === 'completed') {
            setPreviewLoading(false);
            if (previewProgressIntervalRef.current) {
              clearInterval(previewProgressIntervalRef.current);
              previewProgressIntervalRef.current = null;
            }
            // Convert generated topics to preview format
            if (progress.generated && Array.isArray(progress.generated)) {
              const topics = progress.generated.map((t: any, idx: number) => ({
                topic: t.topic || t,
                category: t.category || 'General',
                index: idx + 1
              }));
              setPreviewTopics(topics);
            }
            if (progress.errors && progress.errors.length > 0) {
              setError(`Some topics failed to preview: ${progress.errors.map((e: any) => `Topic ${e.index || ''}: ${e.error}`).join(', ')}`);
            }
          }
        } catch (err) {
          console.error('Error fetching preview progress:', err);
        }
      }, 1000);
    }

    return () => {
      if (previewProgressIntervalRef.current) {
        clearInterval(previewProgressIntervalRef.current);
        previewProgressIntervalRef.current = null;
      }
    };
  }, [previewLoading, count, category]);

  const handlePreview = async () => {
    if (count < 1 || count > 50) {
      setError('Count must be between 1 and 50');
      return;
    }

    setPreviewLoading(true);
    setError('');
    setSuccess('');
    setPreviewTopics([]);
    setGeneratedTopics([]);
    setPreviewProgress({
      total: count,
      completed: 0,
      failed: 0,
      current: null,
      status: 'generating'
    });

    // Generate unique progress ID
    previewProgressIdRef.current = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Start preview (non-blocking)
      adminService.previewTopics({
        count,
        category: category || undefined,
        progressId: previewProgressIdRef.current
      }).catch(err => {
        console.error('Preview error:', err);
        setError(err.message || 'Failed to preview topics');
        setPreviewLoading(false);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start preview');
      setPreviewLoading(false);
    }
  };

  const handleRemoveTopic = (index: number) => {
    setPreviewTopics(prev => prev.filter(t => t.index !== index));
  };

  // Poll for progress updates
  useEffect(() => {
    if (generating && progressIdRef.current) {
      progressIntervalRef.current = setInterval(async () => {
        try {
          const progress = await adminService.getGenerationProgress(progressIdRef.current!);
          setGenerationProgress({
            total: progress.total,
            completed: progress.completed,
            failed: progress.failed,
            current: progress.current,
            status: progress.status
          });
          setGeneratedTopics(progress.generated);
          
          if (progress.status === 'completed') {
            setGenerating(false);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setSuccess(`Successfully generated ${progress.completed} out of ${progress.total} lessons!`);
            if (progress.errors && progress.errors.length > 0) {
              setError(`Some lessons failed to generate: ${progress.errors.map(e => `${e.topic}: ${e.error}`).join(', ')}`);
            }
            setPreviewTopics([]);
          }
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }, 1000); // Poll every second
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [generating]);

  const handleGenerateSelected = async () => {
    if (previewTopics.length === 0) {
      setError('Please preview and select at least one topic to generate');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');
    setGeneratedTopics([]);
    setGenerationProgress({
      total: previewTopics.length,
      completed: 0,
      failed: 0,
      current: null,
      status: 'generating'
    });
    
    // Initialize topic statuses
    const initialStatuses = new Map<string, 'pending' | 'generating' | 'completed' | 'failed'>();
    previewTopics.forEach(t => {
      initialStatuses.set(t.topic, 'pending');
    });
    setTopicStatuses(initialStatuses);

    // Generate unique progress ID
    progressIdRef.current = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Start generation (non-blocking)
      adminService.generateTopicsFromList({
        topics: previewTopics.map(t => ({ topic: t.topic, category: t.category })),
        progressId: progressIdRef.current
      }).catch(err => {
        console.error('Generation error:', err);
        setError(err.message || 'Failed to generate lessons');
        setGenerating(false);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
      setGenerating(false);
    }
  };

  return (
    <div className="topic-generation-page">
      <h1 className="topic-generation-page__title">Generate Topics</h1>
      <p className="topic-generation-page__subtitle">
        Generate random educational topics to populate the database
      </p>

      <div className="topic-generation-page__form">
        <div className="topic-generation-page__field">
          <label htmlFor="count">Number of Topics</label>
          <input
            id="count"
            type="number"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            disabled={previewLoading || generating}
          />
          <span className="topic-generation-page__hint">Between 1 and 50</span>
        </div>

        <div className="topic-generation-page__field">
          <label htmlFor="category">Category (Optional)</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={previewLoading || generating}
          >
            <option value="">Random Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="topic-generation-page__hint">
            Leave empty to generate topics in random categories
          </span>
        </div>

        <button
          className="topic-generation-page__preview-button"
          onClick={handlePreview}
          disabled={previewLoading || generating || count < 1 || count > 50}
        >
          {previewLoading ? 'Previewing Topics...' : `Preview ${count} Topic${count !== 1 ? 's' : ''}`}
        </button>
      </div>

      {error && <div className="topic-generation-page__error">{error}</div>}
      {success && <div className="topic-generation-page__success">{success}</div>}

      {previewLoading && previewProgress && (
        <div className="topic-generation-page__loading">
          <div className="topic-generation-page__spinner"></div>
          <div className="topic-generation-page__progress">
            <p className="topic-generation-page__progress-text">
              Previewing topics... {previewProgress.completed} of {previewProgress.total} completed
            </p>
            {previewProgress.current && (
              <p className="topic-generation-page__current-topic">
                Currently generating: <strong>{previewProgress.current}</strong>
              </p>
            )}
            <div className="topic-generation-page__progress-bar">
              <div 
                className="topic-generation-page__progress-fill"
                style={{ width: `${(previewProgress.completed / previewProgress.total) * 100}%` }}
              ></div>
            </div>
            {previewProgress.failed > 0 && (
              <p className="topic-generation-page__progress-errors">
                {previewProgress.failed} topic(s) failed to preview
              </p>
            )}
          </div>
        </div>
      )}

      {previewTopics.length > 0 && (
        <div className="topic-generation-page__preview">
          <div className="topic-generation-page__preview-header">
            <h2 className="topic-generation-page__preview-title">
              Preview Topics ({previewTopics.length} selected)
            </h2>
            <button
              className="topic-generation-page__generate-button"
              onClick={handleGenerateSelected}
              disabled={generating || previewTopics.length === 0}
            >
              {generating ? `Generating ${previewTopics.length} Lesson${previewTopics.length !== 1 ? 's' : ''}...` : `Generate ${previewTopics.length} Lesson${previewTopics.length !== 1 ? 's' : ''}`}
            </button>
          </div>
          <div className="topic-generation-page__preview-list">
            {previewTopics.map((previewTopic) => {
              const topicStatus = topicStatuses.get(previewTopic.topic) || 'pending';
              const isGenerating = topicStatus === 'generating';
              const isFailed = topicStatus === 'failed';
              
              return (
                <div key={previewTopic.index} className={`topic-generation-page__preview-item ${isGenerating ? 'topic-generation-page__preview-item--generating' : ''} ${isFailed ? 'topic-generation-page__preview-item--failed' : ''}`}>
                  <div className="topic-generation-page__preview-content">
                    <h3 className="topic-generation-page__preview-topic">{previewTopic.topic}</h3>
                    <span className="topic-generation-page__preview-category">{previewTopic.category}</span>
                    {isGenerating && (
                      <span className="topic-generation-page__status-badge topic-generation-page__status-badge--generating">
                        Generating...
                      </span>
                    )}
                    {isFailed && (
                      <span className="topic-generation-page__status-badge topic-generation-page__status-badge--failed">
                        Failed
                      </span>
                    )}
                  </div>
                  <button
                    className="topic-generation-page__remove-button"
                    onClick={() => handleRemoveTopic(previewTopic.index)}
                    disabled={generating}
                    title="Remove topic"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {generating && generationProgress && (
        <div className="topic-generation-page__loading">
          <div className="topic-generation-page__spinner"></div>
          <div className="topic-generation-page__progress">
            <p className="topic-generation-page__progress-text">
              Generating lessons... {generationProgress.completed} of {generationProgress.total} completed
            </p>
            {generationProgress.current && (
              <p className="topic-generation-page__current-topic">
                Currently generating: <strong>{generationProgress.current}</strong>
              </p>
            )}
            <div className="topic-generation-page__progress-bar">
              <div 
                className="topic-generation-page__progress-fill"
                style={{ width: `${(generationProgress.completed / generationProgress.total) * 100}%` }}
              ></div>
            </div>
            {generationProgress.failed > 0 && (
              <p className="topic-generation-page__progress-errors">
                {generationProgress.failed} lesson(s) failed to generate
              </p>
            )}
          </div>
        </div>
      )}

      {generatedTopics.length > 0 && (
        <div className="topic-generation-page__results">
          <h2 className="topic-generation-page__results-title">Generated Topics</h2>
          <div className="topic-generation-page__topics-list">
            {generatedTopics.map((topic) => (
              <div key={topic.id} className="topic-generation-page__topic-card">
                <div className="topic-generation-page__topic-header">
                  <h3 className="topic-generation-page__topic-name">{topic.topic}</h3>
                  <span className="topic-generation-page__topic-category">{topic.category}</span>
                </div>
                <p className="topic-generation-page__topic-summary">
                  {topic.summary?.substring(0, 150)}...
                </p>
                <div className="topic-generation-page__topic-meta">
                  <span>ID: {topic.id}</span>
                  <span>Created: {new Date(topic.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
