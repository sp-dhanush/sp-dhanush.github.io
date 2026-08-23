import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/helpers';

export const Payments = () => {
  const { paymentDetails, factories, setActiveModal, setModalPayload, deletePaymentDoc } = useApp();
  const [search, setSearch] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');

  const filtered = paymentDetails.filter(p => {
    const matchSearch = (p.factoryName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.paymentMode || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchFact = !factoryFilter || p.factoryId === factoryFilter;
    return matchSearch && matchFact;
  });

  return (
    <section id="tab-payments" className="tab-content active">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Factory Payments Ledger</div>
          <div className="text-muted small">Log and track payouts made to manufacturing factories</div>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('payment'); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Record Factory Payment</span>
        </button>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-8">
          <div className="input-group">
            <span className="input-group-text bg-body-tertiary border-secondary border-opacity-25">
              <i className="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search factory, payment mode, UTR reference, notes..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <select className="form-select" value={factoryFilter} onChange={(e) => setFactoryFilter(e.target.value)}>
            <option value="">All Factories</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Payment Date</th>
                <th>Factory Name</th>
                <th>Amount Paid (₹)</th>
                <th>Payment Mode</th>
                <th>Notes / UTR Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No payment records logged yet. Click "+ Record Factory Payment" to add one.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td className="small fw-medium">{p.paymentDate || '-'}</td>
                    <td><strong>{p.factoryName || '-'}</strong></td>
                    <td className="tabular-nums fw-bold fs-6 text-success">{formatINR(p.amountPaid)}</td>
                    <td>
                      <span className={`badge ${p.paymentMode === 'Bank Transfer' ? 'bg-primary-subtle text-primary border' : 'bg-success-subtle text-success border'} rounded-pill`}>
                        {p.paymentMode || 'Cash'}
                      </span>
                    </td>
                    <td className="small text-muted">{p.notes || '-'}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" onClick={() => { setModalPayload(p); setActiveModal('payment'); }} title="Edit Payment">
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => deletePaymentDoc(p.id)} title="Delete Payment">
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
