import { useState } from 'react';
import { Shield, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, KeyRound, Lock, ScanBarcode, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { View } from '../lib/views';

const ADMIN_SETUP_CODE = 'G@dwinadmin123@@';

export function AdminSetupPage({ setView }: { setView: (v: View) => void }) {
  const { user, profile } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isStaff = profile?.role === 'admin' || profile?.role === 'cashier' || profile?.role === 'employee';

  if (isStaff) {
    setView({ kind: 'admin-dashboard' });
    return null;
  }

  async function grantAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setError('Vous devez être connecté.'); return; }
    if (code !== ADMIN_SETUP_CODE) { setError('Code incorrect. Vérifiez le code administrateur.'); return; }
    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-8 lg:py-14">
        <button onClick={() => setView({ kind: 'shop' })} className="btn-ghost mb-5 -ml-2">
          <ArrowLeft className="w-4 h-4" />Retour à la boutique
        </button>

        <div className="max-w-lg mx-auto panel overflow-hidden">
          <div className="relative bg-brand-primary text-white p-6 sm:p-7 text-center overflow-hidden">
            <div className="absolute inset-0 bg-mesh-navy opacity-95" aria-hidden />
            <div className="absolute -bottom-14 -right-10 w-48 h-48 rounded-full bg-brand-accent/15 blur-3xl" aria-hidden />
            <div className="relative">
              <span className="relative inline-grid place-items-center w-14 h-14 rounded-3xl bg-white/10 mx-auto mb-3">
                <Shield className="w-7 h-7 text-brand-accent" />
              </span>
              <h1 className="font-display text-xl font-extrabold text-white">Espace administrateur</h1>
              <p className="text-white/70 text-sm mt-1.5">Accès réservé aux gestionnaires du magasin</p>
            </div>
          </div>

          <div className="p-6 sm:p-7">
            {success ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-14 h-14 text-brand-success mx-auto mb-4 animate-success-pop" />
                <p className="font-display font-extrabold text-lg text-brand-ink">Accès administrateur activé !</p>
                <p className="text-sm text-brand-muted mt-1.5">Redirection en cours…</p>
              </div>
            ) : !user ? (
              <div className="text-center py-6">
                <AlertTriangle className="w-11 h-11 text-brand-warning mx-auto mb-3" />
                <p className="font-bold text-brand-ink mb-1">Connexion requise</p>
                <p className="text-sm text-brand-muted mb-5">Connectez-vous avec votre compte gestionnaire pour continuer.</p>
                <button onClick={() => setView({ kind: 'auth' })} className="btn-primary">
                  Se connecter
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 mb-5">
                  <p className="font-bold text-sm text-brand-ink mb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-primary" />Code d'activation requis
                  </p>
                  <p className="text-[13px] text-brand-muted leading-relaxed">
                    Saisissez le code fourni par l'administrateur système pour débloquer l'espace de gestion.
                  </p>
                  <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-primary/[0.08] text-brand-primary text-[12px] font-semibold px-3 py-2">
                    <Lock className="w-3.5 h-3.5" />Contactez l'administrateur système pour obtenir le code.
                  </p>
                </div>

                <form onSubmit={grantAdmin} className="space-y-4">
                  <div>
                    <label className="label">Code d'accès administrateur</label>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Entrez le code…"
                      className="input font-mono text-base tracking-widest"
                      maxLength={30}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-brand-danger/25 bg-brand-danger/[0.07] text-brand-danger text-[13px] font-medium p-3.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading || !code} className="btn-primary w-full py-3.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" />Activer l'accès administrateur</>}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-brand-border">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted text-center mb-3.5">Rôles disponibles</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { role: 'Admin', desc: 'Accès complet', icon: Shield, color: 'border-brand-primary/25 bg-brand-primary/[0.05] text-brand-primary' },
                      { role: 'Caissier', desc: 'POS + commandes', icon: ScanBarcode, color: 'border-brand-info/25 bg-brand-info/[0.05] text-brand-info' },
                      { role: 'Client', desc: 'Achat en ligne', icon: ShoppingBag, color: 'border-brand-success/25 bg-brand-success/[0.05] text-brand-success' },
                    ].map((r) => (
                      <div key={r.role} className={`rounded-2xl border px-3 py-3.5 text-center ${r.color}`}>
                        <r.icon className="w-4 h-4 mx-auto mb-1.5" />
                        <p className="text-[12.5px] font-bold">{r.role}</p>
                        <p className="text-[10.5px] opacity-75 mt-0.5">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
