"use client";

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Link, QrCode, Clipboard, Check, Loader2, Users, HeartCrack, LogOut } from 'lucide-react';

interface CoupleConnectProps {
  onCoupleConnected: () => void;
  userName: string;
  userCoupleId: string | null;
}

export function CoupleConnect({ onCoupleConnected, userName, userCoupleId }: CoupleConnectProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [coupleCode, setCoupleCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userCoupleId) {
      onCoupleConnected();
    }
  }, [userCoupleId, onCoupleConnected]);

  const generateNewCode = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    setGeneratedCode('');
    setCoupleCode('');
    setError('');

    try {
      const res = await fetch('/api/couples/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: session.user.email }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedCode(data.code);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Falha ao gerar código. Tente novamente.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao gerar o código.');
    }
    finally {
      setLoading(false);
    }
  };

  const connectWithCode = async () => {
    if (!coupleCode || !session?.user?.email) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/couples/connect-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: session.user.email, code: coupleCode }),
      });

      if (res.ok) {
        onCoupleConnected();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Falha ao conectar. Verifique o código.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao conectar com o código.');
    }
    finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 border border-love-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-love-400 to-love-600"></div>

        <div className="w-20 h-20 bg-love-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Link className="text-love-500 fill-love-500 animate-pulse-slow" size={40} />
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-800">Conecte-se com seu Amor</h1>
          <p className="text-slate-500 mt-2">
            Olá, {userName}! Para começar sua jornada devocional a dois, conecte-se com seu parceiro(a).
          </p>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="space-y-4">
          {/* Option 1: Generate Code */}
          <div className="border border-love-100 p-4 rounded-xl space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <QrCode size={18} /> 1. Gerar um código
            </h3>
            <p className="text-sm text-slate-600">
              Gere um código único e compartilhe com seu parceiro(a) para que ele(a) se conecte a você.
            </p>
            {generatedCode ? (
              <div className="flex items-center justify-between bg-love-50 border border-love-200 rounded-lg p-3">
                <span className="font-mono text-lg text-love-800 font-bold tracking-wider">{generatedCode}</span>
                <button
                  onClick={copyCodeToClipboard}
                  className="p-2 rounded-md bg-love-100 text-love-600 hover:bg-love-200 transition-colors"
                  title="Copiar código"
                >
                  {copySuccess ? <Check size={18} /> : <Clipboard size={18} />}
                </button>
              </div>
            ) : (
              <button
                onClick={generateNewCode}
                disabled={loading}
                className="w-full bg-love-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-love-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Gerar Meu Código'}
              </button>
            )}
            {generatedCode && <p className="text-xs text-green-600">Código gerado! Compartilhe com seu amor.</p>}
          </div>

          {/* Separator */}
          <div className="flex items-center justify-center text-slate-400 text-sm font-semibold">
            <span className="w-1/3 border-b border-slate-200"></span>
            <span className="px-2">OU</span>
            <span className="w-1/3 border-b border-slate-200"></span>
          </div>

          {/* Option 2: Enter Partner's Code */}
          <div className="border border-love-100 p-4 rounded-xl space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Users size={18} /> 2. Inserir código do parceiro(a)
            </h3>
            <p className="text-sm text-slate-600">
              Seu parceiro(a) já gerou um código? Digite-o aqui para se conectar.
            </p>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={coupleCode}
                onChange={(e) => setCoupleCode(e.target.value)}
                placeholder="Ex: ABC-123-XYZ"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 outline-none focus:border-love-400 focus:ring-1 focus:ring-love-400 transition-all"
              />
            </div>
            <button
              onClick={connectWithCode}
              disabled={loading || !coupleCode}
              className="w-full bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Conectar Agora'}
            </button>
          </div>
        </div>
      <div className="flex justify-center mt-6">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 rounded-full text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>

      </div>
    </div>
  );
}
