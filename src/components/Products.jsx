import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/helpers';

export const Products = () => {
  const { boxDetails, setActiveModal, setModalPayload, deleteBoxDoc, setLightboxImg } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = boxDetails.filter(b => {
    const matchSearch = (b.boxName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.paperGsm || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.paperBf || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.openType || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.note || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || b.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <section id="tab-products" className="tab-content active">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Box Details Master Catalog</div>
          <div className="text-muted small">Comprehensive box specifications, rates & manufacturing technical details</div>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('box'); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Box Details</span>
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
              placeholder="Search box name, GSM, BF, open type, notes..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories (Inner & Outer)</option>
            <option value="Outer">Outer Box</option>
            <option value="Inner">Inner Box</option>
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Box Name</th>
                <th>Category</th>
                <th>Dimensions (L×W×H)</th>
                <th>Ply</th>
                <th>Paper GSM</th>
                <th>Paper BF</th>
                <th>Open Type</th>
                <th>Rate / Box (₹)</th>
                <th>Margin / Box (₹)</th>
                <th>Notes</th>
                <th>Reference Photos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-muted">
                    No box specifications found. Click "+ Add Box Details" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(b => {
                  const photoList = b.photos || [];
                  const openTypeVal = b.openType || b.type;

                  return (
                    <tr key={b.id}>
                      <td><strong>{b.boxName || b.productName}</strong></td>
                      <td>
                        <span className={`badge ${b.category === 'Inner' ? 'bg-purple-subtle text-purple border' : 'bg-primary-subtle text-primary border'} rounded-pill px-2 py-1 fw-semibold`}>
                          {b.category || 'Outer'}
                        </span>
                      </td>
                      <td className="tabular-nums">{b.length}×{b.width}×{b.height} {b.unit}</td>
                      <td><span className="badge bg-info text-dark rounded-pill">{b.ply ? `${b.ply}-Ply` : '-'}</span></td>
                      <td>{b.paperGsm || '-'}</td>
                      <td>{b.paperBf || '-'}</td>
                      <td>{openTypeVal ? <span className="badge bg-secondary rounded-pill">{openTypeVal}</span> : '-'}</td>
                      <td className="tabular-nums">{b.rate ? formatINR(b.rate) : '-'}</td>
                      <td className="tabular-nums text-success fw-bold">{b.margin ? formatINR(b.margin) : '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--bs-secondary-color)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.note || b.notes || ''}>
                        {b.note || b.notes || '-'}
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
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={() => { setModalPayload(b); setActiveModal('box'); }} title="Edit Specification">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => deleteBoxDoc(b.id)} title="Delete Specification">
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
