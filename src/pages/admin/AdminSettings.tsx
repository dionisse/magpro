import { useState, useEffect } from 'react';
import {
  Save, Loader2, Store, Building2, Phone, Globe,
  Image, FileText, CheckCircle2, AlertCircle, Palette,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import type { StoreSettings } from '../../lib/database.types';

type FormData = Omit<StoreSettings, 'id' | 'updated_at'>;

const EMPTY: FormData = {
  store_name: '',
  logo_url: null,
  company_name: null,
  rccm: null,
  ifu: null,
  whatsapp_number: null,
  phone_number: null,
  facebook_url: null,
  tiktok_url: null,
  whatsapp_url: null,
  legal_mentions: null,
  terms_of_use: null,
  hero_style: 'auto',
};

function val(v: string | null | undefined): string {
  return v ?? '';
}

export function AdminSettings() {
  const { settings, refresh } = useStoreSettings();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setForm({
      store_name: settings.store_name,
      logo_url: settings.logo_url,
      company_name: settings.company_name,
      rccm: settings.rccm,
      ifu: settings.ifu,
      whatsapp_number: settings.whatsapp_number,
      phone_number: settings.phone_number,
      facebook_url: settings.facebook_url,
      tiktok_url: settings.tiktok_url,
      whatsapp_url: settings.whatsapp_url,
      legal_mentions: settings.legal_mentions,
      terms_of_use: settings.terms_of_use,
      hero_style: settings.hero_style ?? 'auto',
    });
  }, [settings]);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');

    const payload = {
      ...form,
      store_name: form.store_name || 'MagasinPro',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('store_settings')
      .update(payload)
      .eq('id', 1);

    if (error) {
      setErrorMsg(error.message);
      setStatus('error');
    } else {
      await refresh();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-odoo-dark">Paramètres de la boutique</h1>
          <p className="text-sm text-odoo-muted mt-0.5">Personnalisez l'identité et les informations de votre boutique</p>
        </div>
        {status === 'success' && (
          <div className="flex items-center gap-1.5 text-sm text-odoo-success font-medium">
            <CheckCircle2 className="w-4 h-4" />Enregistré
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-sm text-odoo-danger">
            <AlertCircle className="w-4 h-4" />{errorMsg}
          </div>
        )}
      </div>

      <form onSubmit={save} className="space-y-5">

        {/* Identity */}
        <section className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-odoo-dark">
            <Store className="w-4 h-4 text-odoo-primary" />Identité de la boutique
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de la boutique <span className="text-odoo-danger">*</span></label>
              <input
                value={val(form.store_name)}
                onChange={(e) => set('store_name', e.target.value)}
                required
                className="input"
                placeholder="MagasinPro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                URL du logo
                <span className="text-xs text-odoo-muted font-normal ml-1">(lien image)</span>
              </label>
              <input
                value={val(form.logo_url)}
                onChange={(e) => set('logo_url', e.target.value)}
                className="input"
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>
          </div>
          {form.logo_url && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-odoo-surface rounded-lg border border-odoo-border">
              <Image className="w-4 h-4 text-odoo-muted flex-shrink-0" />
              <span className="text-xs text-odoo-muted">Aperçu :</span>
              <img
                src={form.logo_url}
                alt="Logo aperçu"
                className="h-10 w-auto object-contain rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </section>

        {/* Hero style */}
        <section className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-odoo-dark">
            <Palette className="w-4 h-4 text-odoo-primary" />Style de la bannière
          </h2>
          <p className="text-xs text-odoo-muted mb-4">
            Définit l'apparence de la boutique lorsqu'aucune bannière active n'est configurée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => set('hero_style', 'auto')}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${form.hero_style === 'auto' ? 'border-odoo-primary bg-odoo-primary/5' : 'border-odoo-border hover:border-odoo-primary/50'}`}>
              <p className="font-semibold text-sm mb-1">Fond sombre avec titre</p>
              <p className="text-xs text-odoo-muted">Affiche un hero élégant "Qualité garantie" si aucune bannière n'est active.</p>
            </button>
            <button type="button" onClick={() => set('hero_style', 'none')}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${form.hero_style === 'none' ? 'border-odoo-primary bg-odoo-primary/5' : 'border-odoo-border hover:border-odoo-primary/50'}`}>
              <p className="font-semibold text-sm mb-1">Aucun hero (minimal)</p>
              <p className="text-xs text-odoo-muted">Cache complètement la zone banner si aucune bannière active.</p>
            </button>
          </div>
        </section>

        {/* Company */}
        <section className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-odoo-dark">
            <Building2 className="w-4 h-4 text-odoo-primary" />Informations légales de la société
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Raison sociale / Nom de la société</label>
              <input
                value={val(form.company_name)}
                onChange={(e) => set('company_name', e.target.value)}
                className="input"
                placeholder="ACME SARL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro RCCM</label>
              <input
                value={val(form.rccm)}
                onChange={(e) => set('rccm', e.target.value)}
                className="input"
                placeholder="RB/COT/12A/345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro IFU</label>
              <input
                value={val(form.ifu)}
                onChange={(e) => set('ifu', e.target.value)}
                className="input"
                placeholder="3201234567890"
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-odoo-dark">
            <Phone className="w-4 h-4 text-odoo-primary" />Contact
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de téléphone (appels)</label>
              <input
                value={val(form.phone_number)}
                onChange={(e) => set('phone_number', e.target.value)}
                className="input"
                placeholder="+229 97 00 00 00"
                type="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro WhatsApp</label>
              <input
                value={val(form.whatsapp_number)}
                onChange={(e) => set('whatsapp_number', e.target.value)}
                className="input"
                placeholder="+22997000000"
                type="tel"
              />
              <p className="text-xs text-odoo-muted mt-1">Format international sans espaces pour le lien cliquable</p>
            </div>
          </div>
        </section>

        {/* Social media */}
        <section className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-odoo-dark">
            <Globe className="w-4 h-4 text-odoo-primary" />Réseaux sociaux
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Lien WhatsApp</label>
              <input
                value={val(form.whatsapp_url)}
                onChange={(e) => set('whatsapp_url', e.target.value)}
                className="input"
                placeholder="https://wa.me/22997000000"
                type="url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Page Facebook</label>
              <input
                value={val(form.facebook_url)}
                onChange={(e) => set('facebook_url', e.target.value)}
                className="input"
                placeholder="https://facebook.com/votrepage"
                type="url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profil TikTok</label>
              <input
                value={val(form.tiktok_url)}
                onChange={(e) => set('tiktok_url', e.target.value)}
                className="input"
                placeholder="https://tiktok.com/@votrepage"
                type="url"
              />
            </div>
          </div>
        </section>

        {/* Legal pages */}
        <section className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-odoo-dark">
            <FileText className="w-4 h-4 text-odoo-primary" />Pages légales
          </h2>
          <p className="text-xs text-odoo-muted mb-4">
            Ces textes seront affichés sur des pages dédiées accessibles depuis le pied de page.
            Vous pouvez utiliser des sauts de ligne pour structurer le contenu.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mentions légales</label>
              <textarea
                value={val(form.legal_mentions)}
                onChange={(e) => set('legal_mentions', e.target.value)}
                className="input resize-y min-h-40"
                rows={8}
                placeholder="Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004...&#10;&#10;Éditeur du site : ...&#10;Hébergeur : ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conditions d'utilisation (CGU)</label>
              <textarea
                value={val(form.terms_of_use)}
                onChange={(e) => set('terms_of_use', e.target.value)}
                className="input resize-y min-h-40"
                rows={8}
                placeholder="Article 1 – Objet&#10;Les présentes conditions générales d'utilisation ont pour objet de définir les modalités et conditions d'utilisation des services proposés sur le site...&#10;&#10;Article 2 – Accès au service&#10;..."
              />
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end pb-4">
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement…</>
              : <><Save className="w-4 h-4" />Enregistrer les paramètres</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
