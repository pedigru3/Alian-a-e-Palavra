"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, UserRoundPlus, LogIn, Mail, KeyRound, ChevronRight, Loader2, Heart } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      // Handle Login
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Falha no login: Verifique seu email e senha.');
      } else {
        router.push('/app');
      }
    } else {
      // Handle Registration
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        if (res.ok) {
          // After successful registration, log the user in directly
          const loginResult = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });

          if (loginResult?.error) {
            setError('Cadastro realizado com sucesso, mas falha no login automático.');
          } else {
            router.push('/app');
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Falha no cadastro. Tente novamente.');
        }
      } catch (err) {
        setError('Ocorreu um erro no cadastro.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 border border-love-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-love-400 to-love-600"></div>

        <div className="w-20 h-20 bg-love-50 rounded-full flex items-center justify-center mx-auto mb-4">
          {isLogin ? (
            <Heart className="text-love-500 fill-love-500 animate-pulse-slow" size={40} />
          ) : (
            <UserRoundPlus className="text-love-500 fill-love-500 animate-pulse-slow" size={40} />
          )}
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-800">
            {isLogin ? 'Bem-vindo(a) de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isLogin ? 'Faça login para continuar sua jornada.' : 'Junte-se a nós para fortalecer sua fé.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Nome</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-love-400 focus:ring-1 focus:ring-love-400 transition-all"
                  required={!isLogin}
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-love-400 focus:ring-1 focus:ring-love-400 transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Senha</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-love-400 focus:ring-1 focus:ring-love-400 transition-all"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-love-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-love-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isLogin ? (
              <>
                Entrar <ChevronRight size={20} />
              </>
            ) : (
              <>
                Cadastrar <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-sm text-love-600 hover:underline"
        >
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
        </button>
      </div>
    </div>
  );
}
