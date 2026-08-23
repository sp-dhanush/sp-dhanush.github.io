import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateBoxDescription, formatINR } from '../utils/helpers';

export const Products = () => {
  const { products, customers, setActiveModal, setModalPayload, deleteProductDoc, setLightboxImg } = useApp();
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  const filtered = products.filter(p => {
    const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase()) || 
                        (p.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
                        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.type || p.boxType || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.notes || p.note || '').toLowerCase().includes(search.toLowerCase());
    const matchCust = !customerFilter || p.customerId === customerFilter;
    return matchSearch && matchCust;
  });

  return (
    <section id="tab-products" className="tab-content active">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="fs-5 fw-bold font-outfit">Customer Product & Box Specifications Catalog</div>
        <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('product'); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Product Specification</span>
        </button>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-body-tertiary border-secondary border-opacity-25">
              <i className="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search product name, customer, notes, specs..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <select className="form-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="">All Customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Customer</th>
                <th>Product Name</th>
                <th>Dimensions (L×W×H)</th>
                <th>Ply</th>
                <th>GSM / BF</th>
                <th>Type</th>
                <th>Factory Rate / Box (₹)</th>
                <th>My Extra Margin / Box (₹)</th>
                <th>Notes</th>
                <th>Reference Photos</th>
                <th>Auto-Generated Specification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-muted">
                    No product specifications found. Click "+ Add Product Specification" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const autoDesc = p.description || generateBoxDescription(p);
                  const fRate = p.factoryRate !== undefined ? p.factoryRate : p.factoryRatePerBox;
                  const eMargin = p.extraMargin !== undefined ? p.extraMargin : p.extraMarginPerBox;
                  const itemNotes = p.notes || p.note;
                  const photoList = p.photos || p.referencePhotos || [];
                  const itemType = p.type !== undefined && p.type !== null ? p.type : p.boxType;

                  return (
                    <tr key={p.id}>
                      <td><strong>{p.customerName || '-'}</strong></td>
                      <td><strong>{p.productName}</strong></td>
                      <td className="tabular-nums">{p.length}×{p.width}×{p.height} {p.unit}</td>
                      <td><span className="badge bg-info text-dark rounded-pill">{p.ply}</span></td>
                      <td>{p.gsmBf || '-'}</td>
                      <td>{itemType ? <span className="badge bg-secondary rounded-pill">{itemType}</span> : '-'}</td>
                      <td className="tabular-nums">{fRate ? formatINR(fRate) : '-'}</td>
                      <td className="tabular-nums text-success fw-bold">{eMargin ? formatINR(eMargin) : '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--bs-secondary-color)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={itemNotes || ''}>
                        {itemNotes || '-'}
                      </td>
                      <td>
                        {photoList.length > 0 ? (
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setLightboxImg(photoList[0].url)} style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>
                            🖼️ {photoList.length}
                          </button>
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td className="small text-muted fw-medium">{autoDesc}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={() => { setModalPayload(p); setActiveModal('product'); }} title="Edit Specification">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => deleteProductDoc(p.id)} title="Delete Specification">
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
