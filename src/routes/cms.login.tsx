import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, Layout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/cms/login')({
  component: CmsLoginPage,
});

function CmsLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate({ to: '/cms' });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } else {
      // Auto-ensure user is admin role in database
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from('user_roles').upsert({
            user_id: userData.user.id,
            role: 'admin',
          }, { onConflict: 'user_id,role' });
        }
      } catch (err) {
        console.warn('Auto-role assign notice:', err);
      }
      setTimeout(() => navigate({ to: '/cms' }), 500);
    }
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
              Área exclusiva para personalização do site, publicação de artigos e gestão da agenda da Taróloga
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">E-mail da Taróloga / Admin</label>
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
                <span>Entrando...</span>
              ) : (
                <>
                  <span>Entrar no CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-purple-900/20">
        Capella AstroTarot Studio CMS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
