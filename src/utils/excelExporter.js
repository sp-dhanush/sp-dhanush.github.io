import ExcelJS from 'exceljs';

export const exportBoxCatalogExcel = async (boxes = [], { customerName, factoryName, categoryFilter, search } = {}, customers = [], factories = []) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Factory Flow';
  workbook.lastModifiedBy = 'Factory Flow';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Box Master Catalog', {
    views: [{ showGridLines: true }]
  });

  // Define column layout
  worksheet.columns = [
    { header: '#', key: 'index', width: 6 },
    { header: 'Box Name', key: 'boxName', width: 30 },
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'Factory', key: 'factory', width: 22 },
    { header: 'Category', key: 'category', width: 14 },
    { header: 'Dimensions (L×W×H)', key: 'dimensions', width: 22 },
    { header: 'Ply', key: 'ply', width: 10 },
    { header: 'Paper GSM', key: 'paperGsm', width: 14 },
    { header: 'Paper BF', key: 'paperBf', width: 14 },
    { header: 'Open Type', key: 'openType', width: 15 },
    { header: 'Rate / Box (₹)', key: 'rate', width: 16 },
    { header: 'Margin / Box (₹)', key: 'margin', width: 16 },
    { header: 'Notes', key: 'notes', width: 28 },
    { header: 'Auto Specification', key: 'description', width: 45 },
    { header: 'Reference Image', key: 'image', width: 24 }
  ];

  // Header row styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate-800
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Add each box row
  boxes.forEach((b, idx) => {
    const rowNumber = idx + 2;
    const dimStr = (b.length && b.width && b.height) ? `${b.length} × ${b.width} × ${b.height} ${b.unit || 'mm'}` : '-';
    
    // Resolve Customer & Factory names
    const cust = customers.find(c => c.id === b.customerId);
    const custName = cust ? cust.customerName : (b.customerName || '-');
    
    const fact = factories.find(f => f.id === b.factoryId);
    const factName = fact ? fact.factoryName : (b.factoryName || '-');

    const hasPhotos = Array.isArray(b.photos) && b.photos.length > 0 && b.photos[0].url;

    const row = worksheet.addRow({
      index: idx + 1,
      boxName: b.boxName || b.productName || '-',
      customer: custName,
      factory: factName,
      category: b.category || 'Outer',
      dimensions: dimStr,
      ply: b.ply ? `${b.ply}-Ply` : '-',
      paperGsm: b.paperGsm || '-',
      paperBf: b.paperBf || '-',
      openType: b.openType || b.type || 'Regular',
      rate: b.rate ? Number(b.rate) : 0,
      margin: b.margin ? Number(b.margin) : 0,
      notes: b.note || b.notes || '-',
      description: b.description || '-',
      image: ''
    });

    row.height = hasPhotos ? 70 : 24;

    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 7 ? 'center' : (colNumber >= 11 && colNumber <= 12 ? 'right' : 'left'),
        wrapText: true
      };
      cell.font = { name: 'Calibri', size: 10 };
      if (colNumber >= 11 && colNumber <= 12) {
        cell.numFmt = '₹#,##0.00';
      }
    });

    // Embed Image thumbnail inside row
    if (hasPhotos) {
      try {
        const photoUrl = b.photos[0].url;
        let base64Data = photoUrl;
        let ext = 'jpeg';

        if (photoUrl.startsWith('data:image/')) {
          const match = photoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (match) {
            ext = match[1] === 'png' ? 'png' : 'jpeg';
            base64Data = match[2];
          }
        }

        const imageId = workbook.addImage({
          base64: base64Data,
          extension: ext
        });

        worksheet.addImage(imageId, {
          tl: { col: 14.15, row: rowNumber - 0.88 },
          ext: { width: 80, height: 60 },
          editAs: 'oneCell'
        });
      } catch (err) {
        console.warn('Could not embed image into Excel row:', err);
      }
    }
  });

  // Generate Excel file buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  anchor.download = `Box_Details_Catalog_${dateStr}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
