const PrintBOQ = ({ boq, client, organization }) => {
  const formatCurrency = (amount, currency = "AED") => {
    return `${currency} ${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const itemRows = boq.items
    ?.map(
      (item, index) => `
      <tr>
        <td>${item.area || ""}</td>
        <td style="text-align: center;">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" alt="Item" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />`
              : "-"
          }
        </td>
        <td>${item.category || ""}</td>
        <td>${item.itemName || ""}</td>
        <td class="text-right">${formatCurrency(item.unitPrice, boq.currency)}</td>
        <td style="text-align: center;">${item.quantity || 0}</td>
        <td class="text-right">${formatCurrency(
          (item.unitPrice || 0) * (item.quantity || 0),
          boq.currency
        )}</td>
        <td class="text-right">${
          item.discount > 0
            ? formatCurrency(
                (item.unitPrice || 0) * (item.quantity || 0) -
                  ((item.unitPrice || 0) *
                    (item.quantity || 0) *
                    (item.discount || 0)) /
                    100,
                boq.currency
              )
            : formatCurrency(
                (item.unitPrice || 0) * (item.quantity || 0),
                boq.currency
              )
        }</td>
      </tr>
    `
    )
    .join("") || "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shopping Budget - ${boq.boqNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          background: white;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 15px;
          border-bottom: 3px solid #c17f24;
          margin-bottom: 20px;
        }
        .logo-section {
          flex: 1;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        .company-info {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
        }
        .document-info {
          text-align: right;
          flex: 1;
        }
        .document-info h1 {
          color: #c17f24;
          font-size: 26px;
          margin-bottom: 5px;
        }
        .document-number {
          font-size: 13px;
          color: #666;
          margin-bottom: 3px;
        }
        .billed-to {
          margin-bottom: 20px;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
        }
        .billed-to-title {
          font-size: 13px;
          color: #c17f24;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .billed-to-content {
          font-size: 12px;
          line-height: 1.5;
        }
        .billed-to-content strong {
          font-size: 14px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .items-table thead {
          background: #c17f24;
          color: white;
        }
        .items-table th {
          padding: 10px 8px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
          vertical-align: middle;
        }
        .items-table tbody tr:nth-child(even) {
          background: #faf6f0;
        }
        .text-right {
          text-align: right;
        }
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 25px;
        }
        .summary-table {
          width: 320px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        .summary-row.total {
          font-size: 16px;
          font-weight: bold;
          color: #c17f24;
          border-top: 2px solid #c17f24;
          margin-top: 8px;
          padding-top: 10px;
        }
        .notes-section {
          margin-bottom: 25px;
          padding: 12px;
          background: #faf6f0;
          border-radius: 6px;
        }
        .notes-title {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 6px;
          color: #c17f24;
        }
        .notes-content {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        }
        .footer {
          text-align: center;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 11px;
        }
        .footer .company-name {
          font-weight: bold;
          color: #c17f24;
          font-size: 12px;
          margin-bottom: 3px;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          margin-left: 8px;
        }
        .status-draft { background: #e3f2fd; color: #1976d2; }
        .status-sent { background: #fff3e0; color: #f57c00; }
        .status-approved { background: #e8f5e9; color: #2e7d32; }
        .status-rejected { background: #fce4ec; color: #c62828; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            ${
              organization?.logoUrl
                ? `<img src="${organization.logoUrl}" alt="Logo" class="logo" />`
                : `<h2>${organization?.name || "THIS INTERIORS"}</h2>`
            }
            <div class="company-info">
              ${organization?.address ? `<div>${organization.address}</div>` : ""}
              ${organization?.city ? `<div>${organization.city}, ${organization?.country || ""}</div>` : ""}
              ${organization?.email ? `<div>Email: ${organization.email}</div>` : ""}
              ${organization?.contact ? `<div>Phone: ${organization.contact}</div>` : ""}
              ${organization?.website ? `<div>Website: ${organization.website}</div>` : ""}
            </div>
          </div>
          <div class="document-info">
            <h1>SHOPPING BUDGET</h1>
            <div class="document-number">SB No: ${boq.boqNumber}</div>
            <div class="document-number">Date: ${formatDate(boq.date)}</div>
            <span class="status-badge ${
              boq.status === "Approved"
                ? "status-approved"
                : boq.status === "Sent"
                ? "status-sent"
                : boq.status === "Rejected"
                ? "status-rejected"
                : "status-draft"
            }">${boq.status}</span>
          </div>
        </div>

        <div class="billed-to">
          <div class="billed-to-title">Billed To</div>
          <div class="billed-to-content">
            <strong>${client?.name || ""}</strong><br>
            ${client?.address || ""}${client?.state ? `, ${client.state}` : ""}${client?.pin ? ` - ${client.pin}` : ""}<br>
            ${client?.country || ""}<br>
            ${client?.email ? `Email: ${client.email}<br>` : ""}
            ${client?.contact ? `Phone: ${client.contact}` : ""}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th width="12%">Area</th>
              <th width="10%" style="text-align: center;">Image</th>
              <th width="14%">Category</th>
              <th width="18%">Items</th>
              <th width="12%" class="text-right">Unit Price</th>
              <th width="6%" style="text-align: center;">Qty</th>
              <th width="14%" class="text-right">Total Price</th>
              <th width="14%" class="text-right">Discounted Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(boq.subtotal, boq.currency)}</span>
            </div>
            ${
              boq.totalDiscount > 0
                ? `
              <div class="summary-row">
                <span>Total Discount:</span>
                <span style="color: #c62828;">-${formatCurrency(boq.totalDiscount, boq.currency)}</span>
              </div>
            `
                : ""
            }
            ${
              boq.taxAmount > 0
                ? `
              <div class="summary-row">
                <span>${boq.taxLabel || "Tax"} (${boq.taxPercent || 0}%):</span>
                <span>${formatCurrency(boq.taxAmount, boq.currency)}</span>
              </div>
            `
                : ""
            }
            <div class="summary-row total">
              <span>Total Amount Due:</span>
              <span>${formatCurrency(boq.totalAmount, boq.currency)}</span>
            </div>
          </div>
        </div>

        ${
          boq.notes
            ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${boq.notes}</div>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Thanking you,</p>
          <p class="company-name">${organization?.name || "THIS - The Home Interior Stylist"}</p>
          <p style="margin-top: 8px;">This is an electronically generated document. No signature required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default PrintBOQ;
