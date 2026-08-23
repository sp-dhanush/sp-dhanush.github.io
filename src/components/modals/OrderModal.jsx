import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { generateBoxDescription, formatINR } from '../../utils/helpers';

export const OrderModal = () => {
  const { customers, factories, products, orders, saveOrderDoc, setActiveModal, modalPayload } = useApp();
  const item = modalPayload || {};
  const isEditing = Boolean(item && item.id);

  const [orderNumber, setOrderNumber] = useState(item.orderNumber || ('ORD-' + String(orders.length + 1).padStart(3, '0')));
  const [orderDate, setOrderDate] = useState(item.orderDate || new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState(item.customerId || customers[0]?.id || '');
  const [factoryId, setFactoryId] = useState(item.factoryId || factories[0]?.id || '');

  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState(item.boxSpecs?.productName || '');
  const [len, setLen] = useState(item.boxSpecs?.length || '');
  const [wid, setWid] = useState(item.boxSpecs?.width || '');
  const [hei, setHei] = useState(item.boxSpecs?.height || '');
  const [unit, setUnit] = useState(item.boxSpecs?.unit || 'mm');
  const [ply, setPly] = useState(item.boxSpecs?.ply || '5-ply');
  const [gsmBf, setGsmBf] = useState(item.boxSpecs?.gsmBf || '');
  const [type, setType] = useState(item.boxSpecs?.type || item.boxSpecs?.boxType || 'Regular');

  const [quantity, setQuantity] = useState(item.quantity !== undefined ? item.quantity : '');
  const [factoryRate, setFactoryRate] = useState(item.factoryUnitCost !== undefined ? item.factoryUnitCost : '');
  const [margin, setMargin] = useState(item.marginPerUnit !== undefined ? item.marginPerUnit : '');

  // Payment Tracking Fields
  const [marginPaymentStatus, setMarginPaymentStatus] = useState(item.marginPaymentStatus || item.factoryPaymentStatus || 'pending');
  
  const getInitialReceivedAmt = () => {
    if (item.receivedMarginAmount !== undefined) return item.receivedMarginAmount;
    if (item.partialMarginAmount !== undefined) return item.partialMarginAmount;
    if (item.marginPaymentStatus === 'received') return item.profitMargin || '';
    return '';
  };
  const [receivedMarginAmount, setReceivedMarginAmount] = useState(getInitialReceivedAmt);

  const [customerPaymentStatus, setCustomerPaymentStatus] = useState(item.customerPaymentStatus || item.paymentStatus || 'pending');
  const [paymentDate, setPaymentDate] = useState(item.paymentDate || '');
  const [paymentMode, setPaymentMode] = useState(item.paymentMode || 'bank_transfer');
  const [paymentNotes, setPaymentNotes] = useState(item.paymentNotes || '');

  const [photos, setPhotos] = useState(item.photos || []);

  useEffect(() => {
    if (!isEditing) {
      if (customers.length > 0 && !customerId) setCustomerId(customers[0].id);
      if (factories.length > 0 && !factoryId) setFactoryId(factories[0].id);
    }
  }, [customers, factories, isEditing, customerId, factoryId]);

  const custProducts = products.filter(p => p.customerId === customerId);

  const handleProductSelect = (pId) => {
    setSelectedProductId(pId);
    if (!pId) return;
    const p = products.find(i => i.id === pId);
    if (p) {
      setProductName(p.productName || '');
      setLen(p.length || '');
      setWid(p.width || '');
      setHei(p.height || '');
      setUnit(p.unit || 'mm');
      setPly(p.ply || '3-ply');
      setGsmBf(p.gsmBf || '');
      setType(p.type || p.boxType || 'Regular');
      if (p.factoryRate !== undefined || p.factoryRatePerBox !== undefined) {
        setFactoryRate(p.factoryRate !== undefined ? p.factoryRate : p.factoryRatePerBox);
      }
      if (p.extraMargin !== undefined || p.extraMarginPerBox !== undefined) {
        setMargin(p.extraMargin !== undefined ? p.extraMargin : p.extraMarginPerBox);
      }
      if (p.photos && p.photos.length > 0) {
        setPhotos(p.photos);
      }
    }
  };

  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(evt.target.result);
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      alert('Maximum 5 reference photos allowed per order to optimize storage.');
    }
    const eligible = files.slice(0, 5 - photos.length);
    for (const file of eligible) {
      try {
        const compressedUrl = await compressImageFile(file);
        setPhotos(prev => [...prev, { name: file.name, url: compressedUrl }]);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  const numQty = parseInt(quantity) || 0;
  const numRate = parseFloat(factoryRate) || 0;
  const numMargin = parseFloat(margin) || 0;

  const customerRate = numRate + numMargin;
  const totalCustomerBill = customerRate * numQty;
  const totalFactoryCost = numRate * numQty;
  const profitMargin = numMargin * numQty;
  const generatedDesc = generateBoxDescription({ productName, length: len, width: wid, height: hei, unit, ply, gsmBf, type });

  // Handle status select change
  const handleMarginStatusChange = (newStatus) => {
    setMarginPaymentStatus(newStatus);
    if (newStatus === 'received') {
      setReceivedMarginAmount(profitMargin > 0 ? profitMargin : '');
    } else if (newStatus === 'pending') {
      setReceivedMarginAmount(0);
    }
  };

  // Handle received margin input change
  const handleReceivedAmountChange = (val) => {
    setReceivedMarginAmount(val);
    const numVal = parseFloat(val) || 0;
    if (profitMargin > 0) {
      if (numVal >= profitMargin) {
        setMarginPaymentStatus('received');
      } else if (numVal > 0) {
        setMarginPaymentStatus('partial');
      } else {
        setMarginPaymentStatus('pending');
      }
    }
  };

  const numReceivedMargin = parseFloat(receivedMarginAmount) || 0;
  const remainingMarginBalance = Math.max(0, profitMargin - numReceivedMargin);

  const handleSubmit = (e) => {
    e.preventDefault();
    const custObj = customers.find(c => c.id === customerId);
    const factObj = factories.find(f => f.id === factoryId);

    saveOrderDoc({
      orderNumber,
      orderDate,
      customerId,
      customerName: custObj ? custObj.name : '',
      factoryId,
      factoryName: factObj ? factObj.name : '',
      boxSpecs: {
        productName,
        length: parseFloat(len) || 0,
        width: parseFloat(wid) || 0,
        height: parseFloat(hei) || 0,
        unit,
        ply,
        gsmBf,
        type,
        description: generatedDesc,
        printing: ''
      },
      quantity: numQty,
      factoryUnitCost: numRate,
      marginPerUnit: numMargin,
      customerUnitRate: customerRate,
      totalFactoryCost,
      totalCustomerBill,
      profitMargin,

      // Payment Tracking Fields
      marginPaymentStatus,
      receivedMarginAmount: numReceivedMargin,
      partialMarginAmount: numReceivedMargin,
      customerPaymentStatus,
      paymentStatus: customerPaymentStatus,
      factoryPaymentStatus: marginPaymentStatus,
      paymentDate,
      paymentMode,
      paymentNotes,

      photos
    }, item.id);

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3>{isEditing ? `Edit Order (${orderNumber})` : 'New Carton Box Order'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="form-order" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Order Number</label>
                <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Order Date</label>
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Customer</label>
                <select value={customerId} onChange={e => { setCustomerId(e.target.value); setSelectedProductId(''); }}>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Factory</label>
                <select value={factoryId} onChange={e => setFactoryId(e.target.value)}>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group full-width">
                <label>Select Saved Product / Specification</label>
                <select value={selectedProductId} onChange={e => handleProductSelect(e.target.value)}>
                  <option value="">-- Custom Box Specifications --</option>
                  {custProducts.map(p => <option key={p.id} value={p.id}>{p.productName} ({p.length}×{p.width}×{p.height} {p.unit})</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Product / Box Name</label>
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. 1kg Medicine Outer Box" />
              </div>
            </div>

            <div className="form-grid-dimensions" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Length (L)</label>
                <input type="number" value={len} onChange={e => setLen(e.target.value)} placeholder="e.g. 350" required />
              </div>
              <div className="form-group">
                <label>Width (W)</label>
                <input type="number" value={wid} onChange={e => setWid(e.target.value)} placeholder="e.g. 250" required />
              </div>
              <div className="form-group">
                <label>Height (H)</label>
                <input type="number" value={hei} onChange={e => setHei(e.target.value)} placeholder="e.g. 200" required />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select value={unit} onChange={e => setUnit(e.target.value)}>
                  <option value="mm">mm</option>
                  <option value="inch">inch</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Ply Type</label>
                <select value={ply} onChange={e => setPly(e.target.value)}>
                  <option value="3-ply">3-Ply</option>
                  <option value="5-ply">5-Ply</option>
                  <option value="7-ply">7-Ply</option>
                  <option value="9-ply">9-Ply</option>
                </select>
              </div>
              <div className="form-group">
                <label>Paper GSM / BF Spec</label>
                <input type="text" value={gsmBf} onChange={e => setGsmBf(e.target.value)} placeholder="e.g. 180 GSM 24 BF" />
              </div>
              <div className="form-group">
                <label>Box Type</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="Regular">Regular</option>
                  <option value="Over Flop">Over Flop</option>
                  <option value="Default">Default</option>
                </select>
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Auto-Generated Specification Description</label>
              <input type="text" value={generatedDesc} readOnly style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'var(--primary)', color: 'var(--text-main)', fontWeight: 600 }} />
            </div>

            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Total Quantity (Boxes)</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required />
              </div>
              <div className="form-group">
                <label>Factory Rate / Box (₹)</label>
                <input type="number" step="0.01" value={factoryRate} onChange={e => setFactoryRate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>My Extra Margin / Box (₹)</label>
                <input type="number" step="0.01" value={margin} onChange={e => setMargin(e.target.value)} required />
              </div>
            </div>

            <div className="calc-box">
              <div className="calc-item">
                <span className="lbl">Customer Selling Rate</span>
                <span className="val">₹{customerRate.toFixed(2)}</span>
              </div>
              <div className="calc-item">
                <span className="lbl">Total Customer Bill</span>
                <span className="val">{formatINR(totalCustomerBill)}</span>
              </div>
              <div className="calc-item">
                <span className="lbl">Total Payable to Factory</span>
                <span className="val">{formatINR(totalFactoryCost)}</span>
              </div>
              <div className="calc-item">
                <span className="lbl">My Net Margin Profit</span>
                <span className="val highlight">{formatINR(profitMargin)}</span>
              </div>
            </div>

            {/* Payment & Settlement Details */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}><i className="bi bi-wallet2"></i> Payment & Commission Settlement</div>

              <div className="form-grid">
                <div className="form-group">
                  <label>My Margin Payout Status</label>
                  <select value={marginPaymentStatus} onChange={e => handleMarginStatusChange(e.target.value)}>
                    <option value="pending">Margin Pending</option>
                    <option value="partial">Partial Commission Settled</option>
                    <option value="received">Commission Fully Received</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Commission Amount Received (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={receivedMarginAmount} 
                    onChange={e => handleReceivedAmountChange(e.target.value)} 
                    placeholder={`e.g. ${profitMargin > 0 ? profitMargin.toFixed(2) : '2500'} (Full margin: ₹${profitMargin.toFixed(2)})`}
                  />
                </div>
              </div>

              {/* Helper text showing remaining pending balance */}
              <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                {remainingMarginBalance > 0 ? (
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }} className="d-flex align-items-center gap-1">
                    <i className="bi bi-dash-circle-fill text-warning"></i> Remaining Pending Margin Balance: ₹{remainingMarginBalance.toFixed(2)} (Out of ₹{profitMargin.toFixed(2)})
                  </span>
                ) : (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }} className="d-flex align-items-center gap-1">
                    <i className="bi bi-check-circle-fill text-success"></i> Commission Margin Fully Settled! (₹{profitMargin.toFixed(2)})
                  </span>
                )}
              </div>

              <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label>Customer → Factory Status</label>
                  <select value={customerPaymentStatus} onChange={e => setCustomerPaymentStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="partial">Partially Paid</option>
                    <option value="paid_to_factory">Paid to Factory Directly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Settlement Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
                <label>Payment Reference / Comments</label>
                <input 
                  type="text" 
                  value={paymentNotes} 
                  onChange={e => setPaymentNotes(e.target.value)} 
                  placeholder="e.g. Bank Ref #123456, paid via UPI on 12th Aug, settled full margin"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Reference Photos (Customer / Factory Samples)</label>
              <label className="dropzone">
                <i className="bi bi-cloud-arrow-up-fill fs-3 text-secondary"></i>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click to upload reference photos</div>
                <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
              <div className="photo-thumbs">
                {photos.map((p, idx) => (
                  <img key={idx} src={p.url} className="photo-thumb" title={p.name} onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} />
                ))}
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{isEditing ? 'Update Order' : 'Save Order'}</button>
        </div>
      </div>
    </div>
  );
};
