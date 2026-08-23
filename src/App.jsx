import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Orders } from './components/Orders';
import { Products } from './components/Products';
import { Factories } from './components/Factories';
import { Customers } from './components/Customers';
import { Payments } from './components/Payments';
import { Reports } from './components/Reports';

import { FactoryModal } from './components/modals/FactoryModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { BoxModal } from './components/modals/BoxModal';
import { OrderModal } from './components/modals/OrderModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { LightboxModal } from './components/modals/LightboxModal';
import { FirebaseModal } from './components/modals/FirebaseModal';

export const App = () => {
  const { activeTab, activeModal, syncNotice, setSyncNotice, user, loginWithGoogle, startDemoMode, setActiveModal, theme } = useApp();

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme === 'dark' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  return (
    <>
      <Navbar />

      <main className="container-fluid px-3 px-md-4 py-3 flex-grow-1">
        {syncNotice && (
          <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center justify-content-between mb-4 shadow-sm" role="alert">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              <span>{syncNotice}</span>
            </div>
            <button type="button" className="btn-close" onClick={() => setSyncNotice(null)} aria-label="Close"></button>
          </div>
        )}

        {!user ? (
          <div className="auth-hero-section py-4">
            <div className="auth-ambient-glow"></div>

            <div className="auth-hero-grid">
              {/* Left Side: Feature Pills Stack */}
              <div className="auth-feature-list">
                <div className="auth-feature-pill">
                  <div className="auth-pill-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                    <i className="bi bi-building-gear text-white fs-5"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Factories Management</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Factory contacts, plant locations & pending balance dues</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-pill-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <i className="bi bi-people-fill text-white fs-5"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Customers Directory</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Client accounts & delivery address details</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-pill-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                    <i className="bi bi-box-seam-fill text-white fs-5"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Box Specifications Catalog</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>L×W×H, Ply, GSM, BF, Inner/Outer, Rate & Margin</div>
                  </div>
                </div>

                <div className="auth-feature-pill">
                  <div className="auth-pill-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <i className="bi bi-bag-check-fill text-white fs-5"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Rate-Free Orders & Work Orders</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Book production orders & export factory PDFs (No rates)</div>
                  </div>
                </div>
              </div>

              {/* Right Side: Sleek Glassmorphic Login Card */}
              <div className="auth-card shadow-lg border-0">
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  boxShadow: '0 10px 25px rgba(168, 85, 247, 0.35)'
                }}>
                  <i className="bi bi-box-seam-fill text-white fs-2"></i>
                </div>

                <h1 className="fw-bold font-outfit text-white mb-1" style={{ fontSize: '2.1rem' }}>
                  FACTORY FLOW
                </h1>

                <p className="text-muted mb-4 fw-medium" style={{ fontSize: '0.95rem' }}>
                  Log in to your 5-Table Factory & Order Manager
                </p>

                <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    className="auth-google-btn"
                    onClick={loginWithGoogle}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign in with Google
                  </button>

                  <button
                    className="btn btn-success rounded-3 border-0 py-2.5 text-white fw-bold shadow-sm"
                    onClick={startDemoMode}
                  >
                    <i className="bi bi-play-circle-fill me-2"></i>
                    Explore in Offline Demo Mode
                  </button>

                  <button
                    className="btn btn-secondary rounded-3 border-0 py-2 text-white-50"
                    onClick={() => setActiveModal('firebase')}
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <i className="bi bi-gear-fill me-2"></i>
                    Configure BYOF Firebase Credentials
                  </button>
                </div>

                <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-center gap-2 text-muted" style={{ fontSize: '0.78rem' }}>
                  <i className="bi bi-shield-check text-success fs-6"></i>
                  <span>Encrypted Row-Level User Isolation (`users/&#123;uid&#125;/...`)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'factories' && <Factories />}
            {activeTab === 'customers' && <Customers />}
            {(activeTab === 'products' || activeTab === 'box-details') && <Products />}
            {activeTab === 'orders' && <Orders />}
            {activeTab === 'payments' && <Payments />}
            {activeTab === 'reports' && <Reports />}
          </>
        )}
      </main>

      <footer>
        Factory Flow &copy; 2026 • 5-Table Carton Box Brokerage & Financial Ledger
      </footer>

      {activeModal === 'factory' && <FactoryModal />}
      {activeModal === 'customer' && <CustomerModal />}
      {(activeModal === 'box' || activeModal === 'product') && <BoxModal />}
      {activeModal === 'order' && <OrderModal />}
      {activeModal === 'payment' && <PaymentModal />}
      {activeModal === 'firebase' && <FirebaseModal />}
      <LightboxModal />
    </>
  );
};

export default App;
