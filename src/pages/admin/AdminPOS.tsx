import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Plus, Minus, Trash2, ScanBarcode, CheckCircle2, Package2, Receipt, MessageCircle, Printer, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/format';
import { getEffectivePrice } from '../../contexts/CartContext';
import type { Product, CartItem, PaymentMethod } from '../../lib/database.types';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  mobile_money_mtn: 'MTN MoMo',
  mobile_money_moov: 'MOOV Money',
  mobile_money_celtis: 'CELTIS Pay',
  bank_transfer: 'Virement',
  cash_on_delivery: 'À la livraison',
  chariow_online: 'En ligne',
};

export function AdminPOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const catIds = [...new Set(products.map((p) => p.category_id).filter(Boolean))] as string[];
    return catIds;
  }, [products]);

  interface ReceiptData {
    orderNumber: string;
    total: number;
    items: CartItem[];
    payment: PaymentMethod;
    customerName: string;
    customerPhone: string;
    date: string;
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name');
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) list = list.filter((p) => p.category_id === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return list;
  }, [products, search, activeCategory]);

  function addProduct(p: Product) {
    if (p.stock <= 0) return;
    setCart((prev) => {
      const found = prev.find((it) => it.product.id === p.id);
      if (found) return found.quantity >= p.stock ? prev : prev.map((it) => it.product.id === p.id ? { ...it, quantity: it.quantity + 1 } : it);
      return [...prev, { product: p, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => prev.flatMap((it) => {
      if (it.product.id !== id) return [it];
      const q = it.quantity + delta;
      if (q <= 0) return [];
      if (q > it.product.stock) return [it];
      return [{ ...it, quantity: q }];
    }));
  }

  function setQty(id: string, qty: number) {
    const item = cart.find((it) => it.product.id === id);
    if (!item) return;
    if (qty <= 0) { setCart((prev) => prev.filter((it) => it.product.id !== id)); return; }
    setCart((prev) => prev.map((it) => it.product.id === id ? { ...it, quantity: Math.min(qty, it.product.stock) } : it));
  }

  const subtotal = cart.reduce((acc, it) => acc + getEffectivePrice(it.product, it.quantity) * it.quantity, 0);
  const hasBulkItems = cart.some((it) => it.product.bulk_quantity > 0 && it.quantity >= it.product.bulk_quantity && it.product.bulk_price > 0);
  const originalTotal = cart.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const discount = originalTotal - subtotal;

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: null,
      customer_name: customerName || 'Client de passage',
      customer_phone: customerPhone,
      total: subtotal,
      status: 'delivered',
      payment_method: payment,
      source: 'pos',
    }).select().single();

    if (error || !order) { setSubmitting(false); return; }

    const orderItems = cart.map((it) => {
      const unit = getEffectivePrice(it.product, it.quantity);
      return { order_id: (order as { id: string }).id, product_id: it.product.id, product_name: it.product.name, quantity: it.quantity, unit_price: unit, subtotal: unit * it.quantity };
    });
    await supabase.from('order_items').insert(orderItems);

    for (const it of cart) {
      await supabase.from('products').update({ stock: it.product.stock - it.quantity }).eq('id', it.product.id);
    }

    setReceipt({
      orderNumber: (order as { order_number: string }).order_number,
      total: subtotal,
      items: [...cart],
      payment,
      customerName: customerName || 'Client de passage',
      customerPhone,
      date: new Date().toISOString(),
    });
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPayment('cash');
    setSubmitting(false);
    loadProducts();
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-odoo-primary animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
      <div className="grid lg:grid-cols-5 gap-4" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-odoo-primary flex-shrink-0" />
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-odoo-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, SKU..." autoFocus className="input pl-9" />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button onClick={() => setActiveCategory(null)}
                className={`flex-shrink-0 px-3 py-1 rounded text-xs font-medium border transition ${!activeCategory ? 'bg-odoo-primary border-odoo-primary text-white' : 'bg-white border-odoo-border'}`}>
                Tout
              </button>
              {categories.map((cid) => {
                const count = products.filter((p) => p.category_id === cid).length;
                return (
                  <button key={cid} onClick={() => setActiveCategory(cid)}
                    className={`flex-shrink-0 px-3 py-1 rounded text-xs font-medium border transition ${activeCategory === cid ? 'bg-odoo-primary border-odoo-primary text-white' : 'bg-white border-odoo-border'}`}>
                    Cat. ({count})
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 overflow-auto flex-1">
            {filtered.map((p) => {
              const inCart = cart.find((it) => it.product.id === p.id)?.quantity ?? 0;
              return (
                <button key={p.id} onClick={() => addProduct(p)} disabled={p.stock === 0}
                  className={`card overflow-hidden text-left hover:border-odoo-primary hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed group relative ${inCart > 0 ? 'ring-2 ring-odoo-primary' : ''}`}>
                  {inCart > 0 && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-odoo-primary text-white text-xs font-bold rounded-full flex items-center justify-center z-10">
                      {inCart}
                    </div>
                  )}
                  <div className="aspect-square bg-odoo-surface relative overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center"><Package2 className="w-8 h-8 text-odoo-muted" /></div>}
                    {p.stock === 0 && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><span className="text-xs font-semibold text-odoo-danger">Rupture</span></div>}
                    {p.bulk_quantity > 0 && <div className="absolute top-1 left-1"><Tag className="w-3.5 h-3.5 text-odoo-success" /></div>}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                    <p className="text-sm font-bold text-odoo-primary">{formatPrice(p.price)}</p>
                    <p className="text-xs text-odoo-muted">Stock: {p.stock}</p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="col-span-full text-center py-16 text-odoo-muted text-sm">Aucun produit</div>}
          </div>
        </div>

        <div className="lg:col-span-2 card flex flex-col">
          <div className="p-4 bg-odoo-primary/5 border-b border-odoo-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-odoo-dark">
              <Receipt className="w-4 h-4 text-odoo-primary" />Ticket de caisse
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-odoo-muted hover:text-odoo-danger transition">Effacer</button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-odoo-muted text-sm">
                <ScanBarcode className="w-10 h-10 mb-3 opacity-30" />
                Aucun article — cliquez sur un produit
              </div>
            ) : (
              <div className="divide-y divide-odoo-border">
                {cart.map((it) => {
                  const price = getEffectivePrice(it.product, it.quantity);
                  const isBulk = it.product.bulk_quantity > 0 && it.quantity >= it.product.bulk_quantity && it.product.bulk_price > 0;
                  return (
                    <div key={it.product.id} className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{it.product.name}</p>
                          {isBulk && <span className="badge bg-odoo-success/10 text-odoo-success text-xs"><Tag className="w-2.5 h-2.5 mr-0.5" />Lot</span>}
                        </div>
                        <button onClick={() => setCart((prev) => prev.filter((i) => i.product.id !== it.product.id))} className="text-odoo-muted hover:text-odoo-danger transition flex-shrink-0 ml-2">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-odoo-border rounded overflow-hidden">
                          <button onClick={() => updateQty(it.product.id, -1)} className="px-2 py-1 hover:bg-odoo-surface transition text-odoo-muted"><Minus className="w-3 h-3" /></button>
                          <input type="number" value={it.quantity} onChange={(e) => setQty(it.product.id, parseInt(e.target.value) || 0)}
                            className="w-10 text-center text-sm font-medium border-x border-odoo-border py-1 focus:outline-none" />
                          <button onClick={() => updateQty(it.product.id, 1)} disabled={it.quantity >= it.product.stock} className="px-2 py-1 hover:bg-odoo-surface transition text-odoo-muted disabled:opacity-40"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-odoo-primary text-sm">{formatPrice(price * it.quantity)}</p>
                          {isBulk && <p className="text-xs text-odoo-muted line-through">{formatPrice(it.product.price * it.quantity)}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-odoo-border p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-2">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nom client" className="input text-sm" />
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Téléphone (WhatsApp)" className="input text-sm" type="tel" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(['cash', 'mobile_money_mtn', 'mobile_money_moov', 'mobile_money_celtis', 'bank_transfer', 'cash_on_delivery'] as PaymentMethod[]).map((m) => (
                <button key={m} onClick={() => setPayment(m)}
                  className={`py-2 border rounded text-xs font-medium transition ${payment === m ? 'bg-odoo-primary border-odoo-primary text-white' : 'border-odoo-border hover:border-odoo-primary bg-white'}`}>
                  {PAYMENT_LABELS[m]}
                </button>
              ))}
            </div>

            <div className="pt-1 border-t border-odoo-border space-y-1">
              {hasBulkItems && discount > 0 && (
                <div className="flex justify-between text-sm text-odoo-success">
                  <span>Remise de gros</span><span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-base">TOTAL</span>
                <span className="text-2xl font-bold text-odoo-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button onClick={checkout} disabled={cart.length === 0 || submitting} className="btn-primary w-full text-base py-3">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />Encaisser {formatPrice(subtotal)}</>}
            </button>
          </div>
        </div>
      </div>

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

interface ReceiptData {
  orderNumber: string;
  total: number;
  items: CartItem[];
  payment: PaymentMethod;
  customerName: string;
  customerPhone: string;
  date: string;
}

function ReceiptModal({ receipt, onClose }: { receipt: ReceiptData; onClose: () => void }) {
  const whatsappMsg = encodeURIComponent(
    `Bonjour ${receipt.customerName},\nVotre reçu - Commande ${receipt.orderNumber}\n` +
    receipt.items.map((it) => `• ${it.quantity}x ${it.product.name}: ${formatPrice(getEffectivePrice(it.product, it.quantity) * it.quantity)}`).join('\n') +
    `\nTOTAL: ${formatPrice(receipt.total)}\nPaiement: ${PAYMENT_LABELS[receipt.payment]}\nMerci pour votre achat !`
  );

  function printReceipt() {
    const win = window.open('', '_blank', 'width=350,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Reçu ${receipt.orderNumber}</title>
      <style>body{font-family:monospace;font-size:12px;padding:16px;max-width:280px;margin:0 auto}
      h2{text-align:center;font-size:14px;margin:0 0 4px}
      .center{text-align:center}.divider{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between}.total{font-size:16px;font-weight:bold}
      </style></head>
      <body>
        <h2>MagasinPro</h2>
        <p class="center" style="font-size:10px;margin:0">${formatDate(receipt.date)}</p>
        <div class="divider"></div>
        ${receipt.items.map((it) => {
          const price = getEffectivePrice(it.product, it.quantity);
          return `<div class="row"><span>${it.quantity}x ${it.product.name}</span><span>${formatPrice(price * it.quantity)}</span></div>`;
        }).join('')}
        <div class="divider"></div>
        <div class="row total"><span>TOTAL</span><span>${formatPrice(receipt.total)}</span></div>
        <div class="row" style="font-size:10px;margin-top:4px"><span>Paiement</span><span>${PAYMENT_LABELS[receipt.payment]}</span></div>
        <div class="divider"></div>
        <p class="center" style="font-size:10px">${receipt.orderNumber}</p>
        <p class="center" style="font-size:11px;margin-top:8px">Merci pour votre achat !</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-odoo-success/10 p-6 text-center border-b border-dashed border-odoo-border">
          <CheckCircle2 className="w-14 h-14 text-odoo-success mx-auto mb-3" />
          <p className="text-odoo-muted text-sm">Vente enregistrée avec succès</p>
          <p className="font-mono font-semibold text-lg mt-1 text-odoo-dark">{receipt.orderNumber}</p>
          <p className="text-3xl font-bold text-odoo-primary mt-1">{formatPrice(receipt.total)}</p>
          <p className="text-sm text-odoo-muted mt-1">{PAYMENT_LABELS[receipt.payment]} — {receipt.customerName}</p>
        </div>
        <div className="p-4 max-h-52 overflow-auto text-sm">
          {receipt.items.map((it) => {
            const price = getEffectivePrice(it.product, it.quantity);
            const isBulk = it.product.bulk_quantity > 0 && it.quantity >= it.product.bulk_quantity && it.product.bulk_price > 0;
            return (
              <div key={it.product.id} className="flex justify-between py-1.5 border-b border-odoo-border last:border-0">
                <div>
                  <span className="font-medium">{it.quantity}× {it.product.name}</span>
                  {isBulk && <span className="ml-1 text-xs text-odoo-success">(-{Math.round((1 - it.product.bulk_price / it.product.price) * 100)}%)</span>}
                </div>
                <span className="font-semibold">{formatPrice(price * it.quantity)}</span>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-odoo-border grid grid-cols-2 gap-2">
          <button onClick={printReceipt} className="btn-secondary gap-1.5 text-sm">
            <Printer className="w-4 h-4" />Imprimer
          </button>
          {receipt.customerPhone ? (
            <a href={`https://wa.me/${receipt.customerPhone.replace(/\D/g, '')}?text=${whatsappMsg}`}
              target="_blank" rel="noopener noreferrer" className="btn-secondary gap-1.5 text-sm">
              <MessageCircle className="w-4 h-4" />WhatsApp
            </a>
          ) : (
            <button onClick={onClose} className="btn-secondary text-sm">Fermer</button>
          )}
          <button onClick={onClose} className="btn-primary col-span-2 gap-1.5">
            <ScanBarcode className="w-4 h-4" />Nouvelle vente
          </button>
        </div>
      </div>
    </div>
  );
}
