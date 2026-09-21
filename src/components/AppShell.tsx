import { useState, ReactNode, useEffect, useRef } from 'react';
import {
  Store, ShoppingCart, Package, Menu, User, LogOut, LayoutDashboard,
  ScanBarcode, Boxes, ListOrdered, X, BarChart3, Settings, Warehouse,
  ShoppingBasket, CreditCard, ShieldCheck, Phone, MessageCircle, ExternalLink,
  Scale, FileText, Megaphone, TicketPercent, ChevronRight, Sparkles,
  Truck, ShieldCheck as ShieldIcon, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import type { View } from '../lib/views';

// ─── Social icon SVGs ────────────────────────────────────────────────────────

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IconTiktok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.16 8.16 0 004.77 1.52V7.03a4.85 4.85 0 01-1-.34z"/>
    </svg>
  );
}

function IconWhatsapp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppShell({ view, setView, children }: { view: View; setView: (v: View) => void; children: ReactNode }) {
  const { profile, user, signOut, canAccess } = useAuth();
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prevCount = useRef(itemCount);
  const [badgeAnim, setBadgeAnim] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBadgeAnim(true);
      setTimeout(() => setBadgeAnim(false), 500);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isStaff = profile?.role === 'admin' || profile?.role === 'cashier' || profile?.role === 'employee';
  const isAdminView = view.kind.startsWith('admin-');

  const ALL_ADMIN_NAV = [
    { kind: 'admin-dashboard' as const,  icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { kind: 'admin-products' as const,   icon: <Boxes className="w-4 h-4" />,           label: 'Produits' },
    { kind: 'admin-stock' as const,      icon: <Warehouse className="w-4 h-4" />,        label: 'Stocks' },
    { kind: 'admin-purchases' as const,  icon: <ShoppingBasket className="w-4 h-4" />,   label: 'Appros' },
    { kind: 'admin-categories' as const, icon: <Package className="w-4 h-4" />,          label: 'Catégories' },
    { kind: 'admin-orders' as const,     icon: <ListOrdered className="w-4 h-4" />,      label: 'Commandes' },
    { kind: 'admin-payments' as const,   icon: <CreditCard className="w-4 h-4" />,       label: 'Paiements' },
    { kind: 'admin-reports' as const,    icon: <BarChart3 className="w-4 h-4" />,        label: 'Rapports' },
    { kind: 'admin-pos' as const,        icon: <ScanBarcode className="w-4 h-4" />,      label: 'POS' },
    { kind: 'admin-sections' as const,  icon: <ShieldCheck className="w-4 h-4" />,      label: 'Sections' },
    { kind: 'admin-banners' as const,   icon: <Megaphone className="w-4 h-4" />,         label: 'Bannières' },
    { kind: 'admin-promos' as const,    icon: <TicketPercent className="w-4 h-4" />,     label: 'Codes Promo' },
    { kind: 'admin-settings' as const,  icon: <Settings className="w-4 h-4" />,          label: 'Paramètres' },
  ];

  const adminNav = ALL_ADMIN_NAV.filter((item) => canAccess(item.kind));
  const storeName = settings.store_name || 'MagasinPro';
  const year = new Date().getFullYear();
  const phone = settings.phone_number?.trim() || null;
  const whatsappHref = settings.whatsapp_url?.trim()
    || (settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}` : null);

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">

      {/* ── Announcement bar (shop only) ──────────────────────────────────── */}
      {!isAdminView && (
        <div className="relative overflow-hidden bg-brand-primary text-white">
          <div className="absolute inset-0 bg-mesh-navy opacity-90" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-accent/70 to-transparent" aria-hidden />
          <div className="shell relative py-2.5 flex items-center justify-center gap-2.5 sm:gap-3 text-[11.5px] sm:text-[13px] font-medium">
            <span className="flex items-center gap-1.5 text-brand-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Boutique en ligne</span>
              <span className="sm:hidden">MagasinPro</span>
            </span>
            <span className="w-px h-4 bg-white/20" aria-hidden />
            {phone ? (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-brand-accent transition-colors">
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Commandez au</span> {phone}
              </a>
            ) : (
              <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Livraison rapide disponible</span>
            )}
            <span className="hidden md:flex items-center gap-3">
              <span className="w-px h-4 bg-white/20" aria-hidden />
              <span className="flex items-center gap-1.5 text-white/85"><ShieldIcon className="w-3.5 h-3.5 text-brand-accent" />Paiement Mobile Money & espèces</span>
            </span>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'glass shadow-[0_10px_30px_-20px_rgba(11,44,77,0.6)]' : 'bg-white'}`}>
        <div className="shell">
          <div className={`flex items-center justify-between gap-3 transition-all duration-300 ${scrolled ? 'h-16' : 'h-[72px]'}`}>

            {/* Brand */}
            <button
              onClick={() => setView({ kind: 'shop' })}
              className="group flex items-center gap-2.5 flex-shrink-0 tap-none"
            >
              <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-brand-primary text-white shadow-[0_10px_24px_-14px_rgba(11,44,77,0.95)] overflow-hidden">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={storeName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Store className="w-5 h-5" />
                )}
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-accent" aria-hidden />
              </span>
              <span className="text-left leading-none">
                <span className="block font-display font-extrabold text-[17px] text-brand-ink group-hover:text-brand-primary transition-colors">
                  {storeName}
                </span>
                <span className="hidden sm:block text-[11px] font-medium text-brand-muted mt-0.5">
                  {isAdminView ? 'Espace de gestion' : 'Boutique en ligne'}
                </span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 text-sm ml-4">
              {isAdminView ? (
                <button
                  onClick={() => setView({ kind: 'shop' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface text-brand-ink font-semibold hover:bg-brand-primary hover:text-white transition-all duration-200"
                >
                  <Store className="w-4 h-4" />Voir la boutique
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setView({ kind: 'shop' })}
                    className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                      view.kind === 'shop'
                        ? 'bg-brand-primary text-white shadow-[0_10px_22px_-14px_rgba(11,44,77,0.9)]'
                        : 'text-brand-ink/80 hover:bg-brand-surface hover:text-brand-primary'
                    }`}
                  >
                    Boutique
                  </button>
                  {user && (
                    <button
                      onClick={() => setView({ kind: 'orders' })}
                      className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                        view.kind === 'orders' || view.kind === 'order'
                          ? 'bg-brand-primary text-white shadow-[0_10px_22px_-14px_rgba(11,44,77,0.9)]'
                          : 'text-brand-ink/80 hover:bg-brand-surface hover:text-brand-primary'
                      }`}
                    >
                      Mes commandes
                    </button>
                  )}
                </>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!isAdminView && phone && (
                <a
                  href={`tel:${phone}`}
                  className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-brand-border text-[13px] font-semibold text-brand-ink hover:border-brand-primary hover:text-brand-primary transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />{phone}
                </a>
              )}

              {isAdminView && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary/[0.08] text-brand-primary text-[11px] font-bold uppercase tracking-wider">
                  <LayoutDashboard className="w-3.5 h-3.5" />Admin
                </span>
              )}

              {!isAdminView && (
                <button
                  onClick={() => setView({ kind: 'cart' })}
                  aria-label="Mon panier"
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-brand-border bg-white text-brand-ink
                             hover:border-brand-primary hover:text-brand-primary hover:shadow-soft transition-all duration-200 active:scale-95"
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {itemCount > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-brand-accent text-brand-ink text-[11px] font-extrabold rounded-full grid place-items-center shadow-accent ring-2 ring-white ${badgeAnim ? 'animate-badge-bounce' : ''}`}>
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </button>
              )}

              {isStaff && !isAdminView && (
                <button
                  onClick={() => setView({ kind: 'admin-dashboard' })}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-semibold
                             hover:bg-brand-primary-light hover:shadow-lift transition-all duration-200 active:scale-95"
                >
                  <Settings className="w-4 h-4" />Admin
                </button>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-2xl hover:bg-brand-surface transition-colors"
                    aria-label="Mon compte"
                  >
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light text-white grid place-items-center text-sm font-bold shadow-[0_8px_18px_-10px_rgba(11,44,77,0.9)]">
                      {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden lg:block text-sm font-semibold max-w-24 truncate text-brand-ink">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-3xl shadow-[0_30px_70px_-25px_rgba(11,44,77,0.45)] border border-brand-border z-40 overflow-hidden animate-fade-in-scale">
                        <div className="relative p-4 bg-brand-primary text-white overflow-hidden">
                          <div className="absolute inset-0 bg-mesh-navy opacity-90" aria-hidden />
                          <div className="relative flex items-center gap-3">
                            <span className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center text-base font-bold">
                              {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{profile?.full_name || 'Utilisateur'}</p>
                              <p className="text-xs text-white/70 truncate">{user.email}</p>
                            </div>
                          </div>
                          <span className="relative inline-block mt-3 badge bg-brand-accent text-brand-ink capitalize">
                            {profile?.role || 'customer'}
                          </span>
                        </div>
                        <div className="p-2">
                          <button onClick={() => { setView({ kind: 'orders' }); setUserMenuOpen(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-brand-surface flex items-center gap-2.5 transition-colors">
                            <Package className="w-4 h-4 text-brand-muted" />Mes commandes
                          </button>
                          {isStaff && (
                            <button onClick={() => { setView({ kind: 'admin-dashboard' }); setUserMenuOpen(false); }}
                              className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-brand-surface flex items-center gap-2.5 transition-colors">
                              <Settings className="w-4 h-4 text-brand-muted" />Espace administrateur
                            </button>
                          )}
                          <div className="my-1.5 h-px bg-brand-border" />
                          <button onClick={() => { signOut(); setUserMenuOpen(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-brand-danger/[0.08] text-brand-danger flex items-center gap-2.5 transition-colors">
                            <LogOut className="w-4 h-4" />Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setView({ kind: 'auth' })}
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-semibold
                             hover:bg-brand-primary-light hover:shadow-lift transition-all duration-200 active:scale-95"
                >
                  <User className="w-4 h-4" /><span className="hidden sm:inline">Connexion</span>
                </button>
              )}

              <button
                className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-brand-border bg-white text-brand-ink hover:border-brand-primary transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Admin sub-navigation */}
        {isAdminView && adminNav.length > 0 && (
          <div className="hidden md:block border-t border-brand-border bg-white/70">
            <div className="shell">
              <nav className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
                {adminNav.map((item) => (
                  <button
                    key={item.kind}
                    onClick={() => setView({ kind: item.kind })}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                      view.kind === item.kind
                        ? 'bg-brand-primary text-white shadow-[0_10px_22px_-14px_rgba(11,44,77,0.9)]'
                        : 'text-brand-ink/75 hover:bg-brand-surface hover:text-brand-primary'
                    }`}
                  >
                    {item.icon}{item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent" aria-hidden />
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-brand-ink/50 backdrop-blur-[2px] animate-fade-in-scale" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[86%] max-w-sm bg-white shadow-2xl flex flex-col animate-fade-in-scale">
            <div className="relative p-4 bg-brand-primary text-white overflow-hidden">
              <div className="absolute inset-0 bg-mesh-navy opacity-90" aria-hidden />
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/15">
                    <Store className="w-4 h-4" />
                  </span>
                  <span className="font-display font-bold">{storeName}</span>
                </span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-white/15 transition-colors" aria-label="Fermer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {user && (
                <div className="relative mt-3 flex items-center gap-2.5 text-sm">
                  <span className="w-8 h-8 rounded-xl bg-white/15 grid place-items-center text-xs font-bold">
                    {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-white/90">{profile?.full_name || user.email}</span>
                </div>
              )}
            </div>

            <nav className="flex-1 p-3 overflow-auto">
              {isAdminView ? (
                <>
                  {adminNav.map((item) => (
                    <button key={item.kind} onClick={() => { setView({ kind: item.kind }); setMobileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-2xl text-left mb-1 transition-colors ${
                        view.kind === item.kind ? 'bg-brand-primary text-white' : 'text-brand-ink hover:bg-brand-surface'
                      }`}>
                      <span className={view.kind === item.kind ? 'text-brand-accent' : 'text-brand-muted'}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div className="my-3 h-px bg-brand-border" />
                  <button onClick={() => { setView({ kind: 'shop' }); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-surface rounded-2xl text-left">
                    <span className="text-brand-muted"><Store className="w-4 h-4" /></span>Voir la boutique
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setView({ kind: 'shop' }); setMobileOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-surface rounded-2xl transition-colors">
                    <span className="flex items-center gap-3"><span className="text-brand-muted"><Store className="w-4 h-4" /></span>Boutique</span>
                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                  </button>
                  <button onClick={() => { setView({ kind: 'cart' }); setMobileOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-surface rounded-2xl transition-colors">
                    <span className="flex items-center gap-3"><span className="text-brand-muted"><ShoppingCart className="w-4 h-4" /></span>Mon panier</span>
                    <span className="badge bg-brand-accent text-brand-ink">{itemCount}</span>
                  </button>
                  {user && (
                    <button onClick={() => { setView({ kind: 'orders' }); setMobileOpen(false); }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-surface rounded-2xl transition-colors">
                      <span className="flex items-center gap-3"><span className="text-brand-muted"><Package className="w-4 h-4" /></span>Mes commandes</span>
                      <ChevronRight className="w-4 h-4 text-brand-muted" />
                    </button>
                  )}
                  {isStaff && (
                    <>
                      <div className="my-3 h-px bg-brand-border" />
                      <button onClick={() => { setView({ kind: 'admin-dashboard' }); setMobileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-brand-ink hover:bg-brand-surface rounded-2xl text-left">
                        <span className="text-brand-muted"><LayoutDashboard className="w-4 h-4" /></span>Espace Admin
                      </button>
                    </>
                  )}
                  {whatsappHref && (
                    <>
                      <div className="my-3 h-px bg-brand-border" />
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366]/10 rounded-2xl">
                        <IconWhatsapp className="w-4 h-4" />Commander sur WhatsApp
                      </a>
                    </>
                  )}
                </>
              )}
            </nav>

            {user && (
              <div className="p-3 border-t border-brand-border">
                <button onClick={() => { signOut(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-brand-danger hover:bg-brand-danger/[0.08] rounded-2xl transition-colors">
                  <LogOut className="w-4 h-4" />Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 page-enter" key={view.kind}>{children}</main>

      {/* ── Footer (boutique uniquement) ──────────────────────────────────── */}
      {!isAdminView && (
      <footer className="relative mt-16 bg-brand-primary text-white/75 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-navy opacity-95" aria-hidden />
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-brand-accent/10 blur-3xl" aria-hidden />

        <div className="shell relative pt-14 pb-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-white/10">

            {/* Brand */}
            <div className="lg:pr-6">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="relative grid place-items-center w-11 h-11 rounded-2xl bg-white/10 overflow-hidden">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt={storeName} className="w-full h-full object-cover brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Store className="w-5 h-5 text-white" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-accent" aria-hidden />
                </span>
                <span className="font-display font-extrabold text-white text-lg">{storeName}</span>
              </div>
              <p className="text-sm text-white/65 leading-relaxed">
                Des produits de qualité, des prix justes et une livraison rapide. Commandez en ligne ou passez au magasin.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {[['Livraison rapide', Truck], ['Paiement sécurisé', ShieldIcon]].map(([label, Icon]) => {
                  const Ico = Icon as typeof Truck;
                  return (
                    <span key={label as string} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-[11px] font-semibold text-white/85">
                      <Ico className="w-3.5 h-3.5 text-brand-accent" />{label as string}
                    </span>
                  );
                })}
              </div>
              {(settings.company_name || settings.rccm || settings.ifu) && (
                <div className="mt-5 space-y-0.5">
                  {settings.company_name && <p className="text-xs text-white/55">{settings.company_name}</p>}
                  {settings.rccm && <p className="text-[11px] text-white/40">RCCM : {settings.rccm}</p>}
                  {settings.ifu && <p className="text-[11px] text-white/40">IFU : {settings.ifu}</p>}
                </div>
              )}
            </div>

            {/* Boutique links */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mb-4">Boutique</p>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={() => setView({ kind: 'shop' })} className="group inline-flex items-center gap-2 hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-accent/70 group-hover:translate-x-0.5 transition-transform" />Tous les produits
                  </button>
                </li>
                <li>
                  <button onClick={() => setView({ kind: 'cart' })} className="group inline-flex items-center gap-2 hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-accent/70 group-hover:translate-x-0.5 transition-transform" />Mon panier
                  </button>
                </li>
                <li>
                  <button onClick={() => setView({ kind: 'orders' })} className="group inline-flex items-center gap-2 hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-accent/70 group-hover:translate-x-0.5 transition-transform" />Mes commandes
                  </button>
                </li>
                <li>
                  <button onClick={() => setView({ kind: 'legal' })} className="group inline-flex items-center gap-2 hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-accent/70 group-hover:translate-x-0.5 transition-transform" />Mentions légales
                  </button>
                </li>
                <li>
                  <button onClick={() => setView({ kind: 'terms' })} className="group inline-flex items-center gap-2 hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-accent/70 group-hover:translate-x-0.5 transition-transform" />Conditions d'utilisation
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mb-4">Contact</p>
              <div className="space-y-3 text-sm">
                {phone && (
                  <a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-white transition-colors">
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/8"><Phone className="w-4 h-4 text-brand-accent" /></span>
                    {phone}
                  </a>
                )}
                {settings.whatsapp_number && (
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-white transition-colors">
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/8"><MessageCircle className="w-4 h-4 text-brand-accent" /></span>
                    {settings.whatsapp_number}
                  </a>
                )}
                {!phone && !settings.whatsapp_number && (
                  <p className="text-xs text-white/45 italic">Coordonnées à compléter dans les paramètres.</p>
                )}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mt-7 mb-3">Moyens de paiement</p>
              <div className="flex flex-wrap gap-1.5">
                {['Espèces', 'MTN MoMo', 'Moov Money', 'Celtiis Pay', 'Carte bancaire', 'FedaPay'].map((m) => (
                  <span key={m} className="px-2.5 py-1.5 rounded-lg bg-white/8 text-[11px] font-semibold text-white/80">{m}</span>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mb-4">Restons en contact</p>
              <p className="text-sm text-white/65 mb-4">
                Suivez nos nouveautés, promos et arrivages sur nos réseaux.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                    className="w-11 h-11 rounded-2xl bg-white/8 hover:bg-[#25D366] grid place-items-center transition-all duration-200 hover:-translate-y-0.5">
                    <IconWhatsapp className="w-5 h-5 text-white" />
                  </a>
                )}
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook"
                    className="w-11 h-11 rounded-2xl bg-white/8 hover:bg-[#1877F2] grid place-items-center transition-all duration-200 hover:-translate-y-0.5">
                    <IconFacebook className="w-5 h-5 text-white" />
                  </a>
                )}
                {settings.tiktok_url && (
                  <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" title="TikTok"
                    className="w-11 h-11 rounded-2xl bg-white/8 hover:bg-black grid place-items-center transition-all duration-200 hover:-translate-y-0.5">
                    <IconTiktok className="w-5 h-5 text-white" />
                  </a>
                )}
                {!whatsappHref && !settings.facebook_url && !settings.tiktok_url && (
                  <p className="text-xs text-white/45 italic">Réseaux sociaux à configurer.</p>
                )}
              </div>

              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5">
                  <IconWhatsapp className="w-4 h-4" />Commander sur WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <span>© {year} {settings.company_name || storeName}. Tous droits réservés.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <button onClick={() => setView({ kind: 'legal' })} className="hover:text-white transition flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />Mentions légales
              </button>
              <span className="text-white/20">·</span>
              <button onClick={() => setView({ kind: 'terms' })} className="hover:text-white transition flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />CGU
              </button>
              {isStaff && (
                <>
                  <span className="text-white/20">·</span>
                  <button onClick={() => setView({ kind: 'admin-dashboard' })} className="hover:text-white transition flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" />Administration
                  </button>
                </>
              )}
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" />PWA installable</span>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* ── Floating WhatsApp (shop only, hidden on product page where a sticky bar lives) */}
      {!isAdminView && whatsappHref && view.kind !== 'product' && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discuter sur WhatsApp"
          className="group fixed bottom-5 right-4 sm:bottom-7 sm:right-6 z-30 inline-flex items-center gap-2.5 pl-3 pr-4 py-3 rounded-full
                     bg-[#25D366] text-white font-bold text-sm shadow-[0_18px_40px_-12px_rgba(37,211,102,0.75)]
                     hover:bg-[#1EBE5A] hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        >
          <span className="relative grid place-items-center w-7 h-7">
            <span className="absolute inset-0 rounded-full bg-white/25 animate-pulse-soft" aria-hidden />
            <IconWhatsapp className="relative w-5 h-5" />
          </span>
          <span className="hidden sm:inline">Besoin d'aide ?</span>
        </a>
      )}
    </div>
  );
}
