import React from 'react';
import { useApp } from '../../context/AppContext';

export const LightboxModal = () => {
  const { lightboxImg, setLightboxImg } = useApp();

  if (!lightboxImg) return null;

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={() => setLightboxImg(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg" style={{ maxWidth: 800, background: 'rgba(10,15,25,0.95)' }}>
        <div className="modal-header">
          <h3>Photo Preview</h3>
          <button className="close-btn" onClick={() => setLightboxImg(null)}>&times;</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <img src={lightboxImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }} />
        </div>
      </div>
    </div>
  );
};
