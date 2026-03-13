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
          <td style="color:#e65100;font-size:11px;">${item.procurementSource || "<em style='color:#bbb;'>Not specified</em>"}</td>
        </tr>`;
    })
    .join("") || "";

  return `<!DOCTYPE html>
<html>
<head>
  <title>BOQ Invoice [INTERNAL COPY] - ${invoice.boqInvoiceNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color: #333; background: white; }
    .internal-banner { background:linear-gradient(135deg,#f57c00 0%,#e65100 100%); color:white; text-align:center; padding:10px; font-weight:bold; font-size:14px; letter-spacing:1px; margin-bottom:20px; border-radius:6px; }
    .container { max-width: 980px; margin: 0 auto; padding: 20px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:15px; border-bottom:3px solid #f57c00; margin-bottom:20px; }
    .logo-section { flex:1; }
    .logo { max-height:60px; margin-bottom:10px; }
    .company-info { font-size:11px; color:#666; line-height:1.4; }
    .document-info { text-align:right; flex:1; }
    .document-info h1 { background:linear-gradient(135deg,#f57c00 0%,#e65100 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; font-size:26px; margin-bottom:5px; }
    .document-number { font-size:13px; color:#666; margin-bottom:3px; }
    .info-row { display:flex; gap:15px; margin-bottom:15px; }
    .info-box { flex:1; border:1px solid #ffe0b2; border-radius:6px; padding:10px; }
    .info-box-title { font-size:11px; color:#f57c00; font-weight:bold; margin-bottom:6px; text-transform:uppercase; }
    .info-box-content { font-size:11px; line-height:1.5; }
    table.items-table { width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px; }
    .items-table thead { background:linear-gradient(135deg,#f57c00 0%,#e65100 100%); color:white; }
    .items-table th { padding:10px 8px; text-align:left; font-size:10px; font-weight:600; text-transform:uppercase; }
    .items-table td { padding:10px 8px; border-bottom:1px solid #ffe0b2; font-size:11px; vertical-align:middle; }
    .items-table tbody tr:nth-child(even) { background:#fff8f0; }
    .text-right { text-align:right; }
    .summary-section { display:flex; justify-content:flex-end; margin-bottom:25px; }
    .summary-table { width:320px; }
    .summary-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
    .summary-row.total { font-size:16px; font-weight:bold; color:#f57c00; border-top:2px solid #f57c00; margin-top:8px; padding-top:10px; }
    .notes-section { margin-bottom:25px; padding:12px; background:#fff8f0; border-radius:6px; }
    .notes-title { font-size:13px; font-weight:bold; margin-bottom:6px; color:#f57c00; }
    .notes-content { font-size:12px; color:#666; line-height:1.5; }
    .footer { text-align:center; padding-top:15px; border-top:1px solid #ffe0b2; color:#666; font-size:11px; }
    .footer .company-name { font-weight:bold; color:#f57c00; font-size:12px; margin-bottom:3px; }
    .status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:bold; margin-left:8px; background:#fff3e0; color:#e65100; }
    @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="internal-banner">INTERNAL COPY — CONFIDENTIAL — NOT FOR CLIENT DISTRIBUTION</div>

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
          ${bankAccount.ifscSwift ? `<strong>IFSC/SWIFT:</strong> ${bankAccount.ifscSwift}<br>` : ""}
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
      <p class="company-name">${organization?.name || "THIS - The Home Interior Stylist"}</p>
      <p style="margin-top:8px;color:#e65100;font-weight:bold;">This document contains internal procurement information. Handle with care.</p>
    </div>
  </div>
</body>
</html>`;
};

export default PrintBOQInvoiceInternal;
