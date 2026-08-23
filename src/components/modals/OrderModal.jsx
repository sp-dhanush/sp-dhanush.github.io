import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const OrderModal = () => {
  const { customers, factories, boxDetails, saveOrderDoc, setActiveModal, modalPayload } = useApp();
  const item = modalPayload || {};
  const isEditing = Boolean(item && item.id);

  const [customerId, setCustomerId] = useState(item.customerId || customers[0]?.id || '');
  const [factoryId, setFactoryId] = useState(item.factoryId || factories[0]?.id || '');
  const [orderDate, setOrderDate] = useState(item.orderDate || new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(item.deliveryDate || '');
  const [notes, setNotes] = useState(item.notes || '');

  // Multi-item support with legacy fallback
  const getInitialItems = () => {
    if (Array.isArray(item.items) && item.items.length > 0) {
      return item.items;
    }
    if (item.boxId) {
      return [{ boxId: item.boxId, quantity: item.quantity || '', notes: item.notes || '' }];
    }
    return [{ boxId: boxDetails[0]?.id || '', quantity: '', notes: '' }];
  };

  const [items, setItems] = useState(getInitialItems);

  useEffect(() => {
    if (!isEditing) {
      if (customers.length > 0 && !customerId) setCustomerId(customers[0].id);
      if (factories.length > 0 && !factoryId) setFactoryId(factories[0].id);
    }
  }, [customers, factories, isEditing, customerId, factoryId]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { boxId: boxDetails[0]?.id || '', quantity: '', notes: '' }]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) {
      alert('An order must contain at least 1 box item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId || !factoryId) {
      alert('Please select Customer and Factory.');
      return;
    }

    if (items.some(it => !it.boxId || !it.quantity || parseInt(it.quantity) <= 0)) {
      alert('Please select a Box Specification and valid Quantity for all line items.');
      return;
    }

    const custObj = customers.find(c => c.id === customerId);
    const factObj = factories.find(f => f.id === factoryId);

    // Prepare summary fields
    const processedItems = items.map(it => {
      const b = boxDetails.find(box => box.id === it.boxId);
      return {
        boxId: it.boxId,
        boxName: b ? b.boxName : '',
        quantity: parseInt(it.quantity) || 0,
        notes: (it.notes || '').trim()
      };
    });

    const totalQty = processedItems.reduce((sum, i) => sum + i.quantity, 0);
    const summaryBoxNames = processedItems.map(i => i.boxName).filter(Boolean).join(', ');

    saveOrderDoc(item.id, {
      customerId,
      customerName: custObj ? custObj.customerName : '',
      factoryId,
      factoryName: factObj ? factObj.factoryName : '',
      boxId: processedItems[0]?.boxId || '',
      boxName: summaryBoxNames,
      quantity: totalQty,
      items: processedItems,
      orderDate,
      deliveryDate,
      notes: notes.trim()
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Multi-Item Order' : 'Book Multi-Item Carton Order'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="form-order" onSubmit={handleSubmit}>
            {/* Header Details */}
            <div className="form-grid">
              <div className="form-group">
                <label>Customer</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Manufacturing Factory</label>
                <select value={factoryId} onChange={e => setFactoryId(e.target.value)} required>
                  <option value="">-- Select Factory --</option>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Order Date</label>
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Target Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
            </div>

            {/* Line Items Section */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                  <i className="bi bi-box-seam me-1"></i> Order Line Items ({items.length} Box Types)
                </div>
                <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={handleAddItem}>
                  <i className="bi bi-plus-lg me-1"></i> Add Another Box Item
                </button>
              </div>

              {items.map((line, idx) => {
                const selectedBox = boxDetails.find(b => b.id === line.boxId);
                return (
                  <div key={idx} className="p-3 mb-3 bg-body-tertiary rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-secondary">Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button type="button" className="btn btn-sm btn-outline-danger border-0 py-0" onClick={() => handleRemoveItem(idx)}>
                          <i className="bi bi-trash-fill me-1"></i> Remove Item
                        </button>
                      )}
                    </div>

                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Select Box Specification</label>
                        <select value={line.boxId} onChange={e => handleItemChange(idx, 'boxId', e.target.value)} required>
                          <option value="">-- Select Box Details --</option>
                          {boxDetails.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.boxName} ({b.length}×{b.width}×{b.height} {b.unit}, {b.ply}-Ply, {b.category || 'Box'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedBox && (
                      <div className="mt-1 mb-2 small text-muted" style={{ fontSize: '0.78rem' }}>
                        Specs: {selectedBox.length}×{selectedBox.width}×{selectedBox.height} {selectedBox.unit} | {selectedBox.ply}-Ply | {selectedBox.category || 'Box'} | {selectedBox.paperGsm || ''} {selectedBox.paperBf || ''} | {selectedBox.openType || 'Regular'}
                      </div>
                    )}

                    <div className="form-grid" style={{ marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label>Quantity (Boxes)</label>
                        <input type="number" min="1" value={line.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} placeholder="e.g. 5000" required />
                      </div>
                      <div className="form-group">
                        <label>Item Specific Notes</label>
                        <input type="text" value={line.notes} onChange={e => handleItemChange(idx, 'notes', e.target.value)} placeholder="e.g. Express dispatch, special Kraft paper" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Overall Production Notes & Instructions</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="e.g. Dispatch all boxes together, corner protection needed" />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{isEditing ? 'Update Order' : 'Save Multi-Item Order'}</button>
        </div>
      </div>
    </div>
  );
};
