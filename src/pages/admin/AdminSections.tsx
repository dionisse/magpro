import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, Plus, Trash2, Edit2, Loader2, X, Check,
  Users, LayoutDashboard, Boxes, Warehouse, ShoppingBasket,
  Package, ListOrdered, CreditCard, BarChart3, ScanBarcode,
  UserCog, RefreshCw, AlertTriangle, Search, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/format';
import { useAuth } from '../../contexts/AuthContext';
import type { Section, AdminModule, Profile } from '../../lib/database.types';

// ─── Module definitions ───────────────────────────────────────────────────────

interface ModuleDef {
  key: AdminModule;
  label: string;
  icon: React.ReactNode;
  group: string;
}

const ALL_MODULES: ModuleDef[] = [
  { key: 'admin-dashboard',  label: 'Tableau de bord',    icon: <LayoutDashboard className="w-4 h-4" />,  group: 'Vue générale' },
  { key: 'admin-pos',        label: 'Point de vente',      icon: <ScanBarcode className="w-4 h-4" />,      group: 'Ventes' },
  { key: 'admin-orders',     label: 'Commandes',           icon: <ListOrdered className="w-4 h-4" />,      group: 'Ventes' },
  { key: 'admin-payments',   label: 'Paiements',           icon: <CreditCard className="w-4 h-4" />,       group: 'Ventes' },
  { key: 'admin-products',   label: 'Produits',            icon: <Boxes className="w-4 h-4" />,            group: 'Catalogue' },
  { key: 'admin-categories', label: 'Catégories',          icon: <Package className="w-4 h-4" />,          group: 'Catalogue' },
  { key: 'admin-stock',      label: 'Gestion des stocks',  icon: <Warehouse className="w-4 h-4" />,        group: 'Stock' },
  { key: 'admin-purchases',  label: 'Approvisionnements',  icon: <ShoppingBasket className="w-4 h-4" />,   group: 'Stock' },
  { key: 'admin-reports',    label: 'Rapports & stats',    icon: <BarChart3 className="w-4 h-4" />,        group: 'Analyse' },
  { key: 'admin-sections',   label: 'Sections & accès',    icon: <ShieldCheck className="w-4 h-4" />,      group: 'Administration' },
];

const MODULE_GROUPS = [...new Set(ALL_MODULES.map((m) => m.group))];

const COLORS = ['#714B67','#017E84','#28A745','#FFC107','#DC3545','#17A2B8','#6C757D','#343a40','#e83e8c','#6610f2'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionWithPerms extends Section {
  section_permissions: { module: string }[];
  _members?: Profile[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSections() {
  const { user } = useAuth();
  const [sections, setSections] = useState<SectionWithPerms[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithPerms | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formModules, setFormModules] = useState<Set<AdminModule>>(new Set());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Member assignment
  const [assigningSection, setAssigningSection] = useState<SectionWithPerms | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [secRes, profRes] = await Promise.all([
      supabase.from('sections')
        .select('*, section_permissions(module)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles')
        .select('*')
        .in('role', ['admin', 'cashier', 'employee'])
        .order('full_name'),
    ]);
    setSections((secRes.data as SectionWithPerms[]) ?? []);
    setAllProfiles((profRes.data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  function openCreate() {
    setEditingSection(null);
    setFormName('');
    setFormDesc('');
    setFormColor(COLORS[0]);
    setFormModules(new Set());
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(s: SectionWithPerms) {
    setEditingSection(s);
    setFormName(s.name);
    setFormDesc(s.description);
    setFormColor(s.color || COLORS[0]);
    setFormModules(new Set(s.section_permissions.map((p) => p.module as AdminModule)));
    setFormError(null);
    setShowForm(true);
  }

  function toggleModule(m: AdminModule) {
    setFormModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

  function toggleGroup(group: string) {
    const groupMods = ALL_MODULES.filter((m) => m.group === group).map((m) => m.key);
    const allSelected = groupMods.every((m) => formModules.has(m));
    setFormModules((prev) => {
      const next = new Set(prev);
      if (allSelected) groupMods.forEach((m) => next.delete(m));
      else groupMods.forEach((m) => next.add(m));
      return next;
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function saveSection() {
    if (!formName.trim()) { setFormError('Le nom est requis.'); return; }
    setSaving(true);
    setFormError(null);

    let sectionId: string;

    if (editingSection) {
      const { error } = await supabase.from('sections').update({
        name: formName.trim(),
        description: formDesc.trim(),
        color: formColor,
        updated_at: new Date().toISOString(),
      }).eq('id', editingSection.id);
      if (error) { setSaving(false); setFormError(error.message); return; }
      sectionId = editingSection.id;
      // Delete existing permissions then re-insert
      await supabase.from('section_permissions').delete().eq('section_id', sectionId);
    } else {
      const { data, error } = await supabase.from('sections').insert({
        name: formName.trim(),
        description: formDesc.trim(),
        color: formColor,
        created_by: user?.id ?? null,
      }).select().maybeSingle();
      if (error || !data) { setSaving(false); setFormError(error?.message ?? 'Erreur'); return; }
      sectionId = (data as { id: string }).id;
    }

    if (formModules.size > 0) {
      const perms = [...formModules].map((m) => ({ section_id: sectionId, module: m }));
      const { error } = await supabase.from('section_permissions').insert(perms);
      if (error) { setSaving(false); setFormError(error.message); return; }
    }

    setSaving(false);
    setShowForm(false);
    load();
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteSection(id: string) {
    if (!confirm('Supprimer cette section ? Les utilisateurs ne seront plus associés à aucune section.')) return;
    await supabase.from('sections').delete().eq('id', id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Member assignment ─────────────────────────────────────────────────────
  async function assignMember(profileId: string, sectionId: string | null) {
    await supabase.from('profiles').update({ section_id: sectionId }).eq('id', profileId);
    setAllProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, section_id: sectionId } : p));
  }

  async function setMemberRole(profileId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', profileId);
    setAllProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, role: role as Profile['role'] } : p));
  }

  const filtered = sections.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const membersOf = (sectionId: string) => allProfiles.filter((p) => p.section_id === sectionId);
  const unassigned = allProfiles.filter((p) => !p.section_id && p.role !== 'admin');

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-odoo-primary" />Sections & Accès
          </h1>
          <p className="text-sm text-odoo-muted mt-1">Gérez les profils d'accès et associez des membres aux modules autorisés</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary gap-1.5 text-sm"><RefreshCw className="w-3.5 h-3.5" />Actualiser</button>
          <button onClick={openCreate} className="btn-primary gap-1.5 text-sm"><Plus className="w-4 h-4" />Nouvelle section</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-odoo-muted mb-1">Sections</p>
          <p className="text-2xl font-bold text-odoo-primary">{sections.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-odoo-muted mb-1">Membres assignés</p>
          <p className="text-2xl font-bold">{allProfiles.filter((p) => p.section_id).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-odoo-muted mb-1">Non assignés</p>
          <p className="text-2xl font-bold text-odoo-warning">{unassigned.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-odoo-muted mb-1">Modules disponibles</p>
          <p className="text-2xl font-bold">{ALL_MODULES.length}</p>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="card mb-6 border-l-4 overflow-hidden" style={{ borderLeftColor: formColor }}>
          <div className="p-4 border-b border-odoo-border bg-odoo-surface flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-odoo-primary" />
              {editingSection ? 'Modifier la section' : 'Nouvelle section'}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-odoo-muted hover:text-odoo-dark"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5">
            {/* Name + desc + color */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium mb-1">Nom de la section *</label>
                <input className="input text-sm" placeholder="Ex: Vendeur, Caissier, Gestionnaire stock…"
                  value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input className="input text-sm" placeholder="Rôle et responsabilités…"
                  value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
            </div>

            {/* Color picker */}
            <div className="mb-5">
              <label className="block text-xs font-medium mb-2">Couleur de la section</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setFormColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formColor === c ? 'border-odoo-dark scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Module permissions */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium">Modules autorisés</label>
                <span className="text-xs text-odoo-muted">{formModules.size} sélectionné(s)</span>
              </div>
              <div className="space-y-3">
                {MODULE_GROUPS.map((group) => {
                  const groupMods = ALL_MODULES.filter((m) => m.group === group);
                  const allSelected = groupMods.every((m) => formModules.has(m.key));
                  const someSelected = groupMods.some((m) => formModules.has(m.key));
                  return (
                    <div key={group} className="border border-odoo-border rounded-xl overflow-hidden">
                      <button type="button" onClick={() => toggleGroup(group)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition ${allSelected ? 'bg-odoo-primary/8 text-odoo-primary' : someSelected ? 'bg-odoo-warning/5' : 'bg-odoo-surface'}`}>
                        <span>{group}</span>
                        <div className="flex items-center gap-2">
                          {allSelected && <span className="text-xs bg-odoo-primary text-white px-2 py-0.5 rounded-full">Tout</span>}
                          {someSelected && !allSelected && <span className="text-xs bg-odoo-warning/20 text-odoo-warning px-2 py-0.5 rounded-full">Partiel</span>}
                        </div>
                      </button>
                      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x-0 border-t border-odoo-border">
                        {groupMods.map((mod) => (
                          <button key={mod.key} type="button" onClick={() => toggleModule(mod.key)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm text-left transition ${formModules.has(mod.key) ? 'bg-odoo-primary/5' : 'hover:bg-odoo-surface'}`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${formModules.has(mod.key) ? 'bg-odoo-primary border-odoo-primary' : 'border-odoo-border'}`}>
                              {formModules.has(mod.key) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={formModules.has(mod.key) ? 'text-odoo-muted' : 'text-odoo-muted'}>{mod.icon}</span>
                            <span className={`font-medium ${formModules.has(mod.key) ? 'text-odoo-primary' : ''}`}>{mod.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-odoo-danger text-sm bg-odoo-danger/5 border border-odoo-danger/20 rounded-lg px-3 py-2 mb-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{formError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={saveSection} disabled={saving} className="btn-primary gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingSection ? 'Enregistrer les modifications' : 'Créer la section'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-odoo-muted pointer-events-none" />
        <input className="input pl-9 text-sm" placeholder="Rechercher une section…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-odoo-primary animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map((section) => {
            const members = membersOf(section.id);
            const perms = section.section_permissions.map((p) => p.module);
            const isExpanded = expandedId === section.id;

            return (
              <div key={section.id} className="card overflow-hidden">
                {/* Section header row */}
                <div className="flex items-start justify-between p-4 gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: section.color || COLORS[0] }}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold flex items-center gap-2">
                        {section.name}
                        <span className="text-xs text-odoo-muted font-normal">
                          {members.length} membre{members.length !== 1 ? 's' : ''}
                        </span>
                      </h3>
                      {section.description && <p className="text-xs text-odoo-muted mt-0.5">{section.description}</p>}
                      {/* Module pills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {perms.length === 0 ? (
                          <span className="badge bg-odoo-danger/10 text-odoo-danger text-xs">Aucun accès</span>
                        ) : (
                          ALL_MODULES.filter((m) => perms.includes(m.key)).map((m) => (
                            <span key={m.key} className="inline-flex items-center gap-1 badge bg-odoo-surface text-odoo-muted text-xs border border-odoo-border">
                              {m.icon}<span>{m.label}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(section)} title="Modifier"
                      className="p-1.5 text-odoo-muted hover:text-odoo-primary hover:bg-odoo-primary/10 rounded-md transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setAssigningSection(assigningSection?.id === section.id ? null : section)} title="Gérer les membres"
                      className={`p-1.5 rounded-md transition ${assigningSection?.id === section.id ? 'bg-odoo-primary/10 text-odoo-primary' : 'text-odoo-muted hover:text-odoo-info hover:bg-odoo-info/10'}`}>
                      <Users className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSection(section.id)} title="Supprimer"
                      className="p-1.5 text-odoo-muted hover:text-odoo-danger hover:bg-odoo-danger/10 rounded-md transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : section.id)}
                      className="p-1.5 text-odoo-muted hover:text-odoo-primary hover:bg-odoo-surface rounded-md transition">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: member list */}
                {isExpanded && (
                  <div className="border-t border-odoo-border bg-odoo-surface/50 px-4 py-3">
                    <p className="text-xs font-semibold text-odoo-muted uppercase mb-2">Membres de cette section</p>
                    {members.length === 0 ? (
                      <p className="text-sm text-odoo-muted italic">Aucun membre assigné</p>
                    ) : (
                      <div className="space-y-1">
                        {members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between bg-white border border-odoo-border rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: section.color || COLORS[0] }}>
                                {m.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{m.full_name}</p>
                                {m.employee_number && <p className="text-xs text-odoo-muted">#{m.employee_number}</p>}
                              </div>
                            </div>
                            <button onClick={() => assignMember(m.id, null)}
                              className="text-xs text-odoo-danger hover:underline">Retirer</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Member assignment panel */}
                {assigningSection?.id === section.id && (
                  <MemberAssignPanel
                    section={section}
                    allProfiles={allProfiles}
                    onAssign={assignMember}
                    onRoleChange={setMemberRole}
                    onClose={() => setAssigningSection(null)}
                  />
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <ShieldCheck className="w-10 h-10 text-odoo-muted mx-auto mb-3" />
              <p className="font-medium">Aucune section créée</p>
              <p className="text-sm text-odoo-muted mt-1">Créez une section pour définir les accès d'un groupe d'utilisateurs</p>
              <button onClick={openCreate} className="btn-primary mt-4"><Plus className="w-4 h-4" />Créer une section</button>
            </div>
          )}
        </div>
      )}

      {/* Unassigned staff */}
      {unassigned.length > 0 && (
        <div className="mt-6 card overflow-hidden border-l-4 border-l-odoo-warning">
          <div className="p-4 bg-odoo-warning/5 border-b border-odoo-border">
            <p className="font-semibold flex items-center gap-2 text-odoo-warning">
              <AlertTriangle className="w-4 h-4" />Utilisateurs sans section ({unassigned.length})
            </p>
            <p className="text-xs text-odoo-muted mt-0.5">Ces utilisateurs n'ont accès à aucun module admin.</p>
          </div>
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unassigned.map((p) => (
              <UnassignedUserRow key={p.id} profile={p} sections={sections}
                onAssign={assignMember} onRoleChange={setMemberRole} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MemberAssignPanel ────────────────────────────────────────────────────────

function MemberAssignPanel({ section, allProfiles, onAssign, onRoleChange, onClose }: {
  section: SectionWithPerms;
  allProfiles: Profile[];
  onAssign: (profileId: string, sectionId: string | null) => void;
  onRoleChange: (profileId: string, role: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const available = allProfiles.filter((p) =>
    p.section_id !== section.id && p.role !== 'admin' &&
    (!search || p.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="border-t border-odoo-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <UserCog className="w-4 h-4 text-odoo-primary" />Assigner des membres
        </p>
        <button onClick={onClose} className="text-odoo-muted hover:text-odoo-dark"><X className="w-4 h-4" /></button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-odoo-muted pointer-events-none" />
        <input className="input pl-8 text-xs py-1.5" placeholder="Rechercher un utilisateur…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {available.length === 0 ? (
        <p className="text-xs text-odoo-muted italic text-center py-3">Aucun utilisateur disponible</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-auto">
          {available.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-odoo-surface border border-odoo-border rounded-lg px-3 py-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-odoo-primary/15 text-odoo-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {p.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.full_name}</p>
                  <span className={`badge text-xs ${p.role === 'cashier' ? 'bg-odoo-info/15 text-odoo-info' : p.role === 'employee' ? 'bg-odoo-success/15 text-odoo-success' : 'bg-odoo-muted/15 text-odoo-muted'}`}>
                    {p.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <select className="text-xs border border-odoo-border rounded px-1.5 py-1 bg-white"
                  value={p.role}
                  onChange={(e) => onRoleChange(p.id, e.target.value)}>
                  <option value="employee">Employé</option>
                  <option value="cashier">Caissier</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => onAssign(p.id, section.id)}
                  className="px-2 py-1 bg-odoo-primary text-white text-xs rounded-md hover:bg-odoo-primary-dark transition">
                  Assigner
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UnassignedUserRow ────────────────────────────────────────────────────────

function UnassignedUserRow({ profile, sections, onAssign, onRoleChange }: {
  profile: Profile;
  sections: SectionWithPerms[];
  onAssign: (profileId: string, sectionId: string | null) => void;
  onRoleChange: (profileId: string, role: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-odoo-border rounded-lg px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-odoo-muted/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {profile.full_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.full_name}</p>
      </div>
      <select className="text-xs border border-odoo-border rounded px-1.5 py-1 bg-white"
        value={profile.role}
        onChange={(e) => onRoleChange(profile.id, e.target.value)}>
        <option value="employee">Employé</option>
        <option value="cashier">Caissier</option>
      </select>
      <select className="text-xs border border-odoo-border rounded px-1.5 py-1 bg-white"
        value="" onChange={(e) => { if (e.target.value) onAssign(profile.id, e.target.value); }}>
        <option value="">Assigner…</option>
        {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );
}
