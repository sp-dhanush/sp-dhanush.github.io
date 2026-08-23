import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PaymentModal = () => {
  const { factories, savePaymentDoc, setActiveModal, modalPayload } = useApp();
  const item = modalPayload || {};
  const isEditing = Boolean(item && item.id);

  const [factoryId, setFactoryId] = useState(item.factoryId || factories[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(item.paymentDate || new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState(item.amountPaid !== undefined ? item.amountPaid : '');
  const [paymentMode, setPaymentMode] = useState(item.paymentMode || 'Bank Transfer');
  const [notes, setNotes] = useState(item.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!factoryId || !amountPaid) {
      alert('Please select a factory and enter the amount paid.');
      return;
    }

    const factObj = factories.find(f => f.id === factoryId);

    savePaymentDoc(item.id, {
      factoryId,
      factoryName: factObj ? factObj.factoryName : '',
      paymentDate,
      amountPaid: parseFloat(amountPaid) || 0,
      paymentMode,
      notes: notes.trim()
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Factory Payment' : 'Record Factory Payment'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label>Manufacturing Factory</label>
              <select value={factoryId} onChange={e => setFactoryId(e.target.value)} required>
                <option value="">-- Select Factory --</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
              </select>
            </div>
            <div className="form-group mb-3">
              <label>Payment Date</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
            </div>
            <div className="form-group mb-3">
              <label>Amount Paid (₹)</label>
              <input type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="e.g. 50000" required />
            </div>
            <div className="form-group mb-3">
              <label>Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Google Pay">Google Pay</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              </select>
            </div>
            <div className="form-group mb-3">
              <label>Notes / UTR Reference</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="e.g. Part payment via RTGS UTR #99887766" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Payment</button>
        </div>
      </div>
    </div>
  );
};
