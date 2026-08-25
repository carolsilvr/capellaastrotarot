import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles, Calendar, Settings, LogOut, FileText, Layout,
  MessageSquare, ExternalLink, Plus, Check, X, Edit2, Trash2,
  Eye, Wand2, Save, Megaphone, AlertCircle, RefreshCw,
  ToggleLeft, ToggleRight, DollarSign, Clock, Tag, ChevronDown,
  ChevronRight as ChevronRightIcon, Hash, Image, Globe, Phone, Instagram
} from 'lucide-react';

export const Route = createFileRoute('/cms/')({
  component: CmsStudioPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
  sort_order: number;
  category?: string;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_status: string;
  price_cents: number;
  services?: { name: string } | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  category: string;
  reading_minutes: number;
  published: boolean;
  created_at: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  text: string;
  active: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  active: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const currency = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Shared UI components ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-[#0a0712] border border-purple-900/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors ${className}`}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-[#0a0712] border border-purple-900/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors resize-none"
    />
  );
}

function SaveBtn({ loading = false, label = 'Salvar' }: { loading?: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all"
    >
      <Save className="w-4 h-4" />
      {loading ? 'Salvando…' : label}
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border ${ok ? 'bg-emerald-950 border-emerald-600/40 text-emerald-200' : 'bg-red-950 border-red-700/40 text-red-200'}`}>
      {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
      {msg}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'cms' | 'blog' | 'agenda' | 'servicos' | 'depoimentos';

export default function CmsStudioPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('cms');

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blog, setBlog] = useState<BlogPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // CMS Settings
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsDirty, setSettingsDirty] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate({ to: '/cms/login' });
      } else if (!isAdmin) {
        // Usuário logado mas não é admin — acesso negado
        navigate({ to: '/cms/login' });
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => { if (user && isAdmin) fetchAll(); }, [user, isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [svcR, bkR, blgR, testR, faqR, setR] = await Promise.all([
        supabase.from('services').select('*').order('sort_order'),
        supabase.from('bookings').select('*, services(name)').order('starts_at', { ascending: false }).limit(100),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('faqs').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('key, value'),
      ]);

      // Verificar erros individualmente
      const errors = [
        svcR.error && `Serviços: ${svcR.error.message}`,
        bkR.error && `Agendamentos: ${bkR.error.message}`,
        blgR.error && `Blog: ${blgR.error.message}`,
        testR.error && `Depoimentos: ${testR.error.message}`,
        faqR.error && `FAQ: ${faqR.error.message}`,
        setR.error && `Configurações: ${setR.error.message}`,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Erros ao carregar CMS:', errors);
        // Continua com os dados que conseguiu carregar
      }

      if (svcR.data) setServices(svcR.data as Service[]);
      if (bkR.data) setBookings(bkR.data as unknown as Booking[]);
      if (blgR.data) setBlog(blgR.data as BlogPost[]);
      if (testR.data) setTestimonials(testR.data as Testimonial[]);
      if (faqR.data) setFaqs(faqR.data as FAQ[]);
      if (setR.data) {
        const map: Record<string, string> = {};
        for (const row of setR.data as any[]) {
          map[row.key] = typeof row.value === 'object'
            ? JSON.stringify(row.value).replace(/"/g, '')
            : String(row.value ?? '');
        }
        setSettings(map);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados.';
      setFetchError(msg);
      showToast('Erro ao carregar dados: ' + msg, false);
    } finally {
      setLoading(false);
    }
  };

  const setSetting = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSettingsDirty(true);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const upserts = Object.entries(settings).map(([key, value]) =>
      supabase.from('site_settings').upsert({ key, value }).then()
    );
    await Promise.all(upserts);
    setSettingsDirty(false);
    showToast('Configurações salvas! As alterações já estão ao vivo.');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'cms',        label: 'Site & Banners',   icon: <Layout className="w-4 h-4" /> },
    { key: 'blog',       label: 'Blog',             icon: <FileText className="w-4 h-4" /> },
    { key: 'agenda',     label: 'Agenda',           icon: <Calendar className="w-4 h-4" /> },
    { key: 'servicos',   label: 'Serviços',         icon: <Tag className="w-4 h-4" /> },
    { key: 'depoimentos',label: 'Depoimentos & FAQ',icon: <MessageSquare className="w-4 h-4" /> },
  ];

  // Aguarda auth resolver
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0712] flex items-center justify-center text-amber-300 text-sm">
        <Sparkles className="w-5 h-5 mr-2 animate-pulse" /> Carregando CMS…
      </div>
    );
  }

  // Bloqueio visual enquanto redireciona não-admins
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0712] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-slate-300">Acesso restrito. Redirecionando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09070f] text-slate-100 selection:bg-purple-600 selection:text-white">
      {toast && <Toast {...toast} />}

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-[#11092a]/95 border-b border-purple-900/50 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Wand2 className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-serif tracking-widest text-amber-200">CAPELLA CMS STUDIO</span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              v2
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" /> Ver Site
            </a>
            <button
              onClick={() => { signOut(); navigate({ to: '/' }); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32 text-slate-500 text-sm">
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Carregando dados…
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-red-300 max-w-md text-center">{fetchError}</p>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg text-xs hover:bg-amber-500/20 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {tab === 'cms'         && <TabCms settings={settings} setSetting={setSetting} onSave={saveSettings} dirty={settingsDirty} showToast={showToast} />}
            {tab === 'blog'        && <TabBlog posts={blog} refresh={fetchAll} showToast={showToast} />}
            {tab === 'agenda'      && <TabAgenda bookings={bookings} refresh={fetchAll} showToast={showToast} />}
            {tab === 'servicos'    && <TabServicos services={services} refresh={fetchAll} showToast={showToast} />}
            {tab === 'depoimentos' && <TabDepoimentos testimonials={testimonials} faqs={faqs} refresh={fetchAll} showToast={showToast} />}
          </>
        )}
      </main>
    </div>
  );
}

// ─── TAB: SITE & BANNERS (CMS) ────────────────────────────────────────────────

function TabCms({ settings, setSetting, onSave, dirty, showToast }: {
  settings: Record<string, string>;
  setSetting: (k: string, v: string) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  dirty: boolean;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif text-amber-100">Personalizar Site</h1>
          <p className="text-xs text-slate-400 mt-0.5">Edite textos e configurações que aparecem ao vivo no site.</p>
        </div>
        {dirty && (
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Alterações não salvas
          </span>
        )}
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {/* Announcement Banner */}
        <section className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" /> Faixa de Anúncio no Topo
          </h2>
          <Field label="Texto do Anúncio">
            <Input
              value={settings['announcement_banner'] ?? ''}
              onChange={v => setSetting('announcement_banner', v)}
              placeholder="Ex: 🌙 Novas datas disponíveis em agosto — agende já!"
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setSetting('announcement_active', settings['announcement_active'] === 'true' ? 'false' : 'true')}
              className="relative"
            >
              {settings['announcement_active'] === 'true'
                ? <ToggleRight className="w-9 h-5 text-amber-400" />
                : <ToggleLeft className="w-9 h-5 text-slate-500" />}
            </div>
            <span className="text-xs text-slate-300">
              {settings['announcement_active'] === 'true' ? 'Faixa visível no site' : 'Faixa oculta no site'}
            </span>
          </label>
        </section>

        {/* Hero */}
        <section className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" /> Texto Principal da Home (Hero)
          </h2>
          <Field label="Título H1">
            <Input
              value={settings['hero_title'] ?? ''}
              onChange={v => setSetting('hero_title', v)}
              placeholder="descubra o que as cartas têm a dizer."
            />
          </Field>
          <Field label="Subtítulo / Descrição">
            <Textarea
              value={settings['hero_subtitle'] ?? ''}
              onChange={v => setSetting('hero_subtitle', v)}
              placeholder="Leituras de tarot e mapa astral com profundidade e clareza."
            />
          </Field>
        </section>

        {/* Contato */}
        <section className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-400" /> Contatos & Redes Sociais
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="WhatsApp (somente números com DDD)">
              <Input
                value={settings['contact_whatsapp'] ?? ''}
                onChange={v => setSetting('contact_whatsapp', v)}
                placeholder="11999999999"
              />
            </Field>
            <Field label="Instagram (URL completo)">
              <Input
                value={settings['contact_instagram'] ?? ''}
                onChange={v => setSetting('contact_instagram', v)}
                placeholder="https://instagram.com/capellaastrotarot"
              />
            </Field>
          </div>
        </section>

        <SaveBtn label={dirty ? 'Salvar Alterações no Site Ao Vivo' : 'Salvo ✓'} />
      </form>
    </div>
  );
}

// ─── TAB: BLOG ───────────────────────────────────────────────────────────────

function TabBlog({ posts, refresh, showToast }: {
  posts: BlogPost[];
  refresh: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tarot');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (publishNow: boolean) => {
    if (!title.trim()) { showToast('Preencha o título do artigo.', false); return; }
    setSaving(true);
    const slug = slugify(title) + '-' + Date.now().toString(36);
    const { error } = await supabase.from('blog_posts').insert({
      title, slug, excerpt, content, category,
      cover_image_url: coverUrl || null,
      published: publishNow,
      reading_minutes: Math.max(1, Math.ceil((content.split(' ').length || 1) / 200)),
      author_name: 'Capella',
    });
    setSaving(false);
    if (error) { showToast('Erro ao salvar: ' + error.message, false); return; }
    showToast(publishNow ? 'Artigo publicado!' : 'Rascunho salvo!');
    setTitle(''); setExcerpt(''); setContent(''); setCoverUrl('');
    refresh();
  };

  const togglePublished = async (post: BlogPost) => {
    await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id);
    showToast(post.published ? 'Post ocultado.' : 'Post publicado!');
    refresh();
  };

  const deletePost = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    showToast('Artigo excluído.');
    refresh();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Editor */}
      <div className="lg:col-span-1 bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 h-fit space-y-4">
        <h2 className="text-lg font-serif text-amber-100">Novo Artigo</h2>
        <div className="space-y-4">
          <Field label="Título"><Input value={title} onChange={setTitle} placeholder="Título do artigo" /></Field>
          <Field label="Categoria">
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-[#0a0712] border border-purple-900/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-400/70">
              <option>Tarot</option>
              <option>Astrologia</option>
              <option>Autoconhecimento</option>
              <option>Espiritualidade</option>
            </select>
          </Field>
          <Field label="Resumo (aparece na listagem)">
            <Textarea value={excerpt} onChange={setExcerpt} placeholder="Um breve resumo do artigo…" />
          </Field>
          <Field label="Conteúdo completo">
            <Textarea value={content} onChange={setContent} placeholder="Escreva o conteúdo completo aqui…" rows={8} />
          </Field>
          <Field label="URL da Imagem de Capa (opcional)">
            <Input value={coverUrl} onChange={setCoverUrl} placeholder="https://…" />
          </Field>
          {/* Dois botões: Rascunho e Publicar */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 border border-slate-600/40 transition-all disabled:opacity-40"
            >
              {saving ? 'Salvando…' : 'Salvar Rascunho'}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 transition-all disabled:opacity-40"
            >
              {saving ? 'Publicando…' : 'Publicar ✨'}
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-serif text-amber-100">Artigos ({posts.length})</h2>
        {posts.length === 0 && (
          <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Nenhum artigo ainda. Crie seu primeiro post acima!
          </div>
        )}
        {posts.map(post => (
          <div key={post.id} className="bg-[#130d21] border border-purple-900/40 rounded-xl p-4 flex gap-4 items-start">
            {post.cover_image_url && (
              <img src={post.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  {post.category}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  post.published ? 'text-emerald-300 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10'
                }`}>
                  {post.published ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 truncate">{post.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{post.excerpt}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => togglePublished(post)}
                title={post.published ? 'Mover para Rascunho' : 'Publicar'}
                className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${
                  post.published ? 'text-emerald-400 hover:text-slate-400' : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => deletePost(post.id)} title="Excluir" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: AGENDA ─────────────────────────────────────────────────────────────

function TabAgenda({ bookings, refresh, showToast }: {
  bookings: Booking[];
  refresh: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const statusColors: Record<string, string> = {
    pending:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    confirmed: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    cancelled: 'text-red-300 bg-red-500/10 border-red-500/30',
    completed: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  };

  const paymentColors: Record<string, string> = {

    unpaid:     'text-slate-400 bg-slate-500/10 border-slate-500/30',
    processing: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    paid:       'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    refunded:   'text-purple-300 bg-purple-500/10 border-purple-500/30',
    failed:     'text-red-300 bg-red-500/10 border-red-500/30',
  };

  const paymentLabels: Record<string, string> = {
    unpaid: 'não pago', processing: 'processando', paid: 'pago ✔', refunded: 'reembolsado', failed: 'falhou',
  };

  const gcalUrl = (b: Booking) => {
    const s = new Date(b.starts_at).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const e = new Date(b.ends_at).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consulta: ' + b.customer_name)}&dates=${s}/${e}&details=${encodeURIComponent((b.services?.name ?? '') + '\n' + b.customer_email + '\n' + b.customer_phone)}`;
  };

  const updateStatus = async (id: string, status: Booking['status']) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    showToast('Status atualizado.');
    refresh();
  };

  const upcoming = bookings.filter(b => new Date(b.starts_at) >= new Date());
  const past = bookings.filter(b => new Date(b.starts_at) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif text-amber-100">Agenda de Consultas</h1>
        <span className="text-xs text-slate-400">{upcoming.length} próxima(s) — {past.length} passada(s)</span>
      </div>

      {bookings.length === 0 && (
        <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-12 text-center text-slate-500 text-sm">
          Nenhum agendamento ainda. Quando clientes reservarem, aparecerão aqui.
        </div>
      )}

      {[{ label: 'Próximas Consultas', list: upcoming }, { label: 'Consultas Passadas', list: past }].map(({ label, list }) =>
        list.length > 0 && (
          <div key={label} className="bg-[#130d21] border border-purple-900/40 rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-purple-900/30 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </div>
            <div className="divide-y divide-purple-900/20">
              {list.map(b => (
                <div key={b.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-200">{b.customer_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[b.status] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/30'}`}>
                        {b.status}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${paymentColors[b.payment_status] ?? paymentColors.unpaid}`}>
                        {paymentLabels[b.payment_status] ?? b.payment_status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-0.5">
                      <div>{b.services?.name ?? 'Consulta'} — {currency(b.price_cents)}</div>
                      <div>{new Date(b.starts_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      <div>{b.customer_email} · {b.customer_phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(b.id, 'confirmed')}
                        className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        Confirmar
                      </button>
                    )}
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(b.id, 'cancelled')}
                        className="text-xs px-3 py-1.5 bg-red-500/10 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <a
                      href={gcalUrl(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Google Calendar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── TAB: SERVIÇOS ────────────────────────────────────────────────────────────

function TabServicos({ services, refresh, showToast }: {
  services: Service[];
  refresh: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [newCategory, setNewCategory] = useState<'tarot' | 'astrologia'>('tarot');
  const [saving, setSaving] = useState(false);

  const startEdit = (s: Service) => { setEditId(s.id); setEditData({ ...s }); };
  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const saveEdit = async () => {
    if (!editId) return;
    const { error } = await supabase.from('services').update({
      name: editData.name,
      short_description: editData.short_description,
      price_cents: Math.round(Number(editData.price_cents)),
      duration_minutes: Number(editData.duration_minutes),
      ...(editData.category ? { category: editData.category } : {}),
      active: editData.active,
    }).eq('id', editId);
    if (error) { showToast('Erro ao salvar: ' + error.message, false); return; }
    showToast('Serviço atualizado!');
    cancelEdit();
    refresh();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id);
    showToast(s.active ? 'Serviço desativado.' : 'Serviço ativado!');
    refresh();
  };

  const deleteService = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return;
    await supabase.from('services').delete().eq('id', id);
    showToast('Serviço excluído.');
    refresh();
  };

  const createService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug = slugify(newName) + '-' + Date.now().toString(36);
    const { error } = await supabase.from('services').insert({
      name: newName, slug,
      short_description: newDesc,
      price_cents: Math.round(Number(newPrice) * 100),
      duration_minutes: Number(newDuration),
      active: true,
      sort_order: (services[services.length - 1]?.sort_order ?? 0) + 10,
    });
    setSaving(false);
    if (error) { showToast('Erro: ' + error.message, false); return; }
    showToast('Serviço criado!');
    setNewName(''); setNewDesc(''); setNewPrice(''); setNewDuration('60');
    refresh();
  };

  const grouped = {
    tarot: services.filter(s => s.category === 'tarot' || !s.category),
    astrologia: services.filter(s => s.category === 'astrologia'),
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Service List */}
      <div className="lg:col-span-2 space-y-6">
        {(['tarot', 'astrologia'] as const).map(cat => (
          <div key={cat} className="bg-[#130d21] border border-purple-900/40 rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-purple-900/30 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {cat === 'tarot' ? '🔮 Tarot' : '✨ Astrologia'}
              </span>
              <span className="text-[10px] text-slate-500">({grouped[cat].length} serviços)</span>
            </div>
            <div className="divide-y divide-purple-900/20">
              {grouped[cat].map(s => (
                <div key={s.id} className="px-5 py-4">
                  {editId === s.id ? (
                    /* ── Inline Edit Form ── */
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Nome">
                          <Input value={editData.name ?? ''} onChange={v => setEditData(d => ({ ...d, name: v }))} />
                        </Field>
                        <Field label="Categoria">
                          <select value={editData.category ?? 'tarot'} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0712] border border-purple-900/50 rounded-lg text-sm text-slate-200 focus:outline-none">
                            <option value="tarot">Tarot</option>
                            <option value="astrologia">Astrologia</option>
                          </select>
                        </Field>
                        <Field label="Preço (R$)">
                           <Input
                             value={String((editData.price_cents ?? 0) / 100)}
                             onChange={v => setEditData(d => ({ ...d, price_cents: Math.round(Number(v) * 100) }))}
                             type="number"
                             placeholder="Ex: 27"
                           />
                         </Field>
                        <Field label="Duração (minutos)">
                          <Input value={String(editData.duration_minutes ?? '')} onChange={v => setEditData(d => ({ ...d, duration_minutes: Number(v) }))} type="number" />
                        </Field>
                      </div>
                      <Field label="Descrição curta">
                        <Textarea value={editData.short_description ?? ''} onChange={v => setEditData(d => ({ ...d, short_description: v }))} />
                      </Field>
                      <div className="flex items-center gap-2 pt-1">
                        <button type="button" onClick={saveEdit} className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all">
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                        <button type="button" onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display Row ── */
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-semibold ${s.active ? 'text-slate-200' : 'text-slate-500 line-through'}`}>{s.name}</span>
                          {!s.active && <span className="text-[10px] text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded">inativo</span>}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{s.short_description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="text-amber-400 font-semibold">{currency(s.price_cents)}</span>
                          <span>·</span>
                          <span>{s.duration_minutes}min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleActive(s)} title={s.active ? 'Desativar' : 'Ativar'} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-300 transition-colors">
                          {s.active ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => startEdit(s)} title="Editar" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-blue-300 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteService(s.id)} title="Excluir" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {grouped[cat].length === 0 && (
                <div className="px-5 py-6 text-xs text-slate-500 text-center">Nenhum serviço nesta categoria.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 h-fit space-y-4">
        <h2 className="text-lg font-serif text-amber-100">Novo Subproduto</h2>
        <form onSubmit={createService} className="space-y-4">
          <Field label="Nome do Serviço"><Input value={newName} onChange={setNewName} placeholder="Ex: Tarot de Amor" /></Field>
          <Field label="Categoria">
            <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full px-3 py-2 bg-[#0a0712] border border-purple-900/50 rounded-lg text-sm text-slate-200 focus:outline-none">
              <option value="tarot">Tarot</option>
              <option value="astrologia">Astrologia</option>
            </select>
          </Field>
          <Field label="Descrição curta">
            <Textarea value={newDesc} onChange={setNewDesc} placeholder="Breve descrição do serviço…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço (R$)"><Input value={newPrice} onChange={setNewPrice} type="number" placeholder="150" /></Field>
            <Field label="Duração (min)"><Input value={newDuration} onChange={setNewDuration} type="number" placeholder="60" /></Field>
          </div>
          <SaveBtn loading={saving} label="Criar Serviço" />
        </form>
      </div>
    </div>
  );
}

// ─── TAB: DEPOIMENTOS & FAQ ──────────────────────────────────────────────────

function TabDepoimentos({ testimonials, faqs, refresh, showToast }: {
  testimonials: Testimonial[];
  faqs: FAQ[];
  refresh: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('');
  const [tText, setTText] = useState('');
  const [fQuestion, setFQuestion] = useState('');
  const [fAnswer, setFAnswer] = useState('');

  const addTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('testimonials').insert({ name: tName, role: tRole || '', text: tText, active: true });
    if (error) { showToast('Erro: ' + error.message, false); return; }
    showToast('Depoimento salvo!');
    setTName(''); setTRole(''); setTText('');
    refresh();
  };

  const addFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('faqs').insert({ question: fQuestion, answer: fAnswer, active: true });
    if (error) { showToast('Erro: ' + error.message, false); return; }
    showToast('Pergunta salva!');
    setFQuestion(''); setFAnswer('');
    refresh();
  };

  const toggleTestimonial = async (t: Testimonial) => {
    await supabase.from('testimonials').update({ active: !t.active }).eq('id', t.id);
    showToast(t.active ? 'Depoimento ocultado.' : 'Depoimento ativado!');
    refresh();
  };

  const toggleFaq = async (f: FAQ) => {
    await supabase.from('faqs').update({ active: !f.active }).eq('id', f.id);
    showToast(f.active ? 'FAQ ocultada.' : 'FAQ ativada!');
    refresh();
  };

  const deleteT = async (id: string) => { await supabase.from('testimonials').delete().eq('id', id); showToast('Depoimento excluído.'); refresh(); };
  const deleteF = async (id: string) => { await supabase.from('faqs').delete().eq('id', id); showToast('FAQ excluída.'); refresh(); };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* TESTIMONIALS */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif text-amber-100">Depoimentos ({testimonials.length})</h2>
        <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-5 space-y-4">
          <form onSubmit={addTestimonial} className="space-y-3">
            <Field label="Nome"><Input value={tName} onChange={setTName} placeholder="Maria Luísa" /></Field>
            <Field label="Cidade / Descrição (opcional)"><Input value={tRole} onChange={setTRole} placeholder="São Paulo, SP" /></Field>
            <Field label="Depoimento"><Textarea value={tText} onChange={setTText} rows={4} placeholder="Escreva o depoimento…" /></Field>
            <SaveBtn label="Salvar Depoimento" />
          </form>
        </div>
        <div className="space-y-2">
          {testimonials.map(t => (
            <div key={t.id} className={`bg-[#130d21] border rounded-xl p-4 flex gap-3 items-start ${t.active ? 'border-purple-900/40' : 'border-slate-700/30 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">{t.name} {t.role && <span className="text-slate-400 font-normal text-xs">· {t.role}</span>}</div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.text}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleTestimonial(t)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-amber-300 transition-colors">
                  {t.active ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteT(t.id)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif text-amber-100">Perguntas Frequentes ({faqs.length})</h2>
        <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-5 space-y-4">
          <form onSubmit={addFaq} className="space-y-3">
            <Field label="Pergunta"><Input value={fQuestion} onChange={setFQuestion} placeholder="Como funciona a leitura online?" /></Field>
            <Field label="Resposta"><Textarea value={fAnswer} onChange={setFAnswer} rows={4} placeholder="Escreva a resposta…" /></Field>
            <SaveBtn label="Salvar Pergunta" />
          </form>
        </div>
        <div className="space-y-2">
          {faqs.map(f => (
            <div key={f.id} className={`bg-[#130d21] border rounded-xl p-4 flex gap-3 items-start ${f.active ? 'border-purple-900/40' : 'border-slate-700/30 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">{f.question}</div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{f.answer}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleFaq(f)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-amber-300 transition-colors">
                  {f.active ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteF(f.id)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
