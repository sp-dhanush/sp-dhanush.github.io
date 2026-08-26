import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  exportFactoryMarginStatementPDF, 
  exportFactoryRateStatementPDF 
} from '../utils/pdfExporter';
import { formatINR } from '../utils/helpers';

export const Reports = () => {
  const { factories, customers, orders, boxDetails, paymentDetails } = useApp();
  const [selectedFactoryId, setSelectedFactoryId] = useState(factories[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [monthStr, setMonthStr] = useState('');
  const [activeReportTab, setActiveReportTab] = useState('margin'); // 'margin' | 'rate' | 'combined'

  const selectedFactory = factories.find(f => f.id === selectedFactoryId);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const openingBal = selectedFactory
    ? (parseFloat(selectedFactory.openingBalance) || parseFloat(selectedFactory.currentBalance) || 0)
    : 0;

  // Filter & sort orders descending by order date
  const factoryOrders = orders
    .filter(o => {
      const matchFact = !selectedFactoryId || o.factoryId === selectedFactoryId;
      const matchCust = !selectedCustomerId || o.customerId === selectedCustomerId;
      const matchMonth = !monthStr || (o.orderDate && o.orderDate.startsWith(monthStr));
      return matchFact && matchCust && matchMonth;
    })
    .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));

  // Filter & sort payments descending by payment date
  const factoryPayments = paymentDetails
    .filter(p => {
      const matchFact = !selectedFactoryId || p.factoryId === selectedFactoryId;
      const matchMonth = !monthStr || (p.paymentDate && p.paymentDate.startsWith(monthStr));
      return matchFact && matchMonth;
    })
    .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));

  let totalMarginEarned = 0;
  let totalRateValue = 0;

  factoryOrders.forEach(o => {
    const items = Array.isArray(o.items) && o.items.length > 0
      ? o.items
      : [{ boxId: o.boxId, quantity: o.quantity }];

    items.forEach(it => {
      const b = boxDetails.find(box => box.id === it.boxId) || {};
      const margin = parseFloat(b.margin) || 0;
      const rate = parseFloat(b.rate) || 0;
      const qty = parseInt(it.quantity) || 0;
      totalMarginEarned += margin * qty;
      totalRateValue += rate * qty;
    });
  });

  let totalPaymentsSettled = 0;
  factoryPayments.forEach(p => totalPaymentsSettled += (parseFloat(p.amountPaid) || 0));

  const netPendingCommission = openingBal + totalMarginEarned - totalPaymentsSettled;

  // 1. Download Personal Margin Statement PDF
  const handleDownloadMarginPDF = () => {
    exportFactoryMarginStatementPDF({
      factory: selectedFactory || { factoryName: 'All Factories Margin Statement' },
      monthStr,
      factoryOrders,
      factoryPayments,
      boxDetails
    });
  };

  // 2. Download Factory Rate / Supply Statement PDF
  const handleDownloadRatePDF = () => {
    exportFactoryRateStatementPDF({
      factory: selectedFactory || { factoryName: 'All Factories Supply Statement' },
      monthStr,
      factoryOrders,
      boxDetails
    });
  };

  return (
    <section id="tab-reports" className="tab-content active">
      {/* Header Bar with Dedicated Export Buttons */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Financial Reports & Statements</div>
          <div className="text-muted small">Live calculation of personal margin commissions and factory supply order rates</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-success d-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm" onClick={handleDownloadMarginPDF} title="Download Personal Brokerage Margin Statement PDF">
            <i className="bi bi-file-earmark-lock-fill fs-5"></i>
            <span>Download Personal Margin PDF</span>
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm" onClick={handleDownloadRatePDF} title="Download Factory Supply & Rate Statement PDF">
            <i className="bi bi-file-earmark-text-fill fs-5"></i>
            <span>Download Factory Rate PDF</span>
          </button>
        </div>
      </div>

      {/* 3-Column Filter Panel */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-body-tertiary">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label text-uppercase small fw-bold text-muted">Select Manufacturing Factory</label>
            <select className="form-select" value={selectedFactoryId} onChange={(e) => setSelectedFactoryId(e.target.value)}>
              <option value="">-- All Factories --</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label text-uppercase small fw-bold text-muted">Select Customer</label>
            <select className="form-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">-- All Customers --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label text-uppercase small fw-bold text-muted">Filter Month (Optional)</label>
            <input type="month" className="form-control" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(selectedFactory || selectedCustomer || monthStr) && (
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
          <span className="small text-muted fw-semibold me-1">Active Filters:</span>
          {selectedFactory && (
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              Factory: {selectedFactory.factoryName}
            </span>
          )}
          {selectedCustomer && (
            <span className="badge bg-info-subtle text-info border border-info-subtle">
              Customer: {selectedCustomer.customerName}
            </span>
          )}
          {monthStr && (
            <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
              Month: {monthStr}
            </span>
          )}
          <button className="btn btn-link btn-sm text-decoration-none p-0 ms-2" onClick={() => { setSelectedFactoryId(''); setSelectedCustomerId(''); setMonthStr(''); }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Primary KPI Cards (Margin, Rate Value, Payments Received, Net Commission) */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 mb-4">
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-info">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Total Factory Rate / Value</div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-info">{formatINR(totalRateValue)}</div>
            <div className="small text-muted mt-1">Based on Rate/Box across {factoryOrders.length} orders</div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-primary">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Personal Margin Commission</div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-primary">{formatINR(totalMarginEarned)}</div>
            <div className="small text-muted mt-1">Calculated from {factoryOrders.length} matching orders</div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-success">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Payments Received from Factory</div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-success">{formatINR(totalPaymentsSettled)}</div>
            <div className="small text-muted mt-1">{factoryPayments.length} payment settlements recorded</div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-warning">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Net Commission Pending Owed</div>
            <div className={`fs-3 fw-bold tabular-nums font-outfit ${netPendingCommission > 0 ? 'text-warning' : 'text-success'}`}>
              {formatINR(netPendingCommission)}
            </div>
            <div className="small text-muted mt-1">
              {openingBal > 0 ? `Includes ${formatINR(openingBal)} initial opening balance` : (netPendingCommission > 0 ? 'Pending payout owed by factory' : 'Fully settled')}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Breakdown Table with Report View Switcher */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div className="p-3 bg-body-tertiary border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold font-outfit fs-6">Orders Financial Breakdown</div>
            <span className="badge bg-secondary">{factoryOrders.length} Orders (Sorted: Newest First)</span>
          </div>

          {/* View Mode Buttons */}
          <div className="btn-group btn-group-sm" role="group">
            <button 
              type="button" 
              className={`btn ${activeReportTab === 'margin' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveReportTab('margin')}
            >
              Personal Margin Report
            </button>
            <button 
              type="button" 
              className={`btn ${activeReportTab === 'rate' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveReportTab('rate')}
            >
              Factory Rate / Value Report
            </button>
            <button 
              type="button" 
              className={`btn ${activeReportTab === 'combined' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveReportTab('combined')}
            >
              All Columns Combined
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Order Date</th>
                <th>Customer</th>
                <th>Factory</th>
                <th>Box Name</th>
                <th>Specs</th>
                <th>Quantity</th>
                {(activeReportTab === 'rate' || activeReportTab === 'combined') && (
                  <>
                    <th>Factory Rate / Box (₹)</th>
                    <th>Total Order Value (₹)</th>
                  </>
                )}
                {(activeReportTab === 'margin' || activeReportTab === 'combined') && (
                  <>
                    <th>My Margin / Box (₹)</th>
                    <th>Total Margin Earned (₹)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {factoryOrders.length === 0 ? (
                <tr>
                  <td colSpan={activeReportTab === 'combined' ? 10 : 8} className="text-center py-4 text-muted">
                    No orders matching current filter criteria.
                  </td>
                </tr>
              ) : (
                factoryOrders.map(o => {
                  const items = Array.isArray(o.items) && o.items.length > 0
                    ? o.items
                    : [{ boxId: o.boxId, boxName: o.boxName, quantity: o.quantity }];

                  return items.map((line, idx) => {
                    const b = boxDetails.find(box => box.id === line.boxId) || {};
                    const margin = parseFloat(b.margin) || 0;
                    const rate = parseFloat(b.rate) || 0;
                    const qty = parseInt(line.quantity) || 0;
                    const totalLineMargin = margin * qty;
                    const totalLineRate = rate * qty;
                    const specStr = (b.length && b.width && b.height) ? `${b.length}×${b.width}×${b.height} ${b.unit || ''}` : '-';

                    return (
                      <tr key={`${o.id}_${idx}`}>
                        <td className="small fw-medium">{o.orderDate || '-'}</td>
                        <td><strong>{o.customerName || '-'}</strong></td>
                        <td><span className="badge bg-secondary-subtle text-secondary border">{o.factoryName || '-'}</span></td>
                        <td>{line.boxName || b.boxName || '-'}</td>
                        <td className="small text-muted">{specStr}</td>
                        <td className="tabular-nums">{qty.toLocaleString('en-IN')}</td>
                        
                        {(activeReportTab === 'rate' || activeReportTab === 'combined') && (
                          <>
                            <td className="tabular-nums">{rate ? `₹${rate.toFixed(2)}` : '-'}</td>
                            <td className="tabular-nums fw-bold text-info">{formatINR(totalLineRate)}</td>
                          </>
                        )}

                        {(activeReportTab === 'margin' || activeReportTab === 'combined') && (
                          <>
                            <td className="tabular-nums">{margin ? `₹${margin.toFixed(2)}` : '-'}</td>
                            <td className="tabular-nums fw-bold text-primary">{formatINR(totalLineMargin)}</td>
                          </>
                        )}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settled Payments Table (Sorted Descending by Payment Date) */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="p-3 bg-body-tertiary border-bottom d-flex justify-content-between align-items-center">
          <div className="fw-bold font-outfit fs-6">Payments Received from Factory</div>
          <span className="badge bg-success">{factoryPayments.length} Payments (Sorted: Newest First)</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Payment Date</th>
                <th>Factory Name</th>
                <th>Amount Paid (₹)</th>
                <th>Payment Mode</th>
                <th>Notes / Reference</th>
              </tr>
            </thead>
            <tbody>
              {factoryPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No payment transactions matching current filter criteria.</td>
                </tr>
              ) : (
                factoryPayments.map(p => (
                  <tr key={p.id}>
                    <td className="small fw-medium">{p.paymentDate || '-'}</td>
                    <td><strong>{p.factoryName || '-'}</strong></td>
                    <td className="tabular-nums text-success fw-bold">{formatINR(p.amountPaid)}</td>
                    <td><span className="badge bg-success-subtle text-success border">{p.paymentMode || 'Cash'}</span></td>
                    <td className="small text-muted">{p.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
