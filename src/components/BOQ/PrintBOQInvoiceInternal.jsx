const PrintBOQInvoiceInternal = ({ invoice, client, organization, bankAccount }) => {
  const formatCurrency = (amount, currency = "AED") =>
    `${currency} ${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const itemRows = invoice.items
    ?.map((item) => {
      const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
      const discountAmt =
        (item.discountType || "percent") === "flat"
          ? item.discount || 0
          : (lineTotal * (item.discount || 0)) / 100;
      return `
        <tr>
          <td>${item.area || ""}</td>
          <td style="text-align:center;">${item.imageUrl ? `<img src="${item.imageUrl}" alt="Item" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />` : "-"}</td>
          <td>${item.category || ""}</td>
          <td>${item.itemName || ""}</td>
          <td class="text-right">${formatCurrency(item.unitPrice, invoice.currency)}</td>
          <td style="text-align:center;">${item.quantity || 0}</td>
          <td class="text-right">${formatCurrency(lineTotal - discountAmt, invoice.currency)}</td>
          <td>${item.procurementSource ? `<span class="vendor-cell">${item.procurementSource}</span>` : `<span class="vendor-empty">Not specified</span>`}</td>
        </tr>`;
    })
    .join("") || "";

  return `<!DOCTYPE html>
<html>
<head>
  <title>BOQ Invoice [INTERNAL COPY] - ${invoice.boqInvoiceNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .container { max-width: 100%; padding: 0; }

    /* Internal banner — charcoal with gold left stripe */
    .internal-banner { background: #1a1a1a; color: #c17f24; text-align: center; padding: 7px 12px; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; margin-bottom: 10px; border-radius: 4px; border-left: 5px solid #c17f24; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 3px solid #c17f24; margin-bottom: 10px; }
    .logo-section { flex: 1; }
    .logo { max-height: 44px; margin-bottom: 5px; }
    .company-info { font-size: 9px; color: #555; line-height: 1.35; }
    .document-info { text-align: right; flex: 1; }
    .document-info h1 { color: #1a1a1a; font-size: 22px; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
    .document-number { font-size: 11px; color: #555; margin-bottom: 3px; }

    .info-row { display: flex; gap: 10px; margin-bottom: 10px; page-break-inside: avoid; }
    .info-box { flex: 1; border: 1px solid #e8d5b0; border-radius: 5px; padding: 8px; background: #fdf6ec; }
    .info-box-title { font-size: 10px; color: #c17f24; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e8d5b0; padding-bottom: 3px; }
    .info-box-content { font-size: 10px; line-height: 1.45; color: #333; }
    .info-box-content strong { color: #1a1a1a; }

    table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #c17f24; }
    .items-table thead { background: none; color: #1a1a1a; display: table-header-group; }
    .items-table th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; border: 1px solid #c17f24; }
    .items-table td { padding: 6px 8px; border: 1px solid #c17f24; font-size: 10px; vertical-align: middle; }
    .text-right { text-align: right; }

    /* Vendor/Source column in gold */
    .vendor-cell { color: #a0652a; font-weight: 600; font-size: 10px; }
    .vendor-empty { color: #aaa; font-style: italic; font-size: 10px; }

    .summary-section { display: flex; justify-content: flex-end; margin-bottom: 12px; page-break-inside: avoid; }
    .summary-table { width: 260px; }
    .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; }
    .summary-row.total { font-size: 13px; font-weight: 700; color: #c17f24; border-top: 2px solid #c17f24; margin-top: 5px; padding-top: 6px; }

    .notes-section { margin-bottom: 10px; padding: 8px 10px; background: #fdf6ec; border-radius: 5px; border-left: 3px solid #c17f24; page-break-inside: avoid; }
    .notes-title { font-size: 10px; font-weight: 700; margin-bottom: 4px; color: #1a1a1a; }
    .notes-content { font-size: 10px; color: #555; line-height: 1.45; }

    .footer { text-align: center; padding-top: 10px; border-top: 1px solid #e8d5b0; color: #888; font-size: 9px; page-break-inside: avoid; }
    .footer .company-name { font-weight: 700; color: #c17f24; font-size: 10px; margin-bottom: 2px; }
    .footer .internal-note { color: #a0652a; font-weight: 600; font-size: 9px; margin-top: 3px; }

    /* Internal copy badge */
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; margin-left: 8px; background: #1a1a1a; color: #c17f24; border: 1px solid #c17f24; letter-spacing: 0.5px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead { display: table-header-group; }
      .info-row, .notes-section, .summary-section, .footer { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="internal-banner">🔒 &nbsp; INTERNAL COPY — CONFIDENTIAL — NOT FOR CLIENT DISTRIBUTION</div>

    <div class="header">
      <div class="logo-section">
        ${organization?.logoUrl ? `<img src="${organization.logoUrl}" alt="Logo" class="logo" />` : `<h2>${organization?.name || "THIS INTERIORS"}</h2>`}
        <div class="company-info">
          ${organization?.address ? `<div>${organization.address}</div>` : ""}
          ${organization?.city ? `<div>${organization.city}, ${organization?.country || ""}</div>` : ""}
          ${organization?.email ? `<div>Email: ${organization.email}</div>` : ""}
          ${organization?.contact ? `<div>Phone: ${organization.contact}</div>` : ""}
          ${organization?.website ? `<div>Website: ${organization.website}</div>` : ""}
        </div>
      </div>
      <div class="document-info">
        <h1>BOQ INVOICE</h1>
        <div class="document-number">Invoice No: ${invoice.boqInvoiceNumber}</div>
        <div class="document-number">BOQ Ref: ${invoice.boqNumber}</div>
        <div class="document-number">Date: ${formatDate(invoice.date)}</div>
        <span class="status-badge">INTERNAL COPY</span>
      </div>
    </div>

    <div class="info-row">
      <div class="info-box">
        <div class="info-box-title">Billed To</div>
        <div class="info-box-content">
          <strong>${client?.name || ""}</strong><br>
          ${client?.showCompanyInDocuments && client?.companyName ? `<span style="color:#555;font-size:10px;">${client.companyName}</span><br>` : ""}
          ${client?.address || ""}${client?.state ? `, ${client.state}` : ""}${client?.pin ? ` - ${client.pin}` : ""}<br>
          ${client?.country || ""}<br>
          ${client?.email ? `Email: ${client.email}<br>` : ""}
          ${client?.contact ? `Phone: ${client.contact}<br>` : ""}
          ${client?.showTaxInDocuments && client?.taxNumber ? `<strong>TRN / Tax No:</strong> ${client.taxNumber}` : ""}
        </div>
      </div>
      ${bankAccount ? `
      <div class="info-box">
        <div class="info-box-title">Banking Information</div>
        <div class="info-box-content">
          <strong>Bank:</strong> ${bankAccount.bankName}<br>
          <strong>A/C No:</strong> ${bankAccount.accountNumber}<br>
          ${bankAccount.accountHolderName ? `<strong>A/C Holder:</strong> ${bankAccount.accountHolderName}<br>` : ""}
          ${bankAccount.branch ? `<strong>Branch:</strong> ${bankAccount.branch}<br>` : ""}
          ${bankAccount.iban ? `<strong>IBAN:</strong> ${bankAccount.iban}<br>` : ""}
        </div>
      </div>` : ""}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th width="10%">Area</th>
          <th width="8%" style="text-align:center;">Image</th>
          <th width="11%">Category</th>
          <th width="14%">Item</th>
          <th width="11%" class="text-right">Unit Price</th>
          <th width="5%" style="text-align:center;">Qty</th>
          <th width="12%" class="text-right">Discounted</th>
          <th width="29%">Vendor / Source</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="summary-section">
      <div class="summary-table">
        <div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
        ${invoice.totalDiscount > 0 ? `<div class="summary-row"><span>Total Discount:</span><span style="color:#c62828;">-${formatCurrency(invoice.totalDiscount, invoice.currency)}</span></div>` : ""}
        ${invoice.taxAmount > 0 ? `<div class="summary-row"><span>${invoice.taxLabel || "Tax"} (${invoice.taxPercent || 0}%):</span><span>${formatCurrency(invoice.taxAmount, invoice.currency)}</span></div>` : ""}
        ${invoice.serviceTaxAmount > 0 ? `<div class="summary-row"><span>Service Tax (${invoice.serviceTaxPercent || 0}%):</span><span>${formatCurrency(invoice.serviceTaxAmount, invoice.currency)}</span></div>` : ""}
        <div class="summary-row total"><span>Total Amount Due:</span><span>${formatCurrency(invoice.totalAmount, invoice.currency)}</span></div>
      </div>
    </div>

    ${invoice.notes ? `<div class="notes-section"><div class="notes-title">Notes</div><div class="notes-content">${invoice.notes}</div></div>` : ""}

    <div class="footer">
      <p class="company-name">${organization?.name || "THIS — The Home Interior Stylist"}</p>
          <p class="internal-note">⚠ This document contains internal procurement information. Handle with care.</p>
    </div>
  </div>
</body>
</html>`;
};

export default PrintBOQInvoiceInternal;
