import { clsx, type ClassValue } from "clsx";
import jsPDF from "jspdf";
import { twMerge } from "tailwind-merge";
import type { OrderDTO } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function getRestaurantName() {
  return process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? "Savoria Table";
}

export function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function getPaymentLabel(method: string) {
  if (method === "BKASH") return "bKash";
  if (method === "NAGAD") return "Nagad";
  if (method === "ROCKET") return "Rocket";
  if (method === "CARD") return "Card";
  return "Cash";
}

function getCashierName(orderId: string) {
  const names = ["Mira Sen", "Rafi Noor", "Lina Das", "Arman Roy"];
  const seed = orderId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return names[seed % names.length];
}

export function getPaymentSlipData(order: OrderDTO) {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentLabel = getPaymentLabel(order.paymentMethod);
  const orderDigits = order.id.replace(/\D/g, "");
  const numericSeed = Number(orderDigits || "1");
  const guestCount = Math.max(1, Math.min(6, order.items.reduce((sum, item) => sum + item.quantity, 0)));
  const paymentStateLabel = order.paymentStatus === "PAY_ON_TABLE" ? "Pending At Table" : "Paid";
  const reference =
    order.paymentMethod === "CARD"
      ? `CARD-${order.paymentLast4 ?? String(numericSeed).slice(-4).padStart(4, "0")}`
      : order.paymentMethod === "CASH"
        ? `CASH-TABLE-${order.tableNumber}`
        : `${order.paymentMethod}-${order.paymentAccount ?? String(numericSeed).slice(-4).padStart(4, "0")}`;

  return {
    restaurantName: getRestaurantName(),
    slipNumber: `PS-${order.id}`,
    issuedAtLabel: new Date(order.createdAt).toLocaleString(),
    statusLabel: order.status.replaceAll("_", " "),
    paymentLabel,
    paymentStateLabel,
    reference,
    cashierName: getCashierName(order.id),
    servicePoint: `Dining Hall ${((numericSeed % 4) + 1).toString().padStart(2, "0")}`,
    guestCount,
    subtotal,
    serviceCharge: 0,
    total: order.total
  };
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 7) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensurePageSpace(doc: jsPDF, currentY: number, requiredHeight: number) {
  if (currentY + requiredHeight <= 280) {
    return currentY;
  }

  doc.addPage();
  return 20;
}

export function openInvoicePdf(order: OrderDTO) {
  const slip = getPaymentSlipData(order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightColumnX = 118;
  const cardWidth = 72;

  doc.setFillColor(255, 246, 238);
  doc.rect(0, 0, pageWidth, 297, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 12, pageWidth - 24, 273, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(35, 35, 63);
  doc.text(getRestaurantName(), 20, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Payment slip for your restaurant order", 20, 35);

  doc.setDrawColor(243, 228, 215);
  doc.line(20, 40, pageWidth - 20, 40);

  const leftMeta = [
    ["Slip Number", slip.slipNumber],
    ["Order ID", order.id],
    ["Table", order.tableNumber],
    ["Issued", slip.issuedAtLabel],
    ["Status", slip.statusLabel],
  ] as const;
  const rightMeta = [
    ["Payment", `${slip.paymentLabel} - ${slip.paymentStateLabel}`],
    ["Reference", slip.reference],
    ["Processed By", slip.cashierName],
    ["Service Point", slip.servicePoint],
    ["Guests", String(slip.guestCount)],
  ] as const;

  let leftY = 50;
  for (const [label, value] of leftMeta) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(35, 35, 63);
    doc.text(label, 20, leftY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    leftY = addWrappedText(doc, value, 20, leftY + 6, 82) + 4;
  }

  let rightY = 50;
  for (const [label, value] of rightMeta) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(35, 35, 63);
    doc.text(label, rightColumnX, rightY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    rightY = addWrappedText(doc, value, rightColumnX, rightY + 6, 72) + 4;
  }

  let y = Math.max(leftY, rightY) + 8;
  y = ensurePageSpace(doc, y, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(35, 35, 63);
  doc.text("Slip Details", 20, y);
  y += 8;

  doc.setFillColor(255, 246, 238);
  doc.roundedRect(20, y, 106, 10, 3, 3, "F");
  doc.roundedRect(128, y, 18, 10, 3, 3, "F");
  doc.roundedRect(148, y, 24, 10, 3, 3, "F");
  doc.roundedRect(174, y, 20, 10, 3, 3, "F");

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Item", 24, y + 6.5);
  doc.text("Qty", 133, y + 6.5);
  doc.text("Unit", 153, y + 6.5);
  doc.text("Total", 178, y + 6.5);

  y += 16;

  for (const item of order.items) {
    const note = item.specialInstructions ? `Note: ${item.specialInstructions}` : "";
    const itemLines = doc.splitTextToSize(item.name, 100);
    const noteLines = note ? doc.splitTextToSize(note, 100) : [];
    const rowHeight = Math.max(12, 6 + (itemLines.length + noteLines.length) * 5);

    y = ensurePageSpace(doc, y, rowHeight + 6);

    doc.setFillColor(255, 250, 246);
    doc.roundedRect(20, y - 4, pageWidth - 40, rowHeight, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(35, 35, 63);
    doc.text(itemLines, 24, y + 2);

    let itemTextY = y + 2 + itemLines.length * 5;
    if (noteLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(noteLines, 24, itemTextY + 1);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(35, 35, 63);
    doc.text(String(item.quantity), 133, y + 2);
    doc.text(formatCurrency(item.price), 153, y + 2, { align: "left" });
    doc.text(formatCurrency(item.price * item.quantity), 178, y + 2, { align: "left" });

    y += rowHeight + 4;
  }

  y += 4;
  y = ensurePageSpace(doc, y, 42);

  const summaryCards = [
    { label: "Subtotal", value: formatCurrency(slip.subtotal) },
    { label: "Service Charge", value: formatCurrency(slip.serviceCharge) },
    { label: "Total", value: formatCurrency(slip.total), emphasized: true },
  ];

  let cardX = 20;
  for (const card of summaryCards) {
    const fillColor = card.emphasized ? [35, 35, 63] : [255, 250, 246];
    const textColor = card.emphasized ? [255, 255, 255] : [107, 114, 128];
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.roundedRect(cardX, y, cardWidth, 24, 4, 4, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(card.label, cardX + 4, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(card.value, cardX + 4, y + 17);
    cardX += cardWidth + 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Estimated ready time: ${new Date(order.estimatedReadyAt).toLocaleString()}`, 20, y + 34);

  doc.save(`${slip.slipNumber}.pdf`);
}

export function downloadAdminReportPdf(input: {
  restaurantName: string;
  period: "daily" | "weekly" | "monthly";
  generatedAt: string;
  fromLabel: string;
  toLabel: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  orders: OrderDTO[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const periodLabel = `${input.period.charAt(0).toUpperCase()}${input.period.slice(1)} Report`;

  doc.setFillColor(255, 246, 238);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(35, 35, 63);
  doc.text(input.restaurantName, 20, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text(`${periodLabel} - Admin Dashboard`, 20, y);

  y += 7;
  doc.text(`Range: ${input.fromLabel} to ${input.toLabel}`, 20, y);
  y += 6;
  doc.text(`Generated: ${input.generatedAt}`, 20, y);

  y += 10;
  const cards = [
    { label: "Orders", value: String(input.totalOrders), fill: [255, 244, 232] as const, text: [35, 35, 63] as const },
    { label: "Revenue", value: formatCurrency(input.revenue), fill: [35, 35, 63] as const, text: [255, 255, 255] as const },
    { label: "Active", value: String(input.activeOrders), fill: [255, 250, 246] as const, text: [35, 35, 63] as const },
    { label: "Completed", value: String(input.completedOrders), fill: [236, 253, 245] as const, text: [35, 35, 63] as const },
  ];

  let cardX = 20;
  for (const card of cards) {
    doc.setFillColor(card.fill[0], card.fill[1], card.fill[2]);
    doc.roundedRect(cardX, y, 41, 22, 4, 4, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.text(card.label, cardX + 4, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(card.value, cardX + 4, y + 16);
    cardX += 43;
  }

  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Cancelled: ${input.cancelledOrders}`, 20, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(35, 35, 63);
  doc.text("Orders", 20, y);

  y += 8;
  doc.setFillColor(255, 246, 238);
  doc.roundedRect(20, y, 34, 10, 3, 3, "F");
  doc.roundedRect(56, y, 22, 10, 3, 3, "F");
  doc.roundedRect(80, y, 30, 10, 3, 3, "F");
  doc.roundedRect(112, y, 27, 10, 3, 3, "F");
  doc.roundedRect(141, y, 27, 10, 3, 3, "F");
  doc.roundedRect(170, y, 24, 10, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Order", 23, y + 6.5);
  doc.text("Table", 59, y + 6.5);
  doc.text("Status", 83, y + 6.5);
  doc.text("Payment", 115, y + 6.5);
  doc.text("Created", 144, y + 6.5);
  doc.text("Total", 173, y + 6.5);
  y += 14;

  if (!input.orders.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("No orders found in this reporting range.", 20, y);
  } else {
    for (const order of input.orders) {
      const createdLabel = new Date(order.createdAt).toLocaleString();
      const rowHeight = 12;
      y = ensurePageSpace(doc, y, rowHeight + 8);

      doc.setFillColor(255, 250, 246);
      doc.roundedRect(20, y - 4, pageWidth - 40, rowHeight, 4, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(35, 35, 63);
      doc.text(doc.splitTextToSize(order.id, 30), 23, y + 2);

      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(order.tableNumber || "Takeaway", 18), 59, y + 2);
      doc.text(doc.splitTextToSize(order.status.replaceAll("_", " "), 26), 83, y + 2);
      doc.text(doc.splitTextToSize(getPaymentLabel(order.paymentMethod), 23), 115, y + 2);
      doc.text(doc.splitTextToSize(createdLabel, 24), 144, y + 2);
      doc.text(formatCurrency(order.total), 173, y + 2);

      y += rowHeight + 3;
    }
  }

  doc.save(`${input.period}-report.pdf`);
}
