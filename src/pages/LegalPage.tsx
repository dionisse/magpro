import { ArrowLeft, FileText, Scale, Info } from 'lucide-react';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { EmptyState } from '../components/ui';
import type { View } from '../lib/views';

interface LegalPageProps {
  kind: 'legal' | 'terms';
  setView: (v: View) => void;
}

export function LegalPage({ kind, setView }: LegalPageProps) {
  const { settings } = useStoreSettings();

  const isLegal = kind === 'legal';
  const title = isLegal ? 'Mentions légales' : "Conditions d'utilisation";
  const content = isLegal ? settings.legal_mentions : settings.terms_of_use;

  return (
    <div className="bg-brand-surface min-h-screen">
      <div className="shell py-8 lg:py-12 max-w-4xl">
        <button onClick={() => setView({ kind: 'shop' })} className="btn-ghost mb-5 -ml-2">
          <ArrowLeft className="w-4 h-4" />Retour à la boutique
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-brand-primary text-white p-6 sm:p-8 mb-6">
          <div className="absolute inset-0 bg-mesh-navy opacity-95" aria-hidden />
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-brand-accent/15 blur-3xl" aria-hidden />
          <div className="relative flex items-center gap-4">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/10 flex-shrink-0">
              {isLegal ? <Scale className="w-6 h-6 text-brand-accent" /> : <FileText className="w-6 h-6 text-brand-accent" />}
            </span>
            <div className="min-w-0">
              <p className="eyebrow-light">Informations</p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">{title}</h1>
              <p className="text-sm text-white/70 mt-1">{settings.company_name || settings.store_name}</p>
            </div>
          </div>
        </div>

        <div className="panel p-6 sm:p-9">
          {content ? (
            <div className="text-brand-ink/80 text-[15px] leading-[1.85] whitespace-pre-line">
              {content}
            </div>
          ) : (
            <EmptyState
              icon={<Info className="w-8 h-8 text-brand-primary/60" />}
              title="Contenu bientôt disponible"
              description="Cette page est en cours de rédaction. Contactez-nous si vous avez besoin d'informations légales immédiates."
            />
          )}
        </div>

        {(settings.company_name || settings.rccm || settings.ifu) && (
          <div className="mt-5 rounded-2xl border border-brand-border bg-white p-5 text-[13px] text-brand-muted space-y-1">
            {settings.company_name && <p><strong className="text-brand-ink">{settings.company_name}</strong></p>}
            {settings.rccm && <p>RCCM : {settings.rccm}</p>}
            {settings.ifu && <p>IFU : {settings.ifu}</p>}
            {settings.phone_number && <p>Téléphone : {settings.phone_number}</p>}
            {settings.whatsapp_number && <p>WhatsApp : {settings.whatsapp_number}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
