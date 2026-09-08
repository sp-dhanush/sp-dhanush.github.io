import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportPersonalMarginPDFNew } from '../utils/pdfExporter';
import { formatINR } from '../utils/helpers';

export const Ledger = () => {
  const { factories, customers, orders, boxDetails, paymentDetails } = useApp();
  const [selectedFactoryId, setSelectedFactoryId] = useState(factories[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [monthStr, setMonthStr] = useState('');

  const selectedFactory = factories.find(f => f.id === selectedFactoryId);

  const openingBal = selectedFactory
    ? (parseFloat(selectedFactory.openingBalance) || parseFloat(selectedFactory.currentBalance) || 0)
    : factories.reduce((sum, f) => sum + (parseFloat(f.openingBalance) || parseFloat(f.currentBalance) || 0), 0);

  // 1. Build Credit & Debit Ledger Entries
  const rawLedger = [];

  // Opening Balance Entry
  if (openingBal > 0) {
    rawLedger.push({
      id: 'leg_opening',
      date: 'Opening',
      rawDate: '0000-00-00',
      type: 'Opening Balance',
      entityName: selectedFactory ? selectedFactory.factoryName : 'All Factories',
      particulars: 'Initial Opening Margin Balance Dues',
      debit: openingBal,
      credit: 0
    });
  }

  // Orders -> Debit (Margin Commission Earned)
  const filteredOrders = orders.filter(o => {
    const matchFact = !selectedFactoryId || o.factoryId === selectedFactoryId;
    const matchCust = !selectedCustomerId || o.customerId === selectedCustomerId;
    const matchMonth = !monthStr || (o.orderDate && o.orderDate.startsWith(monthStr));
    const matchSearch = !search || (
      (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.factoryName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.notes || '').toLowerCase().includes(search.toLowerCase())
    );
    return matchFact && matchCust && matchMonth && matchSearch;
  });

  filteredOrders.forEach(o => {
    const items = Array.isArray(o.items) && o.items.length > 0
      ? o.items
      : [{ boxId: o.boxId, boxName: o.boxName, quantity: o.quantity, margin: o.margin, rate: o.rate }];

    let totalOrderMargin = 0;
    const itemDescs = [];

    items.forEach(it => {
      const b = boxDetails.find(box => box.id === it.boxId) || {};
      const margin = it.margin !== undefined ? parseFloat(it.margin) : (parseFloat(b.margin) || 0);
      const qty = parseInt(it.quantity) || 0;
      const totalMargin = margin * qty;
      totalOrderMargin += totalMargin;
      itemDescs.push(`${it.boxName || b.boxName || 'Box'} (${qty.toLocaleString('en-IN')} boxes @ ${formatINR(margin)}/box)`);
    });

    rawLedger.push({
      id: `ord_${o.id}`,
      date: o.orderDate || '-',
      rawDate: o.orderDate || '1970-01-01',
      type: 'Order Commission (Debit)',
      entityName: o.customerName || 'Customer',
      factoryName: o.factoryName,
      particulars: itemDescs.join(', '),
      notes: o.notes,
      debit: totalOrderMargin,
      credit: 0
    });
  });

  // Payments -> Credit (Settlements Received)
  const filteredPayments = paymentDetails.filter(p => {
    const matchFact = !selectedFactoryId || p.factoryId === selectedFactoryId;
    const matchMonth = !monthStr || (p.paymentDate && p.paymentDate.startsWith(monthStr));
    const matchSearch = !search || (
      (p.factoryName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.paymentMode || '').toLowerCase().includes(search.toLowerCase())
    );
    return matchFact && matchMonth && matchSearch;
  });

  filteredPayments.forEach(p => {
    const amt = parseFloat(p.amountPaid) || 0;
    rawLedger.push({
      id: `pay_${p.id}`,
      date: p.paymentDate || '-',
      rawDate: p.paymentDate || '1970-01-01',
      type: 'Payment Settlement (Credit)',
      entityName: p.factoryName || 'Factory',
      particulars: `Mode: ${p.paymentMode || 'Cash'} ${p.notes ? '• Note: ' + p.notes : ''}`,
      debit: 0,
      credit: amt
    });
  });

  // Sort chronologically ascending (Oldest first) to calculate running balance accurately
  rawLedger.sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  let runningAccumulator = 0;
  let totalDebitSum = 0;
  let totalCreditSum = 0;

  const ledgerRows = rawLedger.map(row => {
    runningAccumulator += (row.debit - row.credit);
    if (row.type !== 'Opening Balance') {
      totalDebitSum += row.debit;
    }
    totalCreditSum += row.credit;

    return {
      ...row,
      runningBalance: runningAccumulator
    };
  });

  // For display in table, show newest transactions on top
  const displayLedger = [...ledgerRows].reverse();

  // Download PDF_new Action
  const handleDownloadPDFNew = () => {
    exportPersonalMarginPDFNew({
      factory: selectedFactory || { factoryName: 'All Manufacturing Factories Ledger' },
      monthStr,
      factoryOrders: filteredOrders,
      factoryPayments: filteredPayments,
      boxDetails
    });
  };

  return (
    <section id="tab-ledger" className="tab-content active">
      {/* Header with Download Personal Margin PDF_new Button */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-3">
        <div>
          <div className="fs-4 fw-bold font-outfit text-main">Financial Ledger & Credit / Debit Statement</div>
          <div className="text-muted small">Chronological ledger transactions, debit (margin earned), credit (factory payments) & running balance</div>
        </div>
        <button 
          className="btn btn-success d-flex align-items-center gap-2 rounded-3 px-3 py-2 shadow-sm font-outfit fw-bold"
          onClick={handleDownloadPDFNew}
          title="Download Personal Margin Statement PDF_new with Credit & Debit Running Ledger"
        >
          <i className="bi bi-file-earmark-diff-fill fs-5"></i>
          <span>Download Personal Margin PDF_new</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-body-tertiary">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Manufacturing Factory</label>
            <select className="form-select" value={selectedFactoryId} onChange={(e) => setSelectedFactoryId(e.target.value)}>
              <option value="">-- All Factories --</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.factoryName}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Customer Account</label>
            <select className="form-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">-- All Customers --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Search Keywords</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search customer, particulars, notes..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label text-uppercase small fw-bold text-muted mb-1">Filter Month</label>
            <input 
              type="month" 
              className="form-control" 
              value={monthStr} 
              onChange={(e) => setMonthStr(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 mb-4">
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-primary">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Total Margin Earned (Debit)</div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-primary">{formatINR(totalDebitSum)}</div>
            <div className="small text-muted mt-1">From {filteredOrders.length} orders</div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-success">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Total Payments Received (Credit)</div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-success">{formatINR(totalCreditSum)}</div>
            <div className="small text-muted mt-1">From {filteredPayments.length} settlements</div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-info">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Initial Opening Balance</div>
            <div className="fs-3 fw-bold tabular-nums font-outfit text-info">{formatINR(openingBal)}</div>
            <div className="small text-muted mt-1">{selectedFactory ? selectedFactory.factoryName : 'Combined initial dues'}</div>
          </div>
        </div>
        <div className="col">
          <div className="card border-0 shadow-sm p-3 bg-body-tertiary rounded-3 border-start border-4 border-warning">
            <div className="text-muted small mb-1 text-uppercase fw-bold">Net Running Balance</div>
            <div className={`fs-3 fw-bold tabular-nums font-outfit ${runningAccumulator > 0 ? 'text-warning' : 'text-success'}`}>
              {formatINR(runningAccumulator)}
            </div>
            <div className="small text-muted mt-1">{runningAccumulator > 0 ? 'Net pending dues owed' : 'Fully settled'}</div>
          </div>
        </div>
      </div>

      {/* Credit & Debit Ledger Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div className="p-3 bg-body-tertiary border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-journal-text fs-5 text-primary"></i>
            <span className="fw-bold font-outfit fs-6">Credit & Debit Ledger Transactions</span>
            <span className="badge bg-secondary">{displayLedger.length} Records</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Transaction Type</th>
                <th>Entity / Account</th>
                <th>Particulars & Line Items</th>
                <th className="text-end text-danger">Debit (+₹)</th>
                <th className="text-end text-success">Credit (-₹)</th>
                <th className="text-end">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {displayLedger.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No ledger transactions found matching selected filters.
                  </td>
                </tr>
              ) : (
                displayLedger.map(row => (
                  <tr key={row.id}>
                    <td className="small fw-semibold">{row.date}</td>
                    <td>
                      {row.type.includes('Debit') ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          <i className="bi bi-arrow-up-right me-1"></i>{row.type}
                        </span>
                      ) : row.type.includes('Credit') ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          <i className="bi bi-arrow-down-left me-1"></i>{row.type}
                        </span>
                      ) : (
                        <span className="badge bg-info-subtle text-info border border-info-subtle">
                          <i className="bi bi-dash-circle me-1"></i>{row.type}
                        </span>
                      )}
                    </td>
                    <td className="fw-semibold">{row.entityName}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <div>{row.particulars}</div>
                      {row.notes && <div className="text-muted italic" style={{ fontSize: '0.76rem' }}>Note: {row.notes}</div>}
                    </td>
                    <td className="text-end tabular-nums fw-bold text-danger">
                      {row.debit > 0 ? formatINR(row.debit) : '-'}
                    </td>
                    <td className="text-end tabular-nums fw-bold text-success">
                      {row.credit > 0 ? formatINR(row.credit) : '-'}
                    </td>
                    <td className="text-end tabular-nums fw-bold text-primary fs-6">
                      {formatINR(row.runningBalance)}
                    </td>
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
