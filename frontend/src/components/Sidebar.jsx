import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  return (
    <aside
      className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Sidebar navigation"
    >
      <div className="sidebar-nav">
        <span className="sidebar-section-title">
          {!collapsed && 'Main Navigation'}
        </span>

        {/* Citizen Nav */}
        {role === 'citizen' && (
          <>
            <NavLink
              to="/dashboard/citizen"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Dashboard"
            >
              <span className="sidebar-icon">📊</span>
              {!collapsed && <span className="sidebar-label">Dashboard</span>}
            </NavLink>

            <NavLink
              to="/citizen/challenges"
              end
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="My Challenges"
            >
              <span className="sidebar-icon">📋</span>
              {!collapsed && <span className="sidebar-label">My Challenges</span>}
            </NavLink>

            <NavLink
              to="/citizen/challenges/new"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Report a Challenge"
            >
              <span className="sidebar-icon">➕</span>
              {!collapsed && <span className="sidebar-label">Report Challenge</span>}
            </NavLink>
          </>
        )}

        {/* Admin Nav */}
        {role === 'admin' && (
          <>
            <NavLink
              to="/dashboard/admin"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Overview"
            >
              <span className="sidebar-icon">📊</span>
              {!collapsed && <span className="sidebar-label">Dashboard</span>}
            </NavLink>

            <NavLink
              to="/admin/challenges"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Review Queue"
            >
              <span className="sidebar-icon">🔍</span>
              {!collapsed && <span className="sidebar-label">Review Queue</span>}
            </NavLink>
          </>
        )}

        {/* Government Nav */}
        {role === 'government' && (
          <>
            <NavLink
              to="/dashboard/government"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Oversight"
            >
              <span className="sidebar-icon">🏛️</span>
              {!collapsed && <span className="sidebar-label">Dashboard</span>}
            </NavLink>

            <NavLink
              to="/admin/challenges"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Inspection Queue"
            >
              <span className="sidebar-icon">📋</span>
              {!collapsed && <span className="sidebar-label">Review Queue</span>}
            </NavLink>
          </>
        )}

        {/* University Nav */}
        {role === 'university' && (
          <>
            <NavLink
              to="/dashboard/university"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="University Portal"
            >
              <span className="sidebar-icon">🎓</span>
              {!collapsed && <span className="sidebar-label">Portal & Matches</span>}
            </NavLink>
          </>
        )}

        {/* Industry Nav */}
        {role === 'industry' && (
          <>
            <NavLink
              to="/dashboard/industry"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title="Industry Dashboard"
            >
              <span className="sidebar-icon">🏭</span>
              {!collapsed && <span className="sidebar-label">Industry Portal</span>}
            </NavLink>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        {!collapsed && user.district && (
          <div style={{ padding: '8px 12px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            📍 District: <strong>{user.district}</strong>
          </div>
        )}
      </div>
    </aside>
  );
}
