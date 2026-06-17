import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Package2, Tag, Plus, Minus, ShoppingCart, MessageCircle, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, parseImages } from '../lib/format';
import type { Product } from '../lib/database.types';
import { useCart, getEffectivePrice } from '../contexts/CartContext';
import { LazyImage, useRipple, useToast } from '../components/ui';
import type { View } from '../lib/views';

// ─── Image gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  function prev() { setActive((i) => (i === 0 ? images.length - 1 : i - 1)); }
  function next() { setActive((i) => (i === images.length - 1 ? 0 : i + 1)); }

  if (images.length === 0) {
    return (
      <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        <div className="aspect-square w-full bg-odoo-surface flex items-center justify-center">
          <Package2 className="w-20 h-20 text-odoo-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '60ms' }}>
      {/* Main image */}
      <div className="aspect-square w-full bg-odoo-surface relative overflow-hidden group">
        <LazyImage
          key={images[active]}
          src={images[active]}
          alt={`${name} — photo ${active + 1}`}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
        />

        {/* Arrows (only when multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/75'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-white border-t border-odoo-border">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === active
                  ? 'border-odoo-primary shadow-md shadow-odoo-primary/25 scale-105'
                  : 'border-odoo-border hover:border-odoo-primary/50 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={src}
                alt={`Miniature ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductPage({ id, setView }: { id: string; setView: (v: View) => void }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const { toast } = useToast();
  const ripple = useRipple();

  useEffect(() => {
    let mounted = true;
    supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (!mounted) return;
      setProduct(data as Product | null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-odoo-primary animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in-scale">
      <AlertCircle className="w-10 h-10 text-odoo-muted mx-auto mb-3" />
      <p className="font-medium">Produit introuvable</p>
      <button onClick={() => setView({ kind: 'shop' })} className="btn-primary mt-4">Retour</button>
    </div>
  );

  const images = parseImages(product.image_url);
  const hasBulk = product.bulk_quantity > 0 && product.bulk_price > 0;
  const isOutOfStock = product.stock === 0;
  const effectivePrice = getEffectivePrice(product, quantity);
  const total = effectivePrice * quantity;
  const savings = hasBulk && quantity >= product.bulk_quantity ? (product.price - product.bulk_price) * quantity : 0;
  const whatsappMsg = encodeURIComponent(`Bonjour, je suis intéressé(e) par: ${product.name} (SKU: ${product.sku})`);

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    if (isOutOfStock) return;
    ripple(e);
    addToCart(product, quantity);
    setAdded(true);
    toast(`${product.name} × ${quantity} ajouté au panier`, 'success');
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 page-enter">
      <button onClick={() => setView({ kind: 'shop' })} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4" />Retour
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <ImageGallery images={images} name={product.name} />

        {/* Details panel */}
        <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          {product.sku && (
            <p className="text-xs text-odoo-muted mb-2 font-medium tracking-wide uppercase">SKU: {product.sku}</p>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold mb-3">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-odoo-primary transition-all duration-200">
              {formatPrice(effectivePrice)}
            </span>
            {hasBulk && quantity >= product.bulk_quantity && (
              <span className="text-base text-odoo-muted line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Bulk pricing badge */}
          {hasBulk && (
            <div className="bg-odoo-success/8 border border-odoo-success/25 rounded-xl p-3.5 mb-4 flex items-start gap-2.5 animate-fade-in-up">
              <Tag className="w-4 h-4 text-odoo-success mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-odoo-success">Prix de gros disponible</p>
                <p className="text-odoo-muted text-xs mt-0.5">
                  Achetez {product.bulk_quantity}+ unités : {formatPrice(product.bulk_price)}/unité
                  <span className="ml-1 text-odoo-success font-medium">({Math.round((1 - product.bulk_price / product.price) * 100)}% de remise)</span>
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-5">
              <h2 className="text-sm font-semibold mb-1.5">Description</h2>
              <p className="text-sm text-odoo-muted leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Stock status */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-semibold">Stock :</span>
            {isOutOfStock ? (
              <span className="badge bg-odoo-danger/15 text-odoo-danger">Rupture de stock</span>
            ) : product.stock <= product.low_stock_threshold ? (
              <span className="badge bg-odoo-warning/15 text-odoo-warning flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-odoo-warning animate-pulse" />
                Faible ({product.stock})
              </span>
            ) : (
              <span className="badge bg-odoo-success/15 text-odoo-success">En stock ({product.stock})</span>
            )}
          </div>

          {/* Quantity picker */}
          {!isOutOfStock && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Quantité</label>
                <div className="flex items-center border border-odoo-border rounded-xl w-fit overflow-hidden shadow-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-odoo-surface active:bg-odoo-border transition-colors duration-100">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center font-bold border-x border-odoo-border py-2 focus:outline-none bg-white" />
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2.5 hover:bg-odoo-surface active:bg-odoo-border transition-colors duration-100">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Total box */}
              <div className={`rounded-xl p-3.5 mb-5 border transition-all duration-300 ${
                savings > 0 ? 'bg-odoo-success/5 border-odoo-success/25' : 'bg-odoo-surface border-odoo-border'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-odoo-muted">Total</span>
                  <span className="text-xl font-bold text-odoo-primary">{formatPrice(total)}</span>
                </div>
                {savings > 0 && (
                  <p className="text-xs text-odoo-success font-medium mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />Économie : {formatPrice(savings)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={handleAdd} disabled={isOutOfStock}
              className={`btn-primary flex-1 transition-all duration-200 ${added ? 'bg-odoo-success hover:bg-odoo-success' : ''}`}>
              {added
                ? <><CheckCircle2 className="w-4 h-4 animate-success-pop" />Ajouté au panier !</>
                : isOutOfStock
                  ? 'Indisponible'
                  : <><ShoppingCart className="w-4 h-4" />Ajouter au panier</>}
            </button>
            <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <MessageCircle className="w-4 h-4" />WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
