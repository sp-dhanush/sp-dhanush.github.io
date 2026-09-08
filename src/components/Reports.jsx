import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  exportFactoryMarginStatementPDF, 
  exportFactoryRateStatementPDF,
  exportPersonalMarginPDFNew
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
      : [{ boxId: o.boxId, quantity: o.quantity, margin: o.margin, rate: o.rate }];

    items.forEach(it => {
      const b = boxDetails.find(box => box.id === it.boxId) || {};
      const margin = it.margin !== undefined ? parseFloat(it.margin) : (parseFloat(b.margin) || 0);
      const rate = it.rate !== undefined ? parseFloat(it.rate) : (parseFloat(b.rate) || 0);
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

  // 2. Download Personal Margin Statement PDF_new (Enhanced Ledger Statement)
  const handleDownloadMarginPDFNew = () => {
    exportPersonalMarginPDFNew({
      factory: selectedFactory || { factoryName: 'All Factories Margin Ledger' },
      monthStr,
      factoryOrders,
      factoryPayments,
      boxDetails
    });
  };

  // 3. Download Factory Rate / Supply Statement PDF
  const handleDownloadRatePDF = () => {
    exportFactoryRateStatementPDF({
      factory: selectedFactory || { factoryName: 'All Factories Supply Statement' },
      monthStr,
      factoryOrders,
      boxDetails
    });
  };

  // Prepare Merged Entries with Monthly Subtotals for Reports view
  const rawReportEntries = [];

  if (openingBal > 0) {
    rawReportEntries.push({
      date: 'Opening',
      rawDate: '0000-00-00',
      monthKey: '0000-00',
      monthLabel: 'Opening Dues',
      type: 'Opening Balance',
      entity: selectedFactory ? selectedFactory.factoryName : 'All Factories',
      boxName: '-',
      specs: 'Initial Opening Dues',
      qty: 0,
      marginPerBox: 0,
      totalMargin: 0,
      debit: openingBal,
      credit: 0
    });
  }

  factoryOrders.forEach(o => {
    const items = Array.isArray(o.items) && o.items.length > 0
      ? o.items
      : [{ boxId: o.boxId, boxName: o.boxName, quantity: o.quantity, margin: o.margin, rate: o.rate }];

    const oDate = o.orderDate || '1970-01-01';
    const monthKey = oDate.substring(0, 7);
    const dateObj = new Date(oDate);
    const monthLabel = isNaN(dateObj.getTime()) ? monthKey : dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    items.forEach(it => {
      const b = boxDetails.find(box => box.id === it.boxId) || {};
      const margin = it.margin !== undefined ? parseFloat(it.margin) : (parseFloat(b.margin) || 0);
      const qty = parseInt(it.quantity) || 0;
      const marginTotal = margin * qty;

      const dimStr = (b.length && b.width && b.height) ? `${b.length}×${b.width}×${b.height} ${b.unit || ''}` : '-';
      const plyStr = b.ply ? `${b.ply}-Ply` : '';
      const specsStr = [dimStr !== '-' ? dimStr : null, plyStr].filter(Boolean).join(', ') || '-';

      rawReportEntries.push({
        date: o.orderDate || '-',
        rawDate: oDate,
        monthKey,
        monthLabel,
        type: 'Order Commission',
        entity: o.customerName || 'Customer',
        boxName: it.boxName || b.boxName || 'Carton Box',
        specs: specsStr,
        qty,
        marginPerBox: margin,
        totalMargin: marginTotal,
        debit: marginTotal,
        credit: 0
      });
    });
  });

  factoryPayments.forEach(p => {
    const pDate = p.paymentDate || '1970-01-01';
    const monthKey = pDate.substring(0, 7);
    const dateObj = new Date(pDate);
    const monthLabel = isNaN(dateObj.getTime()) ? monthKey : dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const amt = parseFloat(p.amountPaid) || 0;

    rawReportEntries.push({
      date: p.paymentDate || '-',
      rawDate: pDate,
      monthKey,
      monthLabel,
      type: 'Payment Received',
      entity: p.factoryName || 'Factory',
      boxName: `Mode: ${p.paymentMode || 'Cash'}`,
      specs: p.notes || '-',
      qty: 0,
      marginPerBox: 0,
      totalMargin: 0,
      debit: 0,
      credit: amt
    });
  });

  rawReportEntries.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  let repRunningBal = 0;
  const mergedReportRows = [];
  let curMKey = null;
  let curMLabel = '';
  let mQty = 0;
  let mMarginSum = 0;
  let mDebitSum = 0;
  let mCreditSum = 0;
  let repLastDateSeen = null;

  const pushReportMonthSubtotal = () => {
    if (!curMKey || curMKey === '0000-00') return;
    mergedReportRows.push({
      isSubtotal: true,
      date: 'SUBTOTAL',
      displayDate: 'SUBTOTAL',
      type: `${curMLabel} Subtotal`,
      entity: '-',
      boxName: '-',
      specs: 'Monthly Summary',
      qty: mQty,
      marginPerBox: 0,
      totalMargin: mMarginSum,
      debit: mDebitSum,
      credit: mCreditSum,
      runningBalance: repRunningBal
    });
    mQty = 0;
    mMarginSum = 0;
    mDebitSum = 0;
    mCreditSum = 0;
    repLastDateSeen = null;
  };

  rawReportEntries.forEach(entry => {
    if (entry.monthKey !== curMKey) {
      if (curMKey !== null) pushReportMonthSubtotal();
      curMKey = entry.monthKey;
      curMLabel = entry.monthLabel;
      repLastDateSeen = null;
    }

    repRunningBal += (entry.debit - entry.credit);
    mQty += entry.qty;
    mMarginSum += entry.totalMargin;
    mDebitSum += (entry.type !== 'Opening Balance' ? entry.debit : 0);
    mCreditSum += entry.credit;

    const displayDate = (entry.date && entry.date === repLastDateSeen) ? '' : entry.date;
    if (entry.date) {
      repLastDateSeen = entry.date;
    }

    mergedReportRows.push({
      ...entry,
      displayDate,
      runningBalance: repRunningBal
    });
  });
  pushReportMonthSubtotal();

  return (
    <section id="tab-reports" className="tab-content active">
      {/* Header Bar with Dedicated Export Buttons */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit">Financial Reports & Statements</div>
          <div className="text-muted small">Live calculation of personal margin commissions and factory supply order rates</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-success d-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm fw-semibold" onClick={handleDownloadMarginPDFNew} title="Download Enhanced Personal Brokerage Margin Statement PDF_new with Credit & Debit Running Ledger">
            <i className="bi bi-file-earmark-diff-fill fs-5"></i>
            <span>Download Personal Margin PDF_new</span>
          </button>
          <button className="btn btn-outline-success d-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm" onClick={handleDownloadMarginPDF} title="Download Classic Personal Brokerage Margin Statement PDF">
            <i className="bi bi-file-earmark-lock-fill fs-5"></i>
            <span>Personal Margin PDF</span>
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm" onClick={handleDownloadRatePDF} title="Download Factory Supply & Rate Statement PDF">
            <i className="bi bi-file-earmark-text-fill fs-5"></i>
            <span>Factory Rate PDF</span>
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

      {/* Breakdown Table with Report View Switcher */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div className="p-3 bg-body-tertiary border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="fw-bold font-outfit fs-6">Financial Reports Table</div>
            <span className="badge bg-secondary">{factoryOrders.length} Orders & {factoryPayments.length} Payments</span>
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
              className={`btn ${activeReportTab === 'merged_ledger' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setActiveReportTab('merged_ledger')}
            >
              Merged Running Ledger (PDF_new View)
            </button>
            <button 
              type="button" 
              className={`btn ${activeReportTab === 'rate' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveReportTab('rate')}
            >
              Factory Rate Report
            </button>
            <button 
              type="button" 
              className={`btn ${activeReportTab === 'combined' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveReportTab('combined')}
            >
              All Columns
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              {activeReportTab === 'merged_ledger' ? (
                <tr>
                  <th>Date</th>
                  <th>Type / Entry</th>
                  <th>Entity / Customer</th>
                  <th>Box Name</th>
                  <th>Specs</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Margin/Box (₹)</th>
                  <th className="text-end">Total Margin (₹)</th>
                  <th className="text-end">Debit (+₹)</th>
                  <th className="text-end">Credit (-₹)</th>
                  <th className="text-end">Running Bal (₹)</th>
                </tr>
              ) : (
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
              )}
            </thead>
            <tbody>
              {activeReportTab === 'merged_ledger' ? (
                mergedReportRows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-muted">
                      No ledger transactions matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  mergedReportRows.map((row, rIdx) => {
                    if (row.isSubtotal) {
                      return (
                        <tr key={`sub_${rIdx}`} className="table-secondary fw-bold">
                          <td className="small">{row.date}</td>
                          <td><span className="badge bg-dark">{row.type}</span></td>
                          <td>-</td>
                          <td>-</td>
                          <td><span className="badge bg-secondary">{row.specs}</span></td>
                          <td className="text-end tabular-nums">{row.qty > 0 ? row.qty.toLocaleString('en-IN') : '-'}</td>
                          <td className="text-end">-</td>
                          <td className="text-end tabular-nums text-primary">{row.totalMargin > 0 ? formatINR(row.totalMargin) : '-'}</td>
                          <td className="text-end tabular-nums text-danger">{row.debit > 0 ? formatINR(row.debit) : '-'}</td>
                          <td className="text-end tabular-nums text-success">{row.credit > 0 ? formatINR(row.credit) : '-'}</td>
                          <td className="text-end tabular-nums text-primary">{formatINR(row.runningBalance)}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={`rep_${rIdx}`}>
                        <td className="small fw-semibold">{row.displayDate !== undefined ? row.displayDate : row.date}</td>
                        <td>
                          {row.type.includes('Debit') || row.type.includes('Commission') ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">{row.type}</span>
                          ) : row.type.includes('Credit') || row.type.includes('Payment') ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">{row.type}</span>
                          ) : (
                            <span className="badge bg-info-subtle text-info border border-info-subtle">{row.type}</span>
                          )}
                        </td>
                        <td className="fw-semibold">{row.entity}</td>
                        <td>{row.boxName}</td>
                        <td className="small text-muted">{row.specs}</td>
                        <td className="text-end tabular-nums">{row.qty > 0 ? row.qty.toLocaleString('en-IN') : '-'}</td>
                        <td className="text-end tabular-nums">{row.marginPerBox > 0 ? `₹${row.marginPerBox.toFixed(2)}` : '-'}</td>
                        <td className="text-end tabular-nums text-primary">{row.totalMargin > 0 ? formatINR(row.totalMargin) : '-'}</td>
                        <td className="text-end tabular-nums text-danger">{row.debit > 0 ? formatINR(row.debit) : '-'}</td>
                        <td className="text-end tabular-nums text-success">{row.credit > 0 ? formatINR(row.credit) : '-'}</td>
                        <td className="text-end tabular-nums fw-bold text-primary">{formatINR(row.runningBalance)}</td>
                      </tr>
                    );
                  })
                )
              ) : factoryOrders.length === 0 ? (
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
                    const margin = line.margin !== undefined ? parseFloat(line.margin) : (parseFloat(b.margin) || 0);
                    const rate = line.rate !== undefined ? parseFloat(line.rate) : (parseFloat(b.rate) || 0);
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
