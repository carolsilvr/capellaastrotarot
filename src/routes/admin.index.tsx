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
  Share2
} from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
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

function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'agendamentos' | 'servicos' | 'blog' | 'cms' | 'depoimentos'>('agendamentos');
  const [calendarView, setCalendarView] = useState<'tabela' | 'mensal' | 'semanal'>('mensal');

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
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);

  // Service Form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(150);
  const [newServiceDuration, setNewServiceDuration] = useState(60);

  // FAQ Form state
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  // Testimonial Form state
  const [newTestimonialName, setNewTestimonialName] = useState('');
  const [newTestimonialRole, setNewTestimonialRole] = useState('');
  const [newTestimonialText, setNewTestimonialText] = useState('');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Block Schedule state
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // STRICT GUARD: Redirect if not logged in or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        navigate({ to: '/auth/login' });
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
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
          if (item.key === 'hero_title') setHeroTitle(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
          if (item.key === 'hero_subtitle') setHeroSubtitle(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
          if (item.key === 'announcement_banner') setAnnouncementBanner(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
          if (item.key === 'announcement_active') setAnnouncementActive(Boolean(item.value));
          if (item.key === 'contact_whatsapp') setContactWhatsapp(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
          if (item.key === 'contact_instagram') setContactInstagram(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updatePaymentStatus = async (id: string, payment_status: Booking['payment_status']) => {
    const { error } = await supabase.from('bookings').update({ payment_status }).eq('id', id);
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, payment_status } : b));
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
      alert('Configurações do site salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
    }
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newBlogTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    
    if (editingBlogPost) {
      const { error } = await supabase.from('blog_posts').update({
        title: newBlogTitle,
        slug,
        excerpt: newBlogExcerpt,
        content: newBlogContent,
        category: newBlogCategory,
        cover_image_url: newBlogImage || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editingBlogPost.id);

      if (!error) {
        alert('Post atualizado com sucesso!');
        setEditingBlogPost(null);
        fetchAdminData();
      }
    } else {
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
        fetchAdminData();
      }
    }
  };

  const toggleBlogPostPublished = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('blog_posts').update({ published: !currentStatus }).eq('id', id);
    if (!error) setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, published: !currentStatus } : p));
  };

  const deleteBlogPost = async (id: string) => {
    if (!confirm('Deseja realmente excluir este post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (!error) setBlogPosts(prev => prev.filter(p => p.id !== id));
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
      alert('Serviço/Subproduto criado com sucesso!');
      setNewServiceName('');
      setNewServiceDesc('');
      fetchAdminData();
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('faqs').insert({
      question: newFaqQuestion,
      answer: newFaqAnswer,
      active: true,
    });
    if (!error) {
      alert('Pergunta frequente adicionada!');
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      fetchAdminData();
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('testimonials').insert({
      name: newTestimonialName,
      role: newTestimonialRole,
      text: newTestimonialText,
      active: true,
    });
    if (!error) {
      alert('Depoimento adicionado!');
      setNewTestimonialName('');
      setNewTestimonialRole('');
      setNewTestimonialText('');
      fetchAdminData();
    }
  };

  const getGoogleCalendarUrl = (booking: Booking) => {
    const start = new Date(booking.starts_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(new Date(booking.starts_at).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`Consulta: ${booking.services?.name || 'Tarot/Astrologia'} - ${booking.customer_name}`);
    const details = encodeURIComponent(`Cliente: ${booking.customer_name}\nE-mail: ${booking.customer_email}\nTelefone: ${booking.customer_phone}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  // Guard Render Check
  if (authLoading || (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-slate-100 flex items-center justify-center">
        <div className="text-amber-200 text-sm animate-pulse flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" />
          <span>Verificando acesso restrito da Taróloga / Admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0914] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-purple-900/40 bg-[#150f24]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xl font-serif text-amber-200 tracking-wider">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>CAPELLA</span>
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PAINEL ADMIN CMS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" target="_blank" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Site</span>
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
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Agendamentos</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">{bookings.length}</p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Faturamento Pago</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">
              {formatCurrency(bookings.filter(b => b.payment_status === 'paid').reduce((acc, b) => acc + (b.price_cents || 0), 0))}
            </p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Posts no Blog</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">{blogPosts.length}</p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Serviços / Subprodutos</span>
              <Settings className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">{services.filter(s => s.active).length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-900/40 gap-6 text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'agendamentos' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agendamentos & Agenda</span>
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'servicos' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Serviços & Subprodutos</span>
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'blog' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Blog CMS</span>
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'cms' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Personalizar Site & Banners</span>
          </button>
          <button
            onClick={() => setActiveTab('depoimentos')}
            className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'depoimentos' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Depoimentos & FAQ</span>
          </button>
        </div>

        {/* TAB 1: AGENDAMENTOS & CALENDÁRIO */}
        {activeTab === 'agendamentos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-serif text-amber-100">Gestão da Agenda & Atendimentos</h2>
              <div className="flex items-center bg-[#0c0816] p-1 rounded-xl border border-purple-900/40 text-xs">
                <button
                  onClick={() => setCalendarView('mensal')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    calendarView === 'mensal' ? 'bg-purple-900/60 text-amber-200' : 'text-slate-400'
                  }`}
                >
                  Visão Mensal
                </button>
                <button
                  onClick={() => setCalendarView('tabela')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    calendarView === 'tabela' ? 'bg-purple-900/60 text-amber-200' : 'text-slate-400'
                  }`}
                >
                  Lista Completa
                </button>
              </div>
            </div>

            {/* Visão Mensal de Calendário */}
            {calendarView === 'mensal' && (
              <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-1.5 bg-[#0c0816] border border-purple-900/50 rounded-lg hover:border-amber-400/50"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-1.5 bg-[#0c0816] border border-purple-900/50 rounded-lg hover:border-amber-400/50"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400 font-medium pb-2 border-b border-purple-900/30">
                  <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, index) => {
                    const dayNumber = index - new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 1;
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
                    const isCurrentMonth = dayNumber > 0 && dayNumber <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                    
                    const dayBookings = bookings.filter(b => {
                      const bDate = new Date(b.starts_at);
                      return bDate.getDate() === dateObj.getDate() && bDate.getMonth() === dateObj.getMonth() && bDate.getFullYear() === dateObj.getFullYear();
                    });

                    return (
                      <div
                        key={index}
                        className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between text-xs transition-all ${
                          isCurrentMonth
                            ? 'bg-[#0c0816] border-purple-900/30 hover:border-purple-700/50'
                            : 'bg-[#08050e]/50 border-transparent opacity-30'
                        }`}
                      >
                        <span className="font-serif font-bold text-slate-300">{isCurrentMonth ? dayNumber : ''}</span>
                        {isCurrentMonth && dayBookings.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {dayBookings.map(b => (
                              <div
                                key={b.id}
                                className={`p-1 rounded text-[10px] truncate flex items-center justify-between ${
                                  b.status === 'confirmed' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                                }`}
                                title={`${b.customer_name} - ${b.services?.name}`}
                              >
                                <span>{b.customer_name.split(' ')[0]}</span>
                                <a
                                  href={getGoogleCalendarUrl(b)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-300 hover:text-white"
                                  title="Add ao Google Agenda"
                                >
                                  <Share2 className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabela de Agendamentos */}
            {calendarView === 'tabela' && (
              <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-purple-900/50 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Serviço</th>
                        <th className="py-3 px-4">Data/Hora</th>
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Pagamento</th>
                        <th className="py-3 px-4 text-right">Google Calendar / Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-[#1a132d]/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-200">{booking.customer_name}</div>
                            <div className="text-[11px] text-slate-400">{booking.customer_email}</div>
                            <div className="text-[10px] text-slate-500">{booking.customer_phone}</div>
                          </td>
                          <td className="py-3 px-4 text-amber-200 font-medium">
                            {booking.services?.name || 'Consulta'}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {new Date(booking.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 text-slate-200 font-medium">
                            {formatCurrency(booking.price_cents)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              booking.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => updatePaymentStatus(booking.id, booking.payment_status === 'paid' ? 'unpaid' : 'paid')}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase cursor-pointer ${
                                booking.payment_status === 'paid' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {booking.payment_status === 'paid' ? 'Pago' : 'Marcar Pago'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <a
                              href={getGoogleCalendarUrl(booking)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded border border-amber-500/30 text-[10px]"
                              title="Adicionar ao Google Agenda"
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
          </div>
        )}

        {/* TAB 2: SERVIÇOS & SUBPRODUTOS */}
        {activeTab === 'servicos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Serviços e Subprodutos Ativos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-[#0c0816] border border-purple-900/30 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-semibold text-amber-200">{service.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{service.short_description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-purple-900/20 text-xs">
                      <span className="text-slate-400">{service.duration_minutes} min</span>
                      <span className="text-amber-300 font-semibold">{formatCurrency(service.price_cents)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criar Subproduto Form */}
            <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
              <h2 className="text-lg font-serif text-amber-100">Criar Novo Subproduto</h2>
              <form onSubmit={handleCreateService} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Nome do Subproduto (ex: Tarot de Amor)</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    placeholder="Tarot de Amor"
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Descrição Rápida</label>
                  <input
                    type="text"
                    required
                    value={newServiceDesc}
                    onChange={e => setNewServiceDesc(e.target.value)}
                    placeholder="Leitura focada em relacionamentos e vínculos"
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Preço (R$)</label>
                    <input
                      type="number"
                      required
                      value={newServicePrice}
                      onChange={e => setNewServicePrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Duração (Minutos)</label>
                    <input
                      type="number"
                      required
                      value={newServiceDuration}
                      onChange={e => setNewServiceDuration(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Subproduto</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: BLOG CMS */}
        {activeTab === 'blog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Artigos Publicados no Blog</h2>
              <div className="space-y-4">
                {blogPosts.map(post => (
                  <div key={post.id} className="bg-[#0c0816] border border-purple-900/30 rounded-xl p-4 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        {post.category}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-200">{post.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleBlogPostPublished(post.id, post.published)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          post.published ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {post.published ? 'Publicado' : 'Rascunho'}
                      </button>
                      <button onClick={() => deleteBlogPost(post.id)} className="p-1 text-red-400 hover:bg-red-950/60 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criar/Editar Post */}
            <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
              <h2 className="text-lg font-serif text-amber-100">
                {editingBlogPost ? 'Editar Artigo' : 'Novo Artigo no Blog'}
              </h2>
              <form onSubmit={handleSaveBlogPost} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Título do Artigo</label>
                  <input
                    type="text"
                    required
                    value={newBlogTitle}
                    onChange={e => setNewBlogTitle(e.target.value)}
                    placeholder="Os Arcanos Maiores e o Ano Pessoal"
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Categoria</label>
                  <select
                    value={newBlogCategory}
                    onChange={e => setNewBlogCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  >
                    <option value="Tarot">Tarot</option>
                    <option value="Astrologia">Astrologia</option>
                    <option value="Autoconhecimento">Autoconhecimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Resumo (Excerpt)</label>
                  <textarea
                    required
                    rows={2}
                    value={newBlogExcerpt}
                    onChange={e => setNewBlogExcerpt(e.target.value)}
                    placeholder="Breve resumo que aparece nos cards do blog..."
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Conteúdo Completo</label>
                  <textarea
                    required
                    rows={6}
                    value={newBlogContent}
                    onChange={e => setNewBlogContent(e.target.value)}
                    placeholder="Escreva aqui o seu artigo completo..."
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">URL da Imagem de Capa (Opcional)</label>
                  <input
                    type="url"
                    value={newBlogImage}
                    onChange={e => setNewBlogImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Artigo</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: PERSONALIZAR SITE (CMS & BANNERS) */}
        {activeTab === 'cms' && (
          <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl max-w-3xl space-y-6">
            <h2 className="text-lg font-serif text-amber-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-amber-400" />
              <span>Personalizar Textos do Site & Banners</span>
            </h2>

            <form onSubmit={saveCmsSettings} className="space-y-5 text-xs">
              <div className="space-y-3 bg-[#0c0816] p-4 rounded-xl border border-purple-900/30">
                <h3 className="font-semibold text-amber-300 text-xs flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Barra de Avisos no Topo</span>
                </h3>
                <div>
                  <label className="block text-slate-300 mb-1">Texto do Aviso</label>
                  <input
                    type="text"
                    value={announcementBanner}
                    onChange={e => setAnnouncementBanner(e.target.value)}
                    className="w-full p-2.5 bg-[#150f24] border border-purple-900/50 rounded-xl text-slate-200"
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
                  <label htmlFor="announcementActive" className="text-slate-300 cursor-pointer">
                    Exibir aviso no topo de todas as páginas
                  </label>
                </div>
              </div>

              <div className="space-y-3 bg-[#0c0816] p-4 rounded-xl border border-purple-900/30">
                <h3 className="font-semibold text-amber-300 text-xs">Hero Banner (Página Inicial)</h3>
                <div>
                  <label className="block text-slate-300 mb-1">Título Principal (H1)</label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={e => setHeroTitle(e.target.value)}
                    className="w-full p-2.5 bg-[#150f24] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Subtítulo / Descrição</label>
                  <textarea
                    rows={3}
                    value={heroSubtitle}
                    onChange={e => setHeroSubtitle(e.target.value)}
                    className="w-full p-2.5 bg-[#150f24] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-[#0c0816] p-4 rounded-xl border border-purple-900/30">
                <h3 className="font-semibold text-amber-300 text-xs">Canais de Atendimento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1">WhatsApp (Número com DDD)</label>
                    <input
                      type="text"
                      value={contactWhatsapp}
                      onChange={e => setContactWhatsapp(e.target.value)}
                      className="w-full p-2.5 bg-[#150f24] border border-purple-900/50 rounded-xl text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">URL do Instagram</label>
                    <input
                      type="text"
                      value={contactInstagram}
                      onChange={e => setContactInstagram(e.target.value)}
                      className="w-full p-2.5 bg-[#150f24] border border-purple-900/50 rounded-xl text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Todas as Configurações do Site</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: DEPOIMENTOS & FAQ */}
        {activeTab === 'depoimentos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Depoimentos Form */}
            <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Adicionar Depoimento</h2>
              <form onSubmit={handleAddTestimonial} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    value={newTestimonialName}
                    onChange={e => setNewTestimonialName(e.target.value)}
                    placeholder="Marina L."
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Profissão / Função (Opcional)</label>
                  <input
                    type="text"
                    value={newTestimonialRole}
                    onChange={e => setNewTestimonialRole(e.target.value)}
                    placeholder="Designer"
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Depoimento</label>
                  <textarea
                    required
                    rows={3}
                    value={newTestimonialText}
                    onChange={e => setNewTestimonialText(e.target.value)}
                    placeholder="Saí da sessão com uma clareza incrível..."
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Depoimento</span>
                </button>
              </form>
            </div>

            {/* FAQ Form */}
            <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-serif text-amber-100">Adicionar Pergunta Frequente (FAQ)</h2>
              <form onSubmit={handleAddFaq} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Pergunta</label>
                  <input
                    type="text"
                    required
                    value={newFaqQuestion}
                    onChange={e => setNewFaqQuestion(e.target.value)}
                    placeholder="O tarot prevê o futuro?"
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Resposta</label>
                  <textarea
                    required
                    rows={3}
                    value={newFaqAnswer}
                    onChange={e => setNewFaqAnswer(e.target.value)}
                    placeholder="Não. O tarot é uma linguagem simbólica..."
                    className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar FAQ</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
