const PrintQuotation = ({ quotation, client, organization, bankAccount }) => {
  const formatCurrency = (amount, currency = "AED") => {
    return `${currency} ${amount.toLocaleString("en-US", {
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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Performa Invoice - ${quotation.quotationNumber}</title>
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
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #667eea;
          margin-bottom: 30px;
        }
        .logo-section {
          flex: 1;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        .document-title {
          text-align: right;
          flex: 1;
        }
        .document-title h1 {
          color: #667eea;
          font-size: 32px;
          margin-bottom: 5px;
        }
        .document-number {
          font-size: 14px;
          color: #666;
        }
        .info-section {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-box {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
        }
        .section-title {
          font-size: 14px;
          color: #667eea;
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .info-block {
          font-size: 13px;
          line-height: 1.6;
          color: #333;
        }
        .info-block strong {
          color: #000;
        }
        .qr-code {
          max-width: 100px;
          max-height: 100px;
          margin-top: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .items-table th {
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
        }
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
        }
        .items-table tbody tr:hover {
          background: #f8f9fa;
        }
        .text-right {
          text-align: right;
        }
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .summary-table {
          width: 300px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .summary-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
          border-top: 2px solid #667eea;
          margin-top: 10px;
          padding-top: 10px;
        }
        .payment-info-section {
          margin-bottom: 30px;
          padding: 15px;
          background: #f3f0ff;
          border: 1px solid #d1c4e9;
          border-radius: 8px;
        }
        .payment-info-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #667eea;
          text-transform: uppercase;
        }
        .payment-info-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        .payment-entry {
          flex: 1;
          min-width: 200px;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          font-size: 13px;
          line-height: 1.6;
        }
        .notes-section {
          margin-bottom: 30px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .notes-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .notes-content {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-left: 10px;
        }
        .status-performa {
          background: #e3f2fd;
          color: #1976d2;
        }
        .status-partially {
          background: #fff3e0;
          color: #f57c00;
        }
        .status-paid {
          background: #e8f5e9;
          color: #2e7d32;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="logo-section">
            ${
              organization?.logoUrl
                ? `<img src="${organization.logoUrl}" alt="Logo" class="logo" />`
                : `<h2>${organization?.name || "THIS INTERIORS"}</h2>`
            }
            <div class="company-info">
              ${
                organization?.address
                  ? `<div>${organization.address}</div>`
                  : ""
              }
              ${
                organization?.email
                  ? `<div>Email: ${organization.email}</div>`
                  : ""
              }
              ${
                organization?.contact
                  ? `<div>Phone: ${organization.contact}</div>`
                  : ""
              }
              ${
                organization?.website
                  ? `<div>Website: ${organization.website}</div>`
                  : ""
              }
              ${
                organization?.taxId
                  ? `<div>${organization.taxLabel || "Tax"} ID: ${
                      organization.taxId
                    }</div>`
                  : ""
              }
            </div>
          </div>
          <div class="document-title">
            <h1>PERFORMA INVOICE</h1>
            <div class="document-number">${quotation.quotationNumber}</div>
            <span class="status-badge ${
              quotation.status === "Fully Paid"
                ? "status-paid"
                : quotation.status === "Partially Paid"
                ? "status-partially"
                : "status-performa"
            }">${quotation.status}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="section-title">Bill To</div>
            <div class="info-block">
              <strong>${client?.name || ""}</strong><br>
              ${client?.address || ""}<br>
              ${client?.state ? `${client.state}, ` : ""}${
    client?.pin || ""
  }<br>
              ${client?.country || ""}<br>
              ${client?.email ? `Email: ${client.email}<br>` : ""}
              ${client?.contact ? `Phone: ${client.contact}` : ""}
            </div>
          </div>
          <div class="info-box">
            <div class="section-title">Performa Invoice Details</div>
            <div class="info-block">
              <strong>Date:</strong> ${formatDate(quotation.date)}<br>
              <strong>Valid Until:</strong> ${formatDate(
                new Date(
                  new Date(quotation.date).getTime() + 30 * 24 * 60 * 60 * 1000
                )
              )}<br>
              <strong>Currency:</strong> ${quotation.currency || "AED"}
            </div>
          </div>
          <div class="info-box">
            <div class="section-title">Banking Information</div>
            <div class="info-block">
              ${
                bankAccount
                  ? `
                <strong>Bank:</strong> ${bankAccount.bankName}<br>
                <strong>A/C No:</strong> ${bankAccount.accountNumber}<br>
                ${bankAccount.accountHolderName ? `<strong>A/C Holder:</strong> ${bankAccount.accountHolderName}<br>` : ""}
                ${bankAccount.branch ? `<strong>Branch:</strong> ${bankAccount.branch}<br>` : ""}
                ${bankAccount.ifscSwift ? `<strong>IFSC/SWIFT:</strong> ${bankAccount.ifscSwift}<br>` : ""}
                ${bankAccount.qrCodeUrl ? `<img src="${bankAccount.qrCodeUrl}" alt="QR Code" class="qr-code" />` : ""}
              `
                  : "No bank account selected"
              }
            </div>
          </div>
        </div>

        ${
          quotation.payments && quotation.payments.length > 0 &&
          (quotation.status === "Partially Paid" || quotation.status === "Fully Paid")
            ? `
          <div class="payment-info-section">
            <div class="payment-info-title">Payment Information</div>
            <div class="payment-info-grid">
              ${quotation.payments
                .map(
                  (payment, index) => `
                <div class="payment-entry">
                  <strong>Payment #${index + 1}</strong><br>
                  <strong>Amount:</strong> ${formatCurrency(payment.amount, quotation.currency || "AED")}<br>
                  <strong>Method:</strong> ${payment.paymentMethod}<br>
                  <strong>Date:</strong> ${formatDateTime(payment.date || payment.paymentDate)}<br>
                  ${payment.notes ? `<strong>Notes:</strong> ${payment.notes}` : ""}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <table class="items-table">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="30%">Scope of Work</th>
              <th width="45%">Task Description</th>
              <th width="20%" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${
              quotation.items
                ?.map(
                  (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.scopeOfWork || ""}</td>
                <td>${item.task || ""}</td>
                <td class="text-right">${formatCurrency(item.amount)}</td>
              </tr>
            `
                )
                .join("") || ""
            }
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(
                quotation.subtotal || quotation.totalAmount
              )}</span>
            </div>
            ${
              quotation.taxAmount > 0
                ? `
              <div class="summary-row">
                <span>${quotation.taxLabel || "Tax"} (${
                    quotation.taxPercent || 0
                  }%):</span>
                <span>${formatCurrency(quotation.taxAmount)}</span>
              </div>
            `
                : ""
            }
            ${
              quotation.serviceTaxAmount > 0
                ? `
              <div class="summary-row">
                <span>Service Tax (${quotation.serviceTaxPercent || 0}%):</span>
                <span>${formatCurrency(quotation.serviceTaxAmount)}</span>
              </div>
            `
                : ""
            }
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>${formatCurrency(quotation.totalAmount)}</span>
            </div>
            ${
              quotation.paidAmount > 0
                ? `
              <div class="summary-row">
                <span>Paid Amount:</span>
                <span style="color: #2e7d32;">${formatCurrency(
                  quotation.paidAmount
                )}</span>
              </div>
              <div class="summary-row">
                <span>Balance Due:</span>
                <span style="color: #d32f2f;">${formatCurrency(
                  quotation.totalAmount - quotation.paidAmount
                )}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>

        ${
          quotation.notes
            ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${quotation.notes}</div>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 10px;">This is a computer-generated document. No signature is required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default PrintQuotation;
