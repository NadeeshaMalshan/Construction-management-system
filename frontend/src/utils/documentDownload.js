import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility helper for document downloads across all Odiliya portals
 */

export function triggerDownload(blobOrUrl, fileName = 'document.txt') {
  if (typeof blobOrUrl === 'string' && (blobOrUrl.startsWith('data:') || blobOrUrl.startsWith('http') || blobOrUrl.startsWith('blob:'))) {
    const link = document.createElement('a');
    link.href = blobOrUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  let blob;
  if (blobOrUrl instanceof Blob) {
    blob = blobOrUrl;
  } else {
    blob = new Blob([String(blobOrUrl || '')], { type: 'text/plain;charset=utf-8' });
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/**
 * Universal fallback document downloader supporting PDF and TXT
 */
export function downloadFile(fileDataOrUrl, fileName = 'document.pdf', fallbackTitle = 'Document', fallbackDetails = {}) {
  if (fileDataOrUrl && (fileDataOrUrl.startsWith('data:') || fileDataOrUrl.startsWith('http') || fileDataOrUrl.startsWith('blob:'))) {
    triggerDownload(fileDataOrUrl, fileName);
    return;
  }

  if (fileName.toLowerCase().endsWith('.pdf')) {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Top Brand Header Banner
      doc.setFillColor(15, 76, 58); // Primary Emerald
      doc.rect(0, 0, 210, 24, 'F');
      
      doc.setFillColor(217, 119, 6); // Gold Accent Bar
      doc.rect(0, 24, 210, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(209, 250, 229);
      doc.text('OFFICIAL CORPORATE DOCUMENT & CONSTRUCTION RECORDS VAULT', 14, 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('VERIFIED RECORD', 196, 15, { align: 'right' });

      // Title Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(fallbackTitle.toUpperCase(), 14, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Ref: ODLY-${Date.now().toString().slice(-6)}`, 14, 42);

      // Metadata Table
      const metaRows = Object.entries(fallbackDetails)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), String(v)]);

      if (metaRows.length > 0) {
        autoTable(doc, {
          startY: 48,
          head: [['Specification / Field', 'Recorded Value & Details']],
          body: metaRows,
          theme: 'striped',
          headStyles: { fillColor: [15, 76, 58], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60, textColor: [15, 76, 58] },
            1: { cellWidth: 122 },
          },
          margin: { left: 14, right: 14 },
        });
      }

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 70;

      // Authentication Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, 182, 28, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 76, 58);
      doc.text('AUTHENTICATION & COMPLIANCE VERIFICATION', 18, finalY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('This document has been digitally issued by the Odiliya Construction Management Enterprise Platform.', 18, finalY + 13);
      doc.text('All engineering records, materials, and corporate logs adhere to ISO/SLS construction standards.', 18, finalY + 18);
      doc.text('Corporate Office: No. 120, Negombo Road, Peliyagoda, Sri Lanka | Phone: +94 11 234 5678', 18, finalY + 23);

      // Bottom Footer Bar
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Odiliya Residencies & Homes (Pvt) Ltd — Confidential Construction & Logistics Document', 105, 287, { align: 'center' });

      doc.save(fileName);
      return;
    } catch (err) {
      console.warn('PDF rendering error, falling back to text format:', err);
    }
  }

  // Generate an official Odiliya document summary text file if no binary payload is attached or as fallback
  const lines = [
    '========================================================================',
    '                   ODILIYA RESIDENCIES & HOMES (PVT) LTD                ',
    '                 OFFICIAL CONSTRUCTION DOCUMENT & RECORD                 ',
    '========================================================================',
    '',
    `DOCUMENT TITLE : ${fallbackTitle}`,
    `FILE NAME      : ${fileName}`,
    `GENERATED ON   : ${new Date().toLocaleString()}`,
    `PORTAL ORIGIN  : Odiliya Construction Management Enterprise System`,
    '',
    '------------------------------------------------------------------------',
    '                         DOCUMENT SPECIFICATIONS                        ',
    '------------------------------------------------------------------------',
  ];

  for (const [key, val] of Object.entries(fallbackDetails)) {
    if (val !== undefined && val !== null && val !== '') {
      lines.push(`${key.padEnd(16)}: ${val}`);
    }
  }

  lines.push('');
  lines.push('------------------------------------------------------------------------');
  lines.push('                      AUTHENTICATION & COMPLIANCE                       ');
  lines.push('------------------------------------------------------------------------');
  lines.push('This document is electronically generated and recorded by the Odiliya');
  lines.push('Construction Management System. Verified for site engineering and compliance.');
  lines.push('========================================================================');

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, fileName.endsWith('.txt') ? fileName : `${fileName.replace(/\.[^/.]+$/, '')}.txt`);
}

export function exportCsv(arg1, arg2, arg3) {
  let filename = 'export.csv';
  let headers = [];
  let rows = [];

  if (typeof arg1 === 'string' && Array.isArray(arg2) && Array.isArray(arg3)) {
    filename = arg1;
    headers = arg2;
    rows = arg3;
  } else if (typeof arg1 === 'string' && Array.isArray(arg2)) {
    filename = arg1;
    if (arg2.length > 0 && typeof arg2[0] === 'object' && !Array.isArray(arg2[0])) {
      headers = Object.keys(arg2[0]);
      rows = arg2.map((obj) => headers.map((h) => obj[h]));
    } else {
      rows = arg2;
    }
  } else if (Array.isArray(arg1)) {
    filename = typeof arg2 === 'string' ? arg2 : 'export.csv';
    if (arg1.length > 0 && typeof arg1[0] === 'object' && !Array.isArray(arg1[0])) {
      headers = Object.keys(arg1[0]);
      rows = arg1.map((obj) => headers.map((h) => obj[h]));
    } else {
      rows = arg1;
    }
  }

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvLines = [];
  if (headers && headers.length > 0) {
    csvLines.push(headers.map(escapeCsv).join(','));
  }

  for (const row of rows) {
    if (Array.isArray(row)) {
      csvLines.push(row.map(escapeCsv).join(','));
    } else if (typeof row === 'object' && row !== null) {
      csvLines.push(Object.values(row).map(escapeCsv).join(','));
    } else {
      csvLines.push(escapeCsv(row));
    }
  }

  const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export structured data directly to Microsoft Excel (.xlsx) spreadsheet
 */
export function exportExcel(arg1, arg2, arg3, arg4) {
  let filename = 'spreadsheet.xlsx';
  let data = [];
  let sheetName = 'Sheet1';

  if (typeof arg1 === 'string' && Array.isArray(arg2) && Array.isArray(arg3)) {
    // Signature: (filename, headers, rows, [sheetName])
    filename = arg1;
    const headers = arg2;
    const rows = arg3;
    sheetName = typeof arg4 === 'string' ? arg4 : 'Data';
    data = rows.map((row) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = Array.isArray(row) ? (row[idx] !== undefined ? row[idx] : '') : (row[h] !== undefined ? row[h] : '');
      });
      return obj;
    });
  } else if (typeof arg1 === 'string' && Array.isArray(arg2)) {
    // Signature: (filename, dataArray, [sheetName])
    filename = arg1;
    data = arg2;
    sheetName = typeof arg3 === 'string' ? arg3 : 'Data';
  } else if (Array.isArray(arg1)) {
    // Signature: (dataArray, [filename], [sheetName])
    data = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'spreadsheet.xlsx';
    sheetName = typeof arg3 === 'string' ? arg3 : 'Data';
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-calculate column widths
    if (data.length > 0) {
      const colKeys = Object.keys(data[0] || {});
      worksheet['!cols'] = colKeys.map((key) => {
        let maxLen = String(key).length;
        data.forEach((row) => {
          const valStr = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
          if (valStr.length > maxLen) {
            maxLen = Math.min(valStr.length, 60);
          }
        });
        return { wch: Math.max(maxLen + 4, 12) };
      });
    }

    const workbook = XLSX.utils.book_new();
    const cleanSheetName = (sheetName || 'Data').replace(/[:\\/?*\[\]]/g, '_').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    const finalName = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    triggerDownload(blob, finalName);
  } catch (err) {
    console.error('Excel generation failed, falling back to CSV export:', err);
    exportCsv(filename.replace(/\.xlsx$/i, '.csv'), data);
  }
}

/**
 * Generate and download an official corporate Goods Procurement Purchase Invoice (PDF)
 * for buying goods/materials from suppliers.
 */
export function downloadPurchaseOrderInvoice(po, supplier = null) {
  if (!po) return;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const poNum = po.poNumber || `PO-${po.id || 'NEW'}`;
    const fileName = `Odiliya_Supplier_Purchase_Invoice_${poNum}.pdf`;
    const supplierName = po.supplier || supplier?.name || 'Verified Construction Supplier';
    const supplierCode = supplier?.supplierCode || 'SUP-RECORD';
    const contactPerson = supplier?.contactPerson || 'Sales & Procurement Desk';
    const phone = supplier?.phone || '+94 11 234 5678';
    const email = supplier?.email || 'sales@supplier.lk';
    const address = supplier?.address || 'Supplier Central Depot, Colombo, Sri Lanka';
    const paymentTerms = supplier?.paymentTerms || 'Net 30 Days (Direct Bank Transfer)';

    const itemName = po.material?.name || 'Construction Grade Material';
    const itemCode = po.material?.materialCode || 'MAT-001';
    const itemCategory = po.material?.category || supplier?.category || 'Building Materials';
    const warehouseLocation = po.material?.location || 'Central Construction Depot (Bay 01)';
    const qty = Number(po.quantity || 0);
    const unit = po.material?.unit || 'units';
    const unitPrice = Number(po.unitPrice || 0);
    const totalAmount = Number(po.totalAmount || (qty * unitPrice));
    
    const orderDate = po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const deliveryDate = po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB') : 'Immediate Site Dispatch';
    const receivedDate = po.receivedDate ? new Date(po.receivedDate).toLocaleDateString('en-GB') : null;
    const isReceived = String(po.status).toUpperCase() === 'RECEIVED';
    const statusText = isReceived ? 'GOODS RECEIVED & VERIFIED' : 'PURCHASE ORDER ISSUED';

    const formattedUnitPrice = unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedTotal = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ==========================================
    // 1. TOP HEADER BANNER & BRANDING
    // ==========================================
    // Emerald Top Bar
    doc.setFillColor(15, 76, 58); // Deep Emerald
    doc.rect(0, 0, 210, 32, 'F');

    // Amber Accent Line
    doc.setFillColor(217, 119, 6); // Warm Amber
    doc.rect(0, 32, 210, 2, 'F');

    // Company Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD', 14, 13);

    // Subtitle & Registration
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(209, 250, 229);
    doc.text('ENGINEERING, PROPERTY DEVELOPMENT & MATERIAL PROCUREMENT DIVISION', 14, 19);
    doc.text('Reg No: PV-128940 | VAT ID: 102938475-7000 | Web: www.odiliyahomes.lk', 14, 25);

    // Right Header - Invoice Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('PURCHASE INVOICE', 196, 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(254, 240, 138); // Yellow accent
    doc.text(`PO: ${poNum}`, 196, 21, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(209, 250, 229);
    doc.text(`Issue Date: ${orderDate}`, 196, 27, { align: 'right' });

    // ==========================================
    // 2. METADATA CARDS (BUYER & SUPPLIER)
    // ==========================================
    const cardY = 40;
    const cardHeight = 44;
    const cardWidth = 88;

    // Buyer Card (Left)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFillColor(15, 76, 58);
    doc.rect(14, cardY, cardWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('BUYER / BILLING ENTITY', 18, cardY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Odiliya Residencies & Homes (Pvt) Ltd', 18, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Procurement & Central Logistics Division', 18, cardY + 17);
    doc.text('No. 120, Negombo Road, Peliyagoda, Sri Lanka', 18, cardY + 22);
    doc.text('Phone: +94 11 234 5678 | +94 77 123 4567', 18, cardY + 27);
    doc.text('Email: procurement@odiliyahomes.lk', 18, cardY + 32);
    doc.text(`Delivery Yard: ${warehouseLocation}`, 18, cardY + 37);

    // Supplier Card (Right)
    const supX = 108;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(supX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFillColor(4, 120, 87);
    doc.rect(supX, cardY, cardWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('VENDOR / SUPPLIER DETAILS', supX + 4, cardY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${supplierName}`, supX + 4, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Vendor Code: ${supplierCode} | Contact: ${contactPerson}`, supX + 4, cardY + 17);
    doc.text(`Address: ${address}`, supX + 4, cardY + 22);
    doc.text(`Phone: ${phone}`, supX + 4, cardY + 27);
    doc.text(`Email: ${email}`, supX + 4, cardY + 32);
    doc.text(`Payment Terms: ${paymentTerms}`, supX + 4, cardY + 37);

    // ==========================================
    // 3. ORDER STATUS STRIP
    // ==========================================
    const stripY = 88;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, stripY, 182, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 76, 58);
    doc.text('STATUS:', 18, stripY + 7.5);

    doc.setFont('helvetica', 'bold');
    if (isReceived) {
      doc.setTextColor(4, 120, 87);
    } else {
      doc.setTextColor(180, 83, 9);
    }
    doc.text(statusText, 35, stripY + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 76, 58);
    doc.text('EXPECTED DELIVERY:', 95, stripY + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(deliveryDate, 130, stripY + 7.5);

    if (receivedDate) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(`(Received: ${receivedDate})`, 160, stripY + 7.5);
    }

    // ==========================================
    // 4. ITEM DETAILS TABLE
    // ==========================================
    const tableData = [
      [
        '1',
        itemCode,
        itemName,
        itemCategory,
        warehouseLocation,
        `LKR ${formattedUnitPrice}`,
        `${qty} ${unit}`,
        `LKR ${formattedTotal}`,
      ],
    ];

    autoTable(doc, {
      startY: 104,
      head: [['#', 'Item Code', 'Material Description', 'Category', 'Target Yard', 'Unit Price', 'Quantity', 'Amount (LKR)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 76, 58],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 46, fontStyle: 'bold' },
        3: { halign: 'left', cellWidth: 24 },
        4: { halign: 'left', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 24 },
        6: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        7: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [15, 76, 58] },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 3.5,
      },
      margin: { left: 14, right: 14 },
    });

    const tableEnd = doc.lastAutoTable ? doc.lastAutoTable.finalY : 130;

    // ==========================================
    // 5. FINANCIAL TOTALS & NOTES SUMMARY
    // ==========================================
    const summaryY = tableEnd + 6;

    // Left Notes Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, summaryY, 105, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 76, 58);
    doc.text('PROCUREMENT INSTRUCTIONS & NOTES', 18, summaryY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const notesText = po.notes ? po.notes : 'All materials must strictly conform to SLS/BS construction specifications. Delivery trucks must present Goods Delivery Note (GDN) matching this PO upon arrival at the central gate.';
    const splitNotes = doc.splitTextToSize(notesText, 97);
    doc.text(splitNotes, 18, summaryY + 12);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Authorized Officer: ${po.createdBy || 'Inventory & Procurement Manager'}`, 18, summaryY + 29);

    // Right Totals Box
    const totalsX = 124;
    const totalsWidth = 72;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(totalsX, summaryY, totalsWidth, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal (Excl. Taxes):', totalsX + 4, summaryY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`LKR ${formattedTotal}`, totalsX + totalsWidth - 4, summaryY + 7, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('VAT / Tax Assessment:', totalsX + 4, summaryY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Included in Quoted Rate', totalsX + totalsWidth - 4, summaryY + 14, { align: 'right' });

    // Grand Total Emerald Highlight Box
    doc.setFillColor(15, 76, 58);
    doc.roundedRect(totalsX + 2, summaryY + 19, totalsWidth - 4, 12, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('NET PAYABLE TOTAL:', totalsX + 5, summaryY + 26.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(254, 240, 138); // Yellow accent
    doc.text(`LKR ${formattedTotal}`, totalsX + totalsWidth - 6, summaryY + 26.5, { align: 'right' });

    // ==========================================
    // 6. TERMS & CONDITIONS
    // ==========================================
    const termsY = summaryY + 38;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, termsY, 182, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 76, 58);
    doc.text('PURCHASE TERMS & CORPORATE COMPLIANCE AGREEMENT:', 18, termsY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Quality Inspection: Goods are received subject to on-site civil quality assessment and sampling laboratory test approval.', 18, termsY + 9.5);
    doc.text('2. Rejection & Transit: Non-conforming or damaged batches will be rejected at vendor risk; replacement must be completed within 48h.', 18, termsY + 13.5);
    doc.text('3. Invoice Settlement: Payments are released according to agreed payment terms following verified Goods Received Note (GRN) issuance.', 18, termsY + 17.5);
    doc.text('4. Jurisdiction: This commercial order is governed by the commercial laws of the Democratic Socialist Republic of Sri Lanka.', 18, termsY + 21.5);

    // ==========================================
    // 7. SIGNATURES & OFFICIAL SEALS
    // ==========================================
    const signY = termsY + 28;

    // Signatory 1: Prepared By
    doc.setDrawColor(148, 163, 184);
    doc.line(18, signY + 14, 64, signY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Prepared By (Procurement)', 18, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(po.createdBy || 'Inventory Manager', 18, signY + 21.5);

    // Signatory 2: Authorized Director
    doc.line(82, signY + 14, 128, signY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized By (Finance / Ops)', 82, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Head of Project Logistics', 82, signY + 21.5);

    // Signatory 3: Supplier Stamp
    doc.line(146, signY + 14, 192, signY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Vendor Acknowledgment & Stamp', 146, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Official Seal / Signature', 146, signY + 21.5);

    // ==========================================
    // 8. SECURITY WATERMARK & FOOTER
    // ==========================================
    doc.setFillColor(15, 76, 58);
    doc.rect(0, 289, 210, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(209, 250, 229);
    doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD — ELECTRONIC PURCHASE INVOICE & AUDIT TRAIL', 14, 294);

    doc.setFont('helvetica', 'bold');
    doc.text('SYSTEM VERIFIED', 196, 294, { align: 'right' });

    // Save and Trigger PDF download
    doc.save(fileName);
  } catch (err) {
    console.error('PDF generation error, executing fallback text download:', err);
    // Fallback if needed
    downloadFile(null, `Odiliya_Supplier_Purchase_Invoice_${po.poNumber || po.id}.txt`, 'Supplier Purchase Order Invoice', {
      poNumber: po.poNumber,
      supplier: po.supplier || supplier?.name,
      material: po.material?.name,
      quantity: `${po.quantity} ${po.material?.unit || 'units'}`,
      totalAmount: `LKR ${po.totalAmount}`,
      status: po.status,
    });
  }
}

/**
 * Download official Client Payment Invoice & Tax Receipt (PDF)
 */
export function downloadPaymentInvoice(payment, client = null, project = null) {
  if (!payment) return;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const invNum = payment.referenceNumber
      ? `INV-${payment.referenceNumber}`
      : `INV-PAY-${payment.id ? String(payment.id).padStart(5, '0') : Date.now().toString().slice(-6)}`;
    const fileName = `Odiliya_Payment_Invoice_${invNum}.pdf`;

    const clientObj = client || payment.client || {};
    const clientName = clientObj.name || 'Valued Client';
    const clientPhone = clientObj.phone || 'N/A';
    const clientEmail = clientObj.email || 'N/A';
    const clientAddress = clientObj.address || 'Sri Lanka';

    const projectObj = project || payment.project || {};
    const projectName = projectObj.name || 'General Construction & Property Account';
    const projectLocation = projectObj.location || 'Western Province, Sri Lanka';
    const projectCategory = projectObj.category || 'Luxury Housing / Residential Development';

    const rawAmount = Number(payment.amount || 0);
    const formattedAmount = rawAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const paymentDateStr = payment.paymentDate
      ? new Date(payment.paymentDate).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB');

    const rawMethod = String(payment.paymentMethod || 'BANK_TRANSFER').toUpperCase();
    const isCard = rawMethod.includes('CARD') || rawMethod.includes('VISA') || rawMethod.includes('MASTER');
    const paymentMethodLabel = isCard ? 'Online Credit/Debit Card Gateway' : 'Direct Online Bank Transfer';

    const paymentStatus = payment.status || (isCard ? 'Payment Successful' : 'Confirmed');

    // 1. TOP HEADER BANNER
    doc.setFillColor(15, 76, 58); // Deep Emerald
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFillColor(217, 119, 6); // Warm Amber
    doc.rect(0, 32, 210, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(209, 250, 229);
    doc.text('OFFICIAL CLIENT ACCOUNTS, BILLING & FINANCIAL SETTLEMENTS DIVISION', 14, 19);
    doc.text('Reg No: PV-128940 | VAT ID: 102938475-7000 | Web: www.odiliyahomes.lk', 14, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE & RECEIPT', 196, 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(254, 240, 138); // Yellow accent
    doc.text(invNum, 196, 21, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(209, 250, 229);
    doc.text(`Issue Date: ${paymentDateStr}`, 196, 27, { align: 'right' });

    // 2. METADATA CARDS (COMPANY vs CLIENT)
    const cardY = 40;
    const cardHeight = 44;
    const cardWidth = 88;

    // Company Card (Left)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFillColor(15, 76, 58);
    doc.rect(14, cardY, cardWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ISSUED BY / FINANCIAL ENTITY', 18, cardY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Odiliya Residencies & Homes (Pvt) Ltd', 18, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Head Office: No. 120, Negombo Road, Peliyagoda', 18, cardY + 17);
    doc.text('Finance & Client Escrow Accounts Desk', 18, cardY + 22);
    doc.text('Direct Hotline: +94 11 234 5678 | +94 77 123 4567', 18, cardY + 27);
    doc.text('Email: finance@odiliyahomes.lk', 18, cardY + 32);
    doc.text('Corporate Bankers: Commercial Bank of Ceylon PLC', 18, cardY + 37);

    // Client Card (Right)
    const cliX = 108;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cliX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFillColor(4, 120, 87);
    doc.rect(cliX, cardY, cardWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('BILLED TO / VALUED CLIENT', cliX + 4, cardY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${clientName}`, cliX + 4, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Client ID: CLI-${clientObj.id || 'REG'} | Contact: ${clientPhone}`, cliX + 4, cardY + 17);
    doc.text(`Email: ${clientEmail}`, cliX + 4, cardY + 22);
    doc.text(`Billing Address: ${clientAddress}`, cliX + 4, cardY + 27);
    doc.text(`Project Assigned: ${projectName}`, cliX + 4, cardY + 32);
    doc.text(`Location: ${projectLocation}`, cliX + 4, cardY + 37);

    // 3. PAYMENT SPECIFICATIONS SUMMARY STRIP
    const specY = 90;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, specY, 182, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('TRANSACTION REF', 18, specY + 5.5);
    doc.text('PAYMENT CHANNEL', 65, specY + 5.5);
    doc.text('PAYMENT STATUS', 118, specY + 5.5);
    doc.text('TOTAL CONFIRMED', 192, specY + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(payment.referenceNumber || `PAY-${payment.id}`, 18, specY + 11.5);
    doc.text(paymentMethodLabel, 65, specY + 11.5);

    // Clean status text without non-ASCII bullet characters (which break in standard jsPDF fonts as %Ï)
    const cleanStatus = String(paymentStatus || (isCard ? 'Payment Successful' : 'Confirmed'))
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
    doc.setFillColor(22, 163, 74);
    doc.circle(120, specY + 10.5, 1.2, 'F');
    doc.setTextColor(22, 101, 52);
    doc.text(cleanStatus || 'Payment Successful', 123, specY + 11.5);

    doc.setTextColor(15, 76, 58);
    doc.text(`LKR ${formattedAmount}`, 192, specY + 11.5, { align: 'right' });

    // 4. ITEMIZED INVOICE TABLE
    const tableBody = [
      [
        '1',
        `Milestone Payment / Construction Downpayment\nProject: ${projectName} (${projectCategory})`,
        'Escrow Stage Payment',
        paymentMethodLabel,
        payment.referenceNumber || `REF-${payment.id}`,
        `LKR ${formattedAmount}`,
      ],
    ];

    autoTable(doc, {
      startY: 112,
      head: [['#', 'Description & Construction Particulars', 'Service Type', 'Payment Method', 'Reference Code', 'Amount (LKR)']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 76, 58],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 72, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 32 },
        3: { halign: 'left', cellWidth: 32 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [15, 76, 58] },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 4,
      },
      margin: { left: 14, right: 14 },
    });

    const tableEnd = doc.lastAutoTable ? doc.lastAutoTable.finalY : 145;

    // 5. TOTALS AND REMARKS
    const summaryY = tableEnd + 8;

    // Remarks & Policy Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, summaryY, 105, 36, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 76, 58);
    doc.text('OFFICIAL PAYMENT ACKNOWLEDGMENT', 18, summaryY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const invoiceNotes = payment.notes
      ? `Notes: ${payment.notes}. This payment has been credited to your official construction contract ledger.`
      : 'This invoice certifies that the stated payment has been recorded and credited to the designated construction escrow account under Odiliya Homes & Real Estate (Pvt) Ltd.';
    const splitNotes = doc.splitTextToSize(invoiceNotes, 97);
    doc.text(splitNotes, 18, summaryY + 12);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized by: Odiliya Financial Treasury & Client Management Desk', 18, summaryY + 31);

    // Totals Box
    const totalsX = 124;
    const totalsWidth = 72;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(totalsX, summaryY, totalsWidth, 36, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal (Payment Gross):', totalsX + 4, summaryY + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`LKR ${formattedAmount}`, totalsX + totalsWidth - 4, summaryY + 7, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('VAT & Stamp Duty Assessment:', totalsX + 4, summaryY + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('0.00 (Exempt/Included)', totalsX + totalsWidth - 4, summaryY + 14, { align: 'right' });

    // Net Paid Highlight Box
    doc.setFillColor(15, 76, 58);
    doc.roundedRect(totalsX + 2, summaryY + 20, totalsWidth - 4, 12, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL PAID:', totalsX + 5, summaryY + 27.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(254, 240, 138); // Yellow accent
    doc.text(`LKR ${formattedAmount}`, totalsX + totalsWidth - 6, summaryY + 27.5, { align: 'right' });

    // 6. OFFICIAL SEALS & SIGNATURES
    const signY = summaryY + 44;

    doc.setDrawColor(148, 163, 184);
    doc.line(18, signY + 14, 64, signY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Client Accounts Officer', 18, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Finance & Treasury Desk', 18, signY + 21.5);

    doc.line(82, signY + 14, 128, signY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Client Manager', 82, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Commercial Representative', 82, signY + 21.5);

    doc.line(146, signY + 14, 192, signY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Odiliya Official Corporate Seal', 146, signY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Verified Digital Certificate', 146, signY + 21.5);

    // 7. BOTTOM BANNER
    doc.setFillColor(15, 76, 58);
    doc.rect(0, 289, 210, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(209, 250, 229);
    doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD — OFFICIAL COMPUTER-GENERATED TAX INVOICE & RECEIPT', 14, 294);

    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED PAYMENT RECORD', 196, 294, { align: 'right' });

    doc.save(fileName);
  } catch (err) {
    console.error('Invoice generation error, fallback text download:', err);
    downloadFile(null, `Odiliya_Payment_Invoice_${payment.id || 'RECORD'}.txt`, 'Client Payment Tax Invoice & Receipt', {
      invoiceNumber: payment.referenceNumber || `PAY-${payment.id}`,
      client: client?.name || payment.client?.name,
      project: project?.name || payment.project?.name,
      amount: `LKR ${payment.amount}`,
      method: payment.paymentMethod,
      date: payment.paymentDate,
      status: payment.status,
    });
  }
}

/**
 * Helper to safely convert an image URL or data URL to base64 for jsPDF
 */
async function getBase64Image(url) {
  if (!url) return null;
  if (typeof url === 'string' && url.startsWith('data:image/')) {
    return url;
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 400;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataURL);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generates an executive, professional Project Details & Status Dossier PDF with embedded images,
 * KPI summary metrics, milestone schedule, tasks breakdown, team roster, and financial analysis.
 */
export async function generateProjectDetailsPdf(project, {
  client = null,
  tasks = [],
  milestones = [],
  expenses = [],
  employees = [],
  spent = 0,
  pmName = 'Project Manager',
} = {}) {
  if (!project) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const formattedBudget = Number(project.budget || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedSpent = Number(spent || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const remainingBudget = Number((project.budget || 0) - (spent || 0));
  const formattedRemaining = remainingBudget.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const progress = Number(project.progressPercentage || 0);

  // Helper for rendering header banner on Page 1
  const renderHeader = () => {
    doc.setFillColor(15, 76, 58); // Deep Emerald #0F4C3A
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setFillColor(217, 119, 6); // Gold Accent Bar #D97706
    doc.rect(0, 26, pageWidth, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(209, 250, 229);
    doc.text('ENGINEERING OPERATIONS & PROJECT MANAGEMENT DOSSIER', margin, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(254, 240, 138); // Soft Gold
    doc.text('EXECUTIVE PROJECT REPORT', pageWidth - margin, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`Ref: ODLY-PRJ-${String(project.id).padStart(4, '0')} | ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, 18, { align: 'right' });
  };

  // Helper for footer on all pages
  const addFooter = (pageNum, totalPages) => {
    doc.setFillColor(15, 76, 58);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(209, 250, 229);
    doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD — CONFIDENTIAL PROJECT AUDIT REPORT', margin, pageHeight - 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
  };

  renderHeader();

  // ==========================================
  // 1. PROJECT IDENTITY & CLIENT CARD
  // ==========================================
  let curY = 34;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, curY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 76, 58);
  doc.text(project.name || 'Untitled Construction Project', margin + 4, curY + 7);

  // Status Badge
  const statusStr = String(project.status || 'PLANNING').replace(/_/g, ' ');
  doc.setFillColor(project.status === 'COMPLETED' ? 220 : 254, project.status === 'COMPLETED' ? 252 : 243, project.status === 'COMPLETED' ? 231 : 199);
  doc.roundedRect(margin + contentWidth - 36, curY + 3, 32, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(project.status === 'COMPLETED' ? 22 : 180, project.status === 'COMPLETED' ? 101 : 83, project.status === 'COMPLETED' ? 52 : 9);
  doc.text(statusStr, margin + contentWidth - 20, curY + 7.5, { align: 'center' });

  // Project details subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Category: ${project.category || 'RESIDENCIES'}  |  Location: ${project.location || 'Colombo, Sri Lanka'}  |  Code: PRJ-${project.id}`, margin + 4, curY + 13);

  // Client Info Line
  const clientObj = client || project.client;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Assigned Client: ', margin + 4, curY + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(clientObj ? `${clientObj.name} (${clientObj.email || 'N/A'}${clientObj.phone ? ` • ${clientObj.phone}` : ''})` : 'In-House Development / Direct Corporate Portfolio', margin + 28, curY + 19);

  curY += 30;

  // ==========================================
  // 2. KEY PERFORMANCE INDICATORS (KPIs)
  // ==========================================
  const kpiWidth = (contentWidth - 9) / 4; // 4 boxes
  const kpis = [
    { label: 'TOTAL BUDGET', val: `LKR ${formattedBudget}`, color: [15, 76, 58], bg: [240, 253, 244], border: [187, 247, 208] },
    { label: 'TOTAL EXPENDITURE', val: `LKR ${formattedSpent}`, color: [30, 64, 175], bg: [239, 246, 255], border: [191, 219, 254] },
    { label: 'REMAINING BALANCE', val: `LKR ${formattedRemaining}`, color: remainingBudget >= 0 ? [5, 150, 105] : [220, 38, 38], bg: [255, 255, 255], border: [226, 232, 240] },
    { label: 'PROJECT COMPLETION', val: `${progress}% COMPLETE`, color: [180, 83, 9], bg: [254, 252, 232], border: [254, 240, 138] },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = margin + idx * (kpiWidth + 3);
    doc.setFillColor(...kpi.bg);
    doc.setDrawColor(...kpi.border);
    doc.roundedRect(kx, curY, kpiWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kx + 3, curY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, kx + 3, curY + 12.5);
  });

  curY += 22;

  // ==========================================
  // 3. PROJECT IMAGE & ARCHITECTURAL VISUAL
  // ==========================================
  let imageBase64 = null;
  if (project.imageUrl) {
    try {
      imageBase64 = await getBase64Image(project.imageUrl);
    } catch {
      imageBase64 = null;
    }
  }

  if (imageBase64) {
    const imgBoxWidth = 88;
    const imgBoxHeight = 54;
    const imgX = margin;
    const imgY = curY;

    // Image frame
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(imgX, imgY, imgBoxWidth, imgBoxHeight, 2, 2, 'FD');

    try {
      doc.addImage(imageBase64, 'JPEG', imgX + 1.5, imgY + 1.5, imgBoxWidth - 3, imgBoxHeight - 8);
      // Caption
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Figure 1.0: Site Photo / Architectural Model for ${project.name}`, imgX + 3, imgY + imgBoxHeight - 2.5);
    } catch (e) {
      console.warn('Could not render image to PDF:', e);
    }

    // Right Side: Scope & Specifications Box
    const descX = margin + imgBoxWidth + 4;
    const descWidth = contentWidth - imgBoxWidth - 4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(descX, imgY, descWidth, imgBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 76, 58);
    doc.text('PROJECT SCOPE & SPECIFICATIONS', descX + 4, imgY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);

    const descText = project.description || 'Turnkey architectural design, structural engineering, foundation piling, civil works, and high-spec interior finishes executed by Odiliya Homes.';
    const splitDesc = doc.splitTextToSize(descText, descWidth - 8);
    doc.text(splitDesc.slice(0, 5), descX + 4, imgY + 12);

    // Architectural Specs
    let specY = imgY + 28;
    if (project.specifications) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('Structural Specifications:', descX + 4, specY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      const splitSpecs = doc.splitTextToSize(project.specifications, descWidth - 8);
      doc.text(splitSpecs.slice(0, 3), descX + 4, specY + 4.5);
      specY += 13;
    }

    // Timeline & Construction Stage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('Timeline & Stage:', descX + 4, specY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Start: ${project.startDate || 'N/A'}  |  Target End: ${project.endDate || 'Ongoing'}  |  Stage: ${project.constructionStatus || 'Active Civil Works'}`, descX + 4, specY + 4.5);

    curY += imgBoxHeight + 6;
  } else {
    // No image: Render Full-Width Specifications Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, curY, contentWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 76, 58);
    doc.text('PROJECT SCOPE & ARCHITECTURAL OVERVIEW', margin + 4, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const descText = project.description || 'Full turnkey residential and commercial development, structural design, civil contracting, and certified architectural construction managed under Odiliya standard QA/QC protocols.';
    const splitDesc = doc.splitTextToSize(descText, contentWidth - 8);
    doc.text(splitDesc.slice(0, 3), margin + 4, curY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Start: ${project.startDate || 'N/A'}  |  Target End: ${project.endDate || 'Ongoing'}  |  Stage: ${project.constructionStatus || 'Active'}  |  Price Guide: ${project.priceRange || 'Standard Commercial'}`, margin + 4, curY + 22);

    curY += 30;
  }

  // ==========================================
  // 4. MILESTONES PROGRESSION TABLE
  // ==========================================
  const milestoneRows = milestones.map((m, idx) => [
    String(idx + 1),
    m.title || 'Milestone Phase',
    m.targetDate || '—',
    m.status || 'PENDING',
    `${m.progressPercentage || 0}%`,
    m.description || '—',
  ]);

  if (milestoneRows.length === 0) {
    milestoneRows.push(['1', 'Foundation & Site Earthworks', project.startDate || 'Phase 1', progress > 20 ? 'COMPLETED' : 'IN_PROGRESS', `${Math.min(100, progress * 2)}%`, 'Piling, excavation and foundation structural slab']);
    milestoneRows.push(['2', 'Superstructure & RCC Framing', 'Phase 2', progress > 50 ? 'COMPLETED' : (progress > 20 ? 'IN_PROGRESS' : 'PENDING'), `${Math.max(0, Math.min(100, (progress - 25) * 2))}%`, 'Reinforced concrete columns, beams and slab levels']);
    milestoneRows.push(['3', 'MEP, Masonry & Plastering', 'Phase 3', progress > 80 ? 'COMPLETED' : (progress > 50 ? 'IN_PROGRESS' : 'PENDING'), `${Math.max(0, Math.min(100, (progress - 50) * 2))}%`, 'Conduit wiring, plumbing runs, brickwork and wall plaster']);
    milestoneRows.push(['4', 'Finishes, Handover & Commissioning', project.endDate || 'Phase 4', progress === 100 ? 'COMPLETED' : (progress > 80 ? 'IN_PROGRESS' : 'PENDING'), `${Math.max(0, Math.min(100, (progress - 80) * 5))}%`, 'Flooring tiles, painting, fittings, landscaping and keys handover']);
  }

  autoTable(doc, {
    startY: curY,
    head: [['#', 'Construction Milestone', 'Target Date', 'Status', 'Progress', 'Scope / Engineering Notes']],
    body: milestoneRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 76, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 46 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [15, 76, 58] },
      5: { cellWidth: 62 },
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    margin: { left: margin, right: margin },
  });

  curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : curY + 30;

  // ==========================================
  // 5. TASK SCHEDULE & ENGINEERING EXECUTION
  // ==========================================
  const taskRows = tasks.map((t, idx) => [
    String(idx + 1),
    t.taskName || 'Engineering Task',
    t.assignedEmployee?.name || 'Site Crew',
    t.deadline || '—',
    t.status || 'PENDING',
    `${t.progressPercentage || 0}%`,
    t.progressRemarks || t.description || '—',
  ]);

  if (taskRows.length > 0) {
    if (curY > pageHeight - 60) {
      doc.addPage();
      renderHeader();
      curY = 34;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 76, 58);
    doc.text('PROJECT TASKS & ENGINEERING SCHEDULE', margin, curY);
    curY += 3;

    autoTable(doc, {
      startY: curY,
      head: [['#', 'Task Name', 'Assigned Engineer / Worker', 'Deadline', 'Status', 'Progress', 'Remarks']],
      body: taskRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 64, 175], // Blue Header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 42 },
        2: { cellWidth: 32 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 16, fontStyle: 'bold', textColor: [30, 64, 175] },
        6: { cellWidth: 40 },
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
      },
      margin: { left: margin, right: margin },
    });

    curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : curY + 30;
  }

  // ==========================================
  // 6. ASSIGNED SITE PERSONNEL & TEAM
  // ==========================================
  const teamRows = employees.map((emp, idx) => [
    String(idx + 1),
    emp.name || 'Team Member',
    emp.role || 'Site Engineer / Trade Worker',
    emp.email || 'N/A',
    emp.phone || 'N/A',
  ]);

  if (teamRows.length > 0) {
    if (curY > pageHeight - 50) {
      doc.addPage();
      renderHeader();
      curY = 34;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 76, 58);
    doc.text('ALLOCATED SITE PERSONNEL & TECHNICAL TEAM', margin, curY);
    curY += 3;

    autoTable(doc, {
      startY: curY,
      head: [['#', 'Personnel Name', 'Trade / Role Designation', 'Email Address', 'Contact Phone']],
      body: teamRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // Slate Header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 48 },
        2: { cellWidth: 46 },
        3: { cellWidth: 46 },
        4: { cellWidth: 34 },
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
      },
      margin: { left: margin, right: margin },
    });

    curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : curY + 30;
  }

  // ==========================================
  // 7. FINANCIAL EXPENDITURE & BUDGET AUDIT
  // ==========================================
  const expenseRows = expenses.map((exp, idx) => [
    String(idx + 1),
    exp.description || 'Project Expense Item',
    exp.date || '—',
    `LKR ${Number(exp.amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
  ]);

  if (expenseRows.length > 0) {
    if (curY > pageHeight - 55) {
      doc.addPage();
      renderHeader();
      curY = 34;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 76, 58);
    doc.text('ITEMIZED EXPENDITURE & COST LOG', margin, curY);
    curY += 3;

    autoTable(doc, {
      startY: curY,
      head: [['#', 'Expenditure Description', 'Recorded Date', 'Amount (LKR)']],
      body: expenseRows,
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9], // Gold/Amber Header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 104 },
        2: { halign: 'center', cellWidth: 32 },
        3: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: [15, 76, 58] },
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
      },
      margin: { left: margin, right: margin },
    });

    curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : curY + 30;
  }

  // ==========================================
  // 8. SIGNATURES & OFFICIAL SEALS
  // ==========================================
  if (curY > pageHeight - 42) {
    doc.addPage();
    renderHeader();
    curY = 34;
  }

  const signY = Math.max(curY + 4, pageHeight - 38);

  // Signatory 1: Project Manager
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 4, signY + 12, margin + 50, signY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By (Project Manager)', margin + 4, signY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(pmName || 'Certified Project Engineer', margin + 4, signY + 19.5);

  // Signatory 2: Head of Civil Operations
  doc.line(margin + 66, signY + 12, margin + 116, signY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Reviewed By (Chief Engineer)', margin + 66, signY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Head of Technical & QA/QC', margin + 66, signY + 19.5);

  // Signatory 3: Managing Director / Client
  doc.line(margin + 132, signY + 12, margin + 178, signY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Approved By (Managing Director)', margin + 132, signY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Odiliya Homes Directorate Seal', margin + 132, signY + 19.5);

  // Add Footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  const safeFileName = `Odiliya_Project_Dossier_${(project.name || 'Project').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFileName);
}

/**
 * Download professional branded PDF report for Material and Inventory module
 */
export function downloadMaterialInventoryReportPdf({
  reportType = 'inventory_stock',
  reportTitle = 'Material & Inventory Report',
  subtitle = '',
  stats = [],
  headers = [],
  rows = [],
  summaryNotes = '',
  fileName = '',
}) {
  try {
    const isLandscape = headers.length >= 7;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const margin = 14;

    const renderHeader = (pageNumber) => {
      // Emerald Top Banner
      doc.setFillColor(15, 76, 58); // Emerald #0F4C3A
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Warm Amber Accent Bar
      doc.setFillColor(217, 119, 6); // Gold #D97706
      doc.rect(0, 24, pageWidth, 2, 'F');

      // Odiliya Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD', margin, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(209, 250, 229);
      doc.text('CENTRAL MATERIAL PROCUREMENT & WAREHOUSE INVENTORY CONTROL', margin, 16.5);
      doc.text('Reg No: PV-128940 | Official Supply Chain & Asset Verification System', margin, 20.5);

      // Right Header Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(254, 240, 138); // Yellow accent
      doc.text('OFFICIAL VERIFIED AUDIT', pageWidth - margin, 11, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`Ref: ODLY-INV-${Date.now().toString().slice(-6)} | Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, 17, { align: 'right' });
    };

    const renderFooter = (pageNumber, totalPages) => {
      doc.setFillColor(15, 76, 58);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(209, 250, 229);
      doc.text('Odiliya Homes & Real Estate (Pvt) Ltd — Confidential Internal Warehouse Audit Record', margin, pageHeight - 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
    };

    renderHeader(1);

    let curY = 32;

    // Report Title Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(reportTitle.toUpperCase(), margin, curY);

    curY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      subtitle || `Generated on: ${new Date().toLocaleString()} | Certified Inventory Manager Desk`,
      margin,
      curY
    );

    curY += 6;

    // Stats Metric Cards Block
    if (stats && stats.length > 0) {
      const cardWidth = Math.min(52, (pageWidth - margin * 2 - (stats.length - 1) * 4) / stats.length);
      const cardHeight = 13;

      stats.forEach((st, i) => {
        const x = margin + i * (cardWidth + 4);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, curY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(String(st.label || '').toUpperCase(), x + 2.5, curY + 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 76, 58);
        doc.text(String(st.value || '0'), x + 2.5, curY + 10);
      });

      curY += cardHeight + 6;
    }

    // AutoTable Data Table
    autoTable(doc, {
      startY: curY,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 76, 58],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin, bottom: 22 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          renderHeader(data.pageNumber);
        }
      },
    });

    curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : curY + 30;

    // Summary Notes if available
    if (summaryNotes) {
      if (curY > pageHeight - 38) {
        doc.addPage();
        renderHeader(doc.internal.getNumberOfPages());
        curY = 32;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 76, 58);
      doc.text('AUDIT SUMMARY NOTE:', margin, curY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(summaryNotes, margin, curY + 4, { maxWidth: pageWidth - margin * 2 });
      curY += 10;
    }

    // Signatures / Verification Block
    if (curY > pageHeight - 32) {
      doc.addPage();
      renderHeader(doc.internal.getNumberOfPages());
      curY = 32;
    }

    const signY = Math.max(curY + 4, pageHeight - 28);
    const colWidth = (pageWidth - margin * 2) / 3;

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 2, signY + 8, margin + 45, signY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Prepared By (Inventory Manager)', margin + 2, signY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Warehouse Operations Division', margin + 2, signY + 14.5);

    doc.line(margin + colWidth + 2, signY + 8, margin + colWidth + 45, signY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Verified By (Procurement Lead)', margin + colWidth + 2, signY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Quantity Surveying Desk', margin + colWidth + 2, signY + 14.5);

    doc.line(margin + colWidth * 2 + 2, signY + 8, margin + colWidth * 2 + 45, signY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized By (Internal Audit)', margin + colWidth * 2 + 2, signY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Directorate Clearance Seal', margin + colWidth * 2 + 2, signY + 14.5);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      renderFooter(i, totalPages);
    }

    const safeFile = fileName || `Odiliya_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(safeFile);
  } catch (err) {
    console.error('Error generating inventory report PDF:', err);
    triggerDownload(null, `${reportType}-report.pdf`);
  }
}

/**
 * Download comprehensive Master Inventory & Analytics Executive Dossier PDF
 */
export function downloadMasterInventoryAnalyticsPdf({
  materials = [],
  categories = [],
  purchaseOrders = [],
  requests = [],
  stockAlerts = [],
  suppliers = [],
}) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;

    const renderHeader = (pageNumber) => {
      doc.setFillColor(15, 76, 58);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFillColor(217, 119, 6);
      doc.rect(0, 24, pageWidth, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('ODILIYA HOMES & REAL ESTATE (PVT) LTD', margin, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(209, 250, 229);
      doc.text('MASTER SUPPLY CHAIN, MATERIAL INVENTORY & AUDIT DOSSIER', margin, 16.5);
      doc.text('Reg No: PV-128940 | Official Directorate & Operations Report', margin, 20.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(254, 240, 138);
      doc.text('EXECUTIVE AUDIT DOSSIER', pageWidth - margin, 11, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`Ref: ODLY-INV-MASTER-${Date.now().toString().slice(-6)} | Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, 17, { align: 'right' });
    };

    const renderFooter = (pageNumber, totalPages) => {
      doc.setFillColor(15, 76, 58);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(209, 250, 229);
      doc.text('Odiliya Homes & Real Estate (Pvt) Ltd — Master Supply Chain & Warehouse Asset Dossier', margin, pageHeight - 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
    };

    renderHeader(1);

    let curY = 32;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('MASTER INVENTORY & PROCUREMENT AUDIT DOSSIER', margin, curY);

    curY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Comprehensive corporate inventory audit, material valuations, procurement analysis and site stock alerts.`, margin, curY);

    curY += 6;

    // Metrics calculation
    const totalValuation = materials.reduce((acc, m) => acc + Number((m.quantity || 0) * (m.unitPrice || 0)), 0);
    const lowStockCount = materials.filter((m) => m.quantity <= m.minStockLevel).length;
    const poSpend = purchaseOrders.reduce((acc, p) => acc + Number(p.totalAmount || (p.quantity * p.unitPrice) || 0), 0);
    const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
    const pendingAlerts = stockAlerts.filter((a) => a.status === 'PENDING').length;

    const statBoxes = [
      { label: 'TOTAL INVENTORY VALUE', val: `LKR ${Number(totalValuation).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'CATALOG MATERIAL SKUs', val: `${materials.length} SKUs` },
      { label: 'LOW STOCK WARNINGS', val: `${lowStockCount} Items` },
      { label: 'PROCUREMENT SPEND', val: `LKR ${Number(poSpend).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'PENDING REQUISITIONS', val: `${pendingRequests} Requests` },
      { label: 'REGISTERED SUPPLIERS', val: `${suppliers.length} Vendors` },
    ];

    const cardWidth = (pageWidth - margin * 2 - 2 * 4) / 3;
    const cardHeight = 13;

    statBoxes.forEach((st, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = margin + col * (cardWidth + 4);
      const y = curY + row * (cardHeight + 3);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(st.label, x + 2.5, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 76, 58);
      doc.text(st.val, x + 2.5, y + 10);
    });

    curY += (cardHeight + 3) * 2 + 5;

    // SECTION 1: Category Distribution Table
    const catMap = {};
    materials.forEach((m) => {
      const cat = m.category || 'General';
      if (!catMap[cat]) catMap[cat] = { count: 0, val: 0, lowStock: 0 };
      catMap[cat].count += 1;
      catMap[cat].val += Number((m.quantity || 0) * (m.unitPrice || 0));
      if (m.quantity <= m.minStockLevel) catMap[cat].lowStock += 1;
    });

    const catRows = Object.entries(catMap).map(([cName, data]) => [
      cName,
      `${data.count} items`,
      `${data.lowStock} low stock`,
      `LKR ${data.val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalValuation > 0 ? `${((data.val / totalValuation) * 100).toFixed(1)}%` : '0%',
    ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 76, 58);
    doc.text('1. MATERIAL CATEGORY ALLOCATION & ASSET DISTRIBUTION', margin, curY);
    curY += 3;

    autoTable(doc, {
      startY: curY,
      head: [['Category Classification', 'Item Count', 'Health Alert', 'Asset Valuation (LKR)', '% Share']],
      body: catRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 76, 58], textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) renderHeader(data.pageNumber);
      },
    });

    curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : curY + 40;

    // SECTION 2: Top Stock Items Snapshot
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 76, 58);
    doc.text('2. TOP INVENTORY STOCK & VALUATION REGISTER', margin, curY);
    curY += 3;

    const matRows = materials.slice(0, 15).map((m) => {
      const val = Number((m.quantity || 0) * (m.unitPrice || 0));
      const status = m.quantity <= 0 ? 'OUT OF STOCK' : m.quantity <= m.minStockLevel ? 'LOW STOCK' : 'HEALTHY';
      return [
        m.materialCode || '—',
        m.name || '—',
        m.category || '—',
        `${m.quantity || 0} ${m.unit || ''}`,
        `LKR ${Number(m.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `LKR ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status,
        m.location || 'Depot',
      ];
    });

    autoTable(doc, {
      startY: curY,
      head: [['Code', 'Material Name', 'Category', 'Stock Qty', 'Unit Price', 'Total Value', 'Status', 'Location']],
      body: matRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 76, 58], textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2 },
      bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59], cellPadding: 2 },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) renderHeader(data.pageNumber);
      },
    });

    curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : curY + 40;

    // SECTION 3: Recent Procurement Purchase Orders
    if (purchaseOrders.length > 0) {
      if (curY > pageHeight - 50) {
        doc.addPage();
        renderHeader(doc.internal.getNumberOfPages());
        curY = 32;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 76, 58);
      doc.text('3. RECENT PROCUREMENT PURCHASE ORDERS (PO)', margin, curY);
      curY += 3;

      const poRows = purchaseOrders.slice(0, 10).map((p) => {
        const total = Number(p.totalAmount || (p.quantity * p.unitPrice) || 0);
        return [
          p.poNumber || `PO-${p.id}`,
          p.orderDate ? new Date(p.orderDate).toLocaleDateString('en-GB') : '—',
          p.supplier || '—',
          p.material?.name || '—',
          `${p.quantity} ${p.material?.unit || ''}`,
          `LKR ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          p.status || 'ORDERED',
        ];
      });

      autoTable(doc, {
        startY: curY,
        head: [['PO Number', 'Order Date', 'Supplier', 'Material', 'Qty', 'Total Spend', 'Status']],
        body: poRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 76, 58], textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2 },
        bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59], cellPadding: 2 },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) renderHeader(data.pageNumber);
        },
      });

      curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : curY + 40;
    }

    // Signatures / Verification Block
    if (curY > pageHeight - 32) {
      doc.addPage();
      renderHeader(doc.internal.getNumberOfPages());
      curY = 32;
    }

    const signY = Math.max(curY + 4, pageHeight - 28);
    const colWidth = (pageWidth - margin * 2) / 3;

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 2, signY + 8, margin + 45, signY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Prepared By (Inventory Manager)', margin + 2, signY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Warehouse Operations Division', margin + 2, signY + 14.5);

    doc.line(margin + colWidth + 2, signY + 8, margin + colWidth + 45, signY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Verified By (Procurement Lead)', margin + colWidth + 2, signY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Quantity Surveying Desk', margin + colWidth + 2, signY + 14.5);

    doc.line(margin + colWidth * 2 + 2, signY + 8, margin + colWidth * 2 + 45, signY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized By (Internal Audit)', margin + colWidth * 2 + 2, signY + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Directorate Clearance Seal', margin + colWidth * 2 + 2, signY + 14.5);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      renderFooter(i, totalPages);
    }

    doc.save(`Odiliya_Master_Inventory_Analytics_Dossier_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('Error generating master inventory dossier PDF:', err);
    triggerDownload(null, 'master-inventory-dossier.pdf');
  }
}

