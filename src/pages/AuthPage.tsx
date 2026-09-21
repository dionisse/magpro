import { useState } from 'react';
import {
  Loader2, Store, ArrowLeft, Mail, KeyRound, User, Phone,
  ShieldCheck, Truck, Sparkles, Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import type { View } from '../lib/views';

export function AuthPage({ setView }: { setView: (v: View) => void }) {
  const { signIn, signUp } = useAuth();
  const { settings } = useStoreSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName, phone);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setView({ kind: 'shop' });
  }

  const storeName = settings.store_name || 'MagasinPro';

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-8 lg:py-14">
        <button onClick={() => setView({ kind: 'shop' })} className="btn-ghost mb-5 -ml-2">
          <ArrowLeft className="w-4 h-4" />Retour à la boutique
        </button>

        <div className="max-w-5xl mx-auto panel overflow-hidden lg:grid lg:grid-cols-2">

          {/* Brand side */}
          <div className="relative bg-brand-primary text-white p-7 sm:p-9 overflow-hidden">
            <div className="absolute inset-0 bg-mesh-navy opacity-95" aria-hidden />
            <div className="absolute -bottom-16 -right-10 w-64 h-64 rounded-full bg-brand-accent/15 blur-3xl" aria-hidden />

            <div className="relative h-full flex flex-col">
              <span className="flex items-center gap-2.5">
                <span className="relative grid place-items-center w-11 h-11 rounded-2xl bg-white/10 overflow-hidden">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt={storeName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : <Store className="w-5 h-5" />}
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-accent" aria-hidden />
                </span>
                <span className="font-display font-extrabold text-lg">{storeName}</span>
              </span>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-8 leading-tight text-white">
                Votre espace client,<br />
                <span className="text-brand-accent">simple et rapide.</span>
              </h2>
              <p className="text-sm text-white/70 mt-3.5 leading-relaxed">
                Suivez vos commandes, retrouvez vos informations de livraison et gagnez du temps à chaque achat.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  { icon: Truck, title: 'Suivi des commandes', desc: 'Statut en temps réel, du panier à la livraison.' },
                  { icon: ShieldCheck, title: 'Paiement sécurisé', desc: 'Mobile Money, espèces ou virement bancaire.' },
                  { icon: Heart, title: 'Prix de gros', desc: 'Des remises automatiques sur les lots.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="grid place-items-center w-10 h-10 rounded-2xl bg-white/10 flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand-accent" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="block text-xs text-white/65 mt-0.5">{desc}</span>
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-auto pt-9 text-[11px] text-white/45 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                {storeName} · boutique en ligne
              </p>
            </div>
          </div>

          {/* Form side */}
          <div className="p-7 sm:p-9 bg-white">
            <div className="inline-flex p-1 rounded-2xl bg-brand-surface border border-brand-border mb-6">
              {([
                { key: 'signin' as const, label: 'Connexion' },
                { key: 'signup' as const, label: 'Créer un compte' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setMode(tab.key); setError(null); }}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                    mode === tab.key ? 'bg-white text-brand-primary shadow-soft' : 'text-brand-muted hover:text-brand-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <h1 className="font-display text-xl font-extrabold text-brand-ink">
              {mode === 'signin' ? 'Bon retour !' : 'Bienvenue à bord'}
            </h1>
            <p className="text-sm text-brand-muted mt-1">
              {mode === 'signin' ? 'Connectez-vous pour continuer vos achats.' : 'Quelques secondes suffisent pour créer votre compte.'}
            </p>

            <form onSubmit={submit} className="space-y-4 mt-6">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="label">Nom complet</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="input pl-10" placeholder="Ex : Awa Diallo" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Téléphone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="input pl-10" placeholder="Ex : 97000000" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" autoComplete="email" className="input pl-10" placeholder="votre@email.com" />
                </div>
              </div>

              <div>
                <label className="label">Mot de passe</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type="password"
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="input pl-10"
                    placeholder="6 caractères minimum"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-brand-danger/25 bg-brand-danger/[0.07] text-brand-danger text-[13px] font-medium p-3.5">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-[15px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'signin' ? 'Se connecter' : 'Créer mon compte')}
              </button>
            </form>

            <p className="text-center text-xs text-brand-muted mt-5">
              {mode === 'signin' ? (
                <>Pas encore de compte ?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); }} className="text-brand-primary font-bold hover:underline">Créer un compte</button>
                </>
              ) : (
                <>Déjà inscrit ?{' '}
                  <button onClick={() => { setMode('signin'); setError(null); }} className="text-brand-primary font-bold hover:underline">Se connecter</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
