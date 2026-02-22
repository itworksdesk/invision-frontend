import React, { forwardRef } from 'react';

// Use the actual Invoice type from your project
interface PrintableInvoiceProps {
  invoice: any; // We'll use 'any' here to avoid type conflicts, or you can import the actual Invoice type
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

    // Handle different item property names (description vs name)
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
                padding: 15mm !important;
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
                margin: 60px auto;
              }
            }
          `}
        </style>
        
        <div ref={ref} className="print-container bg-white p-8 max-w-[210mm] mx-auto">
          {/* Header Section */}
          <div className="mb-8 border-b-2 border-gray-800 pb-6">
            <div className="flex justify-between items-start">
              <div className='flex'>
                <div>
                  {company.logo && (
                    <img src={company.logo} alt={company.name} className="h-30" />
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1 ml-4 mt-5">
                  <div>{company.address}</div>
                  <div>Phone: {company.phone}</div>
                  <div>Email: {company.email}</div>
                  {/* {company.website && <div>{company.website}</div>} */}
                  {company.registrationNumber && (
                    <div>TIN #: {company.registrationNumber}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
                <div className="mt-4 space-y-1">
                  <div className="text-lg font-semibold">#{invoice.invoiceNumber}</div>
                  <div className="text-sm text-gray-600">
                    <div>Date: {formatDate(invoice.date)}</div>
                    {mode === "invoice" && invoice.dueDate && (
                      <div>Due Date: {formatDate(invoice.dueDate)}</div>
                    )}
                  </div>
                </div>
                {/* {invoice.status && (
                  <div className="mt-3">
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full
                      ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                        invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
                {mode === "purchase-order" ? (
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">PO For:</h3>
                ) : (
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Bill To:</h3>
                )}
              <div className="text-sm text-gray-700 space-y-1">
                <div className="font-semibold text-base">{invoice.customerName}</div>
                {(invoice.billingAddress || invoice.customerAddress) && (
                  <div className="whitespace-pre-line">{invoice.billingAddress || invoice.customerAddress}</div>
                )}
                {invoice.customerEmail && <div>{invoice.customerEmail}</div>}
                {invoice.customerPhone && <div>{invoice.customerPhone}</div>}
              </div>
            </div>
            {invoice.shippingAddress && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Ship To:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="whitespace-pre-line">{invoice.shippingAddress}</div>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase tracking-wider">No.</th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase tracking-wider w-26">Prod Code</th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase tracking-wider">Item Description</th>
                  <th className="text-center py-3 px-2 text-sm font-bold text-gray-900 uppercase tracking-wider w-20">Qty</th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 uppercase tracking-wider w-32">Unit Price</th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 uppercase tracking-wider w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item: any, index: number) => (
                    <tr key={item.id || index} className="border-b border-gray-300">
                      <td className="py-3 px-2 text-sm text-gray-700">{index + 1}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">{item.productCode}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">{getItemDescription(item)}</td>
                      <td className="py-3 px-2 text-sm text-gray-700 text-center">{getItemQuantity(item)}</td>
                      <td className="py-3 px-2 text-sm text-gray-700 text-right">{formatCurrency(getItemUnitPrice(item))}</td>
                      <td className="py-3 px-2 text-sm text-gray-700 text-right font-medium">{formatCurrency(getItemTotal(item))}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-gray-300">
                    <td colSpan={6} className="py-3 px-2 text-sm text-gray-500 text-center">No items</td>
                  </tr>
                )}
                {/* Add empty rows if items are less than 3 for consistent layout */}
                {invoice.items && invoice.items.length < 3 && Array.from({ length: 3 - invoice.items.length }).map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b border-gray-300">
                    <td className="py-3 px-2">&nbsp;</td>
                    {/* <td className="py-3 px-2">&nbsp;</td> */}
                    {/* <td className="py-3 px-2">&nbsp;</td> */}
                    {/* <td className="py-3 px-2">&nbsp;</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2">
                {invoice.tax > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="text-sm text-gray-700">Subtotal</span>
                    <span className="text-sm text-gray-900 font-medium">{formatCurrency(invoice.subtotal || invoice.total || 0)}</span>
                  </div>
                )}
                {/* {mode !== "delivery" && (
                    <div className="flex justify-between py-2 border-b border-gray-300">
                      <span className="text-sm text-gray-700">Tax (12%)</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {formatCurrency(invoice.tax || invoice.taxAmount || 0)}
                      </span>
                    </div>
                  )} */}
                    {invoice.tax > 0 && ( 
                    <div className="flex justify-between py-2 border-b border-gray-300">
                      <span className="text-sm text-gray-700">Tax (12%)</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {formatCurrency(invoice.tax || invoice.taxAmount || 0)}
                      </span>
                    </div>
                  )}

                <div className="flex justify-between py-3 border-t-2 border-gray-800">
                  <span className="text-lg font-bold text-gray-900">
                    {mode === "invoice" ? "Total Due" : "Total Amount"}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Notes:</h3>
                <div className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</div>
              </div>
            )}
            {/* <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Terms & Conditions:</h3>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {invoice.terms || 'Payment is due within 30 days from the invoice date.\nLate payments may incur additional charges.\nPlease reference invoice number on all payments.'}
              </div>
            </div> */}
          </div>

          {/* Footer */}
          {mode === "delivery" ? (
            <div className="mt-16 pt-8 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-8 text-sm text-gray-700">
                <div>
                  <div className="mb-10">
                    <div className="font-medium mb-8">Delivered By:</div>
                    <div className="border-t border-gray-400 w-48"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-10">
                    <div className="font-medium mb-8">Received By:</div>
                    <div className="border-t border-gray-400 w-48 ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-16 pt-8 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-xs text-gray-500 mb-8">
                    <div>Authorized Signature</div>
                    <div className="mt-8 border-t border-gray-400 w-48"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    <div>Thank you for your business!</div>
                    <div className="mt-2">For questions, please contact our billing department</div>
                    <div>{company.email} | {company.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Page number for multi-page invoices */}
          <div className="text-center text-xs text-gray-400 mt-8">
            Page 1 of 1
          </div>
        </div>
      </>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;