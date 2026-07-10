import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Tag, Package2, Plus, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, ArrowRight, Flame, Sparkles,
  Truck, RotateCcw, ShieldCheck, Headphones, ShoppingCart, SlidersHorizontal,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, parseImages } from '../lib/format';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import type { Banner, Category, Product, Promotion } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { LazyImage, SkeletonCard, StaggerItem, useRipple, useToast } from '../components/ui';
import type { View } from '../lib/views';

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    function calc() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!remaining) return <span className="text-xs opacity-70">Expiré</span>;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-xs font-bold">
      <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
      {remaining.d > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded">{remaining.d}j</span>}
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(remaining.h)}h</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(remaining.m)}m</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(remaining.s)}s</span>
    </div>
  );
}

// ─── Banner carousel ──────────────────────────────────────────────────────────

function BannerCarousel({ banners, onAction }: { banners: Banner[]; onAction: (a: string | null) => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % banners.length), 5500);
    return () => clearInterval(id);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;
  const b = banners[active];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(320px, 62vh, 680px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((banner, i) => (
        <div key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={banner.image_url} alt={banner.title ?? ''} loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover scale-[1.02] transition-transform duration-[8000ms] ease-out"
            style={{ transform: i === active ? 'scale(1)' : 'scale(1.04)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      ))}

      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12">
          {b.title && (
            <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-3 animate-fade-in-up">
              Collection
            </p>
          )}
          {b.title && (
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-none mb-4 animate-fade-in-up drop-shadow-lg"
              style={{ animationDelay: '60ms' }}>
              {b.title}
            </h2>
          )}
          {b.subtitle && (
            <p className="text-white/80 text-base lg:text-lg max-w-lg leading-relaxed mb-8 animate-fade-in-up"
              style={{ animationDelay: '120ms' }}>
              {b.subtitle}
            </p>
          )}
          {b.cta_text && (
            <button onClick={() => onAction(b.cta_action)}
              className="group inline-flex items-center gap-3 bg-white text-brand-dark font-bold px-7 py-3.5 rounded-full text-sm hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-xl animate-fade-in-up"
              style={{ animationDelay: '180ms' }}>
              {b.cta_text}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={() => { setActive((i) => (i === 0 ? banners.length - 1 : i - 1)); setPaused(true); }}
            className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 flex items-center justify-center transition-all hover:scale-110">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => { setActive((i) => (i + 1) % banners.length); setPaused(true); }}
            className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 flex items-center justify-center transition-all hover:scale-110">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => { setActive(i); setPaused(true); }}
                className={`rounded-full transition-all duration-400 ${i === active ? 'bg-white w-8 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Trust bar ────────────────────────────────────────────────────────────────

function TrustBar() {
  const features = [
    { icon: Truck,        title: 'Livraison rapide',    desc: 'Dans toute la ville' },
    { icon: RotateCcw,    title: 'Retours faciles',     desc: '7 jours pour changer' },
    { icon: ShieldCheck,  title: 'Paiement sécurisé',   desc: 'Mobile Money & espèces' },
    { icon: Headphones,   title: 'Assistance client',   desc: 'Réponse rapide' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-odoo-border border border-brand-border rounded-2xl overflow-hidden bg-white my-8 shadow-sm">
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-center gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-brand-dark">{title}</p>
            <p className="text-xs text-brand-muted">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({ categories, products, onSelect }: {
  categories: Category[];
  products: Product[];
  onSelect: (id: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase mb-1">Parcourez</p>
          <h2 className="text-2xl lg:text-3xl font-black text-brand-dark">Nos rayons</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {categories.map((cat, i) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          return (
            <StaggerItem key={cat.id} index={i}>
              <button
                onClick={() => onSelect(cat.id)}
                className="group w-full relative overflow-hidden rounded-2xl bg-brand-surface aspect-[3/4] focus:outline-none"
              >
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
                    <Package2 className="w-10 h-10 text-brand-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/20 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <p className="font-bold text-white text-sm leading-tight drop-shadow">{cat.name}</p>
                  <p className="text-white/60 text-xs mt-0.5">{count} articles</p>
                </div>
              </button>
            </StaggerItem>
          );
        })}
      </div>
    </section>
  );
}

// ─── Promotion card ───────────────────────────────────────────────────────────

const BADGE_STYLES: Record<string, string> = {
  red:    'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  green:  'bg-emerald-500 text-white',
  blue:   'bg-blue-500 text-white',
  yellow: 'bg-yellow-400 text-yellow-900',
};

const CARD_GRADIENTS = [
  'from-rose-600 to-orange-500',
  'from-blue-700 to-cyan-500',
  'from-emerald-700 to-teal-500',
  'from-violet-700 to-fuchsia-500',
  'from-amber-600 to-yellow-500',
  'from-pink-700 to-rose-500',
];

function PromotionCard({ promo, index, onAction }: { promo: Promotion; index: number; onAction: (a: string | null) => void }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const badgeStyle = BADGE_STYLES[promo.badge_color] ?? 'bg-red-500 text-white';

  return (
    <div
      className="relative flex-shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 group cursor-pointer"
      style={{ height: '200px' }}
      onClick={() => onAction(promo.cta_action)}
    >
      {promo.image_url ? (
        <>
          <img src={promo.image_url} alt={promo.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/20" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}

      {promo.badge_text && (
        <span className={`absolute top-4 left-4 z-10 ${badgeStyle} text-xs font-black px-3 py-1.5 rounded-full shadow-lg tracking-wide`}>
          {promo.badge_text}
        </span>
      )}

      <div className="absolute inset-0 z-10 p-5 flex flex-col justify-end">
        <p className="font-black text-white text-xl leading-tight drop-shadow-lg">{promo.title}</p>
        {promo.subtitle && <p className="text-white/75 text-xs mt-1">{promo.subtitle}</p>}
        {promo.ends_at && <div className="mt-2 text-white"><Countdown endsAt={promo.ends_at} /></div>}
        {promo.cta_text && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-white text-xs font-semibold">
            {promo.cta_text} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

export function ProductCard({ product, onView, onAdd }: {
  product: Product;
  onView: () => void;
  onAdd: () => void;
}) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;
  const isNew = Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const hasBulk = product.bulk_quantity > 0 && product.bulk_price > 0;
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();
  const ripple = useRipple();
  const firstImage = parseImages(product.image_url)[0] ?? null;

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (isOutOfStock) return;
    ripple(e);
    onAdd();
    setJustAdded(true);
    toast(`${product.name} ajouté au panier`, 'success');
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border border-transparent hover:border-brand-border">
      {/* Image zone */}
      <div className="relative overflow-hidden bg-brand-surface" style={{ aspectRatio: '1/1' }}>
        <button onClick={onView} className="block w-full h-full focus:outline-none">
          {firstImage ? (
            <img src={firstImage} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-border to-brand-surface">
              <Package2 className="w-10 h-10 text-brand-muted/40" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isNew && !isOutOfStock && (
              <span className="bg-brand-dark text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">
                New
              </span>
            )}
            {hasBulk && (
              <span className="bg-brand-success text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                Lot
              </span>
            )}
          </div>

          {isLowStock && (
            <span className="absolute top-2 right-2 bg-odoo-warning text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              Stock: {product.stock}
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-full">Rupture de stock</span>
            </div>
          )}
        </button>

        {/* Quick-add overlay — slides up on hover */}
        {!isOutOfStock && (
          <button
            onClick={handleAdd}
            className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-2.5 font-semibold text-xs
              transition-all duration-300 ease-out
              translate-y-full group-hover:translate-y-0
              ${justAdded
                ? 'bg-brand-success text-white'
                : 'bg-brand-dark text-white hover:bg-brand-primary'
              }`}
          >
            {justAdded
              ? <><CheckCircle2 className="w-3.5 h-3.5" />Ajouté !</>
              : <><ShoppingCart className="w-3.5 h-3.5" />Ajouter</>}
          </button>
        )}
      </div>

      {/* Text zone */}
      <button onClick={onView} className="w-full text-left p-2.5 focus:outline-none">
        <h3 className="font-semibold text-xs text-brand-dark line-clamp-2 leading-snug mb-1 group-hover:text-brand-primary transition-colors duration-200">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black text-brand-primary">{formatPrice(product.price)}</span>
          {hasBulk && (
            <span className="text-[11px] text-brand-muted line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        {hasBulk && (
          <p className="text-[11px] text-odoo-success font-semibold mt-0.5">
            Lot: {formatPrice(product.bulk_price)} / unité
          </p>
        )}
      </button>
    </div>
  );
}

// ─── Shop page ────────────────────────────────────────────────────────────────

export function ShopPage({ setView }: { setView: (v: View) => void }) {
  const { settings } = useStoreSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();
  const productsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').eq('is_active', true).order('name', { ascending: true }),
      supabase.from('banners').select('*').eq('is_active', true).order('sort_order').order('created_at'),
      supabase.from('promotions').select('*').eq('is_active', true)
        .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
        .order('sort_order').order('created_at'),
    ]).then(([cats, prods, bnrs, promos]) => {
      if (!mounted) return;
      setCategories((cats.data as Category[]) ?? []);
      setProducts((prods.data as Product[]) ?? []);
      setBanners((bnrs.data as Banner[]) ?? []);
      setPromotions((promos.data as Promotion[]) ?? []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  function handleCTA(action: string | null) {
    if (!action || action === 'shop') {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (action.startsWith('http')) {
      window.open(action, '_blank', 'noopener,noreferrer');
    } else {
      setActiveCategory(action);
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory) list = list.filter((p) => p.category_id === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, activeCategory, search, sortBy]);

  const activeCategoryName = activeCategory
    ? categories.find((c) => c.id === activeCategory)?.name
    : null;

  return (
    <div className="page-enter bg-white min-h-screen">

      {/* ── Banner ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="w-full bg-gradient-to-r from-brand-border/40 to-brand-border/20 animate-pulse"
          style={{ height: 'clamp(320px, 62vh, 680px)' }} />
      ) : banners.length > 0 ? (
        <BannerCarousel banners={banners} onAction={handleCTA} />
      ) : settings.hero_style === 'none' ? (
        /* No hero — minimal mode */
        null
      ) : (
        /* Fallback hero */
        <div className="relative overflow-hidden bg-brand-dark" style={{ height: 'clamp(320px, 62vh, 680px)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-dark to-black opacity-90" />
          <div className="absolute top-0 right-0 w-96 h-96 -mr-32 -mt-32 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 -ml-16 -mb-16 rounded-full bg-brand-accent/10 blur-2xl" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-6 lg:px-12">
              <p className="text-brand-accent text-xs font-bold tracking-widest uppercase mb-4">Bienvenue dans notre boutique</p>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-none mb-6">
                Qualité<br /><span className="text-brand-accent">garantie.</span>
              </h1>
              <p className="text-white/60 text-lg max-w-md leading-relaxed mb-8">
                Découvrez notre catalogue avec des prix dégressifs et une livraison rapide.
              </p>
              <button onClick={() => productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center gap-3 bg-brand-accent text-brand-dark font-bold px-8 py-4 rounded-full hover:bg-brand-accent-dark transition-all duration-300 shadow-accent text-sm">
                Explorer le catalogue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* Trust bar */}
        <TrustBar />

        {/* Categories */}
        {!activeCategory && !search && (
          <CategorySection categories={categories} products={products} onSelect={(id) => {
            setActiveCategory(id);
            productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }} />
        )}

        {/* Promotions */}
        {promotions.length > 0 && !activeCategory && !search && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-1">Disponible maintenant</p>
                <h2 className="text-2xl lg:text-3xl font-black text-brand-dark flex items-center gap-2">
                  <Flame className="w-7 h-7 text-orange-500" />
                  Offres du moment
                </h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
              {promotions.map((promo, i) => (
                <PromotionCard key={promo.id} promo={promo} index={i} onAction={handleCTA} />
              ))}
            </div>
          </section>
        )}

        {/* Products section */}
        <section ref={productsSectionRef} className="pb-16">

          {/* Section heading */}
          <div className="flex items-end justify-between mb-6">
            <div>
              {activeCategoryName ? (
                <>
                  <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase mb-1">Catégorie</p>
                  <h2 className="text-2xl lg:text-3xl font-black text-brand-dark">{activeCategoryName}</h2>
                </>
              ) : search ? (
                <>
                  <p className="text-xs font-semibold tracking-widest text-brand-muted uppercase mb-1">Résultats</p>
                  <h2 className="text-2xl lg:text-3xl font-black text-brand-dark">"{search}"</h2>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold tracking-widest text-brand-primary uppercase mb-1">Catalogue</p>
                  <h2 className="text-2xl lg:text-3xl font-black text-brand-dark">Tous les produits</h2>
                </>
              )}
            </div>
            {(activeCategoryName || search) && (
              <button
                onClick={() => { setActiveCategory(null); setSearch(''); }}
                className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-odoo-danger transition-colors">
                <X className="w-4 h-4" />Effacer
              </button>
            )}
          </div>

          {/* Search + filter bar */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-11 pr-4 py-3 border border-brand-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-odoo-primary/30 focus:border-odoo-primary transition bg-white shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition shadow-sm ${
                showFilters ? 'bg-brand-primary text-white border-odoo-primary' : 'bg-white border-brand-border hover:border-odoo-primary text-brand-dark'
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtres</span>
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mb-6 p-4 bg-brand-surface rounded-xl border border-brand-border animate-fade-in-up">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Trier :</span>
                {(['recent', 'price-asc', 'price-desc', 'name'] as const).map((s) => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === s ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border hover:border-odoo-primary'}`}>
                    {{ recent: 'Récents', 'price-asc': 'Prix ↑', 'price-desc': 'Prix ↓', name: 'A-Z' }[s]}
                  </button>
                ))}
              </div>
              {/* Category filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Rayon :</span>
                <button onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!activeCategory ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border hover:border-odoo-primary'}`}>
                  Tout
                </button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeCategory === cat.id ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border hover:border-odoo-primary'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result count */}
          {!loading && (
            <p className="text-sm text-brand-muted mb-4">
              <span className="font-bold text-brand-dark">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 animate-fade-in-scale">
              <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-9 h-9 text-brand-muted" />
              </div>
              <p className="text-lg font-bold mb-2">Aucun résultat</p>
              <p className="text-sm text-brand-muted">Essayez d'autres termes ou explorez toutes les catégories</p>
              <button onClick={() => { setActiveCategory(null); setSearch(''); }}
                className="mt-6 inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-brand-primary-dark transition">
                Voir tout le catalogue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map((product, i) => (
                <StaggerItem key={product.id} index={i % 8}>
                  <ProductCard
                    product={product}
                    onView={() => setView({ kind: 'product', id: product.id })}
                    onAdd={() => addToCart(product)}
                  />
                </StaggerItem>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
