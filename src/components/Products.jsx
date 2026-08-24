import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/helpers';
import { exportBoxCatalogPDF } from '../utils/pdfExporter';
import { exportBoxCatalogExcel } from '../utils/excelExporter';

export const Products = () => {
  const { boxDetails, customers, factories, orders, setActiveModal, setModalPayload, deleteBoxDoc, setLightboxImg } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const filtered = boxDetails.filter(b => {
    // Search match
    const matchSearch = !search || (
      (b.boxName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.paperGsm || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.paperBf || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.openType || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.note || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.factoryName || '').toLowerCase().includes(search.toLowerCase())
    );

    // Category match
    const matchCat = !categoryFilter || b.category === categoryFilter;

    // Factory match (direct assignment or linked in orders)
    const matchFact = !factoryFilter || (
      b.factoryId === factoryFilter ||
      orders.some(o => o.factoryId === factoryFilter && (o.boxId === b.id || (Array.isArray(o.items) && o.items.some(it => it.boxId === b.id))))
    );

    // Customer match (direct assignment or linked in orders)
    const matchCust = !customerFilter || (
      b.customerId === customerFilter ||
      orders.some(o => o.customerId === customerFilter && (o.boxId === b.id || (Array.isArray(o.items) && o.items.some(it => it.boxId === b.id))))
    );

    return matchSearch && matchCat && matchFact && matchCust;
  });

  const selectedCustomerObj = customers.find(c => c.id === customerFilter);
  const selectedFactoryObj = factories.find(f => f.id === factoryFilter);

  const handleExportPDF = () => {
    exportBoxCatalogPDF(filtered, {
      customerName: selectedCustomerObj ? selectedCustomerObj.customerName : null,
      factoryName: selectedFactoryObj ? selectedFactoryObj.factoryName : null,
      categoryFilter: categoryFilter || null,
      search: search || null
    });
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportBoxCatalogExcel(
        filtered,
        {
          customerName: selectedCustomerObj ? selectedCustomerObj.customerName : null,
          factoryName: selectedFactoryObj ? selectedFactoryObj.factoryName : null,
          categoryFilter: categoryFilter || null,
          search: search || null
        },
        customers,
        factories
      );
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Error generating Excel file: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setFactoryFilter('');
    setCustomerFilter('');
  };

  return (
    <section id="tab-products" className="tab-content active">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Box Details Master Catalog</div>
          <div className="text-muted small">Comprehensive box specifications, rates, customer-factory links & manufacturing technical details</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-danger d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={handleExportPDF} title="Export Box Catalog to PDF with Photos">
            <i className="bi bi-file-earmark-pdf-fill"></i>
            <span>Export PDF</span>
          </button>
          <button className="btn btn-outline-success d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={handleExportExcel} disabled={isExportingExcel} title="Export Box Catalog to Excel with Photos">
            <i className="bi bi-file-earmark-excel-fill"></i>
            <span>{isExportingExcel ? 'Exporting...' : 'Export Excel'}</span>
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('box'); }}>
            <i className="bi bi-plus-lg"></i>
            <span>Add Box Details</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Bar (Search, Category, Factory, Customer) */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-3 bg-body-tertiary">
        <div className="row g-2">
          <div className="col-12 col-lg-4">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Search Keywords</label>
            <div className="input-group">
              <span className="input-group-text bg-body border-secondary border-opacity-25">
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
          <div className="col-12 col-sm-6 col-lg-2">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Category</label>
            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Outer">Outer Box</option>
              <option value="Inner">Inner Box</option>
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Filter by Factory</label>
            <select className="form-select" value={factoryFilter} onChange={(e) => setFactoryFilter(e.target.value)}>
              <option value="">All Manufacturing Factories</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Filter by Customer</label>
            <select className="form-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {(categoryFilter || factoryFilter || customerFilter || search) && (
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
          <span className="small text-muted fw-semibold me-1">Active Filters:</span>
          {categoryFilter && (
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              Category: {categoryFilter}
            </span>
          )}
          {selectedFactoryObj && (
            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
              Factory: {selectedFactoryObj.factoryName}
            </span>
          )}
          {selectedCustomerObj && (
            <span className="badge bg-info-subtle text-info border border-info-subtle">
              Customer: {selectedCustomerObj.customerName}
            </span>
          )}
          {search && (
            <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
              Query: "{search}"
            </span>
          )}
          <button className="btn btn-link btn-sm text-decoration-none p-0 ms-2" onClick={clearAllFilters}>
            Clear Filters
          </button>
          <span className="ms-auto small text-muted">Showing <strong>{filtered.length}</strong> of {boxDetails.length} box specifications</span>
        </div>
      )}

      {/* Master Catalog Table */}
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
                    No box specifications found matching current filter criteria. Click "+ Add Box Details" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(b => {
                  const photoList = b.photos || [];
                  const openTypeVal = b.openType || b.type;
                  const custObj = customers.find(c => c.id === b.customerId);
                  const factObj = factories.find(f => f.id === b.factoryId);

                  return (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.boxName || b.productName}</strong>
                        {(custObj || b.customerName) && (
                          <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-person me-1"></i>{custObj ? custObj.customerName : b.customerName}
                          </div>
                        )}
                        {(factObj || b.factoryName) && (
                          <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-building me-1"></i>{factObj ? factObj.factoryName : b.factoryName}
                          </div>
                        )}
                      </td>
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
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setLightboxImg(photoList[0].url)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}>
                            🖼️ {photoList.length} Photo{photoList.length > 1 ? 's' : ''}
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
