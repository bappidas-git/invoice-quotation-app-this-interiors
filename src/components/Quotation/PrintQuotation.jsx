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
        @page { size: A4 portrait; margin: 12mm 14mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .invoice-container { max-width: 100%; padding: 0; }

        /* ── Header ── */
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 3px solid #c17f24; margin-bottom: 10px; }
        .logo-section { flex: 1; }
        .logo { max-height: 44px; margin-bottom: 5px; }
        .company-info { font-size: 9px; color: #555; line-height: 1.35; }
        .document-title { text-align: right; flex: 1; }
        .document-title h1 { color: #1a1a1a; font-size: 22px; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
        .document-number { font-size: 11px; color: #555; margin-bottom: 3px; }

        /* ── Info boxes ── */
        .info-section { display: flex; gap: 10px; margin-bottom: 10px; }
        .info-box { flex: 1; border: 1px solid #e8d5b0; border-radius: 5px; padding: 8px; background: #fdf6ec; }
        .section-title { font-size: 10px; color: #c17f24; font-weight: 700; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e8d5b0; padding-bottom: 3px; }
        .info-block { font-size: 10px; line-height: 1.45; color: #333; }
        .info-block strong { color: #1a1a1a; }
        .qr-code { max-width: 60px; max-height: 60px; margin-top: 4px; border: 1px solid #e8d5b0; border-radius: 3px; }

        /* ── Items table ── */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .items-table thead { background: #1a1a1a; color: white; display: table-header-group; }
        .items-table th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
        .items-table td { padding: 6px 8px; border-bottom: 1px solid #e8d5b0; font-size: 10px; vertical-align: top; }
        .items-table tbody tr:nth-child(even) { background: #fdf6ec; }
        .text-right { text-align: right; }

        /* ── Summary ── */
        .summary-section { display: flex; justify-content: flex-end; margin-bottom: 10px; page-break-inside: avoid; }
        .summary-table { width: 260px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 10px; }
        .summary-row.total { font-size: 13px; font-weight: 700; color: #c17f24; border-top: 2px solid #c17f24; margin-top: 5px; padding-top: 6px; }

        /* ── Payment info ── */
        .payment-info-section { margin-bottom: 10px; padding: 8px 10px; background: #fdf6ec; border: 1px solid #e8d5b0; border-radius: 5px; page-break-inside: avoid; }
        .payment-info-title { font-size: 10px; font-weight: 700; margin-bottom: 4px; color: #c17f24; text-transform: uppercase; letter-spacing: 0.4px; }
        .payment-info-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .payment-entry { flex: 1; min-width: 160px; padding: 6px 8px; background: white; border-radius: 4px; border: 1px solid #e8d5b0; font-size: 10px; line-height: 1.4; }

        /* ── Notes & footer ── */
        .notes-section { margin-bottom: 10px; padding: 8px 10px; background: #fdf6ec; border-radius: 5px; border-left: 3px solid #c17f24; page-break-inside: avoid; }
        .notes-title { font-size: 10px; font-weight: 700; margin-bottom: 4px; color: #1a1a1a; }
        .notes-content { font-size: 10px; color: #555; line-height: 1.45; }
        .footer { text-align: center; padding-top: 10px; border-top: 1px solid #e8d5b0; color: #888; font-size: 9px; page-break-inside: avoid; }
        .footer .brand { font-weight: 700; color: #c17f24; font-size: 10px; margin-bottom: 2px; }

        /* ── Status badges ── */
        .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; margin-top: 4px; border: 1px solid; }
        .status-performa { background: #fdf6ec; color: #a0652a; border-color: #c17f24; }
        .status-partially { background: #fff7ed; color: #c2410c; border-color: #f97316; }
        .status-paid { background: #f0fdf4; color: #15803d; border-color: #22c55e; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          thead { display: table-header-group; }
          .info-section, .payment-info-section, .notes-section, .footer, .summary-section { page-break-inside: avoid; }
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
              ${client?.showCompanyInDocuments && client?.companyName
                ? `<span style="color: #555; font-size: 10px;">${client.companyName}</span><br>`
                : ""}
              ${client?.address || ""}<br>
              ${client?.state ? `${client.state}, ` : ""}${
    client?.pin || ""
  }<br>
              ${client?.country || ""}<br>
              ${client?.email ? `Email: ${client.email}<br>` : ""}
              ${client?.contact ? `Phone: ${client.contact}<br>` : ""}
              ${client?.showTaxInDocuments && client?.taxNumber
                ? `<strong>TRN / Tax No:</strong> ${client.taxNumber}`
                : ""}
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
              (quotation.discountAmount || 0) > 0
                ? `
              <div class="summary-row" style="color: #c62828;">
                <span>Discount${
                  quotation.discountType === "percent"
                    ? ` (${quotation.discountValue}%)`
                    : ""
                }:</span>
                <span>-${formatCurrency(quotation.discountAmount, quotation.currency || "AED")}</span>
              </div>
            `
                : ""
            }
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
          <p class="brand">${organization?.name || "THIS — The Home Interior Stylist"}</p>
          <p>Thank you for your business!</p>
          <p style="margin-top: 3px;">This is a computer-generated document. No signature is required.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default PrintQuotation;
