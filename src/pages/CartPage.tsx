import { ArrowLeft, Trash2, Plus, Minus, Tag, Package2, ShoppingBag, ShieldCheck, Truck, ArrowRight, TicketPercent } from 'lucide-react';
import { useCart, getEffectivePrice } from '../contexts/CartContext';
import { formatPrice, parseImages } from '../lib/format';
import { EmptyState } from '../components/ui';
import type { View } from '../lib/views';

export function CartPage({ setView }: { setView: (v: View) => void }) {
  const { items, updateQuantity, removeFromCart, subtotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[60vh]">
        <div className="shell py-16">
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-brand-primary/60" />}
            title="Votre panier est vide"
            description="Parcourez le catalogue et ajoutez vos produits préférés pour passer commande."
            actionLabel="Découvrir la boutique"
            onAction={() => setView({ kind: 'shop' })}
          />
        </div>
      </div>
    );
  }

  const totalUnits = items.reduce((n, it) => n + it.quantity, 0);

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-6 lg:py-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <p className="eyebrow mb-2"><span className="w-5 h-px bg-brand-accent" aria-hidden />Étape 1 sur 3</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-ink flex items-center gap-3">
              Mon panier
              <span className="badge bg-brand-primary text-white text-xs">{items.length} article{items.length !== 1 ? 's' : ''}</span>
            </h1>
          </div>
          <button onClick={() => setView({ kind: 'shop' })} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />Continuer mes achats
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3.5">
            {items.map((item) => {
              const key = item.cartKey ?? item.product.id;
              const price = getEffectivePrice(item.product, item.quantity, item.priceModifier ?? 0);
              const bulkActive = item.product.bulk_quantity > 0 && item.quantity >= item.product.bulk_quantity && item.product.bulk_price > 0;
              const maxQty = !item.product.track_stock ? 9999 : (item.optionStock !== undefined ? item.optionStock : item.product.stock);
              const firstImage = parseImages(item.product.image_url)[0] ?? null;
              const discount = item.product.bulk_quantity > 0 && item.product.bulk_price > 0 && item.product.price > 0
                ? Math.round((1 - item.product.bulk_price / item.product.price) * 100)
                : 0;

              return (
                <div key={key} className="group card p-3.5 sm:p-4 hover:shadow-lift transition-all duration-300">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setView({ kind: 'product', id: item.product.id })}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-brand-surface flex-shrink-0 ring-1 ring-brand-border"
                    >
                      {firstImage
                        ? <img src={firstImage} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <span className="w-full h-full grid place-items-center"><Package2 className="w-8 h-8 text-brand-muted/50" /></span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button onClick={() => setView({ kind: 'product', id: item.product.id })} className="text-left">
                            <h3 className="font-semibold text-sm sm:text-[15px] text-brand-ink line-clamp-2 leading-snug hover:text-brand-primary transition-colors">
                              {item.product.name}
                            </h3>
                          </button>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {item.optionLabel && (
                              <span className="badge bg-brand-primary/[0.08] text-brand-primary">{item.optionLabel}</span>
                            )}
                            {bulkActive && (
                              <span className="badge bg-brand-success/[0.12] text-brand-success"><Tag className="w-3 h-3" />Prix de gros −{discount}%</span>
                            )}
                            {!bulkActive && discount > 0 && (
                              <span className="badge bg-brand-surface text-brand-muted">−{discount}% dès {item.product.bulk_quantity} pcs</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(key)}
                          aria-label={`Retirer ${item.product.name}`}
                          className="p-2 rounded-xl text-brand-muted hover:text-brand-danger hover:bg-brand-danger/[0.08] transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="stepper">
                            <button onClick={() => updateQuantity(key, item.quantity - 1)} aria-label="Diminuer"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="value py-2">{item.quantity}</span>
                            <button onClick={() => updateQuantity(key, item.quantity + 1)} disabled={item.quantity >= maxQty} aria-label="Augmenter">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-xs text-brand-muted">{formatPrice(price)}<span className="hidden sm:inline"> / unité</span></span>
                        </div>
                        <span className="font-display text-lg font-extrabold text-brand-primary">{formatPrice(price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-1">
              <button onClick={clearCart} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-muted hover:text-brand-danger transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Vider le panier
              </button>
              <button onClick={() => setView({ kind: 'shop' })} className="link-quiet inline-flex items-center gap-1.5 text-[13px]">
                Ajouter d'autres produits <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="panel p-5 sm:p-6">
              <h2 className="font-display text-lg font-extrabold text-brand-ink mb-5">Récapitulatif</h2>

              <div className="space-y-3 text-sm pb-5 border-b border-brand-border">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Articles</span>
                  <span className="font-semibold">{totalUnits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Sous-total</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Livraison</span>
                  <span className="text-brand-muted text-xs text-right">Calculée à la commande</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between py-5">
                <span className="font-bold text-brand-ink">Total estimé</span>
                <span className="font-display text-2xl font-extrabold text-brand-primary">{formatPrice(subtotal)}</span>
              </div>

              <button onClick={() => setView({ kind: 'checkout' })} className="btn-primary w-full py-3.5 text-[15px]">
                Passer la commande
                <ArrowRight className="w-4 h-4" />
              </button>

              <button onClick={() => setView({ kind: 'shop' })} className="btn-ghost w-full mt-2">
                Continuer mes achats
              </button>

              <div className="mt-5 pt-5 border-t border-brand-border space-y-2.5">
                <p className="text-[13px] text-brand-ink flex items-start gap-2.5">
                  <TicketPercent className="w-4 h-4 text-brand-accent-dark mt-0.5 flex-shrink-0" />
                  <span>Un <strong>code promo</strong> ? Il s'applique à l'étape suivante.</span>
                </p>
                <p className="text-[13px] text-brand-ink flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-success mt-0.5 flex-shrink-0" />
                  <span>Paiement sécurisé : Mobile Money, espèces ou virement.</span>
                </p>
                <p className="text-[13px] text-brand-ink flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <span>Livraison organisée avec vous après confirmation.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
