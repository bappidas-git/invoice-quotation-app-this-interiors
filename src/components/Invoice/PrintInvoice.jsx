const PrintInvoice = ({ invoice, client, organization }) => {
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
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #2e7d32;
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
          color: #2e7d32;
          font-size: 32px;
          margin-bottom: 5px;
        }
        .document-number {
          font-size: 14px;
          color: #666;
        }
        .paid-stamp {
          display: inline-block;
          padding: 5px 15px;
          background: #e8f5e9;
          color: #2e7d32;
          font-weight: bold;
          border-radius: 20px;
          margin-top: 10px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .bill-to, .invoice-info {
          flex: 1;
        }
        .section-title {
          font-size: 14px;
          color: #2e7d32;
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
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table thead {
          background: #2e7d32;
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
          color: #2e7d32;
          border-top: 2px solid #2e7d32;
          margin-top: 10px;
          padding-top: 10px;
        }
        .payment-info {
          margin-bottom: 30px;
          padding: 15px;
          background: #e8f5e9;
          border-radius: 8px;
        }
        .payment-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2e7d32;
        }
        .payment-details {
          font-size: 13px;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 12px;
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
            <h1>INVOICE</h1>
            <div class="document-number">${invoice.invoiceNumber}</div>
            <div class="paid-stamp">PAID</div>
          </div>
        </div>

        <div class="info-section">
          <div class="bill-to">
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
          <div class="invoice-info">
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

        <div class="payment-info">
          <div class="payment-title">Payment Information</div>
          <div class="payment-details">
            <strong>Amount Paid:</strong> ${formatCurrency(
              invoice.paidAmount
            )}<br>
            <strong>Payment Method:</strong> ${invoice.paymentMethod}<br>
            <strong>Payment Date:</strong> ${formatDate(invoice.paymentDate)}
          </div>
        </div>

        ${
          invoice.notes
            ? `
          <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Thank you for your payment!</p>
          <p style="margin-top: 10px;">This is a computer-generated invoice. No signature is required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default PrintInvoice;
