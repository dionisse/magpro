import { useEffect, useState } from 'react';
import { Loader2, ShoppingBag, DollarSign, Package, AlertTriangle, TrendingUp, Users, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/format';
import { StatusBadge } from '../OrdersPage';
import type { Order, Product } from '../../lib/database.types';
import type { View } from '../../lib/views';

interface Stats {
  todaySales: number;
  weekSales: number;
  monthSales: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export function AdminDashboard({ setView }: { setView: (v: View) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadStats().then((s) => { if (mounted) { setStats(s); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  async function loadStats(): Promise<Stats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [todayRes, weekRes, monthRes, pendingRes, productsRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total').gte('created_at', startOfDay).neq('status', 'cancelled'),
      supabase.from('orders').select('total').gte('created_at', startOfWeek).neq('status', 'cancelled'),
      supabase.from('orders').select('total').gte('created_at', startOfMonth).neq('status', 'cancelled'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    ]);
    const sum = (rows: { total: number }[] | null) => (rows ?? []).reduce((a, b) => a + Number(b.total), 0);
    const products = (productsRes.data as Product[]) ?? [];
    return {
      todaySales: sum(todayRes.data as { total: number }[]),
      weekSales: sum(weekRes.data as { total: number }[]),
      monthSales: sum(monthRes.data as { total: number }[]),
      pendingOrders: pendingRes.count ?? 0,
      totalProducts: products.length,
      lowStockCount: products.filter((p) => p.stock <= p.low_stock_threshold).length,
      recentOrders: (recentRes.data as Order[]) ?? [],
      lowStockProducts: products.filter((p) => p.stock <= p.low_stock_threshold).slice(0, 5),
    };
  }

  if (loading || !stats) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>;

  return (
    <div className="shell py-6 lg:py-8">
      <div className="mb-6">
        <p className="eyebrow mb-2"><span className="w-5 h-px bg-brand-accent" aria-hidden />Pilotage</p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink">Tableau de bord</h1>
        <p className="text-sm text-brand-muted mt-1.5">Vue d'ensemble de votre activité commerciale</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Ventes du jour" value={formatPrice(stats.todaySales)} color="primary" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="7 derniers jours" value={formatPrice(stats.weekSales)} color="success" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Ce mois-ci" value={formatPrice(stats.monthSales)} color="info" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="En attente" value={stats.pendingOrders.toString()} color="warning" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <button onClick={() => setView({ kind: 'admin-products' })} className="group card-hover p-4 text-left">
          <span className="icon-tile mb-3 group-hover:scale-105"><Package className="w-5 h-5" /></span>
          <p className="text-xs font-semibold text-brand-muted">Produits au catalogue</p>
          <p className="font-display text-xl font-extrabold text-brand-ink mt-0.5">{stats.totalProducts}</p>
        </button>
        <button onClick={() => setView({ kind: 'admin-products' })} className="group card-hover p-4 text-left">
          <span className="icon-tile-accent mb-3 group-hover:scale-105"><AlertTriangle className="w-5 h-5" /></span>
          <p className="text-xs font-semibold text-brand-muted">Alertes stock</p>
          <p className="font-display text-xl font-extrabold text-brand-ink mt-0.5">{stats.lowStockCount}</p>
        </button>
        <button onClick={() => setView({ kind: 'admin-orders' })} className="group card-hover p-4 text-left">
          <span className="icon-tile-info mb-3 group-hover:scale-105"><ShoppingBag className="w-5 h-5" /></span>
          <p className="text-xs font-semibold text-brand-muted">Commandes</p>
          <p className="text-sm font-bold text-brand-primary mt-1.5 inline-flex items-center gap-1.5">
            Tout consulter <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>
        <button onClick={() => setView({ kind: 'admin-pos' })} className="group card-hover p-4 text-left">
          <span className="icon-tile-success mb-3 group-hover:scale-105"><DollarSign className="w-5 h-5" /></span>
          <p className="text-xs font-semibold text-brand-muted">Caisse</p>
          <p className="text-sm font-bold text-brand-success mt-1.5 inline-flex items-center gap-1.5">
            Ouvrir le POS <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <h2 className="font-display font-extrabold text-brand-ink flex items-center gap-2.5">
              <span className="icon-tile w-9 h-9 rounded-xl"><ShoppingBag className="w-4 h-4" /></span>
              Commandes récentes
            </h2>
            <button onClick={() => setView({ kind: 'admin-orders' })} className="link-quiet inline-flex items-center gap-1.5">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {stats.recentOrders.length === 0
            ? <p className="p-6 text-sm text-brand-muted text-center">Aucune commande</p>
            : <div className="divide-y divide-brand-border">
              {stats.recentOrders.map((o) => (
                <div key={o.id} className="px-5 py-3.5 flex items-center justify-between gap-2 hover:bg-brand-surface/60 transition-colors">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{o.order_number}</p>
                    <p className="text-xs text-brand-muted">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={o.status} />
                    <span className="font-bold text-sm">{formatPrice(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        <div className="panel">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <h2 className="font-display font-extrabold text-brand-ink flex items-center gap-2.5">
              <span className="icon-tile-accent w-9 h-9 rounded-xl"><AlertTriangle className="w-4 h-4" /></span>
              Alertes stock
            </h2>
            <button onClick={() => setView({ kind: 'admin-products' })} className="link-quiet inline-flex items-center gap-1.5">
              Gérer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {stats.lowStockProducts.length === 0
            ? <p className="p-6 text-sm text-brand-muted text-center">Tous les stocks sont OK</p>
            : <div className="divide-y divide-brand-border">
              {stats.lowStockProducts.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-2 hover:bg-brand-surface/60 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-brand-muted">{p.sku || '—'}</p>
                  </div>
                  <span className={`badge ${p.stock === 0 ? 'bg-brand-danger/15 text-brand-danger' : 'bg-brand-warning/15 text-brand-warning'}`}>
                    {p.stock} en stock
                  </span>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'primary' | 'success' | 'warning' | 'info' }) {
  const cls = {
    primary: 'bg-brand-primary text-white',
    success: 'bg-brand-success text-white',
    warning: 'bg-brand-accent text-brand-ink',
    info:    'bg-brand-info text-white',
  };
  const glow = {
    primary: 'from-brand-primary/10',
    success: 'from-brand-success/10',
    warning: 'from-brand-accent/15',
    info:    'from-brand-info/10',
  };
  return (
    <div className="relative card p-4 sm:p-5 overflow-hidden">
      <div className={`absolute -top-10 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${glow[color]} to-transparent blur-2xl`} aria-hidden />
      <div className="relative">
        <span className={`grid place-items-center w-10 h-10 rounded-2xl mb-3 shadow-soft ${cls[color]}`}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">{label}</p>
        <p className="font-display text-xl lg:text-2xl font-extrabold text-brand-ink mt-1">{value}</p>
      </div>
    </div>
  );
}
