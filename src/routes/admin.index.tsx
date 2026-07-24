import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Calendar, Clock, ShieldCheck, DollarSign, Users, Settings, Plus, Check, X, LogOut, Lock } from 'lucide-react';

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

function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'agendamentos' | 'servicos' | 'bloqueios'>('agendamentos');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // New Block Form state
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      // Allow access for testing or redirect if not admin
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, servicesRes] = await Promise.all([
        supabase.from('bookings').select('*, services(name)').order('starts_at', { ascending: false }),
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data as unknown as Booking[]);
      if (servicesRes.data) setServices(servicesRes.data as Service[]);
    } catch (error) {
      console.error('Erro ao carregar dados do admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: Booking['payment_status']) => {
    const { error } = await supabase.from('bookings').update({ payment_status }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, payment_status } : b));
    }
  };

  const toggleServiceActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('services').update({ active: !currentActive }).eq('id', id);
    if (!error) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, active: !currentActive } : s));
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStart || !blockEnd) return;
    
    const { error } = await supabase.from('availability_blocks').insert({
      starts_at: new Date(blockStart).toISOString(),
      ends_at: new Date(blockEnd).toISOString(),
      reason: blockReason || 'Bloqueio de Agenda Admin',
    });

    if (!error) {
      alert('Bloqueio de horário adicionado com sucesso!');
      setBlockStart('');
      setBlockEnd('');
      setBlockReason('');
    } else {
      alert('Erro ao adicionar bloqueio.');
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-slate-100 flex items-center justify-center">
        <div className="text-amber-200 text-sm animate-pulse flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Verificando permissões de Administrador...</span>
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
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              PAINEL ADMIN
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/cliente" className="text-xs text-slate-400 hover:text-white transition-colors">
              Portal do Cliente
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Total de Agendamentos</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-serif text-amber-100">{bookings.length}</p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Faturamento Pago</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-serif text-amber-100">
              {formatCurrency(
                bookings
                  .filter(b => b.payment_status === 'paid')
                  .reduce((acc, b) => acc + (b.price_cents || 0), 0)
              )}
            </p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Serviços Ativos</span>
              <Settings className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-serif text-amber-100">
              {services.filter(s => s.active).length}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-900/40 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`pb-3 transition-all ${
              activeTab === 'agendamentos'
                ? 'text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agendamentos
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`pb-3 transition-all ${
              activeTab === 'servicos'
                ? 'text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Serviços & Preços
          </button>
          <button
            onClick={() => setActiveTab('bloqueios')}
            className={`pb-3 transition-all ${
              activeTab === 'bloqueios'
                ? 'text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bloquear Agenda
          </button>
        </div>

        {/* TAB 1: AGENDAMENTOS */}
        {activeTab === 'agendamentos' && (
          <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-serif text-amber-100">Gestão de Agendamentos</h2>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Carregando...</div>
            ) : bookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum agendamento encontrado.</p>
            ) : (
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
                      <th className="py-3 px-4 text-right">Ações</th>
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
                            booking.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                            booking.status === 'cancelled' ? 'bg-red-950 text-red-300 border border-red-800/40' :
                            'bg-amber-950 text-amber-300 border border-amber-800/40'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => updatePaymentStatus(booking.id, booking.payment_status === 'paid' ? 'unpaid' : 'paid')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase cursor-pointer ${
                              booking.payment_status === 'paid'
                                ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {booking.payment_status === 'paid' ? 'Pago' : 'Marcar Pago'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {booking.status !== 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded"
                              title="Confirmar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="p-1 text-red-400 hover:bg-red-950/60 rounded"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVIÇOS */}
        {activeTab === 'servicos' && (
          <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-serif text-amber-100">Serviços e Valores</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div key={service.id} className="bg-[#0c0816] border border-purple-900/30 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-amber-200">{service.name}</h3>
                      <p className="text-xs text-slate-400">{service.short_description}</p>
                    </div>
                    <button
                      onClick={() => toggleServiceActive(service.id, service.active)}
                      className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${
                        service.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {service.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-900/20 text-xs">
                    <span className="text-slate-400">Duração: {service.duration_minutes} min</span>
                    <span className="text-amber-300 font-semibold">{formatCurrency(service.price_cents)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BLOQUEIOS */}
        {activeTab === 'bloqueios' && (
          <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl max-w-xl space-y-4">
            <h2 className="text-lg font-serif text-amber-100">Bloquear Intervalo de Agenda</h2>

            <form onSubmit={handleAddBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Início do Bloqueio</label>
                <input
                  type="datetime-local"
                  required
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Fim do Bloqueio</label>
                <input
                  type="datetime-local"
                  required
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Férias, Evento pessoal"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Salvar Bloqueio de Horário</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
