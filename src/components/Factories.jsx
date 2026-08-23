import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/helpers';

export const Factories = () => {
  const { factories, orders, boxDetails, paymentDetails, setActiveModal, setModalPayload, deleteFactoryDoc } = useApp();

  return (
    <section id="tab-factories" className="tab-content active">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Manufacturing Factories</div>
          <div className="text-muted small">Manage factory contacts, plant locations, opening balance & margin commission dues</div>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('factory'); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Factory</span>
        </button>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-4">
        {factories.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            No manufacturing factories found. Click "+ Add Factory" to create one.
          </div>
        ) : (
          factories.map(f => {
            const openingBal = parseFloat(f.openingBalance) || parseFloat(f.currentBalance) || 0;

            let factoryMarginEarned = 0;
            orders.filter(o => o.factoryId === f.id).forEach(o => {
              const items = Array.isArray(o.items) && o.items.length > 0
                ? o.items
                : [{ boxId: o.boxId, quantity: o.quantity }];

              items.forEach(it => {
                const b = boxDetails.find(box => box.id === it.boxId) || {};
                factoryMarginEarned += (parseFloat(b.margin) || 0) * (parseInt(it.quantity) || 0);
              });
            });

            let factoryPaid = 0;
            paymentDetails.filter(p => p.factoryId === f.id).forEach(p => factoryPaid += (parseFloat(p.amountPaid) || 0));

            const netCommissionDues = openingBal + factoryMarginEarned - factoryPaid;

            return (
              <div key={f.id} className="col">
                <div className="card h-100 border-0 shadow-sm p-3 bg-body-tertiary rounded-3" style={{ borderLeft: '4px solid var(--bs-primary) !important' }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong className="fs-5 text-reset font-outfit">{f.factoryName}</strong>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => { setModalPayload(f); setActiveModal('factory'); }} title="Edit Factory Details or Opening Balance">
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-outline-danger" onClick={() => deleteFactoryDoc(f.id)} title="Delete Factory">
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>

                  <div className="text-muted small mb-2">
                    {f.contactPersonName ? <span><i className="bi bi-person-fill me-1"></i>{f.contactPersonName}</span> : ''}
                    {f.contactPersonNumber ? <span className="ms-2"><i className="bi bi-telephone-fill me-1"></i>{f.contactPersonNumber}</span> : ''}
                  </div>

                  {f.factoryAddress && (
                    <div className="text-secondary small mb-3 text-truncate" title={f.factoryAddress}>
                      <i className="bi bi-geo-alt-fill me-1 text-danger"></i>{f.factoryAddress}
                    </div>
                  )}

                  <div className="d-flex justify-content-between mb-2 pt-2 border-top">
                    <div>
                      <div className="text-secondary small">Total Margin Earned</div>
                      <div className="tabular-nums fw-bold fs-6 text-primary">{formatINR(factoryMarginEarned)}</div>
                    </div>
                    <div>
                      <div className="text-secondary small">Payments Settled</div>
                      <div className="tabular-nums fw-bold fs-6 text-success">{formatINR(factoryPaid)}</div>
                    </div>
                  </div>

                  {openingBal > 0 && (
                    <div className="d-flex justify-content-between mb-2 pb-1 text-muted small" style={{ fontSize: '0.8rem' }}>
                      <span>Initial Opening Dues:</span>
                      <span className="tabular-nums fw-semibold">{formatINR(openingBal)}</span>
                    </div>
                  )}

                  <div className="border-top pt-2 mt-auto d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Net Pending Commission</span>
                    <span className={`tabular-nums fs-5 fw-bold ${netCommissionDues > 0 ? 'text-warning' : 'text-success'}`}>
                      {formatINR(netCommissionDues)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
