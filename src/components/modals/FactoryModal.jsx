import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const FactoryModal = () => {
  const { modalPayload, saveFactoryDoc, setActiveModal } = useApp();
  const item = modalPayload || {};

  const [factoryName, setFactoryName] = useState(item.factoryName || item.name || '');
  const [contactPersonName, setContactPersonName] = useState(item.contactPersonName || '');
  const [contactPersonNumber, setContactPersonNumber] = useState(item.contactPersonNumber || item.phone || '');
  const [factoryAddress, setFactoryAddress] = useState(item.factoryAddress || item.address || '');
  const [openingBalance, setOpeningBalance] = useState(item.openingBalance || item.currentBalance || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!factoryName.trim()) return;

    saveFactoryDoc(item.id, {
      factoryName: factoryName.trim(),
      contactPersonName: contactPersonName.trim(),
      contactPersonNumber: contactPersonNumber.trim(),
      factoryAddress: factoryAddress.trim(),
      openingBalance: parseFloat(openingBalance) || 0
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{item.id ? 'Edit Factory' : 'Add Manufacturing Factory'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label>Factory Name</label>
              <input type="text" value={factoryName} onChange={e => setFactoryName(e.target.value)} required placeholder="e.g. Apex Packaging Pvt Ltd" />
            </div>
            <div className="form-group mb-3">
              <label>Contact Person Name</label>
              <input type="text" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} placeholder="e.g. Rajesh Sharma" />
            </div>
            <div className="form-group mb-3">
              <label>Contact Person Number</label>
              <input type="text" value={contactPersonNumber} onChange={e => setContactPersonNumber(e.target.value)} placeholder="e.g. +91 98765 43210" />
            </div>
            <div className="form-group mb-3">
              <label>Initial Opening Balance Dues (₹)</label>
              <input type="number" step="any" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="e.g. 50000 (Past dues before using app)" />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Enter any existing pending balance owed to factory prior to using FactoryFlow.</small>
            </div>
            <div className="form-group mb-3">
              <label>Factory Address</label>
              <textarea value={factoryAddress} onChange={e => setFactoryAddress(e.target.value)} rows="3" placeholder="Full plant / warehouse address" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Factory</button>
        </div>
      </div>
    </div>
  );
};
