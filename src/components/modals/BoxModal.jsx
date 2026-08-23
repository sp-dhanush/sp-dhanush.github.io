import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateBoxDescription } from '../../utils/helpers';
import { Upload, X } from 'lucide-react';

export const BoxModal = () => {
  const { modalPayload, saveBoxDoc, setActiveModal } = useApp();
  const b = modalPayload || {};

  const [boxName, setBoxName] = useState(b.boxName || b.productName || '');
  const [len, setLen] = useState(b.length || '');
  const [wid, setWid] = useState(b.width || '');
  const [hei, setHei] = useState(b.height || '');
  const [unit, setUnit] = useState(b.unit || 'mm');
  const [category, setCategory] = useState(b.category || 'Outer');
  const [ply, setPly] = useState(b.ply || '5');
  const [paperGsm, setPaperGsm] = useState(b.paperGsm || b.gsmBf || '');
  const [paperBf, setPaperBf] = useState(b.paperBf || '');
  const [openType, setOpenType] = useState(b.openType || b.type || 'Regular');
  const [rate, setRate] = useState(b.rate !== undefined ? b.rate : (b.factoryRate !== undefined ? b.factoryRate : ''));
  const [margin, setMargin] = useState(b.margin !== undefined ? b.margin : (b.extraMargin !== undefined ? b.extraMargin : ''));
  const [note, setNote] = useState(b.note || b.notes || '');
  const [photos, setPhotos] = useState(Array.isArray(b.photos) ? b.photos : []);
  const [uploading, setUploading] = useState(false);

  const autoSentence = generateBoxDescription({ boxName, length: len, width: wid, height: hei, unit, category, ply, paperGsm, paperBf, openType });

  // Canvas image compressor to ensure Firestore document size stays light & fast (<50KB per photo)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve({ name: file.name, url: compressedDataUrl });
        };
        img.onerror = () => resolve({ name: file.name, url: evt.target.result });
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const compressedList = await Promise.all(files.map(compressImage));
      setPhotos(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Error processing photos:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boxName.trim()) return;

    await saveBoxDoc(b.id, {
      boxName: boxName.trim(),
      length: parseFloat(len) || 0,
      width: parseFloat(wid) || 0,
      height: parseFloat(hei) || 0,
      unit,
      category,
      ply,
      paperGsm: paperGsm.trim(),
      paperBf: paperBf.trim(),
      openType,
      rate: parseFloat(rate) || 0,
      margin: parseFloat(margin) || 0,
      note: note.trim(),
      photos,
      description: autoSentence
    });

    setActiveModal(null);
  };

  return (
    <div className="modal-backdrop d-flex align-items-center justify-content-center" onClick={(e) => e.target.classList.contains('modal-backdrop') && setActiveModal(null)}>
      <div className="modal-card modal d-block position-relative shadow-lg" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3>{b.id ? 'Edit Box Details' : 'Add New Box Specification'}</h3>
          <button className="close-btn" onClick={() => setActiveModal(null)}>&times;</button>
        </div>
        <div className="modal-body">
          <form id="form-box-details" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Box Name</label>
                <input type="text" value={boxName} onChange={e => setBoxName(e.target.value)} placeholder="e.g. 1kg Medicine Master Carton" required />
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
                <label>Category (Inner / Outer)</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Outer">Outer Box</option>
                  <option value="Inner">Inner Box</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ply Type</label>
                <select value={ply} onChange={e => setPly(e.target.value)}>
                  <option value="3">3-Ply</option>
                  <option value="5">5-Ply</option>
                  <option value="7">7-Ply</option>
                  <option value="9">9-Ply</option>
                </select>
              </div>
              <div className="form-group">
                <label>Open Type</label>
                <select value={openType} onChange={e => setOpenType(e.target.value)}>
                  <option value="Regular">Regular</option>
                  <option value="Over Flop">Over Flop</option>
                  <option value="Default">Default</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Paper GSM</label>
                <input type="text" value={paperGsm} onChange={e => setPaperGsm(e.target.value)} placeholder="e.g. 180 GSM" />
              </div>
              <div className="form-group">
                <label>Paper Burst Factor (BF)</label>
                <input type="text" value={paperBf} onChange={e => setPaperBf(e.target.value)} placeholder="e.g. 24 BF" />
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Factory Rate / Box (₹)</label>
                <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 45.00" />
              </div>
              <div className="form-group">
                <label>My Extra Margin / Box (₹)</label>
                <input type="number" step="0.01" value={margin} onChange={e => setMargin(e.target.value)} placeholder="e.g. 5.00" />
              </div>
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Note / Special Requirements</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Heavy duty outer carton, customized print" />
            </div>

            {/* Reference Photos Section */}
            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="mb-0">Reference Photos / Sample Image Files ({photos.length})</label>
                {uploading && <span className="badge bg-warning text-dark">Processing Photos...</span>}
              </div>
              
              <label className="dropzone border border-dashed rounded-3 p-3 text-center cursor-pointer" style={{ display: 'block', background: 'var(--bg-body)' }}>
                <Upload size={22} className="text-primary mb-1" />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click or drop sample reference photos here</div>
                <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>

              {photos.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {photos.map((pt, idx) => (
                    <div key={idx} className="position-relative border rounded-3 overflow-hidden" style={{ width: '64px', height: '64px' }}>
                      <img src={pt.url} alt={pt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle"
                        style={{ width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px' }}
                        onClick={() => handleRemovePhoto(idx)}
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
              <label>Auto-Generated Specification Description</label>
              <input type="text" value={autoSentence} readOnly style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'var(--primary)', color: 'var(--text-main)', fontWeight: 600 }} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
            {uploading ? 'Processing...' : 'Save Box Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
