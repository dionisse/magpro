import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Tag, Package2, Plus, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, ArrowRight, Flame, Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, parseImages } from '../lib/format';
import type { Banner, Category, Product, Promotion } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { LazyImage, SkeletonCard, StaggerItem, useRipple, useToast } from '../components/ui';
import type { View } from '../lib/views';

// ─── Countdown timer ──────────────────────────────────────────────────────────

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

  if (!remaining) return <span className="text-xs text-odoo-muted">Expiré</span>;

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold">
      <Clock className="w-3 h-3 opacity-70 flex-shrink-0" />
      {remaining.d > 0 && <span className="bg-black/15 px-1.5 py-0.5 rounded">{remaining.d}j</span>}
      <span className="bg-black/15 px-1.5 py-0.5 rounded">{pad(remaining.h)}h</span>
      <span className="bg-black/15 px-1.5 py-0.5 rounded">{pad(remaining.m)}m</span>
      <span className="bg-black/15 px-1.5 py-0.5 rounded">{pad(remaining.s)}s</span>
    </div>
  );
}

// ─── Banner carousel ──────────────────────────────────────────────────────────

function BannerCarousel({ banners, onAction }: { banners: Banner[]; onAction: (action: string | null) => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  const b = banners[active];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height: 'clamp(220px, 45vw, 520px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={banner.image_url}
            alt={banner.title ?? ''}
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 z-20 flex items-center px-6 sm:px-10 lg:px-14">
        <div className="text-white max-w-md lg:max-w-xl">
          {b.title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight mb-2 drop-shadow-md animate-fade-in-up">
              {b.title}
            </h2>
          )}
          {b.subtitle && (
            <p className="text-sm sm:text-base text-white/85 mb-5 leading-relaxed drop-shadow animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              {b.subtitle}
            </p>
          )}
          {b.cta_text && (
            <button
              onClick={() => onAction(b.cta_action)}
              className="inline-flex items-center gap-2 bg-white text-odoo-dark font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-odoo-surface active:scale-95 transition-all shadow-lg animate-fade-in-up"
              style={{ animationDelay: '160ms' }}
            >
              {b.cta_text}<ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => { setActive((i) => (i === 0 ? banners.length - 1 : i - 1)); setPaused(true); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setActive((i) => (i + 1) % banners.length); setPaused(true); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setPaused(true); }}
              className={`rounded-full transition-all duration-300 ${
                i === active ? 'bg-white w-6 h-2' : 'bg-white/50 w-2 h-2 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
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
  'from-rose-500 to-orange-400',
  'from-blue-600 to-cyan-400',
  'from-emerald-600 to-teal-400',
  'from-violet-600 to-purple-400',
  'from-amber-500 to-yellow-400',
  'from-pink-600 to-rose-400',
];

function PromotionCard({ promo, index, onAction }: { promo: Promotion; index: number; onAction: (action: string | null) => void }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const badgeStyle = BADGE_STYLES[promo.badge_color] ?? 'bg-red-500 text-white';

  return (
    <div className={`relative flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
      style={{ minHeight: '160px' }}>
      {promo.image_url ? (
        <>
          <img src={promo.image_url} alt={promo.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}

      {/* Badge */}
      {promo.badge_text && (
        <div className={`absolute top-3 right-3 z-10 ${badgeStyle} text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md`}>
          {promo.badge_text}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-end" style={{ minHeight: '160px' }}>
        <div className="mt-auto">
          <p className="font-bold text-white text-base leading-tight drop-shadow">{promo.title}</p>
          {promo.subtitle && <p className="text-white/80 text-xs mt-1 leading-relaxed">{promo.subtitle}</p>}
          {promo.ends_at && (
            <div className="mt-2 text-white/90">
              <Countdown endsAt={promo.ends_at} />
            </div>
          )}
          {promo.cta_text && (
            <button
              onClick={() => onAction(promo.cta_action)}
              className="mt-3 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition backdrop-blur-sm"
            >
              {promo.cta_text}<ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shop page ────────────────────────────────────────────────────────────────

export function ShopPage({ setView }: { setView: (v: View) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');
  const { addToCart } = useCart();
  const productsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
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
    if (!action) {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (action.startsWith('http')) {
      window.open(action, '_blank', 'noopener,noreferrer');
    } else if (action === 'shop') {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Treat as category id
      setActiveCategory(action);
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory) list = list.filter((p) => p.category_id === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, activeCategory, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 page-enter">

      {/* ── Banner carousel ──────────────────────────────────────────────── */}
      {!loading && banners.length > 0 ? (
        <div className="mb-8 animate-fade-in-up">
          <BannerCarousel banners={banners} onAction={handleCTA} />
        </div>
      ) : !loading && banners.length === 0 ? (
        /* Fallback hero when no banners configured */
        <div className="relative bg-gradient-to-br from-odoo-primary via-odoo-primary to-odoo-primary-light rounded-2xl p-6 lg:p-10 text-white mb-8 overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block animate-float opacity-20 pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />Prix dégressifs sur les achats en gros
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Achetez plus, économisez plus.</h1>
            <p className="text-white/80 max-w-xl text-sm">
              Découvrez notre catalogue avec des prix dégressifs. Commandez en ligne et faites-vous livrer rapidement.
            </p>
          </div>
        </div>
      ) : (
        /* Skeleton while loading */
        <div className="w-full bg-odoo-border/50 rounded-2xl animate-pulse mb-8" style={{ height: 'clamp(220px, 45vw, 520px)' }} />
      )}

      {/* ── Promotions strip ─────────────────────────────────────────────── */}
      {promotions.length > 0 && (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">Offres du moment</h2>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{promotions.length}</span>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {promotions.map((promo, i) => (
              <PromotionCard key={promo.id} promo={promo} index={i} onAction={handleCTA} />
            ))}
          </div>
        </div>
      )}

      {/* ── Search + Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-odoo-muted pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..."
            className="input pl-9 focus:shadow-md" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="input lg:w-52">
          <option value="recent">Plus récents</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="name">Nom (A-Z)</option>
        </select>
      </div>

      {/* ── Category pills ───────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5">
        {[{ id: null, name: 'Tout' }, ...categories].map((cat, i) => (
          <button key={cat.id ?? 'all'} onClick={() => setActiveCategory(cat.id)}
            style={{ animationDelay: `${i * 35}ms` }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap animate-fade-in-up ${
              activeCategory === cat.id
                ? 'bg-odoo-primary border-odoo-primary text-white shadow-md shadow-odoo-primary/25'
                : 'bg-white border-odoo-border hover:border-odoo-primary hover:shadow-sm'
            }`}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Category cards ───────────────────────────────────────────────── */}
      {!activeCategory && !search && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
          {categories.map((cat, i) => (
            <StaggerItem key={cat.id} index={i}>
              <button onClick={() => setActiveCategory(cat.id)}
                className="group w-full bg-white border border-odoo-border rounded-xl p-3 text-left
                           hover:border-odoo-primary/50 hover:shadow-lg hover:shadow-odoo-primary/10
                           hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-odoo-surface mb-2">
                  {cat.image_url
                    ? <LazyImage src={cat.image_url} alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><Package2 className="w-8 h-8 text-odoo-muted" /></div>}
                </div>
                <p className="font-medium text-sm truncate">{cat.name}</p>
                <p className="text-xs text-odoo-muted">{products.filter((p) => p.category_id === cat.id).length} produits</p>
              </button>
            </StaggerItem>
          ))}
        </div>
      )}

      {/* ── Product grid ─────────────────────────────────────────────────── */}
      <div ref={productsSectionRef}>
        {activeCategory || search ? (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-sm text-odoo-muted">
              {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
              {activeCategory && ` — ${categories.find((c) => c.id === activeCategory)?.name ?? ''}`}
              {search && ` pour "${search}"`}
            </h2>
            {(activeCategory || search) && (
              <button onClick={() => { setActiveCategory(null); setSearch(''); }}
                className="text-xs text-odoo-primary hover:underline">
                Effacer
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-odoo-primary" />
            <h2 className="font-semibold">Tous les produits</h2>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card animate-fade-in-scale">
            <AlertCircle className="w-10 h-10 text-odoo-muted mx-auto mb-3" />
            <p className="font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-odoo-muted mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <StaggerItem key={product.id} index={i % 8}>
                <ProductCard product={product}
                  onView={() => setView({ kind: 'product', id: product.id })}
                  onAdd={() => addToCart(product)} />
              </StaggerItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

export function ProductCard({ product, onView, onAdd }: { product: Product; onView: () => void; onAdd: () => void }) {
  const hasBulk = product.bulk_quantity > 0 && product.bulk_price > 0;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock <= product.low_stock_threshold && !isOutOfStock;
  const isNew = Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();
  const ripple = useRipple();
  const firstImage = parseImages(product.image_url)[0] ?? null;

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    if (isOutOfStock) return;
    ripple(e);
    onAdd();
    setJustAdded(true);
    toast(`${product.name} ajouté au panier`, 'success');
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="product-card h-full will-transform group/card">
      <button onClick={onView}
        className="block aspect-square w-full bg-odoo-surface overflow-hidden relative focus:outline-none">
        {firstImage ? (
          <LazyImage src={firstImage} alt={product.name}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
            fallback={<div className="w-full h-full flex items-center justify-center bg-odoo-surface"><Package2 className="w-12 h-12 text-odoo-muted" /></div>} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package2 className="w-12 h-12 text-odoo-muted" /></div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasBulk && (
            <span className="badge bg-odoo-success text-white shadow-sm text-[10px] px-1.5 py-0.5">
              <Tag className="w-2.5 h-2.5 mr-1" />Lot
            </span>
          )}
          {isNew && !isOutOfStock && (
            <span className="badge bg-odoo-primary text-white shadow-sm text-[10px] px-1.5 py-0.5">
              <Sparkles className="w-2.5 h-2.5 mr-1" />Nouveau
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center backdrop-blur-[1px]">
            <span className="badge bg-odoo-danger text-white shadow-sm">Rupture</span>
          </div>
        )}
        <div className="absolute inset-0 bg-odoo-dark/0 group-hover/card:bg-odoo-dark/5 transition-colors duration-300" />
      </button>

      <div className="p-3 flex flex-col flex-1">
        <button onClick={onView} className="text-left group/name focus:outline-none">
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover/name:text-odoo-primary transition-colors duration-150">
            {product.name}
          </h3>
        </button>
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="font-bold text-odoo-primary">{formatPrice(product.price)}</span>
            {hasBulk && <span className="text-xs text-odoo-muted">lot: {formatPrice(product.bulk_price)}</span>}
          </div>
          {isLowStock && (
            <p className="text-xs text-odoo-warning font-medium mb-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-odoo-warning animate-pulse" />
              Stock: {product.stock}
            </p>
          )}
          <button onClick={handleAdd} disabled={isOutOfStock}
            className={`w-full relative overflow-hidden inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              justAdded
                ? 'bg-odoo-success text-white scale-95'
                : isOutOfStock
                  ? 'bg-odoo-muted/20 text-odoo-muted cursor-not-allowed'
                  : 'bg-odoo-primary hover:bg-odoo-primary-dark active:scale-95 text-white shadow-sm hover:shadow-md hover:shadow-odoo-primary/30'
            }`}>
            {justAdded
              ? <><CheckCircle2 className="w-3.5 h-3.5 animate-success-pop" />Ajouté !</>
              : isOutOfStock
                ? 'Indisponible'
                : <><Plus className="w-3.5 h-3.5" />Ajouter</>}
          </button>
        </div>
      </div>
    </div>
  );
}
