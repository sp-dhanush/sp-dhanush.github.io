import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const CustomerModal = () => {
  const { modalPayload, saveCustomerDoc, setActiveModal } = useApp();
  const item = modalPayload || {};

  const [customerName, setCustomerName] = useState(item.customerName || item.name || '');
  const [customerAddress, setCustomerAddress] = useState(item.customerAddress || item.address || '');
  const [contactPersonName, setContactPersonName] = useState(item.contactPersonName || '');
  const [contactPersonNumber, setContactPersonNumber] = useState(item.contactPersonNumber || item.phone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    saveCustomerDoc(item.id, {
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      contactPersonName: contactPersonName.trim(),
      contactPersonNumber: contactPersonNumber.trim()
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{item.id ? 'Edit Customer' : 'Add Customer Account'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label>Customer Name</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="e.g. Sun Pharma Industries" />
            </div>
            <div className="form-group mb-3">
              <label>Contact Person Name</label>
              <input type="text" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} placeholder="e.g. Amit Verma" />
            </div>
            <div className="form-group mb-3">
              <label>Contact Person Number</label>
              <input type="text" value={contactPersonNumber} onChange={e => setContactPersonNumber(e.target.value)} placeholder="e.g. +91 98123 45678" />
            </div>
            <div className="form-group mb-3">
              <label>Customer Address</label>
              <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows="3" placeholder="Office / plant delivery address" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Customer</button>
        </div>
      </div>
    </div>
  );
};
