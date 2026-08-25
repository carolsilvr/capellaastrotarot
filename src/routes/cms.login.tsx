import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, Layout, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/cms/login')({
  component: CmsLoginPage,
});

function CmsLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, user, isAdmin, role } = useAuth();
  const navigate = useNavigate();

  // Se já está logado como admin, vai direto pro CMS
  React.useEffect(() => {
    if (user && isAdmin) {
      navigate({ to: '/cms' });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await signIn(email, password);

    if (error) {
      setErrorMsg('Credenciais inválidas. Verifique seu e-mail e senha.');
      setLoading(false);
      return;
    }

    // Verifica se o usuário logado tem papel de admin
    // (sem atribuir admin automaticamente — isso precisa ser feito manualmente no SQL)
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userData.user.id)
          .single();

        if (!roleRow || roleRow.role !== 'admin') {
          // Não é admin — desloga e mostra erro
          await supabase.auth.signOut();
          setErrorMsg(
            'Acesso negado. Esta área é exclusiva para a administradora do site. ' +
            'Se você é cliente, acesse /auth/login.'
          );
          setLoading(false);
          return;
        }
      }
    } catch {
      setErrorMsg('Erro ao verificar permissões. Tente novamente.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Admin confirmado — redireciona
    navigate({ to: '/cms' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0712] text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      <header className="px-6 py-6 border-b border-purple-900/40 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 text-xl font-serif tracking-widest text-amber-200 hover:text-amber-100 transition-colors">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>CAPELLA CMS</span>
        </Link>
        <Link to="/" className="text-xs tracking-wider uppercase text-slate-400 hover:text-white transition-colors">
          Voltar ao site
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md bg-[#130d21] border border-amber-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3 text-amber-300">
              <Layout className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif text-amber-100 mb-2">
              Painel de Gestão CMS
            </h1>
            <p className="text-xs text-slate-400">
              Área exclusiva para a Taróloga / Administradora do site
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">E-mail da Administradora</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090611] border border-purple-900/50 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090611] border border-purple-900/50 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Verificando acesso…</span>
              ) : (
                <>
                  <span>Entrar no CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-900/30 text-center">
            <p className="text-[11px] text-slate-500">
              <ShieldCheck className="w-3 h-3 inline mr-1 text-slate-400" />
              Acesso restrito. Apenas a administradora do site pode entrar aqui.
            </p>
            <a href="/auth/login" className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors block mt-2">
              É cliente? Acesse sua área aqui →
            </a>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-purple-900/20">
        Capella AstroTarot Studio CMS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
