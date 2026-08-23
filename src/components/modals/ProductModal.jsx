import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateBoxDescription } from '../../utils/helpers';
import { Upload } from 'lucide-react';

export const ProductModal = () => {
  const { customers, modalPayload, saveProductDoc, setActiveModal } = useApp();

  const p = modalPayload || {};
  const [customerId, setCustomerId] = useState(p.customerId || (customers[0]?.id || ''));
  const [productName, setProductName] = useState(p.productName || '');
  const [len, setLen] = useState(p.length || '');
  const [wid, setWid] = useState(p.width || '');
  const [hei, setHei] = useState(p.height || '');
  const [unit, setUnit] = useState(p.unit || 'mm');
  const [ply, setPly] = useState(p.ply || '5-ply');
  const [gsmBf, setGsmBf] = useState(p.gsmBf || '');
  const [type, setType] = useState(p.type || p.boxType || 'Regular');
  const [factoryRate, setFactoryRate] = useState(p.factoryRate !== undefined ? p.factoryRate : (p.factoryRatePerBox !== undefined ? p.factoryRatePerBox : ''));
  const [extraMargin, setExtraMargin] = useState(p.extraMargin !== undefined ? p.extraMargin : (p.extraMarginPerBox !== undefined ? p.extraMarginPerBox : ''));
  const [notes, setNotes] = useState(p.notes || p.note || '');
  const [photos, setPhotos] = useState(p.photos || p.referencePhotos || []);

  const autoSentence = generateBoxDescription({ productName, length: len, width: wid, height: hei, unit, ply, gsmBf, type });

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotos(prev => [...prev, { name: file.name, url: evt.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const custObj = customers.find(c => c.id === customerId);

    saveProductDoc(p.id, {
      customerId,
      customerName: custObj ? custObj.name : '',
      productName,
      length: parseFloat(len) || 0,
      width: parseFloat(wid) || 0,
      height: parseFloat(hei) || 0,
      unit,
      ply,
      gsmBf,
      type,
      factoryRate: parseFloat(factoryRate) || 0,
      extraMargin: parseFloat(extraMargin) || 0,
      notes: notes.trim(),
      photos,
      description: autoSentence
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3>{p.id ? 'Edit Box Product Specification' : 'Add Box Product Specification'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="form-product" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Customer</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Product / Box Name</label>
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. 1kg Medicine Master Carton" required />
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
                <label>Paper GSM / BF</label>
                <input type="text" value={gsmBf} onChange={e => setGsmBf(e.target.value)} placeholder="e.g. 180 GSM 24 BF" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="Regular">Regular</option>
                  <option value="Over Flop">Over Flop</option>
                  <option value="Default">Default</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Factory Rate / Box (₹)</label>
                <input type="number" step="0.01" value={factoryRate} onChange={e => setFactoryRate(e.target.value)} placeholder="e.g. 45.00" />
              </div>
              <div className="form-group">
                <label>My Extra Margin / Box (₹)</label>
                <input type="number" step="0.01" value={extraMargin} onChange={e => setExtraMargin(e.target.value)} placeholder="e.g. 5.00" />
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Overlap joint, customized print requirement, special Kraft paper" />
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Reference Photos (Customer / Factory Samples)</label>
              <label className="dropzone">
                <Upload size={24} color="var(--text-muted)" />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Click to upload reference sample photos</div>
                <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
              <div className="photo-thumbs">
                {photos.map((pt, idx) => (
                  <img key={idx} src={pt.url} className="photo-thumb" title={`${pt.name} (Click to remove)`} onClick={() => setPhotos(photos.filter((_, i) => i !== idx))} />
                ))}
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Auto-Generated Specification Sentence</label>
              <input type="text" value={autoSentence} readOnly style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'var(--primary)', color: 'var(--text-main)', fontWeight: 600 }} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Product Spec</button>
        </div>
      </div>
    </div>
  );
};
