import React from 'react';
import { useApp } from '../context/AppContext';

export const Customers = () => {
  const { customers, orders, setActiveModal, setModalPayload, deleteCustomerDoc } = useApp();

  return (
    <section id="tab-customers" className="tab-content active">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Customer Accounts</div>
          <div className="text-muted small">Manage customer contact details, delivery addresses & order history</div>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('customer'); }}>
          <i className="bi bi-plus-lg"></i>
          <span>Add Customer</span>
        </button>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-4">
        {customers.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            No customer accounts found. Click "+ Add Customer" to create one.
          </div>
        ) : (
          customers.map(c => {
            const custOrders = orders.filter(o => o.customerId === c.id);
            const totalBoxes = custOrders.reduce((acc, o) => acc + (o.quantity || 0), 0);

            return (
              <div key={c.id} className="col">
                <div className="card h-100 border-0 shadow-sm p-3 bg-body-tertiary rounded-3" style={{ borderLeft: '4px solid var(--bs-success) !important' }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong className="fs-5 text-reset font-outfit">{c.customerName}</strong>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" onClick={() => { setModalPayload(c); setActiveModal('customer'); }} title="Edit Customer">
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-outline-danger" onClick={() => deleteCustomerDoc(c.id)} title="Delete Customer">
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>

                  <div className="text-muted small mb-2">
                    {c.contactPersonName ? <span><i className="bi bi-person-fill me-1"></i>{c.contactPersonName}</span> : ''}
                    {c.contactPersonNumber ? <span className="ms-2"><i className="bi bi-telephone-fill me-1"></i>{c.contactPersonNumber}</span> : ''}
                  </div>

                  {c.customerAddress && (
                    <div className="text-secondary small mb-3 text-truncate" title={c.customerAddress}>
                      <i className="bi bi-geo-alt-fill me-1 text-success"></i>{c.customerAddress}
                    </div>
                  )}

                  <div className="border-top pt-2 mt-auto d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Total Orders Placed</span>
                    <span className="tabular-nums fs-6 fw-bold text-success">
                      {custOrders.length} orders ({totalBoxes.toLocaleString('en-IN')} boxes)
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
