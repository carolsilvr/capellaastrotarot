import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  DollarSign,
  Settings,
  Plus,
  Check,
  X,
  LogOut,
  Lock,
  FileText,
  Layout,
  MessageSquare,
  ExternalLink,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Megaphone,
  Share2,
  Wand2
} from 'lucide-react';

export const Route = createFileRoute('/cms/')({
  component: CmsStudioPage,
});

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  starts_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'processing' | 'paid' | 'refunded' | 'failed';
  price_cents: number;
  services?: { name: string } | null;
}

interface Service {
  id: string;
  name: string;
  short_description: string;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
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

function CmsStudioPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'cms' | 'blog' | 'agendamentos' | 'servicos' | 'depoimentos'>('cms');

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // CMS Settings Form state
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [announcementBanner, setAnnouncementBanner] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');

  // Blog Form state
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('Tarot');
  const [newBlogExcerpt, setNewBlogExcerpt] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogImage, setNewBlogImage] = useState('');

  // Service Form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(150);
  const [newServiceDuration, setNewServiceDuration] = useState(60);

  // FAQ & Testimonial state
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newTestimonialName, setNewTestimonialName] = useState('');
  const [newTestimonialRole, setNewTestimonialRole] = useState('');
  const [newTestimonialText, setNewTestimonialText] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/cms/login' });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCmsData();
  }, []);

  const fetchCmsData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, servicesRes, blogRes, testimonialsRes, faqsRes, settingsRes] = await Promise.all([
        supabase.from('bookings').select('*, services(name)').order('starts_at', { ascending: false }),
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('faqs').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*'),
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data as unknown as Booking[]);
      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (blogRes.data) setBlogPosts(blogRes.data as BlogPost[]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as Testimonial[]);
      if (faqsRes.data) setFaqs(faqsRes.data as FAQ[]);

      if (settingsRes.data) {
        settingsRes.data.forEach((item: any) => {
          if (item.key === 'hero_title') setHeroTitle(typeof item.value === 'string' ? item.value : JSON.stringify(item.value).replace(/"/g, ''));
          if (item.key === 'hero_subtitle') setHeroSubtitle(typeof item.value === 'string' ? item.value : JSON.stringify(item.value).replace(/"/g, ''));
          if (item.key === 'announcement_banner') setAnnouncementBanner(typeof item.value === 'string' ? item.value : JSON.stringify(item.value).replace(/"/g, ''));
          if (item.key === 'announcement_active') setAnnouncementActive(Boolean(item.value));
          if (item.key === 'contact_whatsapp') setContactWhatsapp(typeof item.value === 'string' ? item.value : JSON.stringify(item.value).replace(/"/g, ''));
          if (item.key === 'contact_instagram') setContactInstagram(typeof item.value === 'string' ? item.value : JSON.stringify(item.value).replace(/"/g, ''));
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do CMS:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        supabase.from('site_settings').upsert({ key: 'hero_title', value: heroTitle }),
        supabase.from('site_settings').upsert({ key: 'hero_subtitle', value: heroSubtitle }),
        supabase.from('site_settings').upsert({ key: 'announcement_banner', value: announcementBanner }),
        supabase.from('site_settings').upsert({ key: 'announcement_active', value: announcementActive }),
        supabase.from('site_settings').upsert({ key: 'contact_whatsapp', value: contactWhatsapp }),
        supabase.from('site_settings').upsert({ key: 'contact_instagram', value: contactInstagram }),
      ]);
      alert('Configurações salvas com sucesso! As alterações já estão ao vivo no site.');
    } catch (err) {
      alert('Erro ao salvar alterações.');
    }
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newBlogTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    const { error } = await supabase.from('blog_posts').insert({
      title: newBlogTitle,
      slug,
      excerpt: newBlogExcerpt,
      content: newBlogContent,
      category: newBlogCategory,
      cover_image_url: newBlogImage || null,
      published: true,
      reading_minutes: Math.ceil(newBlogContent.split(' ').length / 200) || 5,
      author_name: 'Capella',
    });

    if (!error) {
      alert('Post publicado com sucesso!');
      setNewBlogTitle('');
      setNewBlogExcerpt('');
      setNewBlogContent('');
      setNewBlogImage('');
      fetchCmsData();
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newServiceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    const { error } = await supabase.from('services').insert({
      name: newServiceName,
      slug,
      short_description: newServiceDesc,
      price_cents: Math.round(newServicePrice * 100),
      duration_minutes: newServiceDuration,
      active: true,
    });

    if (!error) {
      alert('Serviço/Subproduto criado!');
      setNewServiceName('');
      setNewServiceDesc('');
      fetchCmsData();
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('faqs').insert({ question: newFaqQuestion, answer: newFaqAnswer, active: true });
    if (!error) { alert('FAQ adicionada!'); setNewFaqQuestion(''); setNewFaqAnswer(''); fetchCmsData(); }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('testimonials').insert({ name: newTestimonialName, role: newTestimonialRole, text: newTestimonialText, active: true });
    if (!error) { alert('Depoimento adicionado!'); setNewTestimonialName(''); setNewTestimonialRole(''); setNewTestimonialText(''); fetchCmsData(); }
  };

  const getGoogleCalendarUrl = (booking: Booking) => {
    const start = new Date(booking.starts_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(new Date(booking.starts_at).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`Consulta Tarot: ${booking.customer_name}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}`;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0712] text-slate-100 flex items-center justify-center">
        <div className="text-amber-200 text-sm animate-pulse flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Carregando o Capella CMS Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0712] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-purple-900/40 bg-[#130d21]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xl font-serif text-amber-200 tracking-wider">
              <Wand2 className="w-5 h-5 text-amber-400" />
              <span>CAPELLA CMS STUDIO</span>
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30">
              ELEMENTOR-STYLE CMS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" target="_blank" className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-purple-900/40 px-3 py-1.5 rounded-lg border border-purple-800/40">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Visualizar Site</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-purple-900/40 gap-4 text-xs font-semibold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('cms')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'cms' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-slate-200 bg-[#130d21]'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Personalizar Site & Banners (CMS)</span>
          </button>

          <button
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'blog' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-slate-200 bg-[#130d21]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Editor do Blog</span>
          </button>

          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'agendamentos' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-slate-200 bg-[#130d21]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda & Google Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('servicos')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'servicos' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-slate-200 bg-[#130d21]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Serviços & Subprodutos</span>
          </button>

          <button
            onClick={() => setActiveTab('depoimentos')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'depoimentos' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-slate-200 bg-[#130d21]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Depoimentos & FAQ</span>
          </button>
        </div>

        {/* TAB 1: PERSONALIZAR SITE (CMS & BANNERS) */}
        {activeTab === 'cms' && (
          <div className="bg-[#130d21] border border-amber-500/30 rounded-2xl p-6 shadow-2xl max-w-3xl space-y-6">
            <h2 className="text-lg font-serif text-amber-100 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-400" />
              <span>Gerenciador Visual do Site & Banners (CMS Elementor)</span>
            </h2>

            <form onSubmit={saveCmsSettings} className="space-y-5 text-xs">
              <div className="space-y-3 bg-[#0a0712] p-4 rounded-xl border border-purple-900/30">
                <h3 className="font-semibold text-amber-300 text-xs flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Barra de Avisos no Topo do Site</span>
                </h3>
                <div>
                  <label className="block text-slate-300 mb-1">Texto do Anúncio / Aviso</label>
                  <input
                    type="text"
                    value={announcementBanner}
                    onChange={e => setAnnouncementBanner(e.target.value)}
                    className="w-full p-2.5 bg-[#130d21] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="announcementActive"
                    checked={announcementActive}
                    onChange={e => setAnnouncementActive(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="announcementActive" className="text-slate-300 cursor-pointer font-medium">
                    Exibir esta faixa de anúncio no topo de todas as páginas do site
                  </label>
                </div>
              </div>

              <div className="space-y-3 bg-[#0a0712] p-4 rounded-xl border border-purple-900/30">
                <h3 className="font-semibold text-amber-300 text-xs">Hero Banner (Página Inicial)</h3>
                <div>
                  <label className="block text-slate-300 mb-1">Título Principal (H1)</label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={e => setHeroTitle(e.target.value)}
                    className="w-full p-2.5 bg-[#130d21] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Subtítulo / Descrição</label>
                  <textarea
                    rows={3}
                    value={heroSubtitle}
                    onChange={e => setHeroSubtitle(e.target.value)}
                    className="w-full p-2.5 bg-[#130d21] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-[#0a0712] p-4 rounded-xl border border-purple-900/30">
                <h3 className="font-semibold text-amber-300 text-xs">Canais de Atendimento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1">WhatsApp (Número com DDD)</label>
                    <input
                      type="text"
                      value={contactWhatsapp}
                      onChange={e => setContactWhatsapp(e.target.value)}
                      className="w-full p-2.5 bg-[#130d21] border border-purple-900/50 rounded-xl text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">URL do Instagram</label>
                    <input
                      type="text"
                      value={contactInstagram}
                      onChange={e => setContactInstagram(e.target.value)}
                      className="w-full p-2.5 bg-[#130d21] border border-purple-900/50 rounded-xl text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Alterações no Site ao Vivo</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: BLOG CMS */}
        {activeTab === 'blog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Artigos Publicados</h2>
              <div className="space-y-3">
                {blogPosts.map(post => (
                  <div key={post.id} className="bg-[#0a0712] border border-purple-900/30 rounded-xl p-4 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        {post.category}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-200">{post.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{post.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
              <h2 className="text-lg font-serif text-amber-100">Novo Artigo no Blog</h2>
              <form onSubmit={handleSaveBlogPost} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={newBlogTitle}
                    onChange={e => setNewBlogTitle(e.target.value)}
                    className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Conteúdo</label>
                  <textarea
                    required
                    rows={5}
                    value={newBlogContent}
                    onChange={e => setNewBlogContent(e.target.value)}
                    className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Artigo</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: AGENDAMENTOS & GOOGLE CALENDAR */}
        {activeTab === 'agendamentos' && (
          <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-serif text-amber-100">Agendamentos Marcados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-purple-900/50 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Serviço</th>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4 text-right">Google Calendar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#1a132d]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{booking.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{booking.customer_email}</div>
                      </td>
                      <td className="py-3 px-4 text-amber-200 font-medium">{booking.services?.name || 'Consulta'}</td>
                      <td className="py-3 px-4 text-slate-300">{new Date(booking.starts_at).toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-slate-200">{formatCurrency(booking.price_cents)}</td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={getGoogleCalendarUrl(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded border border-amber-500/30 text-[10px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Google Calendar</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SERVIÇOS & SUBPRODUTOS */}
        {activeTab === 'servicos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Serviços & Subprodutos do Tarot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-[#0a0712] border border-purple-900/30 rounded-xl p-5 space-y-2">
                    <h3 className="text-sm font-semibold text-amber-200">{service.name}</h3>
                    <p className="text-xs text-slate-400">{service.short_description}</p>
                    <div className="flex justify-between items-center pt-2 text-xs font-medium text-amber-300">
                      <span>{service.duration_minutes} min</span>
                      <span>{formatCurrency(service.price_cents)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
              <h2 className="text-lg font-serif text-amber-100">Cadastrar Subproduto</h2>
              <form onSubmit={handleCreateService} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Nome do Subproduto</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    placeholder="Tarot de Amor"
                    className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={e => setNewServicePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Subproduto</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: DEPOIMENTOS & FAQ */}
        {activeTab === 'depoimentos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Adicionar Depoimento</h2>
              <form onSubmit={handleAddTestimonial} className="space-y-4 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Nome do Cliente"
                  value={newTestimonialName}
                  onChange={e => setNewTestimonialName(e.target.value)}
                  className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Depoimento..."
                  value={newTestimonialText}
                  onChange={e => setNewTestimonialText(e.target.value)}
                  className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                />
                <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs">
                  Salvar Depoimento
                </button>
              </form>
            </div>

            <div className="bg-[#130d21] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Adicionar Pergunta Frequente</h2>
              <form onSubmit={handleAddFaq} className="space-y-4 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Pergunta"
                  value={newFaqQuestion}
                  onChange={e => setNewFaqQuestion(e.target.value)}
                  className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Resposta..."
                  value={newFaqAnswer}
                  onChange={e => setNewFaqAnswer(e.target.value)}
                  className="w-full p-2.5 bg-[#0a0712] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                />
                <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs">
                  Salvar Pergunta
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
