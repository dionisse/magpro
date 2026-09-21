import { useEffect, useState } from 'react';
import { Package, ChevronRight, ArrowLeft, MapPin, Phone, Calendar, MessageCircle, ShoppingBag, ListChecks, Headphones } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatPrice } from '../lib/format';
import type { Order, OrderItem, OrderStatus } from '../lib/database.types';
import { EmptyState } from '../components/ui';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import type { View } from '../lib/views';

const STATUS_MAP: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending:    { label: 'En attente',    cls: 'bg-brand-warning/[0.12] text-brand-warning', dot: 'bg-brand-warning' },
  processing: { label: 'En traitement', cls: 'bg-brand-info/[0.12] text-brand-info',       dot: 'bg-brand-info' },
  shipped:    { label: 'Expédiée',      cls: 'bg-brand-primary/10 text-brand-primary', dot: 'bg-brand-primary' },
  delivered:  { label: 'Livrée',        cls: 'bg-brand-success/[0.12] text-brand-success', dot: 'bg-brand-success' },
  cancelled:  { label: 'Annulée',       cls: 'bg-brand-danger/10 text-brand-danger',   dot: 'bg-brand-danger' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function OrdersPage({ setView }: { setView: (v: View) => void }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let mounted = true;
    supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (!mounted) return;
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [user]);

  if (!user) return (
    <div className="bg-brand-surface min-h-[70vh]">
      <div className="shell py-16">
        <EmptyState
          icon={<Package className="w-8 h-8 text-brand-primary/60" />}
          title="Connexion requise"
          description="Connectez-vous pour retrouver l'historique de vos commandes."
          actionLabel="Se connecter"
          onAction={() => setView({ kind: 'auth' })}
        />
      </div>
    </div>
  );

  if (loading) return (
    <div className="shell py-10">
      <div className="h-8 w-56 skeleton mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
      </div>
    </div>
  );

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <p className="eyebrow mb-2"><span className="w-5 h-px bg-brand-accent" aria-hidden />Espace client</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink">Mes commandes</h1>
            <p className="text-sm text-brand-muted mt-1.5">Suivez l'avancement de vos commandes en temps réel.</p>
          </div>
          <button onClick={() => setView({ kind: 'shop' })} className="btn-secondary">
            <ShoppingBag className="w-4 h-4" />Continuer mes achats
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={<Package className="w-8 h-8 text-brand-primary/60" />}
              title="Aucune commande pour le moment"
              description="Vos futures commandes apparaîtront ici avec leur statut et leur détail."
              actionLabel="Découvrir les produits"
              onAction={() => setView({ kind: 'shop' })}
            />
          </div>
        ) : (
          <div className="space-y-3.5">
            {orders.map((o, i) => (
              <button key={o.id} onClick={() => setView({ kind: 'order', id: o.id })}
                className="group card-hover w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                <div className="flex items-center gap-4 min-w-0">
                  <span className="hidden sm:grid place-items-center w-12 h-12 rounded-2xl bg-brand-primary/[0.08] text-brand-primary flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-brand-ink">{o.order_number}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-brand-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />{formatDate(o.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  <span className="font-display text-lg font-extrabold text-brand-primary">{formatPrice(o.total)}</span>
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-brand-surface text-brand-muted group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetailPage({ id, setView }: { id: string; setView: (v: View) => void }) {
  const { settings } = useStoreSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
    ]).then(([o, its]) => {
      if (!mounted) return;
      setOrder(o.data as Order | null);
      setItems((its.data as OrderItem[]) ?? []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return (
    <div className="shell py-10 space-y-4">
      <div className="h-6 w-40 skeleton" />
      <div className="h-40 rounded-3xl skeleton" />
      <div className="h-64 rounded-3xl skeleton" />
    </div>
  );

  if (!order) return (
    <div className="shell py-16">
      <EmptyState
        title="Commande introuvable"
        description="Cette commande n'existe plus ou n'est pas accessible."
        actionLabel="Retour à mes commandes"
        onAction={() => setView({ kind: 'orders' })}
      />
    </div>
  );

  const whatsappMsg = encodeURIComponent(`Bonjour, je voudrais des infos sur ma commande ${order.order_number}.`);
  const whatsappHref = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${whatsappMsg}`
    : `https://wa.me/?text=${whatsappMsg}`;

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-6 lg:py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-brand-muted mb-6">
          <button onClick={() => setView({ kind: 'orders' })} className="inline-flex items-center gap-1.5 font-semibold hover:text-brand-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />Mes commandes
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-brand-border" />
          <span className="font-mono font-semibold text-brand-ink">{order.order_number}</span>
        </nav>

        {/* Header card */}
        <div className="panel p-5 sm:p-7 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">Commande</p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink font-mono mt-1">{order.order_number}</h1>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { icon: Calendar, label: 'Date', value: formatDate(order.created_at) },
              { icon: Phone, label: 'Contact', value: order.customer_phone || '—' },
              { icon: MapPin, label: 'Livraison', value: order.delivery_address || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-brand-border bg-brand-surface p-3.5 flex items-start gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-white text-brand-primary ring-1 ring-brand-border flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted">{label}</span>
                  <span className="block text-[13px] font-semibold text-brand-ink mt-0.5 break-words">{value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="panel mb-5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4 border-b border-brand-border">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-primary/[0.08] text-brand-primary"><ListChecks className="w-4 h-4" /></span>
            <h2 className="font-display font-extrabold text-brand-ink">Articles commandés</h2>
            <span className="badge bg-brand-surface text-brand-muted ml-auto">{items.length}</span>
          </div>
          <div className="divide-y divide-brand-border">
            {items.map((it) => (
              <div key={it.id} className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-brand-ink">{it.product_name}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{it.quantity} × {formatPrice(it.unit_price)}</p>
                </div>
                <span className="font-display font-extrabold text-brand-primary flex-shrink-0">{formatPrice(it.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-brand-border bg-brand-surface flex items-baseline justify-between">
            <span className="font-bold text-brand-ink">Total</span>
            <span className="font-display text-2xl font-extrabold text-brand-primary">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Help */}
        <div className="rounded-3xl bg-brand-primary text-white p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-navy opacity-95" aria-hidden />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-white/10 flex-shrink-0">
                <Headphones className="w-5 h-5 text-brand-accent" />
              </span>
              <div>
                <p className="font-display font-extrabold text-lg">Une question sur cette commande ?</p>
                <p className="text-sm text-white/70 mt-1">Notre équipe vous répond rapidement sur WhatsApp.</p>
              </div>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-accent text-brand-ink font-bold text-sm hover:bg-white transition-all hover:-translate-y-0.5 flex-shrink-0">
              <MessageCircle className="w-4 h-4" />Contacter sur WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
