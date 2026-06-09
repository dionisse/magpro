import { useState, ReactNode, useEffect, useRef } from 'react';
import { Store, ShoppingCart, Package, Menu, User, LogOut, LayoutDashboard, ScanBarcode, Boxes, ListOrdered, X, BarChart3, Settings, Warehouse, ShoppingBasket, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { View } from '../lib/views';

export function AppShell({ view, setView, children }: { view: View; setView: (v: View) => void; children: ReactNode }) {
  const { profile, user, signOut, canAccess } = useAuth();
  const { itemCount } = useCart();
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
    { kind: 'admin-sections' as const,   icon: <ShieldCheck className="w-4 h-4" />,      label: 'Sections' },
  ];

  // Filter nav items based on user permissions
  const adminNav = ALL_ADMIN_NAV.filter((item) => canAccess(item.kind));

  return (
    <div className="min-h-screen bg-odoo-surface flex flex-col">
      <header className={`bg-odoo-primary text-white sticky top-0 z-40 transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-odoo-dark/20' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="h-14 flex items-center justify-between gap-4">
            <button onClick={() => setView({ kind: 'shop' })} className="flex items-center gap-2 font-semibold text-lg hover:opacity-90 transition">
              <Store className="w-6 h-6" />
              <span className="hidden sm:inline">MagasinPro</span>
            </button>

            {isAdminView ? (
              <nav className="hidden md:flex items-center gap-1 text-sm overflow-x-auto">
                {adminNav.map((item) => (
                  <button key={item.kind} onClick={() => setView({ kind: item.kind })}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 whitespace-nowrap transition ${view.kind === item.kind ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}`}>
                    {item.icon}{item.label}
                  </button>
                ))}
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-1 text-sm">
                <button onClick={() => setView({ kind: 'shop' })} className={`px-3 py-1.5 rounded-md transition ${view.kind === 'shop' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}`}>Boutique</button>
                {user && <button onClick={() => setView({ kind: 'orders' })} className={`px-3 py-1.5 rounded-md transition ${view.kind === 'orders' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}`}>Mes commandes</button>}
              </nav>
            )}

            <div className="flex items-center gap-2">
              {!isAdminView && (
                <button onClick={() => setView({ kind: 'cart' })} className="relative p-2 hover:bg-white/10 active:scale-90 rounded-md transition-all duration-150">
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 bg-odoo-warning text-odoo-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center transition-transform ${badgeAnim ? 'animate-badge-bounce' : ''}`}>
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </button>
              )}

              {isAdminView ? (
                <button onClick={() => setView({ kind: 'shop' })}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md transition">
                  <Store className="w-3.5 h-3.5" />Boutique
                </button>
              ) : isStaff ? (
                <button onClick={() => setView({ kind: 'admin-dashboard' })}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-md transition">
                  <Settings className="w-3.5 h-3.5" />Admin
                </button>
              ) : null}

              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-md transition">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                      {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block text-sm max-w-24 truncate">{profile?.full_name || user.email?.split('@')[0]}</span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-odoo-border z-40 text-odoo-dark overflow-hidden">
                        <div className="p-3 border-b border-odoo-border">
                          <p className="font-medium text-sm truncate">{profile?.full_name || 'Utilisateur'}</p>
                          <p className="text-xs text-odoo-muted truncate">{user.email}</p>
                          <span className={`inline-block mt-1.5 badge capitalize ${profile?.role === 'admin' ? 'bg-odoo-primary/15 text-odoo-primary' : profile?.role === 'cashier' ? 'bg-odoo-info/15 text-odoo-info' : profile?.role === 'employee' ? 'bg-odoo-success/15 text-odoo-success' : 'bg-odoo-muted/15 text-odoo-muted'}`}>
                            {profile?.role || 'customer'}
                          </span>
                        </div>
                        <button onClick={() => { setView({ kind: 'orders' }); setUserMenuOpen(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-odoo-surface flex items-center gap-2">
                          <Package className="w-4 h-4 text-odoo-muted" />Mes commandes
                        </button>
                        {isStaff && (
                          <button onClick={() => { setView({ kind: 'admin-dashboard' }); setUserMenuOpen(false); }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-odoo-surface flex items-center gap-2">
                            <Settings className="w-4 h-4 text-odoo-muted" />Espace administrateur
                          </button>
                        )}
                        <button onClick={() => { signOut(); setUserMenuOpen(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-odoo-surface flex items-center gap-2 text-odoo-danger border-t border-odoo-border">
                          <LogOut className="w-4 h-4" />Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button onClick={() => setView({ kind: 'auth' })} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-md transition">
                  <User className="w-4 h-4" /><span className="hidden sm:inline">Connexion</span>
                </button>
              )}

              <button className="md:hidden p-2 hover:bg-white/10 rounded-md transition" onClick={() => setMobileOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-odoo-border flex items-center justify-between">
              <span className="font-semibold text-odoo-dark">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-odoo-surface rounded"><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 p-2 overflow-auto">
              {isAdminView ? (
                <>
                  {adminNav.map((item) => (
                    <button key={item.kind} onClick={() => { setView({ kind: item.kind }); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-odoo-dark hover:bg-odoo-surface rounded-md text-left">
                      <span className="text-odoo-muted">{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div className="my-2 border-t border-odoo-border" />
                  <button onClick={() => { setView({ kind: 'shop' }); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-odoo-dark hover:bg-odoo-surface rounded-md text-left">
                    <span className="text-odoo-muted"><Store className="w-4 h-4" /></span>Voir la boutique
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setView({ kind: 'shop' }); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-odoo-dark hover:bg-odoo-surface rounded-md text-left">
                    <span className="text-odoo-muted"><Store className="w-4 h-4" /></span>Boutique
                  </button>
                  <button onClick={() => { setView({ kind: 'cart' }); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-odoo-dark hover:bg-odoo-surface rounded-md text-left">
                    <span className="text-odoo-muted"><ShoppingCart className="w-4 h-4" /></span>Panier ({itemCount})
                  </button>
                  {user && <button onClick={() => { setView({ kind: 'orders' }); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-odoo-dark hover:bg-odoo-surface rounded-md text-left">
                    <span className="text-odoo-muted"><Package className="w-4 h-4" /></span>Mes commandes
                  </button>}
                  <div className="my-2 border-t border-odoo-border" />
                  {isStaff && (
                    <button onClick={() => { setView({ kind: 'admin-dashboard' }); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-odoo-dark hover:bg-odoo-surface rounded-md text-left">
                      <span className="text-odoo-muted"><LayoutDashboard className="w-4 h-4" /></span>Espace Admin
                    </button>
                  )}
                </>
              )}
            </nav>
            {user && (
              <div className="p-3 border-t border-odoo-border">
                <button onClick={() => { signOut(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-odoo-danger hover:bg-odoo-surface rounded-md">
                  <LogOut className="w-4 h-4" />Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 page-enter" key={view.kind}>{children}</main>

      <footer className="bg-odoo-dark text-white/70 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 text-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Store className="w-4 h-4" /><span className="font-medium text-white">MagasinPro</span></div>
          <div className="flex items-center gap-4 text-xs">
            {isStaff && (
              <>
                <button onClick={() => setView({ kind: 'admin-dashboard' })} className="hover:text-white transition flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" />Administration
                </button>
                <span className="text-white/40">|</span>
              </>
            )}
            <span className="text-white/50">PWA — Fonctionne hors-ligne</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
