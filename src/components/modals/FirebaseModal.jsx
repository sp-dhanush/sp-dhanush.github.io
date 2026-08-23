import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getUserSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../../firebase-config';

export const FirebaseModal = () => {
  const { setActiveModal } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  useEffect(() => {
    const cfg = getUserSavedFirebaseConfig();
    if (cfg) {
      setApiKey(cfg.apiKey || '');
      setAuthDomain(cfg.authDomain || '');
      setProjectId(cfg.projectId || '');
      setStorageBucket(cfg.storageBucket || '');
      setMessagingSenderId(cfg.messagingSenderId || '');
      setAppId(cfg.appId || '');
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      alert('Please enter a valid API Key and Project ID.');
      return;
    }

    saveFirebaseConfig({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    });

    window.location.reload();
  };

  const handleDemo = () => {
    clearFirebaseConfig();
    window.location.reload();
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: 600 }}>
        <div className="modal-header border-bottom">
          <h5 className="modal-title fw-bold font-outfit d-flex align-items-center gap-2">
            <i className="bi bi-gear-fill text-primary"></i>
            <span>Bring Your Own Firebase (BYOF) Settings</span>
          </h5>
          <button type="button" className="btn-close" onClick={() => setActiveModal(null)} aria-label="Close"></button>
        </div>
        <div className="modal-body p-4">
          <div className="alert alert-info border-0 shadow-sm rounded-3 mb-3 small" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--text-main)' }}>
            <i className="bi bi-info-circle-fill text-primary me-2"></i>
            Factory Flow is 100% serverless. To connect your personal Firebase project, paste your credentials below. Follow <strong>FIREBASE_SETUP.md</strong> for instructions.
          </div>
          <form onSubmit={handleSave} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label text-uppercase small fw-bold text-muted">API Key (apiKey)</label>
              <input type="text" className="form-control rounded-3" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="e.g. AIzaSyYOUR_CUSTOM_FIREBASE_API_KEY" />
            </div>
            <div>
              <label className="form-label text-uppercase small fw-bold text-muted">Auth Domain (authDomain)</label>
              <input type="text" className="form-control rounded-3" value={authDomain} onChange={e => setAuthDomain(e.target.value)} placeholder="e.g. your-custom-app.firebaseapp.com" />
            </div>
            <div>
              <label className="form-label text-uppercase small fw-bold text-muted">Project ID (projectId)</label>
              <input type="text" className="form-control rounded-3" value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="e.g. your-custom-project-id" />
            </div>
            <div>
              <label className="form-label text-uppercase small fw-bold text-muted">Storage Bucket (storageBucket)</label>
              <input type="text" className="form-control rounded-3" value={storageBucket} onChange={e => setStorageBucket(e.target.value)} placeholder="e.g. your-custom-app.firebasestorage.app" />
            </div>
            <div>
              <label className="form-label text-uppercase small fw-bold text-muted">Messaging Sender ID (messagingSenderId)</label>
              <input type="text" className="form-control rounded-3" value={messagingSenderId} onChange={e => setMessagingSenderId(e.target.value)} placeholder="e.g. 123456789012" />
            </div>
            <div>
              <label className="form-label text-uppercase small fw-bold text-muted">App ID (appId)</label>
              <input type="text" className="form-control rounded-3" value={appId} onChange={e => setAppId(e.target.value)} placeholder="e.g. 1:123456789012:web:abcdef123456" />
            </div>
          </form>
        </div>
        <div className="modal-footer border-top bg-body-tertiary">
          <button type="button" className="btn btn-outline-secondary rounded-3" onClick={handleDemo}>Use Local Demo Mode</button>
          <button type="button" className="btn btn-primary rounded-3" onClick={handleSave}>
            <i className="bi bi-cloud-check-fill me-1"></i>
            Save & Connect Firebase
          </button>
        </div>
      </div>
    </div>
  );
};
