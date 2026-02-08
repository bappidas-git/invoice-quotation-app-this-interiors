const PrintInvoice = ({ invoice, client, organization, bankAccount }) => {
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
      <title>Invoice - ${invoice.invoiceNumber}</title>
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
          padding: 15px 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 3px solid #2e7d32;
          margin-bottom: 15px;
        }
        .logo-section {
          flex: 1;
        }
        .logo {
          max-height: 50px;
          margin-bottom: 6px;
        }
        .company-info {
          font-size: 10px;
          color: #666;
          line-height: 1.3;
        }
        .document-title {
          text-align: right;
          flex: 1;
        }
        .document-title h1 {
          color: #2e7d32;
          font-size: 28px;
          margin-bottom: 3px;
        }
        .document-number {
          font-size: 12px;
          color: #666;
        }
        .paid-stamp {
          display: inline-block;
          padding: 3px 12px;
          background: #e8f5e9;
          color: #2e7d32;
          font-weight: bold;
          border-radius: 20px;
          font-size: 11px;
          margin-top: 5px;
        }
        .info-section {
          display: flex;
          gap: 12px;
          margin-bottom: 15px;
        }
        .info-box {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 10px;
        }
        .section-title {
          font-size: 11px;
          color: #2e7d32;
          font-weight: bold;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .info-block {
          font-size: 11px;
          line-height: 1.4;
          color: #333;
        }
        .info-block strong {
          color: #000;
        }
        .qr-code {
          max-width: 70px;
          max-height: 70px;
          margin-top: 5px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
        .payment-info-section {
          margin-bottom: 15px;
          padding: 8px 10px;
          background: #e8f5e9;
          border: 1px solid #c8e6c9;
          border-radius: 6px;
        }
        .payment-info-title {
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #2e7d32;
          text-transform: uppercase;
        }
        .payment-info-grid {
          display: flex;
          gap: 20px;
          font-size: 11px;
          line-height: 1.4;
        }
        .payment-info-item {
          flex: 1;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .items-table thead {
          background: #2e7d32;
          color: white;
        }
        .items-table th {
          padding: 8px 10px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
        }
        .items-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 11px;
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
          margin-bottom: 15px;
        }
        .summary-table {
          width: 280px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 12px;
        }
        .summary-row.total {
          font-size: 15px;
          font-weight: bold;
          color: #2e7d32;
          border-top: 2px solid #2e7d32;
          margin-top: 6px;
          padding-top: 8px;
        }
        .notes-section {
          margin-bottom: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .notes-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .notes-content {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
        }
        .footer {
          text-align: center;
          padding-top: 12px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 10px;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .invoice-container {
            padding: 10px 15px;
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
            <h1>INVOICE</h1>
            <div class="document-number">${invoice.invoiceNumber}</div>
            <div class="paid-stamp">PAID</div>
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
            <div class="section-title">Invoice Details</div>
            <div class="info-block">
              <strong>Invoice Date:</strong> ${formatDate(invoice.date)}<br>
              <strong>Payment Date:</strong> ${formatDate(
                invoice.paymentDate
              )}<br>
              <strong>Payment Method:</strong> ${invoice.paymentMethod}<br>
              <strong>Currency:</strong> ${invoice.currency || "AED"}
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
                  : "No bank account linked"
              }
            </div>
          </div>
        </div>

        <div class="payment-info-section">
          <div class="payment-info-title">Payment Information</div>
          <div class="payment-info-grid">
            <div class="payment-info-item">
              <strong>Amount Paid:</strong> ${formatCurrency(
                invoice.paidAmount,
                invoice.currency || "AED"
              )}<br>
              <strong>Payment Method:</strong> ${invoice.paymentMethod}
            </div>
            <div class="payment-info-item">
              <strong>Payment Date:</strong> ${formatDateTime(
                invoice.paymentDate
              )}<br>
              ${bankAccount ? `<strong>Bank:</strong> ${bankAccount.bankName}` : ""}
            </div>
            <div class="payment-info-item">
              <strong>Currency:</strong> ${invoice.currency || "AED"}<br>
              ${invoice.notes ? `<strong>Notes:</strong> ${invoice.notes}` : ""}
            </div>
          </div>
        </div>

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
              invoice.items
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
                invoice.subtotal || invoice.totalAmount
              )}</span>
            </div>
            ${
              invoice.taxAmount > 0
                ? `
              <div class="summary-row">
                <span>${invoice.taxLabel || "Tax"} (${
                    invoice.taxPercent || 0
                  }%):</span>
                <span>${formatCurrency(invoice.taxAmount)}</span>
              </div>
            `
                : ""
            }
            ${
              invoice.serviceTaxAmount > 0
                ? `
              <div class="summary-row">
                <span>Service Tax (${invoice.serviceTaxPercent || 0}%):</span>
                <span>${formatCurrency(invoice.serviceTaxAmount)}</span>
              </div>
            `
                : ""
            }
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>${formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your payment!</p>
          <p style="margin-top: 5px;">This is a computer-generated invoice. No signature is required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default PrintInvoice;
