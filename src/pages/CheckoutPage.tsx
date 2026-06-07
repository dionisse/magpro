import { useState } from 'react';
import {
  ArrowLeft, Loader2, CheckCircle2, MessageCircle,
  Banknote, Smartphone, Building2, Truck, CreditCard, ExternalLink,
} from 'lucide-react';
import { useCart, getEffectivePrice } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import type { PaymentMethod } from '../lib/database.types';
import type { View } from '../lib/views';

// ─── Payment method definitions ───────────────────────────────────────────────

interface PaymentOption {
  method: PaymentMethod;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  group: 'manual' | 'online';
  color: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { method: 'cash',               label: 'Espèces',                sublabel: 'Paiement en main propre',         icon: <Banknote className="w-5 h-5" />,    group: 'manual', color: 'odoo-success' },
  { method: 'mobile_money_mtn',   label: 'MTN Mobile Money',       sublabel: 'MTN MoMo',                        icon: <Smartphone className="w-5 h-5" />,  group: 'manual', color: 'odoo-warning' },
  { method: 'mobile_money_moov',  label: 'MOOV Money',             sublabel: 'Moov Africa',                     icon: <Smartphone className="w-5 h-5" />,  group: 'manual', color: 'odoo-info' },
  { method: 'mobile_money_celtis',label: 'CELTIS Pay',             sublabel: 'Celtis Mobile',                   icon: <Smartphone className="w-5 h-5" />,  group: 'manual', color: 'odoo-primary' },
  { method: 'bank_transfer',      label: 'Virement bancaire',      sublabel: 'Virement sur compte',             icon: <Building2 className="w-5 h-5" />,   group: 'manual', color: 'odoo-secondary' },
  { method: 'cash_on_delivery',   label: 'Paiement à la livraison',sublabel: 'Règlement à réception',           icon: <Truck className="w-5 h-5" />,       group: 'manual', color: 'odoo-muted' },
  { method: 'fedapay_online',     label: 'FedaPay',                sublabel: 'MoMo · Carte · Wave · etc.',      icon: <CreditCard className="w-5 h-5" />,  group: 'online', color: 'odoo-success' },
  { method: 'chariow_online',     label: 'Chariow',                sublabel: 'Paiement via Chariow',            icon: <CreditCard className="w-5 h-5" />,  group: 'online', color: 'odoo-primary' },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  mobile_money_mtn: 'MTN Mobile Money',
  mobile_money_moov: 'MOOV Money',
  mobile_money_celtis: 'CELTIS Pay',
  bank_transfer: 'Virement bancaire',
  cash_on_delivery: 'Paiement à la livraison',
  fedapay_online: 'FedaPay (en ligne)',
  chariow_online: 'Chariow (en ligne)',
};

export { METHOD_LABELS };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Component ───────────────────────────────────────────────────────────────

export function CheckoutPage({ setView }: { setView: (v: View) => void }) {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [chariowUrl, setChariowUrl] = useState<string | null>(null);

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Connexion requise</h1>
      <button onClick={() => setView({ kind: 'auth' })} className="btn-primary mt-4">Se connecter</button>
    </div>
  );

  if (items.length === 0 && !orderNumber) { setView({ kind: 'shop' }); return null; }

  if (orderNumber) {
    const msg = encodeURIComponent(`Bonjour, ma commande ${orderNumber} d'un montant de ${formatPrice(subtotal)}. Merci de la confirmer.`);
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-odoo-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-odoo-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-odoo-muted mb-2">Numéro de commande :</p>
        <p className="text-lg font-mono font-semibold text-odoo-primary mb-2">{orderNumber}</p>
        <p className="text-sm text-odoo-muted mb-6">
          Mode de paiement : <span className="font-medium">{METHOD_LABELS[payment]}</span>
        </p>

        {chariowUrl && (
          <div className="bg-odoo-primary/5 border border-odoo-primary/20 rounded-xl p-5 mb-6 text-left">
            <p className="font-semibold text-odoo-primary mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />Finaliser le paiement en ligne
            </p>
            <p className="text-sm text-odoo-muted mb-3">Cliquez sur le bouton ci-dessous pour être redirigé vers la page de paiement sécurisée Chariow.</p>
            <a href={chariowUrl} target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full justify-center gap-2">
              <ExternalLink className="w-4 h-4" />Payer maintenant
            </a>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={() => setView({ kind: 'orders' })} className="btn-primary">Voir mes commandes</button>
          <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <MessageCircle className="w-4 h-4" />Confirmer sur WhatsApp
          </a>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    // 1. Create order
    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      customer_id: user.id,
      customer_name: name,
      customer_phone: phone,
      delivery_address: address,
      notes,
      payment_method: payment,
      source: 'online',
      total: subtotal,
      status: 'pending',
      payment_status: payment === 'chariow_online' ? 'pending' : 'pending',
    }).select().single();

    if (orderErr || !order) { setError(orderErr?.message ?? 'Erreur'); setSubmitting(false); return; }

    // 2. Insert order items
    const orderItems = items.map((it) => {
      const unit = getEffectivePrice(it.product, it.quantity);
      return {
        order_id: (order as { id: string }).id,
        product_id: it.product.id,
        product_name: it.product.name,
        quantity: it.quantity,
        unit_price: unit,
        subtotal: unit * it.quantity,
      };
    });
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) { setError(itemsErr.message); setSubmitting(false); return; }

    // 3. Record payment entry
    const paymentEntry = {
      order_id: (order as { id: string }).id,
      order_number: (order as { order_number: string }).order_number,
      method: payment,
      amount: subtotal,
      status: payment === 'chariow_online' ? 'pending' : 'pending',
      payer_name: name,
      payer_phone: phone,
    };
    await supabase.from('payments').insert(paymentEntry);

    // 4a. FedaPay online checkout
    if (payment === 'fedapay_online') {
      try {
        const nameParts = name.trim().split(' ');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fedapay-checkout/initiate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: subtotal,
            description: `Commande ${(order as { order_number: string }).order_number}`,
            callback_url: `${window.location.origin}?order=${(order as { order_number: string }).order_number}`,
            customer: {
              email: user.email,
              firstname: nameParts[0] ?? name,
              lastname: nameParts.slice(1).join(' ') || nameParts[0],
              phone_number: {
                number: phone.replace(/\D/g, '') || '0',
                country: 'BJ',
              },
            },
            custom_metadata: {
              order_number: (order as { order_number: string }).order_number,
              order_id: (order as { id: string }).id,
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(`FedaPay : ${data?.error ?? data?.message ?? `Erreur ${res.status}`}`);
          setSubmitting(false);
          return;
        }

        const paymentUrl: string | undefined = data?.url;

        if (paymentUrl) {
          await supabase.from('payments').update({
            transaction_id: String(data.transaction_id ?? ''),
          }).eq('order_id', (order as { id: string }).id);

          clearCart();
          setSubmitting(false);
          window.location.href = paymentUrl;
          return;
        }

        setError('FedaPay : URL de paiement non reçue. Réessayez.');
        setSubmitting(false);
        return;
      } catch {
        setError('Impossible de contacter FedaPay. Vérifiez votre connexion.');
        setSubmitting(false);
        return;
      }
    }

    // 4b. For Chariow online: call edge function to initiate checkout
    if (payment === 'chariow_online') {
      try {
        const nameParts = name.trim().split(' ');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/chariow-checkout/initiate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // product_id is injected server-side from CHARIOW_PRODUCT_ID secret
            email: user.email,
            first_name: nameParts[0] ?? name,
            last_name: nameParts.slice(1).join(' ') || nameParts[0],
            phone: { number: phone.replace(/\D/g, '') || '00000000', country_code: 'BJ' },
            redirect_url: `${window.location.origin}?order=${(order as { order_number: string }).order_number}`,
            custom_metadata: {
              order_number: (order as { order_number: string }).order_number,
              order_id: (order as { id: string }).id,
              order_amount: String(subtotal),
              customer_name: name,
            },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(`Paiement Chariow indisponible : ${data?.error ?? data?.message ?? res.status}. Choisissez un autre mode ou contactez l'administrateur.`);
          setSubmitting(false);
          return;
        }

        const step = data?.data?.step;
        const checkoutUrl = data?.data?.payment?.checkout_url ?? null;

        if (step === 'payment' && checkoutUrl) {
          // Persist Chariow references then redirect immediately
          await Promise.all([
            supabase.from('orders').update({
              chariow_sale_id: data?.data?.purchase?.id ?? '',
            }).eq('id', (order as { id: string }).id),
            supabase.from('payments').update({
              transaction_id: data?.data?.purchase?.id ?? '',
              chariow_checkout_url: checkoutUrl,
            }).eq('order_id', (order as { id: string }).id),
          ]);

          clearCart();
          setSubmitting(false);
          window.location.href = checkoutUrl;
          return;
        }

        if (step === 'already_purchased') {
          setError('Ce produit Chariow a déjà été acheté par ce compte. Contactez l\'administrateur.');
          setSubmitting(false);
          return;
        }

        // step === 'completed' (free product) or unknown — fall through to success screen
      } catch {
        setError('Impossible de contacter Chariow. Vérifiez votre connexion ou choisissez un autre mode de paiement.');
        setSubmitting(false);
        return;
      }
    }

    setOrderNumber((order as { order_number: string }).order_number);
    clearCart();
    setSubmitting(false);
  }

  const manualOptions = PAYMENT_OPTIONS.filter((o) => o.group === 'manual');
  const onlineOptions = PAYMENT_OPTIONS.filter((o) => o.group === 'online');

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6">
      <button onClick={() => setView({ kind: 'cart' })} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4" />Retour au panier
      </button>
      <h1 className="text-2xl font-bold mb-6">Finaliser la commande</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Contact */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Coordonnées</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" className="input" placeholder="Ex: 97000000" />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Adresse de livraison</h2>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} placeholder="Adresse complète, quartier, ville…" className="input resize-none" />
          </div>

          {/* Payment methods */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Mode de paiement</h2>

            {/* Manual methods */}
            <p className="text-xs font-semibold text-odoo-muted uppercase tracking-wide mb-2">Paiement manuel</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {manualOptions.map((opt) => (
                <button key={opt.method} type="button" onClick={() => setPayment(opt.method)}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${
                    payment === opt.method
                      ? 'border-odoo-primary bg-odoo-primary/5 ring-1 ring-odoo-primary'
                      : 'border-odoo-border hover:border-odoo-primary/50 hover:bg-odoo-surface'
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    payment === opt.method ? 'bg-odoo-primary text-white' : 'bg-odoo-surface text-odoo-muted'
                  }`}>
                    {opt.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${payment === opt.method ? 'text-odoo-primary' : ''}`}>{opt.label}</p>
                    {opt.sublabel && <p className="text-xs text-odoo-muted truncate">{opt.sublabel}</p>}
                  </div>
                  {payment === opt.method && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-odoo-primary flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Online payment */}
            <p className="text-xs font-semibold text-odoo-muted uppercase tracking-wide mb-2">Paiement en ligne</p>
            <div className="grid grid-cols-1 gap-2">
              {onlineOptions.map((opt) => (
                <button key={opt.method} type="button" onClick={() => setPayment(opt.method)}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${
                    payment === opt.method
                      ? 'border-odoo-primary bg-odoo-primary/5 ring-1 ring-odoo-primary'
                      : 'border-odoo-border hover:border-odoo-primary/50 hover:bg-odoo-surface'
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    payment === opt.method ? 'bg-odoo-primary text-white' : 'bg-odoo-surface text-odoo-muted'
                  }`}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${payment === opt.method ? 'text-odoo-primary' : ''}`}>{opt.label}</p>
                    {opt.sublabel && <p className="text-xs text-odoo-muted">{opt.sublabel}</p>}
                  </div>
                  <span className="text-xs bg-odoo-primary/10 text-odoo-primary px-2 py-0.5 rounded-full font-medium flex-shrink-0">Sécurisé</span>
                  {payment === opt.method && (
                    <div className="w-4 h-4 rounded-full bg-odoo-primary flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* FedaPay info */}
            {payment === 'fedapay_online' && (
              <div className="mt-3 p-3 bg-odoo-success/5 border border-odoo-success/20 rounded-lg text-xs text-odoo-success">
                Vous serez automatiquement redirigé vers FedaPay pour payer par Mobile Money (MTN, Moov), carte bancaire ou Wave.
              </div>
            )}

            {/* Chariow info */}
            {payment === 'chariow_online' && (
              <div className="mt-3 p-3 bg-odoo-info/5 border border-odoo-info/20 rounded-lg text-xs text-odoo-info">
                Vous serez redirigé vers la page de paiement sécurisée Chariow après validation de votre commande.
              </div>
            )}

            {/* Mobile money instruction */}
            {(payment === 'mobile_money_mtn' || payment === 'mobile_money_moov' || payment === 'mobile_money_celtis') && (
              <div className="mt-3 p-3 bg-odoo-warning/5 border border-odoo-warning/20 rounded-lg text-xs text-odoo-warning">
                Après validation, vous recevrez les instructions de paiement par SMS ou WhatsApp.
              </div>
            )}

            {payment === 'bank_transfer' && (
              <div className="mt-3 p-3 bg-odoo-surface border border-odoo-border rounded-lg text-xs text-odoo-muted">
                Les coordonnées bancaires vous seront communiquées après validation de la commande.
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Notes (optionnel)</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Instructions particulières…" className="input resize-none" />
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Récapitulatif</h2>
            <div className="space-y-2 text-sm max-h-60 overflow-auto pb-3 border-b border-odoo-border">
              {items.map((it) => {
                const price = getEffectivePrice(it.product, it.quantity);
                return (
                  <div key={it.product.id} className="flex justify-between gap-2">
                    <span className="line-clamp-1 text-odoo-muted">{it.quantity} × {it.product.name}</span>
                    <span className="font-medium flex-shrink-0">{formatPrice(price * it.quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="py-3 border-b border-odoo-border">
              <div className="flex justify-between text-sm text-odoo-muted mb-1">
                <span>Mode de paiement</span>
                <span className="font-medium text-odoo-dark text-xs text-right max-w-32 truncate">{METHOD_LABELS[payment]}</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-4 mb-4">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-odoo-primary">{formatPrice(subtotal)}</span>
            </div>
            {error && <div className="bg-odoo-danger/10 text-odoo-danger text-sm p-2 rounded mb-3">{error}</div>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                (payment === 'fedapay_online' || payment === 'chariow_online') ? 'Commander & Payer en ligne' : 'Confirmer la commande'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
