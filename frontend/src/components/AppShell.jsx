import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true, state: {} });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="topbar-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 768) {
                setMobileOpen(!mobileOpen);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            title="Toggle navigation sidebar"
          >
            ☰
          </button>

          <Link to="/" className="topbar-brand">
            <div className="topbar-emblem">
              <img src="/logo.png" alt="SamadhanSetu Logo" className="topbar-logo-image" />
            </div>
            <span className="topbar-title">SamadhanSetu</span>
            <span className="topbar-badge">Jharkhand</span>
          </Link>
        </div>

        <div className="topbar-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search portal, challenges, IDs..."
            aria-label="Search portal"
          />
        </div>

        <div className="topbar-right">
          {user && (
            <div className="topbar-user">
              <div className="topbar-avatar">
                {getInitials(user.full_name)}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user.full_name}</span>
                <span className="topbar-user-role">{user.role}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-logout"
                title="Sign out of portal"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* App Body with Sidebar and Main Content */}
      <div className="app-body">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
