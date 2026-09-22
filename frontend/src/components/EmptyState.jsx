import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = '📋',
  title = 'No records found',
  message = 'There is currently no data available in this view.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && (actionTo ? (
        <Link to={actionTo} className="btn btn-primary" style={{ marginTop: '8px' }}>
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button onClick={onAction} className="btn btn-secondary" style={{ marginTop: '8px' }}>
          {actionLabel}
        </button>
      ) : null)}
    </div>
  );
}
