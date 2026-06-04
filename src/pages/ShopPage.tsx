import { useEffect, useMemo, useState } from 'react';
import { Search, Tag, Package2, Plus, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import type { Category, Product } from '../lib/database.types';
import { useCart } from '../contexts/CartContext';
import { LazyImage, SkeletonCard, StaggerItem, useRipple, useToast } from '../components/ui';
import type { View } from '../lib/views';

export function ShopPage({ setView }: { setView: (v: View) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');
  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    ]).then(([cats, prods]) => {
      if (!mounted) return;
      setCategories((cats.data as Category[]) ?? []);
      setProducts((prods.data as Product[]) ?? []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

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
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-odoo-primary via-odoo-primary to-odoo-primary-light rounded-2xl p-6 lg:p-10 text-white mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block animate-float opacity-20 pointer-events-none">
          <Sparkles className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium mb-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <Sparkles className="w-3.5 h-3.5" />Prix dégressifs sur les achats en gros
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            Achetez plus, économisez plus.
          </h1>
          <p className="text-white/80 max-w-xl text-sm animate-fade-in-up" style={{ animationDelay: '220ms' }}>
            Découvrez notre catalogue avec des prix dégressifs. Commandez en ligne et faites-vous livrer rapidement.
          </p>
        </div>
      </div>

      {/* Search + Sort */}
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

      {/* Category pills */}
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

      {/* Category cards */}
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

      {/* Product grid */}
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
  );
}

export function ProductCard({ product, onView, onAdd }: { product: Product; onView: () => void; onAdd: () => void }) {
  const hasBulk = product.bulk_quantity > 0 && product.bulk_price > 0;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock <= product.low_stock_threshold && !isOutOfStock;
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();
  const ripple = useRipple();

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    if (isOutOfStock) return;
    ripple(e);
    onAdd();
    setJustAdded(true);
    toast(`${product.name} ajouté au panier`, 'success');
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="product-card h-full will-transform">
      <button onClick={onView}
        className="block aspect-square w-full bg-odoo-surface overflow-hidden relative group/img focus:outline-none">
        {product.image_url ? (
          <LazyImage src={product.image_url} alt={product.name}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
            fallback={<div className="w-full h-full flex items-center justify-center bg-odoo-surface"><Package2 className="w-12 h-12 text-odoo-muted" /></div>} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package2 className="w-12 h-12 text-odoo-muted" /></div>
        )}
        {hasBulk && (
          <div className="absolute top-2 left-2 badge bg-odoo-success text-white shadow-sm">
            <Tag className="w-3 h-3 mr-1" />Lot
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center backdrop-blur-[1px]">
            <span className="badge bg-odoo-danger text-white shadow-sm">Rupture</span>
          </div>
        )}
        <div className="absolute inset-0 bg-odoo-dark/0 group-hover/img:bg-odoo-dark/6 transition-colors duration-300" />
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
