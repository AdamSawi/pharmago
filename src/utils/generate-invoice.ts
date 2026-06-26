import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { FirestoreOrder } from '@/services/orders';

function formatDate(order: FirestoreOrder): string {
  const ts = order.updatedAt ?? order.createdAt;
  if (!ts) return '—';
  return new Date(ts.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildInvoiceHtml(order: FirestoreOrder): string {
  const invoiceNumber = `FAC-${order.id.slice(0, 8).toUpperCase()}`;
  const subtotal = (order.totalPrice ?? 0) - (order.deliveryFee ?? 0);
  const deliveryAddress = order.deliveryAddress
    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
    : 'Non renseignée';

  const rows = order.items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${(item.price ?? 0).toFixed(2)} €</td>
      <td style="text-align:right">${((item.price ?? 0) * item.quantity).toFixed(2)} €</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
          .logo { font-size: 22px; font-weight: bold; color: #c9821f; }
          .title { font-size: 28px; font-weight: bold; text-align: right; }
          .meta { color: #666; font-size: 13px; text-align: right; margin-top: 4px; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
          .party h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 6px; }
          .party p { margin: 0; font-size: 14px; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; color: #999; border-bottom: 2px solid #eee; padding: 8px 6px; }
          td { font-size: 14px; padding: 10px 6px; border-bottom: 1px solid #eee; }
          .totals { width: 280px; margin-left: auto; }
          .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals .total { font-size: 18px; font-weight: bold; border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 4px; }
          .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">PharmaGo</div>
          <div>
            <div class="title">FACTURE</div>
            <div class="meta">${invoiceNumber}</div>
            <div class="meta">${formatDate(order)}</div>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <h4>Client</h4>
            <p>${order.clientName}</p>
            <p>${deliveryAddress}</p>
          </div>
          <div class="party" style="text-align: right">
            <h4>Pharmacie</h4>
            <p>${order.pharmacyName}</p>
            <p>${order.pharmacyAddress ?? ''}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align:center">Qté</th>
              <th style="text-align:right">Prix unitaire</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Sous-total médicaments</span><span>${subtotal.toFixed(2)} €</span></div>
          <div class="row"><span>Frais de livraison</span><span>${(order.deliveryFee ?? 0).toFixed(2)} €</span></div>
          <div class="row total"><span>Total TTC</span><span>${(order.totalPrice ?? 0).toFixed(2)} €</span></div>
        </div>

        <div class="footer">PharmaGo — Livraison de médicaments à domicile</div>
      </body>
    </html>
  `;
}

export async function generateInvoicePDF(order: FirestoreOrder): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildInvoiceHtml(order) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Facture PharmaGo' });
  }
}
