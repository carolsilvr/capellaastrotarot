import React, { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';

export const Route = createFileRoute('/auth/login')({
  component: AuthLoginPage,
});

function AuthLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate({ to: '/cliente' });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message || 'Falha ao efetuar login. Verifique suas credenciais.');
      } else {
        setSuccessMsg('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => navigate({ to: '/cliente' }), 1000);
      }
    } else {
      if (!fullName) {
        setErrorMsg('Por favor, informe seu nome completo.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setErrorMsg(error.message || 'Falha no cadastro. Tente novamente.');
      } else {
        setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar ou faça login.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0914] text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Header Minimalista */}
      <header className="px-6 py-6 border-b border-purple-900/30 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 text-xl font-serif tracking-widest text-amber-200 hover:text-amber-100 transition-colors">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>CAPELLA</span>
        </Link>
        <Link to="/" className="text-xs tracking-wider uppercase text-slate-400 hover:text-white transition-colors">
          Voltar ao site
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md bg-[#150f24] border border-purple-900/40 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-amber-100 mb-2">
              {isLogin ? 'Acessar sua Conta' : 'Criar Nova Conta'}
            </h1>
            <p className="text-xs text-slate-400">
              {isLogin
                ? 'Entre para visualizar seus agendamentos e consultas astrológicas'
                : 'Cadastre-se para agendar suas consultas e acessar o portal do cliente'}
            </p>
          </div>

          {/* Selector Tabs */}
          <div className="grid grid-cols-2 bg-[#0c0816] p-1 rounded-xl mb-6 border border-purple-900/30">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                isLogin ? 'bg-purple-900/50 text-amber-200 shadow-sm border border-purple-700/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                !isLogin ? 'bg-purple-900/50 text-amber-200 shadow-sm border border-purple-700/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0c0816] border border-purple-900/50 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-medium rounded-xl text-sm shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Aguarde...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-purple-900/20">
        Capella AstroTarot &copy; {new Date().getFullYear()} · Todos os direitos reservados.
      </footer>
    </div>
  );
}
