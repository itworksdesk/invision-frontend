import React, { forwardRef } from 'react';

interface PrintableInvoiceProps {
  invoice: any;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logo?: string;
    registrationNumber?: string;
  };
  title?: string;
  mode?: 'invoice' | 'delivery' | 'quotation' | 'sales-order' | 'purchase-order';
}

const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, companyInfo, title = 'INVOICE', mode = 'invoice' }, ref) => {
    const defaultCompanyInfo = {
      name: 'PENTAMAX ELECTRICAL SUPPLY',
      address: 'Arty 1 Subdivision Brgy. Talipapa Novaliches Quezon City',
      phone: '0916 453 8406',
      email: 'pentamaxelectrical@gmail.com',
      website: 'www.pentamax.com',
      registrationNumber: '314-359-848-00000',
      logo: '3.png'
    };

    const company = companyInfo || defaultCompanyInfo;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatCurrency = (amount: number) => {
      return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getItemDescription = (item: any) => {
      return item.productName || item.description || 'Item';
    };

    const getItemQuantity = (item: any) => {
      return item.quantity || item.qty || 1;
    };

    const getItemUnitPrice = (item: any) => {
      return item.unitPrice || item.price || item.rate || 0;
    };

    const getItemTotal = (item: any) => {
      return item.total || item.amount || (getItemQuantity(item) * getItemUnitPrice(item));
    };

    return (
      <>
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }

              .print-container {
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 8mm 10mm !important;
                margin: 0 !important;
                box-shadow: none !important;
              }

              .page-break {
                page-break-after: always;
              }

              .no-print {
                display: none !important;
              }

              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }
            }

            @media screen {
              .print-container {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 40px auto;
              }
            }

            .invoice-table td,
            .invoice-table th {
              line-height: 1.2;
            }
          `}
        </style>

        <div ref={ref} className="print-container bg-white px-8 py-4 max-w-[210mm] mx-auto">

          {/* Header Section — compact */}
          <div className="mb-3 border-b border-gray-800 pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2">
                {company.logo && (
                  <img src={company.logo} alt={company.name} className="h-16 object-contain" />
                )}
                <div className="text-xs text-gray-600 leading-snug mt-1">
                  <div>{company.address}</div>
                  <div>Phone: {company.phone}</div>
                  <div>Email: {company.email}</div>
                  {company.registrationNumber && (
                    <div>TIN #: {company.registrationNumber}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{title}</h1>
                <div className="mt-1.5 space-y-0.5">
                  <div className="text-base font-semibold">#{invoice.invoiceNumber}</div>
                  <div className="text-xs text-gray-600">
                    <div>Date: {formatDate(invoice.date)}</div>
                    {mode === 'invoice' && invoice.dueDate && (
                      <div>Due Date: {formatDate(invoice.dueDate)}</div>
                    )}
                    {mode === 'quotation' && invoice.dueDate && (
                      <div>Valid Until: {formatDate(invoice.dueDate)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information — compact */}
          <div className="mb-3 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">
                {mode === 'purchase-order' ? 'PO For:' : 'Bill To:'}
              </h3>
              <div className="text-xs text-gray-700 leading-snug">
                <div className="font-semibold text-sm">{invoice.customerName}</div>
                {(invoice.billingAddress || invoice.customerAddress) && (
                  <div className="whitespace-pre-line">{invoice.billingAddress || invoice.customerAddress}</div>
                )}
                {invoice.customerEmail && <div>{invoice.customerEmail}</div>}
                {invoice.customerPhone && <div>{invoice.customerPhone}</div>}
              </div>
            </div>
            {invoice.shippingAddress && (
              <div>
                <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">Ship To:</h3>
                <div className="text-xs text-gray-700 whitespace-pre-line leading-snug">
                  {invoice.shippingAddress}
                </div>
              </div>
            )}
          </div>

          {/* Items Table — maximally compact */}
          <div className="mb-3">
            <table className="invoice-table w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide w-6">No.</th>
                  <th className="text-left py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide w-20">Prod Code</th>
                  <th className="text-left py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide">Item Description</th>
                  <th className="text-left py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide w-10">UM</th>
                  <th className="text-center py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide w-12">Qty</th>
                  <th className="text-right py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide w-24">Unit Price</th>
                  <th className="text-right py-1.5 px-1 text-xs font-bold text-gray-900 uppercase tracking-wide w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item: any, index: number) => (
                    <tr key={item.id || index} className="border-b border-gray-200">
                      <td className="py-1 px-1 text-xs text-gray-600">{index + 1}</td>
                      <td className="py-1 px-1 text-xs text-gray-700">{item.productCode}</td>
                      <td className="py-1 px-1 text-xs text-gray-800">{getItemDescription(item)}</td>
                      <td className="py-1 px-1 text-xs text-gray-600">{item.unitMeasure}</td>
                      <td className="py-1 px-1 text-xs text-gray-700 text-center">{getItemQuantity(item)}</td>
                      <td className="py-1 px-1 text-xs text-gray-700 text-right">{formatCurrency(getItemUnitPrice(item))}</td>
                      <td className="py-1 px-1 text-xs text-gray-900 text-right font-medium">{formatCurrency(getItemTotal(item))}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-gray-200">
                    <td colSpan={7} className="py-2 px-1 text-xs text-gray-400 text-center">No items</td>
                  </tr>
                )}
                {/* Minimum 3 empty filler rows */}
                {invoice.items && invoice.items.length < 3 &&
                  Array.from({ length: 3 - invoice.items.length }).map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-gray-200">
                      <td className="py-1 px-1">&nbsp;</td>
                      <td /><td /><td /><td /><td /><td />
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section — compact */}
          <div className="flex justify-end mb-3">
            <div className="w-64">
              <div className="space-y-0.5">
                {invoice.tax > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600">Subtotal</span>
                    <span className="text-xs text-gray-900 font-medium">
                      {formatCurrency(invoice.subtotal || invoice.total || 0)}
                    </span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600">Tax (12%)</span>
                    <span className="text-xs text-gray-900 font-medium">
                      {formatCurrency(invoice.tax || invoice.taxAmount || 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-t-2 border-gray-800">
                  <span className="text-sm font-bold text-gray-900">
                    {mode === 'invoice' ? 'Total Due' : 'Total Amount'}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(invoice.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-3">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">Notes:</h3>
              <div className="text-xs text-gray-600 whitespace-pre-line">{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          {mode === 'delivery' ? (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-8 text-xs text-gray-700">
                <div>
                  <div className="font-medium mb-6">Delivered By:</div>
                  <div className="border-t border-gray-400 w-40"></div>
                </div>
                <div className="text-right">
                  <div className="font-medium mb-6">Received By:</div>
                  <div className="border-t border-gray-400 w-40 ml-auto"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-xs text-gray-500">
                  <div>Authorized Signature</div>
                  <div className="mt-6 border-t border-gray-400 w-40"></div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>Thank you for your business!</div>
                  <div className="mt-1">For questions, please contact our billing department</div>
                  <div>{company.email} | {company.phone}</div>
                </div>
              </div>
            </div>
          )}

          {/* Page number */}
          <div className="text-center text-xs text-gray-300 mt-3">
            Page 1 of 1
          </div>
        </div>
      </>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;