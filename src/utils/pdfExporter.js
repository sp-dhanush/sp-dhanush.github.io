import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportWorkOrderPDF = (order, boxDetailsList = []) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTORY WORK ORDER / PRODUCTION SHEET', 14, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Carton Box Manufacturing Specifications & Multi-Item Production Order', 14, 24);

  // Metadata Grid
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');

  doc.text('ORDER DETAILS', 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Order ID: ${order.id || 'N/A'}`, 14, 50);
  doc.text(`Order Date: ${order.orderDate || '-'}`, 14, 56);
  doc.text(`Delivery Date: ${order.deliveryDate || '-'}`, 14, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('FACTORY & CUSTOMER', 110, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Factory: ${order.factoryName || '-'}`, 110, 50);
  doc.text(`Customer: ${order.customerName || '-'}`, 110, 56);

  // Parse items (multi-item order vs single item order)
  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [{ boxId: order.boxId, boxName: order.boxName, quantity: order.quantity, notes: order.notes }];

  // Table Data for Specifications (NO MONEY / RATES)
  const tableHead = [['#', 'Box Name', 'Dimensions', 'Category', 'Ply', 'GSM', 'BF', 'Type', 'Quantity', 'Notes']];
  
  let totalOrderBoxes = 0;
  const photosToRender = [];

  const tableBody = items.map((item, idx) => {
    const b = (Array.isArray(boxDetailsList) ? boxDetailsList.find(box => box.id === item.boxId) : null) || {};
    const dimStr = (b.length && b.width && b.height) ? `${b.length}×${b.width}×${b.height} ${b.unit || ''}` : '-';
    const qty = parseInt(item.quantity) || 0;
    totalOrderBoxes += qty;

    if (Array.isArray(b.photos) && b.photos.length > 0) {
      b.photos.forEach((pt, pIdx) => {
        if (pt && pt.url) {
          photosToRender.push({
            url: pt.url,
            name: pt.name || `Photo #${pIdx + 1}`,
            boxTitle: item.boxName || b.boxName || 'Carton Box',
            dimStr: dimStr !== '-' ? dimStr : `${b.length || ''}×${b.width || ''}×${b.height || ''} ${b.unit || ''}`,
            specPill: b.ply ? `${b.ply}-Ply ${b.category || ''}` : (b.category || '')
          });
        }
      });
    }

    return [
      (idx + 1).toString(),
      item.boxName || b.boxName || 'Carton Box',
      dimStr,
      b.category || '-',
      b.ply ? `${b.ply}-Ply` : '-',
      b.paperGsm || '-',
      b.paperBf || '-',
      b.openType || '-',
      qty.toLocaleString('en-IN'),
      item.notes || '-'
    ];
  });

  doc.autoTable({
    startY: 70,
    margin: { left: 14, right: 14 },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 16 },
      4: { cellWidth: 12 },
      5: { cellWidth: 14 },
      6: { cellWidth: 12 },
      7: { cellWidth: 16 },
      8: { cellWidth: 20, halign: 'right' },
      9: { cellWidth: 'auto' }
    }
  });

  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 110;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Order Quantity: ${totalOrderBoxes.toLocaleString('en-IN')} Boxes across ${items.length} item(s)`, 14, finalY);
  finalY += 8;

  // Notes & Instructions
  if (order.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Overall Production Notes & Instructions:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(order.notes, 180);
    doc.text(splitNotes, 14, finalY + 5);
    finalY += (splitNotes.length * 4) + 10;
  }

  // Reference Photos Section (Includes Box Name and Box Size for each image)
  if (photosToRender.length > 0) {
    if (finalY + 70 > 270) {
      doc.addPage();
      finalY = 20;
    } else {
      finalY += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`ATTACHED BOX REFERENCE PHOTOS & DRAWINGS (${photosToRender.length})`, 14, finalY);
    finalY += 6;

    let col = 0;
    const cardW = 88;
    const cardH = 58;

    photosToRender.forEach((photo) => {
      if (finalY + cardH + 12 > 275) {
        doc.addPage();
        finalY = 20;
        col = 0;
      }

      const posX = col === 0 ? 14 : 108;
      
      // Card Container Border
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(posX, finalY, cardW, cardH, 2, 2, 'FD');

      // Card Header Text: Box Name & Box Size
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const titleTrunc = photo.boxTitle.length > 25 ? photo.boxTitle.substring(0, 25) + '...' : photo.boxTitle;
      doc.text(titleTrunc, posX + 4, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Size: ${photo.dimStr} ${photo.specPill ? '(' + photo.specPill + ')' : ''}`, posX + 4, finalY + 11);

      // Render Photo Frame
      try {
        doc.addImage(photo.url, 'JPEG', posX + 4, finalY + 14, cardW - 8, cardH - 18);
      } catch (err) {
        try {
          doc.addImage(photo.url, 'PNG', posX + 4, finalY + 14, cardW - 8, cardH - 18);
        } catch (e) {
          console.warn('Could not render image in Work Order PDF:', e);
        }
      }

      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        finalY += cardH + 6;
      }
    });

    if (col === 1) {
      finalY += cardH + 6;
    }
  }

  // Signatures
  if (finalY + 30 > 275) {
    doc.addPage();
    finalY = 20;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, finalY + 15, 70, finalY + 15);
  doc.line(140, finalY + 15, 196, finalY + 15);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', 14, finalY + 20);
  doc.text('Factory Acceptance Stamp & Sign', 140, finalY + 20);

  const cleanName = (order.customerName || 'Work_Order').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`WorkOrder_${cleanName}_${order.orderDate || 'draft'}.pdf`);
};

export const exportFactoryStatementPDF = ({ factory, monthStr, factoryOrders, factoryPayments, boxDetails }) => {
  const doc = new jsPDF();
  const factoryName = factory ? factory.factoryName : 'Factory Commission Ledger';
  const factoryAddress = factory ? (factory.factoryAddress || '') : '';
  const contactPerson = factory ? (factory.contactPersonName + (factory.contactPersonNumber ? ' (' + factory.contactPersonNumber + ')' : '')) : '';
  const openingBal = factory ? (parseFloat(factory.openingBalance) || parseFloat(factory.currentBalance) || 0) : 0;

  // Header Title (Properly sized to avoid clipping)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('FACTORY MARGIN COMMISSION STATEMENT', 14, 16);

  // Subtitle / Header details
  doc.setFontSize(10);
  doc.text(factoryName, 14, 23);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  
  const splitAddress = doc.splitTextToSize(factoryAddress, 110);
  doc.text(splitAddress, 14, 28);
  let addrHeight = (splitAddress.length * 3.5);
  if (contactPerson) {
    doc.text(`Contact: ${contactPerson}`, 14, 28 + addrHeight);
  }

  // Right-aligned Metadata
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Statement Period: ${monthStr || 'All Time'}`, 196, 23, { align: 'right' });
  doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 196, 28, { align: 'right' });

  let startTableY = Math.max(38, 28 + addrHeight + 8);

  // Table 1: Orders Margin Commission
  let totalMarginEarned = 0;
  const orderRows = [];

  factoryOrders.forEach(o => {
    const items = Array.isArray(o.items) && o.items.length > 0
      ? o.items
      : [{ boxId: o.boxId, boxName: o.boxName, quantity: o.quantity }];

    items.forEach(item => {
      const b = (Array.isArray(boxDetails) ? boxDetails.find(box => box.id === item.boxId) : null) || {};
      const marginPerBox = parseFloat(b.margin) || 0;
      const qty = parseInt(item.quantity) || 0;
      const itemMarginTotal = marginPerBox * qty;
      totalMarginEarned += itemMarginTotal;

      const specStr = (b.length && b.width && b.height) ? `${b.length}×${b.width}×${b.height} ${b.unit || ''}, ${b.ply || ''}Ply` : (item.boxName || '-');
      orderRows.push([
        o.orderDate || '-',
        o.customerName || '-',
        item.boxName || b.boxName || '-',
        specStr,
        qty.toLocaleString('en-IN'),
        `Rs. ${marginPerBox.toFixed(2)}`,
        `Rs. ${itemMarginTotal.toLocaleString('en-IN')}`
      ]);
    });
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Orders Margin Commission Earned', 14, startTableY);

  doc.autoTable({
    startY: startTableY + 3,
    margin: { left: 14, right: 14 },
    head: [['Order Date', 'Customer', 'Box Name', 'Specs', 'Qty', 'Margin/Box', 'Total Margin']],
    body: orderRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 32 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' }
    }
  });

  let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startTableY + 40;

  // Table 2: Settled Payments Received
  let totalPaid = 0;
  const paymentRows = factoryPayments.map(p => {
    const amt = parseFloat(p.amountPaid) || 0;
    totalPaid += amt;
    return [
      p.paymentDate || '-',
      `Rs. ${amt.toLocaleString('en-IN')}`,
      p.paymentMode || 'Cash',
      p.notes || '-'
    ];
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Settled Factory Payments Received', 14, nextY);

  doc.autoTable({
    startY: nextY + 3,
    margin: { left: 14, right: 14 },
    head: [['Payment Date', 'Amount Paid', 'Payment Mode', 'Notes & Reference']],
    body: paymentRows,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 32, halign: 'right' },
      2: { cellWidth: 32 },
      3: { cellWidth: 'auto' }
    }
  });

  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : nextY + 30;
  const netPendingCommission = openingBal + totalMarginEarned - totalPaid;

  // Render Summary Box at Bottom Right (x=90 to x=196) with right-aligned amounts
  const boxHeight = openingBal > 0 ? 36 : 28;
  
  // Check page overflow
  if (finalY + boxHeight > 280) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(88, finalY, 108, boxHeight, 3, 3, 'FD');

  let boxY = finalY + 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  if (openingBal > 0) {
    doc.text('Initial Opening Margin:', 92, boxY);
    doc.text(`Rs. ${openingBal.toLocaleString('en-IN')}`, 192, boxY, { align: 'right' });
    boxY += 5.5;
  }

  doc.text('Total Margin Commission Earned:', 92, boxY);
  doc.text(`Rs. ${totalMarginEarned.toLocaleString('en-IN')}`, 192, boxY, { align: 'right' });
  boxY += 5.5;

  doc.text('Factory Payments Received:', 92, boxY);
  doc.text(`Rs. ${totalPaid.toLocaleString('en-IN')}`, 192, boxY, { align: 'right' });
  boxY += 7.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (netPendingCommission > 0) {
    doc.setTextColor(220, 38, 38); // Red
    doc.text('Net Commission Pending:', 92, boxY);
    doc.text(`Rs. ${netPendingCommission.toLocaleString('en-IN')}`, 192, boxY, { align: 'right' });
  } else {
    doc.setTextColor(5, 150, 105); // Green
    doc.text('Net Commission Balance:', 92, boxY);
    doc.text(`Rs. ${netPendingCommission.toLocaleString('en-IN')} (Settled)`, 192, boxY, { align: 'right' });
  }

  const cleanFactName = factoryName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanFactName}_Margin_Statement_${monthStr || 'all'}.pdf`);
};

export const exportBoxCatalogPDF = (boxes = [], { customerName, factoryName, categoryFilter, search } = {}) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('BOX DETAILS & PRODUCT MASTER CATALOG', 14, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  const filterDesc = [
    customerName ? `Customer: ${customerName}` : null,
    factoryName ? `Factory: ${factoryName}` : null,
    categoryFilter ? `Category: ${categoryFilter}` : null,
    search ? `Search: "${search}"` : null
  ].filter(Boolean).join('  |  ') || 'Complete Specifications Catalog';
  doc.text(`Comprehensive Specifications, Rates & Technical Details  •  ${filterDesc}`, 14, 24);

  // Metadata Bar
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Boxes: ${boxes.length}`, 14, 42);
  doc.text(`Date Generated: ${new Date().toLocaleDateString('en-IN')}`, 196, 42, { align: 'right' });

  // Table Data
  const tableHead = [['#', 'Box Name', 'Category', 'Dimensions', 'Ply', 'GSM / BF', 'Type', 'Rate (₹)', 'Margin (₹)', 'Notes']];
  
  const photosToRender = [];

  const tableBody = boxes.map((b, idx) => {
    const dimStr = (b.length && b.width && b.height) ? `${b.length}×${b.width}×${b.height} ${b.unit || 'mm'}` : '-';
    const gsmBfStr = [b.paperGsm, b.paperBf].filter(Boolean).join(' / ') || '-';
    const rateStr = b.rate ? `Rs. ${Number(b.rate).toFixed(2)}` : '-';
    const marginStr = b.margin ? `Rs. ${Number(b.margin).toFixed(2)}` : '-';

    if (Array.isArray(b.photos) && b.photos.length > 0) {
      b.photos.forEach((pt, pIdx) => {
        if (pt && pt.url) {
          photosToRender.push({
            url: pt.url,
            name: pt.name || `Photo #${pIdx + 1}`,
            boxTitle: b.boxName || b.productName || 'Box Specification',
            dimStr: dimStr !== '-' ? dimStr : `${b.length || ''}×${b.width || ''}×${b.height || ''} ${b.unit || ''}`,
            specPill: `${b.ply ? b.ply + '-Ply ' : ''}${b.category || ''} • Rate: ${rateStr}`,
            notes: b.note || b.notes || ''
          });
        }
      });
    }

    return [
      (idx + 1).toString(),
      b.boxName || b.productName || 'Carton Box',
      b.category || 'Outer',
      dimStr,
      b.ply ? `${b.ply}-Ply` : '-',
      gsmBfStr,
      b.openType || b.type || 'Regular',
      rateStr,
      marginStr,
      b.note || b.notes || '-'
    ];
  });

  doc.autoTable({
    startY: 46,
    margin: { left: 14, right: 14 },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 36 },
      2: { cellWidth: 16 },
      3: { cellWidth: 26 },
      4: { cellWidth: 12 },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 'auto' }
    }
  });

  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 120;

  // Render Attached Reference Photos Section if any photos exist
  if (photosToRender.length > 0) {
    if (finalY + 70 > 270) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`ATTACHED BOX REFERENCE PHOTOS & TECHNICAL DRAWINGS (${photosToRender.length})`, 14, finalY);
    finalY += 6;

    let col = 0;
    const cardW = 88;
    const cardH = 62;

    photosToRender.forEach((photo) => {
      if (finalY + cardH + 10 > 275) {
        doc.addPage();
        finalY = 20;
        col = 0;
      }

      const posX = col === 0 ? 14 : 108;
      
      // Card Container Border
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(posX, finalY, cardW, cardH, 2, 2, 'FD');

      // Card Header Text: Box Name & Box Size
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const titleTrunc = photo.boxTitle.length > 28 ? photo.boxTitle.substring(0, 28) + '...' : photo.boxTitle;
      doc.text(titleTrunc, posX + 4, finalY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Size: ${photo.dimStr} (${photo.specPill})`, posX + 4, finalY + 11);

      // Render Photo Frame
      try {
        doc.addImage(photo.url, 'JPEG', posX + 4, finalY + 14, cardW - 8, cardH - 18);
      } catch (err) {
        try {
          doc.addImage(photo.url, 'PNG', posX + 4, finalY + 14, cardW - 8, cardH - 18);
        } catch (e) {
          console.warn('Could not render image in Catalog PDF:', e);
        }
      }

      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        finalY += cardH + 6;
      }
    });

    if (col === 1) {
      finalY += cardH + 6;
    }
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Box_Details_Catalog_${dateStr}.pdf`);
};
