import { ReactNode, useEffect, useState } from 'react';
import { Loader2, Plus, Search, Edit2, Trash2, Package2, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/format';
import type { Product, Category } from '../../lib/database.types';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts((p.data as Product[]) ?? []);
    setCategories((c.data as Category[]) ?? []);
    setLoading(false);
  }

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-odoo-primary animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div><h1 className="text-2xl font-bold">Produits</h1><p className="text-sm text-odoo-muted">{products.length} produits</p></div>
        <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="w-4 h-4" />Nouveau produit</button>
      </div>
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-odoo-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou SKU..." className="input pl-9" />
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-odoo-surface text-left text-xs font-medium text-odoo-muted uppercase">
              <tr>
                <th className="p-3">Produit</th>
                <th className="p-3 hidden md:table-cell">Catégorie</th>
                <th className="p-3 text-right">Prix</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 hidden lg:table-cell">Lot</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-odoo-border">
              {filtered.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const isLow = p.stock <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className="hover:bg-odoo-surface/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-odoo-surface rounded flex-shrink-0 overflow-hidden">
                          {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package2 className="w-5 h-5 text-odoo-muted" /></div>}
                        </div>
                        <div className="min-w-0"><p className="font-medium truncate">{p.name}</p><p className="text-xs text-odoo-muted">{p.sku || '—'}</p></div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-odoo-muted">{cat?.name || '—'}</td>
                    <td className="p-3 text-right font-medium">{formatPrice(p.price)}</td>
                    <td className="p-3 text-center">
                      <span className={`badge ${p.stock === 0 ? 'bg-odoo-danger/15 text-odoo-danger' : isLow ? 'bg-odoo-warning/15 text-odoo-warning' : 'bg-odoo-success/15 text-odoo-success'}`}>{p.stock}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-odoo-muted">{p.bulk_quantity > 0 ? `${p.bulk_quantity}+ → ${formatPrice(p.bulk_price)}` : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(p)} className="p-1.5 text-odoo-muted hover:text-odoo-primary hover:bg-odoo-primary/10 rounded transition"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingId(p.id)} className="p-1.5 text-odoo-muted hover:text-odoo-danger hover:bg-odoo-danger/10 rounded transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-odoo-muted">Aucun produit</p>}
        </div>
      </div>
      {(editing || creating) && (
        <ProductForm product={editing} categories={categories}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }} />
      )}
      {deletingId && (
        <ConfirmDialog title="Supprimer ce produit ?" message="Cette action est irréversible."
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => { await supabase.from('products').delete().eq('id', deletingId); setDeletingId(null); load(); }} />
      )}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(product?.price ?? 0);
  const [bulkQuantity, setBulkQuantity] = useState(product?.bulk_quantity ?? 0);
  const [bulkPrice, setBulkPrice] = useState(product?.bulk_price ?? 0);
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.low_stock_threshold ?? 5);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { name, sku, description, category_id: categoryId || null, price, bulk_quantity: bulkQuantity, bulk_price: bulkPrice, stock, low_stock_threshold: lowStockThreshold, image_url: imageUrl, is_active: isActive };
    const result = product ? await supabase.from('products').update(payload).eq('id', product.id) : await supabase.from('products').insert(payload);
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    onSaved();
  }

  return (
    <Modal onClose={onClose} title={product ? 'Modifier le produit' : 'Nouveau produit'}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Nom *</label><input value={name} onChange={(e) => setName(e.target.value)} required className="input" /></div>
          <div><label className="block text-sm font-medium mb-1">SKU</label><input value={sku} onChange={(e) => setSku(e.target.value)} className="input" /></div>
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="">— Aucune —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input resize-none" /></div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">URL de l'image</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input" />
            {imageUrl && <div className="mt-2 w-20 h-20 bg-odoo-surface rounded overflow-hidden"><img src={imageUrl} alt="" className="w-full h-full object-cover" /></div>}
          </div>
          <div><label className="block text-sm font-medium mb-1">Prix *</label><input type="number" min={0} step={50} value={price} onChange={(e) => setPrice(Number(e.target.value))} required className="input" /></div>
          <div><label className="block text-sm font-medium mb-1">Stock *</label><input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} required className="input" /></div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité min. lot</label>
            <input type="number" min={0} value={bulkQuantity} onChange={(e) => setBulkQuantity(Number(e.target.value))} className="input" />
            <p className="text-xs text-odoo-muted mt-1">0 = pas de prix de lot</p>
          </div>
          <div><label className="block text-sm font-medium mb-1">Prix de lot</label><input type="number" min={0} step={50} value={bulkPrice} onChange={(e) => setBulkPrice(Number(e.target.value))} className="input" /></div>
          <div><label className="block text-sm font-medium mb-1">Seuil alerte</label><input type="number" min={0} value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} className="input" /></div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
              Visible dans la boutique
            </label>
          </div>
        </div>
        {error && <div className="bg-odoo-danger/10 text-odoo-danger text-sm p-2.5 rounded">{error}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function Modal({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-odoo-border p-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-odoo-surface rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-odoo-danger/10 rounded-full flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-odoo-danger" /></div>
          <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-odoo-muted mt-1">{message}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Annuler</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-odoo-danger hover:bg-odoo-danger/90 text-white font-medium rounded-md transition">Confirmer</button>
        </div>
      </div>
    </div>
  );
}
