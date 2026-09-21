import { useState } from 'react';
import {
  ArrowLeft, Loader2, CheckCircle2, MessageCircle,
  Banknote, Smartphone, Building2, Truck, CreditCard, ExternalLink, UserPlus, Copy, Check,
  TicketPercent, X, Lock, ShieldCheck, Package, MapPin, ClipboardList, Sparkles,
} from 'lucide-react';
import { useCart, getEffectivePrice } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import type { PaymentMethod } from '../lib/database.types';
import type { PromoCode } from '../lib/database.types';
import { SuccessCheck } from '../components/ui';
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
  { method: 'cash',               label: 'Espèces',                sublabel: 'Paiement en main propre',         icon: <Banknote className="w-5 h-5" />,    group: 'manual', color: 'brand-success' },
  { method: 'mobile_money_mtn',   label: 'MTN Mobile Money',       sublabel: 'MTN MoMo',                        icon: <Smartphone className="w-5 h-5" />,  group: 'manual', color: 'brand-warning' },
  { method: 'mobile_money_moov',  label: 'MOOV Money',             sublabel: 'Moov Africa',                     icon: <Smartphone className="w-5 h-5" />,  group: 'manual', color: 'brand-info' },
  { method: 'mobile_money_celtis',label: 'CELTIS Pay',             sublabel: 'Celtis Mobile',                   icon: <Smartphone className="w-5 h-5" />,  group: 'manual', color: 'brand-primary' },
  { method: 'bank_transfer',      label: 'Virement bancaire',      sublabel: 'Virement sur compte',             icon: <Building2 className="w-5 h-5" />,   group: 'manual', color: 'brand-secondary' },
  { method: 'cash_on_delivery',   label: 'Paiement à la livraison',sublabel: 'Règlement à réception',           icon: <Truck className="w-5 h-5" />,       group: 'manual', color: 'brand-muted' },
  { method: 'fedapay_online',     label: 'FedaPay',                sublabel: 'MoMo · Carte · Wave · etc.',      icon: <CreditCard className="w-5 h-5" />,  group: 'online', color: 'brand-success' },
  { method: 'chariow_online',     label: 'Chariow',                sublabel: 'Paiement via Chariow',            icon: <CreditCard className="w-5 h-5" />,  group: 'online', color: 'brand-primary' },
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

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Steps indicator ──────────────────────────────────────────────────────────

function CheckoutSteps({ current }: { current: number }) {
  const steps = ['Panier', 'Coordonnées & paiement', 'Confirmation'];
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-7 overflow-x-auto scrollbar-hide">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className={`step ${state === 'done' ? 'step-done' : state === 'active' ? 'step-active' : ''}`}>
              <span className="step-dot">
                {state === 'done' ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={state === 'todo' ? 'hidden sm:inline' : ''}>{label}</span>
            </span>
            {i < steps.length - 1 && <span className="w-6 sm:w-10 h-px bg-brand-border" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function FormSection({ step, title, icon, children, hint }: {
  step: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center w-10 h-10 rounded-2xl bg-brand-primary text-white font-display font-extrabold text-sm flex-shrink-0">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-extrabold text-brand-ink flex items-center gap-2">
            {icon}{title}
          </h2>
          {hint && <p className="text-xs text-brand-muted mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CheckoutPage({ setView }: { setView: (v: View) => void }) {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [guestEmail, setGuestEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [chariowUrl, setChariowUrl] = useState<string | null>(null);
  const [autoCredentials, setAutoCredentials] = useState<{ email: string; password: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // ── Promo code state ──
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoReward, setPromoReward] = useState(0);

  const finalTotal = appliedPromo ? Math.max(0, subtotal - promoDiscount) : subtotal;

  async function applyPromo() {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setPromoChecking(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    setPromoChecking(false);

    if (error || !data) {
      setAppliedPromo(null);
      setPromoDiscount(0);
      setPromoReward(0);
      setPromoError('Code promo introuvable');
      return;
    }

    const pc = data as PromoCode;

    if (!pc.is_active) {
      setAppliedPromo(null); setPromoDiscount(0); setPromoReward(0);
      setPromoError('Ce code promo n\u2019est plus actif'); return;
    }
    if (pc.starts_at && new Date(pc.starts_at).getTime() > Date.now()) {
      setAppliedPromo(null); setPromoDiscount(0); setPromoReward(0);
      setPromoError('Ce code promo n\u2019est pas encore valide'); return;
    }
    if (pc.ends_at && new Date(pc.ends_at).getTime() < Date.now()) {
      setAppliedPromo(null); setPromoDiscount(0); setPromoReward(0);
      setPromoError('Ce code promo a expiré'); return;
    }
    if (pc.max_uses !== null && pc.used_count >= pc.max_uses) {
      setAppliedPromo(null); setPromoDiscount(0); setPromoReward(0);
      setPromoError('Ce code promo a atteint sa limite d\u2019utilisations'); return;
    }
    if (subtotal < pc.min_order_amount) {
      setAppliedPromo(null); setPromoDiscount(0); setPromoReward(0);
      setPromoError(`Montant minimum requis : ${formatPrice(pc.min_order_amount)}`); return;
    }

    const discount = pc.discount_type === 'percentage'
      ? Math.round(subtotal * pc.discount_value) / 100
      : Math.min(pc.discount_value, subtotal);
    const reward = Math.round((subtotal - discount) * pc.commission_rate) / 100;

    setAppliedPromo(pc);
    setPromoDiscount(discount);
    setPromoReward(reward);
  }

  function removePromo() {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoDiscount(0);
    setPromoReward(0);
    setPromoError(null);
  }

  if (items.length === 0 && !orderNumber) { setView({ kind: 'shop' }); return null; }

  if (orderNumber) {
    const msg = encodeURIComponent(`Bonjour, ma commande ${orderNumber} d'un montant de ${formatPrice(subtotal)}. Merci de la confirmer.`);
    return (
      <div className="bg-brand-surface min-h-screen">
        <div className="shell py-8 lg:py-14">
          <CheckoutSteps current={2} />
          <div className="max-w-2xl mx-auto">
            <div className="panel p-6 sm:p-9 text-center">
              <div className="relative w-24 h-24 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-brand-success/10 animate-pulse-soft" aria-hidden />
                <SuccessCheck className="relative w-24 h-24 text-brand-success" />
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink">Merci, commande envoyée !</h1>
              <p className="text-sm text-brand-muted mt-2">
                Votre commande est enregistrée. Nous vous contactons rapidement pour la confirmer.
              </p>

              <div className="mt-7 grid sm:grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">N° de commande</p>
                  <p className="font-mono text-base font-bold text-brand-primary mt-1 break-all">{orderNumber}</p>
                </div>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">Mode de paiement</p>
                  <p className="text-sm font-bold text-brand-ink mt-1">{METHOD_LABELS[payment]}</p>
                </div>
              </div>

              {/* Auto-created credentials */}
              {autoCredentials && (
                <div className="mt-4 rounded-2xl border border-brand-success/30 bg-brand-success/[0.06] p-5 text-left">
                  <p className="font-bold text-brand-success mb-1.5 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />Votre compte client a été créé
                  </p>
                  <p className="text-[13px] text-brand-muted mb-4">
                    Notez ces identifiants pour suivre vos commandes à tout moment.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold w-28 flex-shrink-0 text-brand-ink text-[13px]">Email</span>
                      <code className="bg-white border border-brand-border rounded-xl px-3 py-2 text-xs flex-1 truncate">{autoCredentials.email}</code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold w-28 flex-shrink-0 text-brand-ink text-[13px]">Mot de passe</span>
                      <code className="bg-white border border-brand-border rounded-xl px-3 py-2 text-xs flex-1 font-mono tracking-widest">{autoCredentials.password}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(autoCredentials.password);
                          setPasswordCopied(true);
                          setTimeout(() => setPasswordCopied(false), 2000);
                        }}
                        className="p-2 rounded-xl border border-brand-border bg-white text-brand-success hover:bg-brand-success/10 transition-colors flex-shrink-0"
                        title="Copier le mot de passe"
                      >
                        {passwordCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-brand-muted mt-3">
                    Vous pouvez modifier ce mot de passe depuis votre profil après connexion.
                  </p>
                </div>
              )}

              {/* Chariow payment link */}
              {chariowUrl && (
                <div className="mt-4 rounded-2xl border border-brand-primary/25 bg-brand-primary/[0.04] p-5 text-left">
                  <p className="font-bold text-brand-primary mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />Finaliser le paiement en ligne
                  </p>
                  <p className="text-[13px] text-brand-muted mb-4">
                    Cliquez sur le bouton ci-dessous pour être redirigé vers la page de paiement sécurisée Chariow.
                  </p>
                  <a href={chariowUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center py-3.5">
                    <ExternalLink className="w-4 h-4" />Payer maintenant
                  </a>
                </div>
              )}

              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                {user ? (
                  <button onClick={() => setView({ kind: 'orders' })} className="btn-dark">
                    <Package className="w-4 h-4" />Voir mes commandes
                  </button>
                ) : (
                  <button onClick={() => setView({ kind: 'auth' })} className="btn-dark">
                    Se connecter
                  </button>
                )}
                <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer" className="btn-secondary justify-center">
                  <MessageCircle className="w-4 h-4" />Confirmer sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // ── Step 0: resolve user identity ────────────────────────────────────────
    let resolvedId: string;
    let resolvedEmail: string;
    let newCredentials: { email: string; password: string } | null = null;

    if (user) {
      resolvedId = user.id;
      resolvedEmail = user.email ?? guestEmail;
    } else {
      const password = generatePassword();
      const { data: sd, error: se } = await supabase.auth.signUp({
        email: guestEmail,
        password,
      });

      if (se || !sd.user) {
        const msg = se?.message ?? '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
          setError('Cet email est déjà enregistré. Connectez-vous avant de commander.');
        } else {
          setError(msg || 'Erreur lors de la création du compte. Réessayez.');
        }
        setSubmitting(false);
        return;
      }

      resolvedId = sd.user.id;
      resolvedEmail = guestEmail;
      newCredentials = { email: guestEmail, password };

      await supabase.from('profiles').insert({
        id: resolvedId,
        full_name: name,
        phone,
        role: 'customer',
      });
    }

    // ── Step 1: Create order ──────────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      customer_id: resolvedId,
      customer_name: name,
      customer_phone: phone,
      delivery_address: address,
      notes,
      payment_method: payment,
      source: 'online',
      total: finalTotal,
      status: 'pending',
      payment_status: 'pending',
    }).select().single();

    if (orderErr || !order) {
      setError(orderErr?.message ?? 'Erreur lors de la création de la commande');
      setSubmitting(false);
      return;
    }

    // ── Step 2: Order items ───────────────────────────────────────────────────
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

    // ── Step 2b: Promo code usage ──────────────────────────────────────────────
    if (appliedPromo) {
      await Promise.all([
        supabase.from('promo_usages').insert({
          promo_code_id: appliedPromo.id,
          order_id: (order as { id: string }).id,
          code: appliedPromo.code,
          partner_name: appliedPromo.partner_name,
          order_total: finalTotal,
          discount_amount: promoDiscount,
          commission_rate: appliedPromo.commission_rate,
          commission_amount: promoReward,
          commission_status: 'pending',
        }),
        supabase.rpc('increment_promo_used_count', { promo_id: appliedPromo.id }),
      ]).catch(() => { /* non-fatal */ });
    }

    // ── Step 2c: WhatsApp notification (fire-and-forget) ─────────────────────────
    fetch(`${SUPABASE_URL}/functions/v1/notify-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_number: (order as { order_number: string }).order_number,
        customer_name: name,
        customer_phone: phone,
        total: finalTotal,
        payment_method: payment,
        delivery_address: address,
        notes,
      }),
    }).catch(() => { /* ignore notification failures */ });

    // ── Step 3: Payment entry ─────────────────────────────────────────────────
    await supabase.from('payments').insert({
      order_id: (order as { id: string }).id,
      order_number: (order as { order_number: string }).order_number,
      method: payment,
      amount: finalTotal,
      status: 'pending',
      payer_name: name,
      payer_phone: phone,
    });

    // ── Step 4a: FedaPay online ───────────────────────────────────────────────
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
            amount: finalTotal,
            description: `Commande ${(order as { order_number: string }).order_number}`,
            callback_url: `${window.location.origin}?order=${(order as { order_number: string }).order_number}`,
            customer: {
              email: resolvedEmail,
              firstname: nameParts[0] ?? name,
              lastname: nameParts.slice(1).join(' ') || nameParts[0],
              phone_number: {
                number: phone.replace(/\D/g, '') || '0',
                country: 'bj',
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

          if (newCredentials) setAutoCredentials(newCredentials);
          clearCart();
          setSubmitting(false);
          window.open(paymentUrl, '_blank');
          setOrderNumber((order as { order_number: string }).order_number);
          return;
        }

        setError(`FedaPay : URL absente. Données: ${JSON.stringify(data).slice(0, 500)}`);
        setSubmitting(false);
        return;
      } catch {
        setError('Impossible de contacter FedaPay. Vérifiez votre connexion.');
        setSubmitting(false);
        return;
      }
    }

    // ── Step 4b: Chariow online ───────────────────────────────────────────────
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
            email: resolvedEmail,
            first_name: nameParts[0] ?? name,
            last_name: nameParts.slice(1).join(' ') || nameParts[0],
            phone: { number: phone.replace(/\D/g, '') || '00000000', country_code: 'BJ' },
            redirect_url: `${window.location.origin}?order=${(order as { order_number: string }).order_number}`,
            custom_metadata: {
              order_number: (order as { order_number: string }).order_number,
              order_id: (order as { id: string }).id,
              order_amount: String(finalTotal),
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
          await Promise.all([
            supabase.from('orders').update({
              chariow_sale_id: data?.data?.purchase?.id ?? '',
            }).eq('id', (order as { id: string }).id),
            supabase.from('payments').update({
              transaction_id: data?.data?.purchase?.id ?? '',
              chariow_checkout_url: checkoutUrl,
            }).eq('order_id', (order as { id: string }).id),
          ]);

          setChariowUrl(checkoutUrl);
          if (newCredentials) setAutoCredentials(newCredentials);
          clearCart();
          setSubmitting(false);
          window.open(checkoutUrl, '_blank');
          setOrderNumber((order as { order_number: string }).order_number);
          return;
        }

        if (step === 'already_purchased') {
          setError('Ce produit Chariow a déjà été acheté par ce compte. Contactez l\'administrateur.');
          setSubmitting(false);
          return;
        }
      } catch {
        setError('Impossible de contacter Chariow. Vérifiez votre connexion ou choisissez un autre mode de paiement.');
        setSubmitting(false);
        return;
      }
    }

    // ── Success ───────────────────────────────────────────────────────────────
    if (newCredentials) setAutoCredentials(newCredentials);
    setOrderNumber((order as { order_number: string }).order_number);
    clearCart();
    setSubmitting(false);
  }

  const manualOptions = PAYMENT_OPTIONS.filter((o) => o.group === 'manual');
  const onlineOptions = PAYMENT_OPTIONS.filter((o) => o.group === 'online');

  const methodHint: Record<string, { tone: string; icon: React.ReactNode; text: string }> = {
    fedapay_online: {
      tone: 'border-brand-success/25 bg-brand-success/[0.06] text-brand-success',
      icon: <CreditCard className="w-4 h-4" />,
      text: 'Vous serez automatiquement redirigé vers FedaPay pour payer par Mobile Money (MTN, Moov), carte bancaire ou Wave.',
    },
    chariow_online: {
      tone: 'border-brand-info/25 bg-brand-info/[0.06] text-brand-info',
      icon: <CreditCard className="w-4 h-4" />,
      text: 'Vous serez redirigé vers la page de paiement sécurisée Chariow après validation de votre commande.',
    },
    mobile_money: {
      tone: 'border-brand-warning/30 bg-brand-warning/[0.07] text-brand-warning',
      icon: <Smartphone className="w-4 h-4" />,
      text: 'Après validation, vous recevrez les instructions de paiement par SMS ou WhatsApp.',
    },
    bank_transfer: {
      tone: 'border-brand-border bg-brand-surface text-brand-ink/70',
      icon: <Building2 className="w-4 h-4" />,
      text: 'Les coordonnées bancaires vous seront communiquées après validation de la commande.',
    },
  };
  const activeHintKey = payment === 'fedapay_online' || payment === 'chariow_online' || payment === 'bank_transfer'
    ? payment
    : (payment === 'mobile_money_mtn' || payment === 'mobile_money_moov' || payment === 'mobile_money_celtis')
      ? 'mobile_money'
      : null;
  const activeHint = activeHintKey ? methodHint[activeHintKey] : null;

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-6 lg:py-10">
        <CheckoutSteps current={1} />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink">Finaliser la commande</h1>
            <p className="text-sm text-brand-muted mt-1">Renseignez vos coordonnées puis choisissez votre mode de paiement.</p>
          </div>
          <button onClick={() => setView({ kind: 'cart' })} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />Retour au panier
          </button>
        </div>

        <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">

            {/* Contact */}
            <FormSection step={1} title="Coordonnées" icon={<UserPlus className="w-4 h-4 text-brand-primary/70" />}>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="label">Nom complet</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="Ex : Awa Diallo" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" className="input" placeholder="Ex : 97000000" />
                </div>
                {!user && (
                  <div className="sm:col-span-2">
                    <label className="label">
                      Email <span className="text-brand-muted font-normal">(pour recevoir vos commandes)</span>
                    </label>
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      required
                      type="email"
                      className="input"
                      placeholder="votre@email.com"
                      autoComplete="email"
                    />
                    <p className="text-xs text-brand-muted mt-2 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      Un compte sera créé automatiquement pour suivre vos commandes.
                    </p>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Delivery */}
            <FormSection step={2} title="Adresse de livraison" icon={<MapPin className="w-4 h-4 text-brand-primary/70" />}>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                placeholder="Adresse complète, quartier, ville…"
                className="input resize-none"
              />
            </FormSection>

            {/* Payment methods */}
            <FormSection step={3} title="Mode de paiement" icon={<CreditCard className="w-4 h-4 text-brand-primary/70" />} hint="Choisissez le moyen qui vous arrange le plus.">

              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted mb-2.5">Paiement manuel</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {manualOptions.map((opt) => (
                  <button key={opt.method} type="button" onClick={() => setPayment(opt.method)}
                    className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      payment === opt.method
                        ? 'border-brand-primary bg-brand-primary/[0.05] ring-2 ring-brand-primary/25 shadow-soft'
                        : 'border-brand-border bg-white hover:border-brand-primary/40 hover:-translate-y-px hover:shadow-soft'
                    }`}>
                    <span className={`grid place-items-center w-10 h-10 rounded-xl flex-shrink-0 transition-colors ${
                      payment === opt.method ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-muted'
                    }`}>
                      {opt.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13.5px] font-bold truncate ${payment === opt.method ? 'text-brand-primary' : 'text-brand-ink'}`}>{opt.label}</span>
                      {opt.sublabel && <span className="block text-[11px] text-brand-muted truncate">{opt.sublabel}</span>}
                    </span>
                    <span className="choice-dot"><span className="choice-dot-inner" /></span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted mt-6 mb-2.5">Paiement en ligne</p>
              <div className="grid grid-cols-1 gap-2.5">
                {onlineOptions.map((opt) => (
                  <button key={opt.method} type="button" onClick={() => setPayment(opt.method)}
                    className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      payment === opt.method
                        ? 'border-brand-primary bg-brand-primary/[0.05] ring-2 ring-brand-primary/25 shadow-soft'
                        : 'border-brand-border bg-white hover:border-brand-primary/40 hover:-translate-y-px hover:shadow-soft'
                    }`}>
                    <span className={`grid place-items-center w-10 h-10 rounded-xl flex-shrink-0 transition-colors ${
                      payment === opt.method ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-muted'
                    }`}>
                      {opt.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13.5px] font-bold ${payment === opt.method ? 'text-brand-primary' : 'text-brand-ink'}`}>{opt.label}</span>
                      {opt.sublabel && <span className="block text-[11px] text-brand-muted">{opt.sublabel}</span>}
                    </span>
                    <span className="badge bg-brand-success/[0.12] text-brand-success hidden sm:inline-flex"><ShieldCheck className="w-3 h-3" />Sécurisé</span>
                    <span className="choice-dot"><span className="choice-dot-inner" /></span>
                  </button>
                ))}
              </div>

              {activeHint && (
                <div className={`mt-4 p-3.5 rounded-2xl border text-[13px] flex items-start gap-2.5 ${activeHint.tone}`}>
                  <span className="mt-px flex-shrink-0">{activeHint.icon}</span>
                  <span>{activeHint.text}</span>
                </div>
              )}
            </FormSection>

            {/* Notes */}
            <FormSection step={4} title="Notes (optionnel)" icon={<ClipboardList className="w-4 h-4 text-brand-primary/70" />}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Instructions particulières, repère de livraison…"
                className="input resize-none"
              />
            </FormSection>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="panel p-5 sm:p-6">
              <h2 className="font-display text-lg font-extrabold text-brand-ink mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-primary/70" />Récapitulatif
              </h2>

              <div className="space-y-2.5 text-sm max-h-60 overflow-auto pr-1 pb-4 border-b border-brand-border">
                {items.map((it) => {
                  const price = getEffectivePrice(it.product, it.quantity);
                  return (
                    <div key={it.product.id} className="flex justify-between gap-3">
                      <span className="line-clamp-2 text-brand-muted">
                        <span className="font-semibold text-brand-ink">{it.quantity} ×</span> {it.product.name}
                      </span>
                      <span className="font-semibold flex-shrink-0">{formatPrice(price * it.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-sm py-3.5 border-b border-brand-border">
                <span className="text-brand-muted">Mode de paiement</span>
                <span className="font-bold text-brand-ink text-[13px] text-right max-w-40 truncate">{METHOD_LABELS[payment]}</span>
              </div>

              {/* Promo code */}
              <div className="py-4 border-b border-brand-border">
                {appliedPromo ? (
                  <div className="flex items-center justify-between gap-2 rounded-2xl border border-brand-success/30 bg-brand-success/[0.06] p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-success text-white flex-shrink-0">
                        <TicketPercent className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <code className="font-mono text-sm font-bold text-brand-success">{appliedPromo.code}</code>
                        <p className="text-[11px] text-brand-muted truncate">
                          {appliedPromo.discount_value > 0
                            ? appliedPromo.discount_type === 'percentage'
                              ? `−${appliedPromo.discount_value}% appliqués`
                              : `−${formatPrice(appliedPromo.discount_value)} appliqués`
                            : 'Code partenaire appliqué'}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={removePromo} aria-label="Retirer le code promo"
                      className="p-1.5 rounded-xl hover:bg-brand-danger/10 text-brand-danger transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="label flex items-center gap-1.5"><TicketPercent className="w-3.5 h-3.5" />Code promo</label>
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                        placeholder="Ex : PROMO10"
                        className="input uppercase font-mono text-sm"
                        disabled={promoChecking}
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={promoChecking || !promoInput.trim()}
                        className="btn-dark flex-shrink-0 px-4"
                      >
                        {promoChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Appliquer'}
                      </button>
                    </div>
                    {promoError && <p className="text-xs font-semibold text-brand-danger mt-2">{promoError}</p>}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Sous-total</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-success font-semibold">Remise promo</span>
                    <span className="font-bold text-brand-success">−{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-brand-muted">Livraison</span>
                  <span className="text-xs text-brand-muted">Calculée à la commande</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-4 pb-5">
                <span className="font-bold text-brand-ink">Total à payer</span>
                <span className="font-display text-2xl font-extrabold text-brand-primary">{formatPrice(finalTotal)}</span>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-brand-danger/25 bg-brand-danger/[0.07] text-brand-danger text-[13px] font-medium p-3.5">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-[15px]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  (payment === 'fedapay_online' || payment === 'chariow_online')
                    ? <><Lock className="w-4 h-4" />Commander & payer en ligne</>
                    : <><CheckCircle2 className="w-4 h-4" />Confirmer la commande</>}
              </button>

              {!user && (
                <p className="text-center text-xs text-brand-muted mt-3">
                  Déjà client ?{' '}
                  <button type="button" onClick={() => setView({ kind: 'auth' })} className="text-brand-primary font-semibold hover:underline">
                    Se connecter
                  </button>
                </p>
              )}

              <div className="mt-5 pt-5 border-t border-brand-border space-y-2.5">
                <p className="text-[12.5px] text-brand-ink flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-success mt-0.5 flex-shrink-0" />
                  <span>Vos informations restent confidentielles et servent uniquement à traiter la commande.</span>
                </p>
                <p className="text-[12.5px] text-brand-ink flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-brand-accent-dark mt-0.5 flex-shrink-0" />
                  <span>Un conseiller vous contacte pour confirmer le paiement et l'heure de livraison.</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
