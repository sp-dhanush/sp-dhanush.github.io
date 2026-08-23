import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportWorkOrderPDF } from '../utils/pdfExporter';

export const Orders = () => {
  const { orders, factories, boxDetails, setActiveModal, setModalPayload, deleteOrderDoc } = useApp();
  const [search, setSearch] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');

  const filtered = orders.filter(o => {
    const matchSearch = (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (o.factoryName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (o.boxName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (o.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchFact = !factoryFilter || o.factoryId === factoryFilter;
    return matchSearch && matchFact;
  });

  return (
    <section id="tab-orders" className="tab-content active">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Factory Production Orders</div>
          <div className="text-muted small">Multi-item order bookings & rate-free production sheets</div>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('order'); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Book Multi-Item Order</span>
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
              placeholder="Search customer, factory, box name, notes..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <select className="form-select" value={factoryFilter} onChange={(e) => setFactoryFilter(e.target.value)}>
            <option value="">All Manufacturing Factories</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Customer</th>
                <th>Factory</th>
                <th>Ordered Box Items & Specs</th>
                <th>Total Quantity</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No orders booked. Click "+ Book Multi-Item Order" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(o => {
                  const items = Array.isArray(o.items) && o.items.length > 0
                    ? o.items
                    : [{ boxId: o.boxId, boxName: o.boxName, quantity: o.quantity, notes: o.notes }];

                  const totalOrderQty = items.reduce((sum, i) => sum + (parseInt(i.quantity) || 0), 0);

                  return (
                    <tr key={o.id}>
                      <td className="small fw-medium">{o.orderDate || '-'}</td>
                      <td className="small text-danger fw-semibold">{o.deliveryDate || '-'}</td>
                      <td><strong>{o.customerName || '-'}</strong></td>
                      <td><span className="badge bg-secondary-subtle text-secondary border">{o.factoryName || '-'}</span></td>
                      <td>
                        <div className="d-flex flex-column gap-2 py-1">
                          {items.map((line, idx) => {
                            const b = boxDetails.find(box => box.id === line.boxId) || {};
                            const dimStr = (b.length && b.width && b.height) ? `${b.length}×${b.width}×${b.height} ${b.unit || ''}` : '-';
                            const specPill = b.ply ? `${b.ply}-Ply` : '';
                            const paperSpec = [b.paperGsm, b.paperBf].filter(Boolean).join(' ');

                            return (
                              <div key={idx} className="p-2 rounded bg-body-tertiary border-start border-3 border-primary small">
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>{line.boxName || b.boxName || 'Carton Box'}</strong>
                                  <span className="badge bg-primary rounded-pill">{(parseInt(line.quantity) || 0).toLocaleString('en-IN')} Boxes</span>
                                </div>
                                <div className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                                  {dimStr} {specPill && <span className="badge bg-info text-dark ms-1">{specPill}</span>} {b.category ? `• ${b.category}` : ''} {paperSpec ? `• ${paperSpec}` : ''} {b.openType ? `• ${b.openType}` : ''}
                                </div>
                                {line.notes && <div className="text-secondary italic mt-1" style={{ fontSize: '0.75rem' }}>Note: {line.notes}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="tabular-nums fw-bold fs-6">{totalOrderQty.toLocaleString('en-IN')} Boxes ({items.length} items)</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--bs-secondary-color)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.notes || ''}>
                        {o.notes || '-'}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-success" onClick={() => exportWorkOrderPDF(o, boxDetails)} title="Export Work Order PDF (No Rates)">
                            <i className="bi bi-file-earmark-pdf-fill me-1"></i>Work Order PDF
                          </button>
                          <button className="btn btn-outline-secondary" onClick={() => { setModalPayload(o); setActiveModal('order'); }} title="Edit Order">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => deleteOrderDoc(o.id)} title="Delete Order">
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
