import React from 'react';

const STATUS_MAP = {
  DRAFT: { label: 'Draft', class: 'status-DRAFT' },
  SUBMITTED: { label: 'Submitted', class: 'status-SUBMITTED' },
  UNDER_REVIEW: { label: 'Under Review', class: 'status-UNDER_REVIEW' },
  NEEDS_INFORMATION: { label: 'Needs Information', class: 'status-NEEDS_INFORMATION' },
  POTENTIAL_DUPLICATE: { label: 'Potential Duplicate', class: 'status-POTENTIAL_DUPLICATE' },
  VALIDATED: { label: 'Validated', class: 'status-VALIDATED' },
  ASSIGNED: { label: 'Assigned', class: 'status-ASSIGNED' },
  IN_PROGRESS: { label: 'In Progress', class: 'status-IN_PROGRESS' },
  ACCEPTED: { label: 'Accepted', class: 'status-ACCEPTED' },
  DECLINED: { label: 'Declined', class: 'status-DECLINED' },
  RESOLVED: { label: 'Resolved', class: 'status-VALIDATED' },
  CLOSED: { label: 'Closed', class: 'status-DRAFT' },
  REJECTED: { label: 'Rejected', class: 'status-REJECTED' },
  PENDING: { label: 'Pending Action', class: 'status-UNDER_REVIEW' },
};

export default function StatusBadge({ status, className = '' }) {
  const norm = (status || '').toUpperCase();
  const config = STATUS_MAP[norm] || { label: status || 'Unknown', class: 'status-DRAFT' };

  return (
    <span className={`status-badge ${config.class} ${className}`}>
      {config.label}
    </span>
  );
}
