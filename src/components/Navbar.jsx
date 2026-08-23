import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Navbar = () => {
  const { activeTab, setActiveTab, theme, toggleTheme, user, loginWithGoogle, logout, isConnected, isDemoMode, setActiveModal } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar navbar-expand-lg border-bottom sticky-top shadow-sm" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', zIndex: 1050 }}>
      <div className="container-fluid px-3 px-md-4">
        <a href="/dashboard" className="d-flex align-items-center gap-2 brand me-lg-4 me-xl-5 text-decoration-none" onClick={(e) => { e.preventDefault(); handleTabClick('dashboard'); }}>
          <div className="brand-icon">
            <i className="bi bi-box-seam-fill text-white fs-5"></i>
          </div>
          <span className="fw-bold fs-5 text-reset font-outfit">Factory Flow</span>
        </a>

        {/* Navigation Items (Only visible when user is logged in) */}
        {user && (
          <nav className={`nav-links ms-lg-2 ms-xl-3 ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="/dashboard" className={`nav-btn btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('dashboard'); }}>
              <i className="bi bi-grid-fill me-1"></i>
              Dashboard
            </a>
            <a href="/factories" className={`nav-btn btn ${activeTab === 'factories' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('factories'); }}>
              <i className="bi bi-building-gear me-1"></i>
              Factories
            </a>
            <a href="/customers" className={`nav-btn btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('customers'); }}>
              <i className="bi bi-people-fill me-1"></i>
              Customers
            </a>
            <a href="/box-details" className={`nav-btn btn ${activeTab === 'products' || activeTab === 'box-details' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('box-details'); }}>
              <i className="bi bi-box-seam-fill me-1"></i>
              Box Details
            </a>
            <a href="/orders" className={`nav-btn btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('orders'); }}>
              <i className="bi bi-bag-check-fill me-1"></i>
              Orders
            </a>
            <a href="/payments" className={`nav-btn btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('payments'); }}>
              <i className="bi bi-credit-card-2-front-fill me-1"></i>
              Payments
            </a>
            <a href="/reports" className={`nav-btn btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabClick('reports'); }}>
              <i className="bi bi-bar-chart-line-fill me-1"></i>
              Reports
            </a>

            <div className="mobile-auth-section d-lg-none mt-3 pt-3 border-top">
              <button
                className={`btn btn-sm w-100 ${isConnected && !isDemoMode ? 'badge-success' : 'badge-warning'}`}
                onClick={() => { setActiveModal('firebase'); setMobileMenuOpen(false); }}
                style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected && !isDemoMode ? '#10b981' : '#f59e0b' }}></span>
                {isConnected && !isDemoMode ? 'Cloud Live' : 'Demo Mode (Offline)'}
              </button>
              <button className="btn btn-secondary btn-sm w-100" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                <i className="bi bi-box-arrow-right me-1"></i>
                {user.displayName || user.email}
              </button>
            </div>
          </nav>
        )}

        <div className="d-flex align-items-center gap-2 ms-auto">
          <button
            className={`btn btn-sm d-none d-md-inline-flex align-items-center gap-1 ${isConnected && !isDemoMode ? 'badge-success' : 'badge-warning'}`}
            onClick={() => setActiveModal('firebase')}
            title="Click to view or update Firebase connection settings"
            style={{ fontSize: '0.78rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', cursor: 'pointer' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected && !isDemoMode ? '#10b981' : '#f59e0b', boxShadow: isConnected && !isDemoMode ? '0 0 6px #10b981' : '0 0 6px #f59e0b' }}></span>
            {isConnected && !isDemoMode ? 'Cloud Live' : 'Demo Mode'}
          </button>

          <button className="btn btn-secondary theme-toggle-btn rounded-circle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
            {theme === 'dark' ? <i className="bi bi-sun-fill text-warning"></i> : <i className="bi bi-moon-stars-fill text-primary"></i>}
          </button>

          {user ? (
            <button className="btn btn-secondary btn-sm d-none d-md-inline-flex align-items-center gap-1" onClick={logout}>
              <i className="bi bi-box-arrow-right"></i>
              {user.displayName || user.email}
            </button>
          ) : (
            <button className="btn btn-primary btn-sm d-none d-md-inline-flex align-items-center gap-1" onClick={loginWithGoogle}>
              <i className="bi bi-box-arrow-in-right"></i>
              Google Login
            </button>
          )}

          {user && (
            <button className="btn btn-secondary d-lg-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <i className="bi bi-x-lg"></i> : <i className="bi bi-list fs-5"></i>}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
