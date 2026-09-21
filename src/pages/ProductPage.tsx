import { useEffect, useState } from 'react';
import {
  ArrowLeft, Package2, Tag, Plus, Minus, ShoppingCart,
  MessageCircle, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  ShieldCheck, Truck, RotateCcw, Sparkles, Percent, Store,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, parseImages } from '../lib/format';
import type { Product, ProductOptionGroup, ProductOption } from '../lib/database.types';
import { useCart, getEffectivePrice } from '../contexts/CartContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { LazyImage, useRipple, useToast } from '../components/ui';
import type { View } from '../lib/views';

// ─── Image gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, name, badge }: { images: string[]; name: string; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0);

  // Reset to first image when the list changes
  useEffect(() => { setActive(0); }, [images.join(',')]);

  function prev() { setActive((i) => (i === 0 ? images.length - 1 : i - 1)); }
  function next() { setActive((i) => (i === images.length - 1 ? 0 : i + 1)); }

  if (images.length === 0) {
    return (
      <div className="rounded-3xl overflow-hidden border border-brand-border bg-white shadow-soft">
        <div className="aspect-square w-full bg-brand-surface grid place-items-center">
          <Package2 className="w-20 h-20 text-brand-muted/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:sticky lg:top-24">
      <div className="relative rounded-3xl overflow-hidden border border-brand-border bg-white shadow-soft group">
        <div className="relative aspect-square w-full bg-brand-surface overflow-hidden">
          <LazyImage
            key={images[active]}
            src={images[active]}
            alt={`${name} — photo ${active + 1}`}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-spring"
          />

          {badge && <div className="absolute top-4 left-4 z-10">{badge}</div>}

          {images.length > 1 && (
            <>
              <button onClick={prev} aria-label="Photo précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur text-brand-ink shadow-soft
                           grid place-items-center transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next} aria-label="Photo suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur text-brand-ink shadow-soft
                           grid place-items-center transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-brand-ink/70 backdrop-blur text-white text-[11px] font-bold">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2.5 p-3.5 overflow-x-auto scrollbar-hide bg-white/80">
            {images.map((src, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}
                className={`flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                  i === active
                    ? 'border-brand-primary shadow-[0_10px_24px_-14px_rgba(11,44,77,0.9)] scale-[1.03]'
                    : 'border-brand-border hover:border-brand-primary/50 opacity-70 hover:opacity-100'
                }`}>
                <img src={src} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Option selector ──────────────────────────────────────────────────────────

interface SelectedOptions {
  [groupId: string]: ProductOption;
}

function OptionSelector({
  groups,
  selected,
  trackStock,
  onSelect,
}: {
  groups: ProductOptionGroup[];
  selected: SelectedOptions;
  trackStock: boolean;
  onSelect: (groupId: string, option: ProductOption) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-bold text-brand-ink uppercase tracking-wide">{group.name}</p>
            {selected[group.id] && (
              <span className="text-[11px] font-semibold text-brand-success inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />{selected[group.id].label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(group.product_options ?? []).map((opt) => {
              const isSelected = selected[group.id]?.id === opt.id;
              const isOutOfStock = !trackStock ? false : opt.stock === 0;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onSelect(group.id, opt)}
                  className={`relative flex items-center gap-2 pl-2 pr-3 py-2 rounded-2xl border text-[13px] font-semibold transition-all duration-200 ${
                    isOutOfStock
                      ? 'border-brand-border bg-brand-surface text-brand-muted cursor-not-allowed opacity-60'
                      : isSelected
                        ? 'border-brand-primary bg-brand-primary text-white shadow-[0_10px_24px_-14px_rgba(11,44,77,0.9)]'
                        : 'border-brand-border bg-white text-brand-ink hover:border-brand-primary/50 hover:-translate-y-px hover:shadow-soft'
                  }`}
                >
                  {opt.image_url && (
                    <img
                      src={opt.image_url}
                      alt={opt.label}
                      className={`w-8 h-8 rounded-xl object-cover flex-shrink-0 ${isSelected ? 'ring-2 ring-white/60' : 'ring-1 ring-brand-border'}`}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span>{opt.label}</span>
                  {opt.price_modifier !== 0 && (
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-white/85' : 'text-brand-muted'}`}>
                      {opt.price_modifier > 0 ? '+' : ''}{formatPrice(opt.price_modifier)}
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="absolute -top-2 -right-2 text-[9px] bg-brand-danger text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                      Rupture
                    </span>
                  )}
                  {!isOutOfStock && trackStock && opt.stock <= 5 && (
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-brand-accent' : 'text-brand-warning'}`}>
                      ({opt.stock})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductPage({ id, setView }: { id: string; setView: (v: View) => void }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<SelectedOptions>({});
  const { addToCart } = useCart();
  const { settings } = useStoreSettings();
  const [added, setAdded] = useState(false);
  const { toast } = useToast();
  const ripple = useRipple();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('products').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('product_option_groups')
        .select('*, product_options(*)')
        .eq('product_id', id)
        .order('sort_order'),
    ]).then(([prod, opts]) => {
      if (!mounted) return;
      setProduct(prod.data as Product | null);
      const groups = (opts.data ?? []) as ProductOptionGroup[];
      // Sort options within each group by sort_order
      groups.forEach((g) => {
        if (g.product_options) {
          g.product_options.sort((a, b) => (a as ProductOption).sort_order - (b as ProductOption).sort_order);
        }
      });
      setOptionGroups(groups);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return (
    <div className="shell py-8 lg:py-12">
      <div className="h-4 w-32 skeleton mb-6" />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square w-full skeleton rounded-3xl" />
        <div className="space-y-4">
          <div className="h-4 w-24 skeleton" />
          <div className="h-9 w-3/4 skeleton" />
          <div className="h-10 w-40 skeleton" />
          <div className="h-24 w-full skeleton" />
          <div className="h-12 w-full skeleton" />
          <div className="h-14 w-full skeleton" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="shell py-20 text-center animate-fade-in-scale">
      <div className="mx-auto w-16 h-16 rounded-3xl bg-brand-surface grid place-items-center mb-4">
        <AlertCircle className="w-8 h-8 text-brand-muted" />
      </div>
      <p className="font-display text-lg font-bold">Produit introuvable</p>
      <p className="text-sm text-brand-muted mt-1">Ce produit n'est plus disponible ou a été retiré du catalogue.</p>
      <button onClick={() => setView({ kind: 'shop' })} className="btn-primary mt-6">
        <ArrowLeft className="w-4 h-4" />Retour à la boutique
      </button>
    </div>
  );

  const current = product;

  // Build displayed images: if a selected option has an image, prepend it
  const productImages = parseImages(current.image_url);
  const selectedOptionImages = Object.values(selected)
    .map((o) => o.image_url)
    .filter((u): u is string => !!u);
  const displayImages = selectedOptionImages.length > 0
    ? [...selectedOptionImages, ...productImages]
    : productImages;

  // Calculate price modifier from selected options
  const totalPriceModifier = Object.values(selected).reduce((acc, o) => acc + o.price_modifier, 0);

  // Determine effective stock: minimum of product stock and all selected option stocks
  // When stock tracking is disabled, treat as unlimited
  const selectedOptionStocks = Object.values(selected).map((o) => o.stock);
  const effectiveStock = !current.track_stock
    ? Infinity
    : selectedOptionStocks.length > 0
      ? Math.min(current.stock, ...selectedOptionStocks)
      : current.stock;

  const hasBulk = current.bulk_quantity > 0 && current.bulk_price > 0;
  const isOutOfStock = current.track_stock && effectiveStock === 0;
  const effectivePrice = getEffectivePrice(current, quantity, totalPriceModifier);
  const total = effectivePrice * quantity;
  const savings = hasBulk && quantity >= current.bulk_quantity ? (current.price - current.bulk_price) * quantity : 0;
  const bulkDiscount = hasBulk && current.price > 0
    ? Math.round((1 - current.bulk_price / current.price) * 100)
    : 0;
  const bulkActive = hasBulk && quantity >= current.bulk_quantity;

  // Check if all groups have a selection (required before adding to cart)
  const allGroupsSelected = optionGroups.length === 0 || optionGroups.every((g) => selected[g.id]);
  const missingSelection = optionGroups.length > 0 && !allGroupsSelected;

  function handleSelectOption(groupId: string, option: ProductOption) {
    setSelected((prev) => ({ ...prev, [groupId]: option }));
    setQuantity(1);
  }

  const optionLabel = optionGroups.length > 0
    ? optionGroups
        .map((g) => selected[g.id]?.label)
        .filter(Boolean)
        .join(' / ')
    : undefined;

  const whatsappMsg = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par: ${current.name}${optionLabel ? ` (${optionLabel})` : ''}${current.sku ? ` — SKU: ${current.sku}` : ''}`,
  );

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    if (isOutOfStock || missingSelection) return;
    ripple(e);
    addToCart(current, quantity, {
      optionLabel,
      priceModifier: totalPriceModifier || undefined,
      optionStock: selectedOptionStocks.length > 0 ? Math.min(...selectedOptionStocks) : undefined,
    });
    setAdded(true);
    toast(`${current.name}${optionLabel ? ` (${optionLabel})` : ''} × ${quantity} ajouté au panier`, 'success');
    setTimeout(() => setAdded(false), 2200);
  }

  const stockBadge = !current.track_stock
    ? <span className="badge bg-brand-info/[0.12] text-brand-info"><Sparkles className="w-3 h-3" />Disponible</span>
    : isOutOfStock
      ? <span className="badge bg-brand-danger/10 text-brand-danger">Rupture de stock</span>
      : effectiveStock <= current.low_stock_threshold
        ? <span className="badge bg-brand-warning/[0.12] text-brand-warning"><span className="w-1.5 h-1.5 rounded-full bg-brand-warning animate-pulse-soft" />Bientôt épuisé · {effectiveStock} restants</span>
        : <span className="badge bg-brand-success/[0.12] text-brand-success"><CheckCircle2 className="w-3 h-3" />En stock</span>;

  return (
    <div className="bg-white">
      <div className="shell py-5 lg:py-10 pb-28 lg:pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-brand-muted mb-5 lg:mb-8">
          <button onClick={() => setView({ kind: 'shop' })} className="inline-flex items-center gap-1.5 font-semibold hover:text-brand-primary transition-colors">
            <Store className="w-3.5 h-3.5" />Boutique
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-brand-border" />
          <span className="font-semibold text-brand-ink line-clamp-1">{current.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Gallery */}
          <div className="relative">
            <ImageGallery
              images={displayImages}
              name={current.name}
              badge={
                isOutOfStock
                  ? <span className="badge bg-brand-ink text-white shadow-soft">Rupture de stock</span>
                  : hasBulk && bulkDiscount > 0
                    ? <span className="badge bg-brand-danger text-white shadow-soft"><Percent className="w-3 h-3" />Prix de gros</span>
                    : undefined
              }
            />
          </div>

          {/* Buy box */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {current.sku && (
                <span className="badge bg-brand-surface text-brand-muted font-mono tracking-wide">Réf. {current.sku}</span>
              )}
              {stockBadge}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold text-brand-ink leading-tight text-balance">
              {current.name}
            </h1>

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-brand-primary leading-none">
                {formatPrice(effectivePrice)}
              </span>
              {bulkActive && (
                <span className="text-lg text-brand-muted line-through decoration-2">{formatPrice(current.price)}</span>
              )}
              {bulkActive && (
                <span className="badge bg-brand-success text-white mb-1">Prix de gros appliqué</span>
              )}
            </div>

            {/* Bulk offer */}
            {hasBulk && (
              <div className={`mt-5 rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
                bulkActive ? 'border-brand-success/40 bg-brand-success/[0.06]' : 'border-brand-accent/50 bg-brand-accent/[0.08]'
              }`}>
                <span className={`grid place-items-center w-10 h-10 rounded-xl flex-shrink-0 ${bulkActive ? 'bg-brand-success text-white' : 'bg-brand-accent text-brand-ink'}`}>
                  <Tag className="w-4 h-4" />
                </span>
                <div className="text-sm">
                  <p className="font-bold text-brand-ink">
                    Achetez {current.bulk_quantity} pièces ou plus : {formatPrice(current.bulk_price)} / unité
                    {bulkDiscount > 0 && <span className="text-brand-success"> (−{bulkDiscount}%)</span>}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">
                    {bulkActive
                      ? `Économie appliquée sur cette commande : ${formatPrice(savings)}`
                      : `Ajoutez ${current.bulk_quantity - quantity > 0 ? current.bulk_quantity - quantity : 0} pièce(s) pour débloquer ce prix.`}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {current.description && (
              <div className="mt-6 rounded-2xl border border-brand-border bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-primary/70 mb-2">Description</p>
                <p className="text-sm text-brand-ink/75 leading-relaxed whitespace-pre-line">{current.description}</p>
              </div>
            )}

            {/* Options */}
            {optionGroups.length > 0 && (
              <div className="mt-6 rounded-2xl border border-brand-border bg-white p-4">
                <OptionSelector
                  groups={optionGroups}
                  selected={selected}
                  trackStock={current.track_stock}
                  onSelect={handleSelectOption}
                />
                {missingSelection && (
                  <p className="text-xs font-semibold text-brand-warning mt-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Veuillez sélectionner une option dans chaque groupe.
                  </p>
                )}
              </div>
            )}

            {/* Quantity + total */}
            {!isOutOfStock && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <label className="label">Quantité</label>
                  <div className="stepper">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuer la quantité">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      aria-label="Quantité"
                      onChange={(e) => setQuantity(Math.max(1, Math.min(effectiveStock === Infinity ? 9999 : effectiveStock, parseInt(e.target.value) || 1)))}
                    />
                    <button onClick={() => setQuantity(Math.min(effectiveStock === Infinity ? 9999 : effectiveStock, quantity + 1))} aria-label="Augmenter la quantité">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={`flex-1 rounded-2xl border px-4 py-3 ${bulkActive ? 'border-brand-success/30 bg-brand-success/[0.06]' : 'border-brand-border bg-brand-surface'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-brand-muted">Total à payer</span>
                    <span className="font-display text-xl font-extrabold text-brand-primary">{formatPrice(total)}</span>
                  </div>
                  {savings > 0 && (
                    <p className="text-[11px] font-bold text-brand-success mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />Vous économisez {formatPrice(savings)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock || missingSelection}
                title={missingSelection ? 'Sélectionnez toutes les options' : undefined}
                className={`flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] ${
                  added
                    ? 'bg-brand-success text-white'
                    : isOutOfStock
                      ? 'bg-brand-surface text-brand-muted cursor-not-allowed'
                      : 'bg-brand-accent text-brand-ink hover:bg-brand-accent-dark shadow-[0_14px_32px_-16px_rgba(233,164,0,0.95)] hover:-translate-y-0.5'
                }`}
              >
                {added
                  ? <><CheckCircle2 className="w-4 h-4 animate-success-pop" />Ajouté au panier !</>
                  : isOutOfStock
                    ? 'Produit indisponible'
                    : <><ShoppingCart className="w-4 h-4" />Ajouter au panier</>}
              </button>
              <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="btn-secondary py-4 justify-center">
                <MessageCircle className="w-4 h-4" />Commander par WhatsApp
              </a>
            </div>

            {/* Reassurance */}
            <div className="mt-7 grid sm:grid-cols-3 gap-3">
              {[
                { icon: Truck, title: 'Livraison rapide', desc: 'Organisée avec vous' },
                { icon: ShieldCheck, title: 'Paiement sûr', desc: 'Mobile Money & espèces' },
                { icon: RotateCcw, title: 'Retour 7 jours', desc: 'Échange simplifié' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white px-3.5 py-3">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-primary/[0.08] text-brand-primary flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-bold text-brand-ink leading-tight">{title}</span>
                    <span className="block text-[11px] text-brand-muted">{desc}</span>
                  </span>
                </div>
              ))}
            </div>

            {settings.phone_number && (
              <p className="mt-5 text-[13px] text-brand-muted">
                Une question ? Appelez-nous au{' '}
                <a href={`tel:${settings.phone_number}`} className="font-bold text-brand-primary hover:underline">{settings.phone_number}</a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile buy bar */}
      {!isOutOfStock && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-brand-border shadow-sheet">
          <div className="shell py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-brand-muted truncate">{current.name}</p>
              <p className="font-display text-lg font-extrabold text-brand-primary leading-tight">{formatPrice(total)}</p>
            </div>
            <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
              aria-label="Commander sur WhatsApp"
              className="grid place-items-center w-11 h-11 rounded-2xl bg-[#25D366] text-white flex-shrink-0 active:scale-95 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </a>
            <button
              onClick={handleAdd}
              disabled={missingSelection}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm flex-shrink-0 transition-all active:scale-95 ${
                added ? 'bg-brand-success text-white'
                  : missingSelection ? 'bg-brand-surface text-brand-muted'
                    : 'bg-brand-accent text-brand-ink'
              }`}
            >
              {added ? <><CheckCircle2 className="w-4 h-4" />Ajouté</> : <><ShoppingCart className="w-4 h-4" />Ajouter</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
