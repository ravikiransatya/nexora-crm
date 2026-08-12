import PDFDocument from "pdfkit";
import { Response } from "express";

interface ChallanForPdf {
  challanNumber: string;
  status: string;
  createdAt: Date;
  customer: { name: string; businessName?: string | null; gstNumber?: string | null; address?: string | null; mobile: string };
  items: { productName: string; sku: string; quantity: number; unitPrice: any; subtotal: any }[];
  totalQuantity: number;
  totalAmount: any;
}

const formatInr = (value: any) =>
  `Rs. ${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function streamChallanPdf(res: Response, challan: ChallanForPdf) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${challan.challanNumber}.pdf"`);
  doc.pipe(res);

  // Header / branding
  doc.fontSize(20).fillColor("#111827").text("NEXORA ERP", { continued: false });
  doc.fontSize(9).fillColor("#6b7280").text("Operations, Inventory & Customer Intelligence");
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#6b7280").text("Nexora Distribution Pvt. Ltd. (demo company) | GSTIN: 24AAAAA0000A1Z5");
  doc.moveDown(1);

  doc.strokeColor("#e5e7eb").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  doc.fontSize(14).fillColor("#111827").text(`Sales Challan — ${challan.challanNumber}`);
  doc.fontSize(9).fillColor("#6b7280").text(`Status: ${challan.status}`);
  doc.fontSize(9).fillColor("#6b7280").text(`Date: ${challan.createdAt.toDateString()}`);
  doc.moveDown(1);

  doc.fontSize(11).fillColor("#111827").text("Bill To");
  doc.fontSize(10).fillColor("#374151").text(challan.customer.name);
  if (challan.customer.businessName) doc.text(challan.customer.businessName);
  if (challan.customer.address) doc.text(challan.customer.address);
  doc.text(`Mobile: ${challan.customer.mobile}`);
  if (challan.customer.gstNumber) doc.text(`GSTIN: ${challan.customer.gstNumber}`);
  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const cols = { sku: 50, name: 130, qty: 330, price: 400, subtotal: 480 };
  doc.fontSize(9).fillColor("#111827");
  doc.text("SKU", cols.sku, tableTop);
  doc.text("Product", cols.name, tableTop);
  doc.text("Qty", cols.qty, tableTop);
  doc.text("Unit Price", cols.price, tableTop);
  doc.text("Subtotal", cols.subtotal, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#e5e7eb").stroke();

  let y = tableTop + 22;
  doc.fontSize(9).fillColor("#374151");
  challan.items.forEach((item) => {
    doc.text(item.sku, cols.sku, y, { width: 75 });
    doc.text(item.productName, cols.name, y, { width: 190 });
    doc.text(String(item.quantity), cols.qty, y);
    doc.text(formatInr(item.unitPrice), cols.price, y);
    doc.text(formatInr(item.subtotal), cols.subtotal, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor("#e5e7eb").stroke();
  y += 15;
  doc.fontSize(10).fillColor("#111827").text(`Total Quantity: ${challan.totalQuantity}`, cols.qty, y);
  doc.fontSize(11).fillColor("#111827").text(`Total: ${formatInr(challan.totalAmount)}`, cols.subtotal, y);

  y += 60;
  doc.fontSize(9).fillColor("#6b7280").text("Authorized Signature: ____________________________", 50, y);

  doc.end();
}
