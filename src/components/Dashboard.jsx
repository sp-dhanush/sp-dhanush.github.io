import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/helpers';
import { exportWorkOrderPDF } from '../utils/pdfExporter';

export const Dashboard = () => {
  const { factories, customers, boxDetails, orders, paymentDetails, setActiveTab, setActiveModal, setModalPayload } = useApp();

  // 1. Financial Stats Calculations
  let totalMarginEarned = 0;
  let totalBoxesOrdered = 0;
  let totalOpeningBal = 0;

  factories.forEach(f => {
    totalOpeningBal += parseFloat(f.openingBalance) || parseFloat(f.currentBalance) || 0;
  });

  orders.forEach(o => {
    const items = Array.isArray(o.items) && o.items.length > 0
      ? o.items
      : [{ boxId: o.boxId, quantity: o.quantity }];

    items.forEach(it => {
      const b = boxDetails.find(box => box.id === it.boxId) || {};
      const margin = parseFloat(b.margin) || 0;
      const qty = parseInt(it.quantity) || 0;
      totalMarginEarned += margin * qty;
      totalBoxesOrdered += qty;
    });
  });

  let totalPaymentsSettled = 0;
  paymentDetails.forEach(p => {
    totalPaymentsSettled += parseFloat(p.amountPaid) || 0;
  });

  const netCommissionPending = totalOpeningBal + totalMarginEarned - totalPaymentsSettled;

  // 2. Factory Financial Summaries
  const factorySummary = factories.map(f => {
    const openingBal = parseFloat(f.openingBalance) || parseFloat(f.currentBalance) || 0;
    let marginEarned = 0;
    orders.filter(o => o.factoryId === f.id).forEach(o => {
      const items = Array.isArray(o.items) && o.items.length > 0
        ? o.items
        : [{ boxId: o.boxId, quantity: o.quantity }];

      items.forEach(it => {
        const b = boxDetails.find(box => box.id === it.boxId) || {};
        marginEarned += (parseFloat(b.margin) || 0) * (parseInt(it.quantity) || 0);
      });
    });

    let paid = 0;
    paymentDetails.filter(p => p.factoryId === f.id).forEach(p => {
      paid += parseFloat(p.amountPaid) || 0;
    });

    const dues = openingBal + marginEarned - paid;
    return { ...f, openingBal, marginEarned, paid, dues };
  }).sort((a, b) => b.dues - a.dues);

  // 3. Recent 5 Orders
  const recentOrders = [...orders].slice(0, 5);

  return (
    <section id="tab-dashboard" className="tab-content active">
      {/* Top Welcome Header & Quick Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="fs-3 fw-bold font-outfit text-main">Brokerage Executive Dashboard</div>
          <div className="text-muted small">Real-time margin commission stats across factories, customers, orders & payments</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('order'); }}>
            <i className="bi bi-plus-lg"></i>
            <span>Book Multi-Item Order</span>
          </button>
          <button className="btn btn-success d-flex align-items-center gap-1 rounded-3 px-3 py-2 shadow-sm" onClick={() => { setModalPayload(null); setActiveModal('payment'); }}>
            <i className="bi bi-credit-card-2-front-fill me-1"></i>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3 mb-4">
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 h-100 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small text-uppercase fw-bold">Total Margin Commission Earned</span>
              <div className="p-2 bg-primary-subtle text-primary rounded-3">
                <i className="bi bi-graph-up-arrow fs-5"></i>
              </div>
            </div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-primary">{formatINR(totalMarginEarned)}</div>
            <div className="small text-muted mt-1">{orders.length} orders ({totalBoxesOrdered.toLocaleString('en-IN')} boxes)</div>
          </div>
        </div>

        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 h-100 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small text-uppercase fw-bold">Payments Received from Factories</span>
              <div className="p-2 bg-success-subtle text-success rounded-3">
                <i className="bi bi-check-circle-fill fs-5"></i>
              </div>
            </div>
            <div className="fs-3 fw-bold tabular-nums text-success font-outfit">{formatINR(totalPaymentsSettled)}</div>
            <div className="small text-muted mt-1">{paymentDetails.length} payment transactions</div>
          </div>
        </div>

        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 h-100 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small text-uppercase fw-bold">Net Commission Pending Owed</span>
              <div className="p-2 bg-warning-subtle text-warning rounded-3">
                <i className="bi bi-hourglass-split fs-5"></i>
              </div>
            </div>
            <div className={`fs-3 fw-bold tabular-nums font-outfit ${netCommissionPending > 0 ? 'text-warning' : 'text-success'}`}>
              {formatINR(netCommissionPending)}
            </div>
            <div className="small text-muted mt-1">
              {totalOpeningBal > 0 ? `Includes ${formatINR(totalOpeningBal)} initial opening balance` : (netCommissionPending > 0 ? 'Pending payout owed by factory' : 'Fully settled')}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="text-muted small">Registered Factories</div>
              <div className="fs-4 fw-bold font-outfit">{factories.length} Plants</div>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveTab('factories')}>View All</button>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="text-muted small">Registered Customers</div>
              <div className="fs-4 fw-bold font-outfit">{customers.length} Clients</div>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveTab('customers')}>View All</button>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="text-muted small">Master Box Specifications</div>
              <div className="fs-4 fw-bold font-outfit">{boxDetails.length} Box Specs</div>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveTab('products')}>View Specs</button>
          </div>
        </div>
      </div>

      {/* Section 1: Factory Dues Breakdown */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div className="p-3 bg-body-tertiary border-bottom d-flex justify-content-between align-items-center">
          <div className="fw-bold font-outfit fs-6">Factory Margin Commission Settlement Summary</div>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTab('factories')}>View Factories Page</button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Factory Name</th>
                <th>Contact Person</th>
                <th>Margin Earned (₹)</th>
                <th>Payments Received (₹)</th>
                <th>Net Commission Pending (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {factorySummary.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No factories recorded yet.</td>
                </tr>
              ) : (
                factorySummary.map(f => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.factoryName}</strong>
                      {f.openingBal > 0 && <div className="text-muted" style={{ fontSize: '0.75rem' }}>Initial Opening: {formatINR(f.openingBal)}</div>}
                    </td>
                    <td className="small text-muted">{f.contactPersonName || '-'} {f.contactPersonNumber ? `(${f.contactPersonNumber})` : ''}</td>
                    <td className="tabular-nums font-semibold text-primary">{formatINR(f.marginEarned)}</td>
                    <td className="tabular-nums text-success">{formatINR(f.paid)}</td>
                    <td className={`tabular-nums fw-bold ${f.dues > 0 ? 'text-warning' : 'text-success'}`}>{formatINR(f.dues)}</td>
                    <td>
                      <span className={`badge ${f.dues > 0 ? 'bg-warning text-dark' : 'bg-success'} rounded-pill`}>
                        {f.dues > 0 ? 'Commission Pending' : 'Fully Settled'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Recent Orders Quick View */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="p-3 bg-body-tertiary border-bottom d-flex justify-content-between align-items-center">
          <div className="fw-bold font-outfit fs-6">Recent Production Orders</div>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTab('orders')}>View All Orders</button>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Customer</th>
                <th>Factory</th>
                <th>Box Item(s) Summary</th>
                <th>Total Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">No orders booked yet.</td>
                </tr>
              ) : (
                recentOrders.map(o => {
                  const items = Array.isArray(o.items) && o.items.length > 0
                    ? o.items
                    : [{ boxId: o.boxId, boxName: o.boxName, quantity: o.quantity }];
                  const totalQty = items.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);

                  return (
                    <tr key={o.id}>
                      <td className="small">{o.orderDate || '-'}</td>
                      <td className="small text-danger fw-semibold">{o.deliveryDate || '-'}</td>
                      <td><strong>{o.customerName || '-'}</strong></td>
                      <td>{o.factoryName || '-'}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {items.length > 1 ? `${items.length} Box Types (${items.map(i => i.boxName).join(', ')})` : (items[0]?.boxName || o.boxName || '-')}
                        </span>
                      </td>
                      <td className="tabular-nums fw-bold">{totalQty.toLocaleString('en-IN')} Boxes</td>
                      <td>
                        <button className="btn btn-sm btn-outline-success" onClick={() => exportWorkOrderPDF(o, boxDetails)} title="Export Factory Work Order PDF (No Rates)">
                          <i className="bi bi-file-earmark-pdf-fill me-1"></i>Work Order PDF
                        </button>
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
