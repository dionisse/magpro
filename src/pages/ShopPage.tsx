import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Tag, Package2, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, ArrowRight, Flame, Sparkles,
  Truck, RotateCcw, ShieldCheck, Headphones, ShoppingCart, X, ArrowLeft,
  Percent, TrendingUp, LayoutGrid, PhoneCall, MessageCircle, Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, parseImages } from '../lib/format';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import type { Banner, Category, Product, Promotion } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { SkeletonCard, StaggerItem, useRipple, useToast, SectionHeader, EmptyState } from '../components/ui';
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

  if (!remaining) return <span className="text-[11px] font-semibold opacity-70">Offre terminée</span>;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-[11px] font-bold">
      <Clock className="w-3 h-3 opacity-70 flex-shrink-0" />
      {remaining.d > 0 && <span className="bg-black/35 backdrop-blur-sm px-1.5 py-1 rounded-md tabular-nums">{remaining.d}j</span>}
      <span className="bg-black/35 backdrop-blur-sm px-1.5 py-1 rounded-md tabular-nums">{pad(remaining.h)}h</span>
      <span className="bg-black/35 backdrop-blur-sm px-1.5 py-1 rounded-md tabular-nums">{pad(remaining.m)}m</span>
      <span className="bg-black/35 backdrop-blur-sm px-1.5 py-1 rounded-md tabular-nums text-brand-accent">{pad(remaining.s)}s</span>
    </div>
  );
}

// ─── Banner carousel ──────────────────────────────────────────────────────────

function BannerCarousel({ banners, onAction, storeName }: {
  banners: Banner[];
  onAction: (a: string | null) => void;
  storeName?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % banners.length), 5500);
    return () => clearInterval(id);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;
  const b = banners[active];
  const go = (i: number) => { setActive(((i % banners.length) + banners.length) % banners.length); setPaused(true); };

  /* Certaines boutiques téléversent des affiches publicitaires : image carrée ou
     verticale, texte déjà incrusté dans le visuel. Affichée en fond plein cadre,
     une affiche est rognée et son texte entre en collision avec celui de
     l'interface. Ces visuels sont donc présentés à côté du texte, dans un cadre
     qui respecte leur format ; les bannières panoramiques gardent la mise en
     page plein cadre. */
  const poster = ratio !== null && ratio < 1.5;
  const posterAspect = Math.min(Math.max(ratio ?? 1.3, 0.7), 1.9);

  /* Mesure le format de la première bannière (sans l'afficher) pour choisir la mise en page. */
  const measure = (
    <img src={banners[0].image_url} alt="" aria-hidden className="hidden"
      onLoad={(e) => {
        const el = e.currentTarget;
        if (el.naturalWidth && el.naturalHeight) setRatio(el.naturalWidth / el.naturalHeight);
      }} />
  );

  const badge = (
    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-[0.14em] animate-fade-in-up">
      <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
      {b.title ? 'En vedette' : (b.subtitle ? 'Nouveauté' : 'Boutique')}
    </span>
  );

  const actions = (
    <div className="mt-7 flex flex-wrap items-center gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      {b.cta_text && (
        <button onClick={() => onAction(b.cta_action)}
          className="group inline-flex items-center gap-2.5 bg-brand-accent text-brand-ink font-bold px-6 sm:px-7 py-3.5 rounded-full text-sm
                     shadow-[0_18px_40px_-16px_rgba(233,164,0,0.9)] hover:bg-white hover:-translate-y-0.5
                     transition-all duration-300 active:scale-95">
          {b.cta_text}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
      <button onClick={() => onAction(null)}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white
                   border border-white/25 bg-white/5 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
        Voir le catalogue
      </button>
    </div>
  );

  const guarantees = (
    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-semibold text-white/70 animate-fade-in-up"
      style={{ animationDelay: '260ms' }}>
      <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4 text-brand-accent" />Livraison rapide</span>
      <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-accent" />Paiement sécurisé</span>
      <span className="inline-flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-brand-accent" />Retour 7 jours</span>
    </div>
  );

  const dots = banners.length > 1 && (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-black/25 backdrop-blur-md border border-white/10">
      {banners.map((_, i) => (
        <button key={i} onClick={() => go(i)} aria-label={`Aller à la bannière ${i + 1}`}
          className={`rounded-full transition-all duration-500 ${i === active ? 'bg-brand-accent w-8 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`} />
      ))}
    </div>
  );

  const progress = (
    <div className="absolute bottom-0 inset-x-0 z-30 h-1 bg-white/10 overflow-hidden">
      {!paused && (
        <span key={active} className="block h-full bg-brand-accent animate-progress" style={{ animationDuration: '5500ms' }} />
      )}
    </div>
  );

  if (poster) {
    return (
      <section className="relative isolate overflow-hidden bg-brand-primary"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="absolute inset-0 bg-mesh-navy" aria-hidden />
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-brand-accent/10 blur-3xl" aria-hidden />
        {measure}

        <div className="relative shell py-10 lg:py-14 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="min-w-0">
            {badge}
            <h1 className="mt-5 text-[2.1rem] sm:text-5xl lg:text-[3.4rem] font-extrabold text-white leading-[1.05] tracking-tight text-balance animate-fade-in-up"
              style={{ animationDelay: '70ms' }}>
              {b.title || storeName || 'Notre sélection'}
            </h1>
            {b.subtitle && (
              <p className="mt-4 text-base sm:text-lg text-white/75 max-w-lg leading-relaxed animate-fade-in-up"
                style={{ animationDelay: '140ms' }}>
                {b.subtitle}
              </p>
            )}
            {actions}
            {guarantees}
            {dots && <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>{dots}</div>}
          </div>

          <div className="relative">
            <div className="relative rounded-[28px] overflow-hidden shadow-lift ring-1 ring-white/15 bg-brand-primary-dark"
              style={{ aspectRatio: String(posterAspect) }}>
              {banners.map((banner, i) => (
                <div key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  <img src={banner.image_url} alt={banner.title ?? ''} loading={i === 0 ? 'eager' : 'lazy'}
                    className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ))}
              {banners.length > 1 && (
                <>
                  <button onClick={() => go(active - 1)} aria-label="Bannière précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-10 h-10 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md text-white border border-white/20 transition-all hover:scale-105">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => go(active + 1)} aria-label="Bannière suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-10 h-10 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md text-white border border-white/20 transition-all hover:scale-105">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {progress}
      </section>
    );
  }

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-brand-primary"
      style={{ height: 'clamp(430px, 74vh, 760px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {measure}
      {banners.map((banner, i) => (
        <div key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={banner.image_url} alt={banner.title ?? ''} loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[9000ms] ease-out"
            style={{ transform: i === active ? 'scale(1.06)' : 'scale(1)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-dark/90 via-brand-primary-dark/60 to-brand-primary-dark/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-dark/70 via-transparent to-transparent" />
        </div>
      ))}

      {/* Decorative accent glow */}
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" aria-hidden />

      <div className="absolute inset-0 z-20 flex items-center">
        <div className="shell w-full">
          <div className="max-w-2xl" key={active}>
            {badge}
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-[0.14em] animate-fade-in-up">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              {b.title ? 'En vedette' : (b.subtitle ? 'Nouveauté' : 'Boutique')}
            </span>

            {b.title && (
              <h1 className="mt-5 text-[2.4rem] sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.02] tracking-tight text-balance animate-fade-in-up"
                style={{ animationDelay: '70ms' }}>
                {b.title}
              </h1>
            )}
            {b.subtitle && (
              <p className="mt-5 text-base sm:text-lg text-white/80 max-w-lg leading-relaxed animate-fade-in-up"
                style={{ animationDelay: '140ms' }}>
                {b.subtitle}
              </p>
            )}
            {actions}
            {guarantees}

            <div className="mt-7 flex flex-wrap items-center gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {b.cta_text && (
                <button onClick={() => onAction(b.cta_action)}
                  className="group inline-flex items-center gap-2.5 bg-brand-accent text-brand-ink font-bold px-6 sm:px-7 py-3.5 rounded-full text-sm
                             shadow-[0_18px_40px_-16px_rgba(233,164,0,0.9)] hover:bg-white hover:-translate-y-0.5
                             transition-all duration-300 active:scale-95">
                  {b.cta_text}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button onClick={() => onAction(null)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white
                           border border-white/25 bg-white/5 backdrop-blur-md hover:bg-white/15 transition-all duration-300">
                Voir le catalogue
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-semibold text-white/70 animate-fade-in-up"
              style={{ animationDelay: '260ms' }}>
              <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4 text-brand-accent" />Livraison rapide</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-accent" />Paiement sécurisé</span>
              <span className="inline-flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-brand-accent" />Retour 7 jours</span>
            </div>
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={() => go(active - 1)}
          <button onClick={() => { setActive((i) => (i === 0 ? banners.length - 1 : i - 1)); setPaused(true); }}
            aria-label="Bannière précédente"
            className="hidden sm:grid absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 place-items-center transition-all hover:scale-110">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(active + 1)}
          <button onClick={() => { setActive((i) => (i + 1) % banners.length); setPaused(true); }}
            aria-label="Bannière suivante"
            className="hidden sm:grid absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 place-items-center transition-all hover:scale-110">
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30">
            {dots}
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-black/25 backdrop-blur-md border border-white/10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => { setActive(i); setPaused(true); }} aria-label={`Aller à la bannière ${i + 1}`}
                className={`rounded-full transition-all duration-500 ${i === active ? 'bg-brand-accent w-8 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`} />
            ))}
          </div>

          <div className="absolute bottom-0 inset-x-0 z-30 h-1 bg-white/10 overflow-hidden">
            {!paused && (
              <span key={active} className="block h-full bg-brand-accent animate-progress" style={{ animationDuration: '5500ms' }} />
            )}
          </div>
        </>
      )}
      {progress}
    </section>
  );
}

// ─── Service strip ────────────────────────────────────────────────────────────

function TrustBar() {
  const features = [
    { icon: Truck,        title: 'Livraison rapide',    desc: 'Dans toute la ville',            tone: 'bg-brand-primary text-white' },
    { icon: RotateCcw,    title: 'Retours faciles',     desc: '7 jours pour changer',           tone: 'bg-brand-accent text-brand-ink' },
    { icon: ShieldCheck,  title: 'Paiement sécurisé',   desc: 'Mobile Money & espèces',         tone: 'bg-brand-success text-white' },
    { icon: Headphones,   title: 'Assistance client',   desc: 'Réponse rapide par WhatsApp',    tone: 'bg-brand-info text-white' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {features.map(({ icon: Icon, title, desc, tone }, i) => (
        <StaggerItem key={title} index={i}>
          <div className="group h-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-brand-border/90 shadow-soft
                          transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-brand-primary/20">
            <span className={`grid place-items-center w-12 h-12 rounded-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${tone}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-bold text-[15px] text-brand-ink">{title}</p>
              <p className="text-xs text-brand-muted mt-0.5">{desc}</p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </div>
  );
}

// ─── Category rail ────────────────────────────────────────────────────────────

function CategorySection({ categories, products, onSelect }: {
  categories: Category[];
  products: Product[];
  onSelect: (id: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="mb-14">
      <SectionHeader
        eyebrow="Nos catégories"
        title="Parcourez nos rayons"
        description="Trouvez rapidement ce que vous cherchez en parcourant nos rayons."
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-5">
        {categories.map((cat, i) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          const hasImage = !!cat.image_url;
          return (
            <StaggerItem key={cat.id} index={i} className="h-full">
              <button
                onClick={() => onSelect(cat.id)}
                className="group flex flex-col items-center gap-3 w-full focus:outline-none"
              >
                <span className="relative block w-full aspect-square rounded-full overflow-hidden bg-brand-surface
                                 ring-1 ring-brand-border shadow-soft transition-all duration-300
                                 group-hover:ring-2 group-hover:ring-brand-accent group-hover:shadow-lift group-hover:-translate-y-1">
                  {hasImage ? (
                    <img src={cat.image_url} alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-spring" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-primary/10 to-brand-accent/15">
                      <Package2 className="w-8 h-8 text-brand-primary/45" />
                    </span>
                  )}
                  <span className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-colors duration-300" />
                </span>
                <span className="text-center">
                  <span className="block text-[13px] font-bold text-brand-ink leading-tight group-hover:text-brand-primary transition-colors">
                    {cat.name}
                  </span>
                  <span className="block text-[11px] text-brand-muted mt-0.5">{count} article{count !== 1 ? 's' : ''}</span>
                </span>
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
  yellow: 'bg-brand-accent text-brand-ink',
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
    <button
      className="group relative flex-shrink-0 w-[280px] sm:w-[340px] h-[220px] rounded-3xl overflow-hidden text-left
                 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-1.5"
      onClick={() => onAction(promo.cta_action)}
    >
      {promo.image_url ? (
        <>
          <img src={promo.image_url} alt={promo.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-spring" />
          <span className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-black/15" />
        </>
      ) : (
        <span className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      <span className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl" aria-hidden />

      {promo.badge_text && (
        <span className={`absolute top-4 left-4 z-10 ${badgeStyle} text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-lg tracking-wide uppercase`}>
          {promo.badge_text}
        </span>
      )}

      <span className="absolute inset-0 z-10 p-5 flex flex-col justify-end">
        <span className="font-display font-extrabold text-white text-xl leading-tight drop-shadow">{promo.title}</span>
        {promo.subtitle && <span className="text-white/75 text-xs mt-1.5 line-clamp-2">{promo.subtitle}</span>}
        {promo.ends_at && <span className="mt-2.5 text-white block"><Countdown endsAt={promo.ends_at} /></span>}
        <span className="mt-3.5 inline-flex items-center gap-1.5 text-white text-xs font-bold bg-white/15 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full">
          {promo.cta_text || 'Voir l\'offre'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </span>
    </button>
  );
}

// ─── Category product row ─────────────────────────────────────────────────────

function CategoryProductsSection({ category, products, onView, onAdd, onSeeAll }: {
  category: Category;
  products: Product[];
  onView: (id: string) => void;
  onAdd: (product: Product) => void;
  onSeeAll: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scrollBy(dir: 1 | -1) {
    scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  return (
    <section className="mb-14">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          {category.image_url ? (
            <span className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-soft ring-1 ring-brand-border">
              <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
            </span>
          ) : (
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-primary/[0.08] text-brand-primary flex-shrink-0">
              <Package2 className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold text-brand-ink leading-tight truncate">{category.name}</h2>
            <p className="text-xs text-brand-muted mt-0.5">{products.length} produit{products.length !== 1 ? 's' : ''} disponible{products.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => scrollBy(-1)} aria-label="Précédent"
            className="hidden lg:grid place-items-center w-10 h-10 rounded-full bg-white border border-brand-border text-brand-ink hover:border-brand-primary hover:text-brand-primary transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scrollBy(1)} aria-label="Suivant"
            className="hidden lg:grid place-items-center w-10 h-10 rounded-full bg-white border border-brand-border text-brand-ink hover:border-brand-primary hover:text-brand-primary transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onSeeAll}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-brand-border text-[13px] font-bold text-brand-ink hover:border-brand-primary hover:text-brand-primary hover:shadow-soft transition-all">
            Voir tout
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div ref={scroller}
        className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible sm:pb-0">
        {products.slice(0, 5).map((product, i) => (
          <div key={product.id} className="flex-shrink-0 w-[180px] sm:w-auto">
            <StaggerItem index={i} className="h-full">
              <ProductCard
                product={product}
                onView={() => onView(product.id)}
                onAdd={() => onAdd(product)}
              />
            </StaggerItem>
          </div>
        ))}
        {products.length > 5 && (
          <button onClick={onSeeAll}
            className="flex-shrink-0 w-[180px] sm:w-auto min-h-[220px] rounded-2xl border-2 border-dashed border-brand-border
                       hover:border-brand-primary hover:bg-white transition-all duration-200 grid place-items-center group">
            <span className="text-center">
              <span className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-brand-primary/[0.08] group-hover:bg-brand-primary group-hover:text-white text-brand-primary transition-colors mb-3">
                <ArrowRight className="w-5 h-5" />
              </span>
              <span className="block text-[13px] font-bold text-brand-primary">+{products.length - 5} autres</span>
              <span className="block text-[11px] text-brand-muted mt-0.5">Voir le rayon</span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

export function ProductCard({ product, onView, onAdd }: {
  product: Product;
  onView: () => void;
  onAdd: () => void;
}) {
  const isOutOfStock = product.track_stock && product.stock === 0;
  const isLowStock = product.track_stock && product.stock > 0 && product.stock <= product.low_stock_threshold;
  const isNew = Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const hasBulk = product.bulk_quantity > 0 && product.bulk_price > 0;
  const bulkDiscount = hasBulk && product.price > 0
    ? Math.round((1 - product.bulk_price / product.price) * 100)
    : 0;
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();
  const ripple = useRipple();
  const firstImage = parseImages(product.image_url)[0] ?? null;
  const secondImage = parseImages(product.image_url)[1] ?? null;

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
    <div className="group product-card h-full">
      {/* Image */}
      <button onClick={onView} className="relative block w-full aspect-[4/5] overflow-hidden bg-brand-surface tap-none" aria-label={product.name}>
        {firstImage ? (
          <>
            <img src={firstImage} alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-spring ${secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.07]'}`} />
            {secondImage && (
              <img src={secondImage} alt="" aria-hidden
                className="absolute inset-0 w-full h-full object-cover opacity-0 scale-[1.04] transition-all duration-700 ease-spring group-hover:opacity-100 group-hover:scale-100" />
            )}
          </>
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-surface-2 to-brand-surface">
            <Package2 className="w-10 h-10 text-brand-muted/40" />
          </span>
        )}

        {/* Badges */}
        <span className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
          {isNew && !isOutOfStock && (
            <span className="badge bg-brand-primary text-white uppercase tracking-[0.12em] shadow-soft">
              <Sparkles className="w-3 h-3 text-brand-accent" />Nouveau
            </span>
          )}
          {hasBulk && bulkDiscount > 0 && (
            <span className="badge bg-brand-danger text-white shadow-soft">
              <Percent className="w-3 h-3" />-{bulkDiscount}% dès {product.bulk_quantity}
            </span>
          )}
          {!hasBulk && !isNew && !isOutOfStock && isLowStock && (
            <span className="badge bg-brand-warning text-white shadow-soft">
              Stock limité
            </span>
          )}
        </span>

        {isLowStock && !isOutOfStock && hasBulk && (
          <span className="absolute top-3 right-3 z-10 badge bg-white/90 backdrop-blur text-brand-warning shadow-soft">
            Plus que {product.stock}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[2px] grid place-items-center">
            <span className="bg-brand-ink text-white text-xs font-bold px-4 py-2 rounded-full">Rupture de stock</span>
          </span>
        )}

        {/* Hover hint */}
        <span className="absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-spring
                         bg-brand-ink/85 backdrop-blur-sm text-white text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5">
          Voir le produit <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4">
        <button onClick={onView} className="text-left">
          <h3 className="font-semibold text-[13.5px] text-brand-ink line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
        </button>

        <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
          <span className="font-display text-lg font-extrabold text-brand-primary">{formatPrice(product.price)}</span>
          {hasBulk && (
            <span className="text-[11px] font-bold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded-md">
              {formatPrice(product.bulk_price)} dès {product.bulk_quantity} pcs
            </span>
          )}
        </div>

        {product.track_stock && !isOutOfStock && (
          <p className="mt-1.5 text-[11px] font-medium text-brand-muted flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-brand-warning animate-pulse-soft' : 'bg-brand-success'}`} />
            {isLowStock ? `${product.stock} en stock — dernière chance` : 'En stock'}
          </p>
        )}

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`group/btn relative mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold
            transition-all duration-200 overflow-hidden
            ${isOutOfStock
              ? 'bg-brand-surface text-brand-muted cursor-not-allowed'
              : justAdded
                ? 'bg-brand-success text-white'
                : 'bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-ink shadow-[0_10px_22px_-14px_rgba(11,44,77,0.9)]'
            }`}
        >
          {justAdded
            ? <><CheckCircle2 className="w-4 h-4 animate-success-pop" />Ajouté !</>
            : isOutOfStock
              ? 'Indisponible'
              : <><ShoppingCart className="w-4 h-4" />Ajouter au panier</>}
        </button>
      </div>
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
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');
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
    if (activeSubcategory) {
      list = list.filter((p) => p.category_id === activeSubcategory);
    } else if (activeCategory) {
      const childIds = categories.filter((c) => c.parent_id === activeCategory).map((c) => c.id);
      list = list.filter((p) => p.category_id === activeCategory || childIds.includes(p.category_id ?? ''));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, categories, activeCategory, activeSubcategory, search, sortBy]);

  const rootCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const activeCategoryName = activeCategory
    ? categories.find((c) => c.id === activeCategory)?.name
    : null;
  const activeSubcategoryName = activeSubcategory
    ? categories.find((c) => c.id === activeSubcategory)?.name
    : null;
  const subcategories = activeCategory
    ? categories.filter((c) => c.parent_id === activeCategory)
    : [];

  const isFiltering = !!(activeCategory || search);
  const hasDeals = promotions.length > 0;

  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="w-full bg-brand-primary relative overflow-hidden" style={{ height: 'clamp(430px, 74vh, 760px)' }}>
          <div className="absolute inset-0 bg-mesh-navy" />
          <div className="shell relative h-full flex flex-col justify-center gap-4">
            <div className="h-8 w-40 rounded-full bg-white/10" />
            <div className="h-14 w-2/3 max-w-lg rounded-2xl bg-white/10" />
            <div className="h-4 w-1/2 max-w-sm rounded-full bg-white/10" />
            <div className="h-12 w-44 rounded-full bg-white/10" />
          </div>
        </div>
      ) : banners.length > 0 ? (
        <BannerCarousel banners={banners} onAction={handleCTA} storeName={settings.store_name} />
        <BannerCarousel banners={banners} onAction={handleCTA} />
      ) : settings.hero_style === 'none' ? null : (
        <section className="relative overflow-hidden bg-brand-primary" style={{ height: 'clamp(430px, 74vh, 760px)' }}>
          <div className="absolute inset-0 bg-mesh-navy" />
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-brand-accent/10 blur-3xl animate-float-slow" aria-hidden />
          <div className="absolute bottom-0 left-0 w-72 h-72 -ml-20 -mb-20 rounded-full bg-brand-accent/10 blur-3xl" aria-hidden />

          <div className="shell relative h-full flex items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-[0.14em]">
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" />Bienvenue chez {settings.store_name || 'MagasinPro'}
              </span>
              <h1 className="mt-5 text-[2.5rem] sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.02] tracking-tight">
                Qualité<br /><span className="text-brand-accent">garantie.</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/75 max-w-lg leading-relaxed">
                Découvrez notre catalogue, profitez de prix dégressifs sur les lots et d'une livraison rapide partout en ville.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={() => productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-2.5 bg-brand-accent text-brand-ink font-bold px-7 py-3.5 rounded-full text-sm
                             shadow-[0_18px_40px_-16px_rgba(233,164,0,0.9)] hover:bg-white hover:-translate-y-0.5 transition-all duration-300">
                  Explorer le catalogue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                {rootCategories.length > 0 && (
                  <button onClick={() => productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white border border-white/25 bg-white/5 backdrop-blur-md hover:bg-white/15 transition-all">
                    <LayoutGrid className="w-4 h-4" />{rootCategories.length} rayons
                  </button>
                )}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-semibold text-white/70">
                <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4 text-brand-accent" />Livraison rapide</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-accent" />Mobile Money accepté</span>
                <span className="inline-flex items-center gap-1.5"><Tag className="w-4 h-4 text-brand-accent" />Prix de gros</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="shell">

        {/* ── Services ────────────────────────────────────────────────────── */}
        <div className="relative z-20 -mt-6 sm:-mt-10 mb-12">
          <TrustBar />
        </div>

        {/* ── Categories ─────────────────────────────────────────────────── */}
        {!activeCategory && !search && (
          <CategorySection categories={rootCategories.length > 0 ? rootCategories : categories} products={products} onSelect={(id) => {
            setActiveCategory(id);
            productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }} />
        )}

        {/* ── Deals ──────────────────────────────────────────────────────── */}
        {hasDeals && !activeCategory && !search && (
          <section className="mb-14">
            <SectionHeader
              eyebrow="Offres du moment"
              title={<><Flame className="w-7 h-7 text-brand-danger" />Bons plans à saisir</>}
              description="Promotions et offres spéciales disponibles dès maintenant."
            />
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
              {promotions.map((promo, i) => (
                <PromotionCard key={promo.id} promo={promo} index={i} onAction={handleCTA} />
              ))}
            </div>
          </section>
        )}

        {/* ── Catalogue ──────────────────────────────────────────────────── */}
        <section ref={productsSectionRef} className="pb-20 pt-2">

          {/* Sticky toolbar */}
          <div className="sticky top-[68px] z-30 -mx-4 px-4 sm:mx-0 sm:px-0 pt-3 pb-4 bg-white/90 backdrop-blur-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="hidden lg:block min-w-0">
                  <p className="eyebrow mb-1">
                    <span className="w-5 h-px bg-brand-accent" aria-hidden />
                    {activeSubcategoryName ? activeCategoryName : activeCategoryName ? 'Rayon' : search ? 'Recherche' : 'Catalogue'}
                  </p>
                  <h2 className="section-title truncate">
                    {activeSubcategoryName ?? activeCategoryName ?? (search ? `« ${search} »` : 'Tous les produits')}
                  </h2>
                </div>


          {/* Sticky toolbar */}
          <div className="sticky top-[68px] z-30 -mx-4 px-4 sm:mx-0 sm:px-0 pt-3 pb-4 bg-white/90 backdrop-blur-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="hidden lg:block min-w-0">
                  <p className="eyebrow mb-1">
                    <span className="w-5 h-px bg-brand-accent" aria-hidden />
                    {activeSubcategoryName ? activeCategoryName : activeCategoryName ? 'Rayon' : search ? 'Recherche' : 'Catalogue'}
                  </p>
                  <h2 className="section-title truncate">
                    {activeSubcategoryName ?? activeCategoryName ?? (search ? `« ${search} »` : 'Tous les produits')}
                  </h2>
                </div>

                <div className="flex-1 flex items-center gap-2 sm:gap-3 lg:justify-end">
                  <div className="relative flex-1 lg:max-w-sm">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher un produit…"
                      aria-label="Rechercher un produit"
                      className="input pl-10 pr-9 rounded-full"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} aria-label="Effacer la recherche"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-brand-muted hover:bg-brand-surface hover:text-brand-ink transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative hidden sm:block">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      aria-label="Trier les produits"
                      className="select rounded-full pr-10 font-semibold text-[13px] w-[170px]"
                    >
                      <option value="recent">Trier : Nouveautés</option>
                      <option value="price-asc">Prix croissant</option>
                      <option value="price-desc">Prix décroissant</option>
                      <option value="name">Nom (A → Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category pills */}
              {(rootCategories.length > 0 || isFiltering) && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  <button
                    onClick={() => { setActiveCategory(null); setActiveSubcategory(null); }}
                    className={!activeCategory ? 'chip-active' : 'chip'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />Tout
                  </button>
                  {rootCategories.map((cat) => (
                    <button key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); setActiveSubcategory(null); }}
                      className={activeCategory === cat.id ? 'chip-active' : 'chip'}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {isFiltering && (
                    <button
                      onClick={() => { setActiveCategory(null); setActiveSubcategory(null); setSearch(''); }}
                      className="chip border-brand-danger/30 text-brand-danger hover:border-brand-danger hover:text-brand-danger"
                    >
                      <X className="w-3.5 h-3.5" />Réinitialiser
                    </button>
                  )}
                </div>
              )}

              {/* Mobile title */}
              <div className="lg:hidden">
                <h2 className="font-display text-xl font-extrabold text-brand-ink truncate">
                  {activeSubcategoryName ?? activeCategoryName ?? (search ? `« ${search} »` : 'Tous les produits')}
                </h2>
              </div>
            </div>
          </div>

          {/* Subcategory chips */}
          {subcategories.length > 0 && !activeSubcategory && (
            <div className="flex flex-wrap gap-2 mb-6 mt-2">
              {subcategories.map((sub) => {
                const count = products.filter((p) => p.category_id === sub.id).length;
                return (
                  <button key={sub.id} onClick={() => setActiveSubcategory(sub.id)}
                    className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold bg-brand-surface text-brand-ink
                               border border-transparent hover:border-brand-primary/30 hover:bg-white transition-all">
                    {sub.name}
                    <span className="text-[11px] font-bold text-brand-muted group-hover:text-brand-primary">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
          {activeSubcategory && (
            <button onClick={() => setActiveSubcategory(null)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-muted hover:text-brand-primary transition mb-6 mt-2">
              <ArrowLeft className="w-4 h-4" />Toutes les sous-catégories
            </button>
          )}

          {/* Results count */}
          {!loading && isFiltering && (
            <p className="text-sm text-brand-muted mb-5">
              <span className="font-bold text-brand-ink">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
            </p>
          )}

          {/* ── Unfiltered: grouped by category ───────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !isFiltering ? (
            (() => {
              const allChildIds = new Set(categories.filter((c) => c.parent_id).map((c) => c.id));
              const sectionsToShow = rootCategories
                .map((cat) => {
                  const childIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id);
                  const catProducts = filtered.filter(
                    (p) => p.category_id === cat.id || childIds.includes(p.category_id ?? ''),
                  );
                  return { cat, catProducts };
                })
                .filter(({ catProducts }) => catProducts.length > 0);

              const uncategorised = filtered.filter(
                (p) => !p.category_id || allChildIds.has(p.category_id)
                  ? false
                  : !rootCategories.some((rc) => {
                      const childIds = categories.filter((c) => c.parent_id === rc.id).map((c) => c.id);
                      return p.category_id === rc.id || childIds.includes(p.category_id ?? '');
                    }),
              );

              return (
                <>
                  {sectionsToShow.map(({ cat, catProducts }) => (
                    <CategoryProductsSection
                      key={cat.id}
                      category={cat}
                      products={catProducts}
                      onView={(id) => setView({ kind: 'product', id })}
                      onAdd={(product) => addToCart(product)}
                      onSeeAll={() => { setActiveCategory(cat.id); setActiveSubcategory(null); productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                    />
                  ))}

                  {uncategorised.length > 0 && (
                    <section className="mb-14">
                      <SectionHeader eyebrow="Sans rayon" title="Autres produits" description={`${uncategorised.length} produit${uncategorised.length !== 1 ? 's' : ''} à découvrir`} />
                      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                        {uncategorised.map((product, i) => (
                          <StaggerItem key={product.id} index={i % 8} className="h-full">
                            <ProductCard
                              product={product}
                              onView={() => setView({ kind: 'product', id: product.id })}
                              onAdd={() => addToCart(product)}
                            />
                          </StaggerItem>
                        ))}
                      </div>
                    </section>
                  )}

                  {sectionsToShow.length === 0 && uncategorised.length === 0 && (
                    <EmptyState
                      icon={<Package2 className="w-8 h-8 text-brand-primary/60" />}
                      title="Catalogue en préparation"
                      description="Aucun produit n'est disponible pour le moment. Revenez très bientôt !"
                    />
                  )}
                </>
              );
            })()
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<AlertCircle className="w-8 h-8 text-brand-warning" />}
              title="Aucun résultat"
              description="Essayez un autre mot-clé ou explorez l'ensemble du catalogue."
              actionLabel="Voir tout le catalogue"
              onAction={() => { setActiveCategory(null); setActiveSubcategory(null); setSearch(''); }}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {filtered.map((product, i) => (
                <StaggerItem key={product.id} index={i % 8} className="h-full">
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

        {/* ── Help band ──────────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-brand-primary text-white p-7 sm:p-10">
            <div className="absolute inset-0 bg-mesh-navy opacity-95" aria-hidden />
            <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-brand-accent/15 blur-3xl" aria-hidden />
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-7 justify-between">
              <div className="max-w-xl">
                <p className="eyebrow-light mb-2"><Sparkles className="w-3.5 h-3.5" />Un doute ? Un conseil ?</p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  On vous aide à choisir le bon produit
                </h2>
                <p className="text-white/70 text-sm mt-3 leading-relaxed">
                  Commandez par téléphone ou sur WhatsApp : notre équipe vous accompagne, confirme la disponibilité et organise la livraison.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 flex-shrink-0">
                {settings.phone_number && (
                  <a href={`tel:${settings.phone_number}`}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-accent text-brand-ink font-bold text-sm hover:bg-white transition-all hover:-translate-y-0.5">
                    <PhoneCall className="w-4 h-4" />{settings.phone_number}
                  </a>
                )}
                {settings.whatsapp_number && (
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all hover:-translate-y-0.5">
                    <MessageCircle className="w-4 h-4" />WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div className="relative mt-8 grid sm:grid-cols-3 gap-4 text-[12px] font-semibold text-white/75">
              {[
                { icon: TrendingUp, label: 'Prix dégressifs sur les lots' },
                { icon: Star, label: 'Produits sélectionnés avec soin' },
                { icon: Truck, label: 'Livraison organisée avec vous' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2.5">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/10"><Icon className="w-4 h-4 text-brand-accent" /></span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
