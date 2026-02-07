import React, { useState } from 'react';
import { nudgeAction } from '../services/api';

export default function NudgeCard({ nudge, refresh }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [acting, setActing] = useState(false);

  const handleAction = async (action) => {
    setActing(true);
    try {
      await nudgeAction(nudge.id, action);
      await refresh();
    } finally {
      setActing(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className={`nudge-card priority-${nudge.priority}`}>
      <div className="nudge-header">
        <span className="nudge-role">{nudge.target_role}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge badge-${nudge.priority}`}>{nudge.priority}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(nudge.created_at)}</span>
        </div>
      </div>
      <div className="nudge-message">{nudge.message}</div>

      <button
        className="btn btn-sm"
        style={{ marginBottom: 8, fontSize: 11, color: 'var(--accent)' }}
        onClick={() => setShowExplanation(!showExplanation)}
      >
        {showExplanation ? 'Hide' : 'Why am I seeing this?'}
      </button>

      {showExplanation && (
        <div className="nudge-explanation">
          <div className="nudge-explanation-label">Why am I seeing this?</div>
          {nudge.explanation}
        </div>
      )}

      <div className="nudge-actions">
        <button
          className="btn btn-sm btn-accent"
          onClick={() => handleAction('acknowledge')}
          disabled={acting}
        >
          Acknowledge
        </button>
        <button
          className="btn btn-sm"
          onClick={() => handleAction('dismiss')}
          disabled={acting}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
