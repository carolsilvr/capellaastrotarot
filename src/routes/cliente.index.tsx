import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Calendar, Clock, CreditCard, User as UserIcon, LogOut, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/cliente/')({
  component: ClienteDashboardPage,
});

interface BookingItem {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_status: string;
  price_cents: number;
  service_id: string;
  services?: {
    name: string;
    duration_minutes: number;
  } | null;
}

function ClienteDashboardPage() {
  const { user, profile, loading: authLoading, signOut, role } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/auth/login' });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.email) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          starts_at,
          ends_at,
          status,
          payment_status,
          price_cents,
          service_id,
          services (
            name,
            duration_minutes
          )
        `)
        .eq('customer_email', user?.email ?? '')
        .order('starts_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
      } else if (data) {
        setBookings(data as unknown as BookingItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-slate-100 flex items-center justify-center">
        <div className="text-amber-200 text-sm animate-pulse flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Carregando Portal do Cliente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0914] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-purple-900/30 bg-[#150f24]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-serif text-amber-200 tracking-wider">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>CAPELLA</span>
          </Link>

          <div className="flex items-center gap-4">
            {role === 'admin' && (
              <Link
                to="/admin"
                className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-all"
              >
                Painel Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#170f2b] to-[#120a21] border border-purple-900/40 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-900/50 border border-amber-400/30 flex items-center justify-center text-amber-200 font-serif text-xl shadow-inner">
              {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif text-amber-100">
                Olá, {profile?.full_name || 'Cliente'}!
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <Link
            to="/agendar"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </Link>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#150f24] border border-purple-900/30 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Total de Agendamentos</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">{bookings.length}</p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Sessões Confirmadas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>

          <div className="bg-[#150f24] border border-purple-900/30 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs">Aguardando Pagamento</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-serif text-amber-100">
              {bookings.filter(b => b.payment_status === 'unpaid').length}
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-[#150f24] border border-purple-900/40 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-serif text-amber-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Meus Agendamentos</span>
          </h2>

          {loadingBookings ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Carregando agendamentos...
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="text-sm">Você ainda não realizou nenhum agendamento.</p>
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 underline"
              >
                Agende sua leitura de Tarot ou Mapa Astral
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[#0c0816] border border-purple-900/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-purple-800/50 transition-all"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-amber-200">
                      {booking.services?.name || 'Consulta Astrológica / Tarot'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(booking.starts_at)}
                      </span>
                      {booking.services?.duration_minutes && (
                        <span>({booking.services.duration_minutes} min)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-purple-900/30">
                    <span className="text-sm font-medium text-slate-200">
                      {formatCurrency(booking.price_cents)}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium ${
                        booking.payment_status === 'paid'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                      }`}
                    >
                      {booking.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-purple-900/20">
        Capella AstroTarot &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
