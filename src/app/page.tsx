'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useSession, signOut } from 'next-auth/react';
import {
  Heart,
  BookOpen,
  Flame,
  CheckCircle,
  Users,
  Sparkles,
  Lock,
  RefreshCw,
  ChevronDown,
  Feather,
  LogOut,
  Loader2,
} from 'lucide-react';
import { generateDevotionalContent, suggestScripture } from '@/services/geminiService';
import { User, DevotionalSession, WeeklyProgress, Note, Couple } from '@prisma/client';
import { ProgressBar } from '@/components/ProgressBar';
import { DayBadge } from '@/components/DayBadge';
import { AuthForm } from '@/components/AuthForm';
import { CoupleConnect } from '@/components/CoupleConnect';
import Link from 'next/link';

// --- SWR Fetcher ---
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-ignore
    error.info = await res.json();
    // @ts-ignore
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// --- Main App ---

// Define a type that includes the relation
interface UserWithCouple extends User {
  couple: (Couple & { users: User[] }) | null;
}

export default function Home() {
  // --- Authentication State ---
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const loadingSession = status === 'loading';
  const userId = session?.user?.id;

  // --- Local State Management ---
  const [appLoading, setAppLoading] = useState(false);
  const [sessionData, setSessionData] = useState<DevotionalSession | null>(null);

  const [scriptureInput, setScriptureInput] = useState('');
  const [activeTab, setActiveTab] = useState<'context' | 'christ' | 'application'>('context');

  // Notes Local State (for immediate typing feedback)
  const [myNote, setMyNote] = useState('');

  // --- SWR Hooks ---
  const { data: user, error: userError, mutate: mutateUser } = useSWR<UserWithCouple>(
    userId ? `/api/users/${userId}` : null,
    fetcher
  );

  // Derive partnerName from user.couple
  const partner = user?.couple?.users?.find((u: User) => u.id !== userId);
  const partnerName = partner?.name;
  const coupleCode = user?.couple?.code;

  const { data: progress, mutate: mutateProgress } = useSWR<WeeklyProgress>(
    userId ? `/api/weekly-progress/${userId}` : null,
    fetcher
  );

  const { data: history } = useSWR<DevotionalSession[]>(
    userId ? '/api/sessions/history' : null,
    fetcher
  );

  const { data: notes, mutate: mutateNotes } = useSWR<Note[]>(
    sessionData ? `/api/notes/session/${sessionData.id}` : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  // Poll for current active session for the couple
  const { data: currentSession, mutate: mutateCurrentSession } = useSWR<DevotionalSession | null>(
    user?.coupleId ? '/api/sessions/current' : null,
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds to check for partner's new session
  );

  // Auto-set session data if an active session is found and we aren't already in one
  useEffect(() => {
    if (currentSession && !sessionData) {
      setSessionData(currentSession);
      setScriptureInput(currentSession.scriptureReference);
    } else if (currentSession && sessionData && currentSession.id === sessionData.id && currentSession.status !== sessionData.status) {
       // Update status if it changed (e.g. partner finished)
       setSessionData(currentSession);
    } else if (!currentSession && sessionData) {
       // Session finalized elsewhere (e.g., partner concluiu). Limpa estado e força atualização.
       setSessionData(null);
       setScriptureInput('');
       mutateProgress();
    }
  }, [currentSession, sessionData, mutateProgress]);

  // Handle User Error
  useEffect(() => {
    if (userError) {
      console.error('Error fetching user:', userError);
      if (isAuthenticated) {
        signOut();
      }
    }
  }, [userError, isAuthenticated]);

  // Initialize Progress if missing for an authenticated user
  useEffect(() => {
    // Only initialize if user is authenticated and data is loaded and no progress exists
    if (user && isAuthenticated && !progress) {
      const initProgress = async () => {
        try {
          const defaultProgress = {
            weekStart: new Date().toISOString(),
            daysCompleted: '0,0,0,0,0,0,0',
            spiritualGrowthXP: 0,
            userId: user.id
          };
          await fetch(`/api/weekly-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultProgress)
          });
          mutateProgress();
        } catch (error) {
          console.error('Error creating weekly progress:', error);
        }
      };
      initProgress();
    }
  }, [user, progress, isAuthenticated, mutateProgress]);

  // Sync Notes from SWR to Local State
  const partnerNote = notes?.find(n => n.userId !== userId)?.content || '';

  useEffect(() => {
    if (notes && userId) {
      const serverMyNote = notes.find(n => n.userId === userId);
      if (serverMyNote && myNote === '') {
        setMyNote(serverMyNote.content);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, userId]);

  // --- Handlers ---
  const handleCoupleConnected = () => {
    // Force re-fetch user data to get updated coupleId (and potential partnerName from couple)
    mutateUser();
    // No explicit state change needed here, conditional rendering will pick it up
  };

  const handleGetSuggestion = async () => {
    setAppLoading(true);
    const sugg = await suggestScripture();
    setScriptureInput(sugg);
    setAppLoading(false);
  };

  const handleStartDevotional = async () => {
    if (!scriptureInput || !user) return;
    setAppLoading(true);

    try {
      const content = await generateDevotionalContent(scriptureInput);

      const newSessionPayload = {
        scriptureReference: scriptureInput,
        theme: content.theme,
        status: 'IN_PROGRESS',
        culturalContext: content.culturalContext,
        literaryContext: content.literaryContext,
        christConnection: content.christConnection,
        applicationQuestions: JSON.stringify(content.questions),
        userId: user.id,
        coupleId: user.coupleId
      };

      const sessionRes = await fetch(`/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionPayload),
      });

      if (sessionRes.ok) {
        const createdSession: DevotionalSession = await sessionRes.json();
        setSessionData(createdSession);

        await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '', sessionId: createdSession.id, userId: user.id })
        });

        mutateNotes();
        setScriptureInput('');
      } else {
        console.error('Failed to create session:', sessionRes.statusText);
      }
    } catch (error) {
      console.error('Error starting devotional:', error);
    } finally {
      setAppLoading(false);
    }
  };

  const handleNoteChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMyNote(newContent);

    if (!sessionData || !user || !notes) return;

    const myNoteObj = notes.find(n => n.userId === user.id);

    if (myNoteObj) {
        await fetch(`/api/notes/${myNoteObj.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent })
        });
        mutateNotes();
    }
  };

  const handleFinishSession = async () => {
    if (!sessionData || !user) return;

    setAppLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const updatedSession = await res.json();

      if (updatedSession.status === 'WAITING_PARTNER') {
        setSessionData(updatedSession);
        mutateCurrentSession();
        return;
      }

      setSessionData(null);
      setScriptureInput('');
      mutateProgress();
      mutateCurrentSession();
    } catch (error) {
      console.error('Error finishing session:', error);
    } finally {
      setAppLoading(false);
    }
  };

  // --- Views ---

  // Show loading while session status is being determined or app-specific loading is active
  if (loadingSession || appLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-rose-50"><Loader2 className="animate-spin text-love-400" size={48} /></div>;
  }

  // 1. If not authenticated, show AuthForm
  if (!isAuthenticated || !userId) {
    return <AuthForm />;
  }

  // 2. If authenticated and user data is loaded, but not part of a couple, show CoupleConnect
  if (user && !user.coupleId) {
    return <CoupleConnect onCoupleConnected={handleCoupleConnected} userName={user.name} userCoupleId={user.coupleId} />;
  }

  // 3. If part of a couple but partnerName is missing, show waiting screen
  if (user && user.coupleId && !partnerName) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 text-center">
            <div>
                <h1 className="text-2xl font-bold mb-4">Aguardando seu parceiro(a) conectar...</h1>
                <p className="mb-4">Compartilhe o código do casal com seu parceiro(a) para que ele(a) possa se conectar.</p>
                {coupleCode && (
                   <div className="bg-white p-4 rounded-xl border border-love-200 inline-block shadow-sm">
                      <span className="font-mono text-2xl font-bold text-love-600 tracking-widest">{coupleCode}</span>
                   </div>
                )}
            </div>
        </div>
    );
  }

  // 4. Fallback if user data is still not loaded after all checks (should ideally not happen often)
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-rose-50"><Loader2 className="animate-spin text-love-400" size={48} /></div>;


  return (
    <div className="min-h-screen bg-rose-50 text-slate-800 font-sans selection:bg-rose-200">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <Heart className="absolute top-10 left-10 text-rose-100 opacity-50 animate-float" size={120} />
        <Heart className="absolute bottom-20 right-10 text-rose-100 opacity-50 animate-float" style={{ animationDelay: '2s' }} size={80} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="mb-8 flex justify-between items-center bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white">
          <div>
            <h1 className="font-serif text-2xl font-bold text-love-800 flex items-center gap-2">
              <Users size={24} className="text-love-600" />
              Aliança & Palavra
            </h1>
            <p className="text-sm text-love-900/60">Bem-vindo, {user.name} {partnerName ? `& ${partnerName}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <span className="text-xs uppercase tracking-widest text-love-800 font-semibold">Nível de Intimidade</span>
               <div className="w-32">
                 <ProgressBar progress={progress?.spiritualGrowthXP || 0} />
               </div>
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-love-400 to-love-600 flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg">
               {user.name.charAt(0)}
             </div>
             <button
               onClick={() => signOut({ callbackUrl: '/' })}
               className="p-2 rounded-full bg-love-100 text-love-600 hover:bg-love-200 transition-colors"
               title="Sair"
             >
               <LogOut size={20} />
             </button>
          </div>
        </header>

        {!sessionData ? (
          /* Dashboard View */
          <main className="space-y-8 animate-fade-in">

            {/* Streak Section */}
            <section className="bg-white rounded-3xl p-6 shadow-xl border border-rose-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-xl font-semibold text-slate-700 flex items-center gap-2">
                  <Flame className="text-orange-500 fill-orange-500" /> Sequência da Semana
                </h2>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                  {progress?.daysCompleted ? progress.daysCompleted.split(',').filter(d => d === 'true').length : 0} / 7 Dias
                </span>
              </div>
              <div className="flex justify-between px-2 sm:px-8">
                {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((d, i) => (
                  <DayBadge key={d} day={d} completed={progress?.daysCompleted ? progress.daysCompleted.split(',')[i] === 'true' : false} />
                ))}
              </div>
            </section>

            {/* Start Devotional Card */}
            <section className="bg-gradient-to-br from-white to-rose-50 rounded-3xl p-8 shadow-xl border border-rose-100 text-center space-y-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-love-300 via-love-500 to-love-300" />

               <div className="max-w-md mx-auto space-y-6">
                 <div className="w-16 h-16 bg-love-100 rounded-full flex items-center justify-center mx-auto text-love-600 mb-4">
                   <BookOpen size={32} />
                 </div>

                 <h2 className="font-serif text-3xl font-bold text-love-900">Devocional de Hoje</h2>
                 <p className="text-slate-600">Escolha uma passagem para estudarem juntos ou deixe a IA sugerir algo para fortalecer a união.</p>

                 <div className="flex flex-col gap-3">
                   <div className="relative">
                     <input
                       type="text"
                       value={scriptureInput}
                       onChange={(e) => setScriptureInput(e.target.value)}
                       placeholder="Ex: 1 Coríntios 13"
                       className="w-full pl-4 pr-12 py-4 rounded-xl border border-love-200 focus:border-love-500 focus:ring-2 focus:ring-love-200 outline-none transition-all bg-white shadow-sm"
                     />
                     <button
                       onClick={handleGetSuggestion}
                       className="absolute right-2 top-2 p-2 text-love-400 hover:text-love-600 hover:bg-love-50 rounded-lg transition-colors"
                       title="Sugerir passagem"
                     >
                       <Sparkles size={20} />
                     </button>
                   </div>

                   <button
                     onClick={handleStartDevotional}
                     disabled={appLoading || !scriptureInput}
                     className="w-full bg-love-600 hover:bg-love-700 disabled:bg-love-300 text-white font-semibold py-4 rounded-xl shadow-lg shadow-love-200/50 transition-all flex items-center justify-center gap-2 group"
                   >
                     {appLoading ? (
                       <RefreshCw className="animate-spin" />
                     ) : (
                       <>
                         Iniciar Estudo <ChevronDown className="group-hover:translate-y-1 transition-transform" />
                       </>
                     )}
                   </button>
                 </div>
               </div>
            </section>

            {/* History Section */}
            {history && history.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-xl font-semibold text-slate-700 flex items-center gap-2">
                  <CheckCircle className="text-green-500" /> Histórico de Devocionais
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {history.map((session) => (
                  <Link
                    key={session.id}
                    href={`/devotional/${session.id}`}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center text-left hover:-translate-y-1 hover:shadow-md transition-all"
                  >
                      <div>
                        <h3 className="font-bold text-slate-800">{session.scriptureReference}</h3>
                        <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold tracking-wider mt-1">
                          {session.theme.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Concluído</span>
                         <span className="text-[10px] text-love-500 font-semibold underline decoration-dotted">Rever anotações</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </main>
        ) : (

          /* Active Session View */
          <main className="animate-fade-in space-y-6">
            
            {/* Waiting Banner */}
            {sessionData.status === 'WAITING_PARTNER' && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r shadow-sm animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Loader2 className="h-5 w-5 text-orange-400 animate-spin" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      Você concluiu sua parte! Aguardando {partnerName} finalizar para marcar como completo.
                      <button 
                        onClick={() => window.location.reload()} 
                        className="ml-2 font-bold underline hover:text-orange-800"
                      >
                        Verificar agora
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Title Bar */}
            <div className="flex items-center justify-between">
              <button onClick={() => setSessionData(null)} className="text-love-600 hover:underline text-sm">
                &larr; Cancelar
              </button>
              <div className="flex items-center gap-2 text-love-800 bg-white px-4 py-1 rounded-full shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider">Sincronizado com {partnerName}</span>
              </div>
            </div>

            {/* Scripture Header */}
            <section className="text-center py-6">
               <span className="inline-block px-3 py-1 bg-love-100 text-love-700 rounded-full text-xs font-bold tracking-wider mb-2">
                 {sessionData.theme.toUpperCase()}
               </span>
               <h2 className="font-serif text-4xl font-bold text-slate-800 mb-2">{sessionData.scriptureReference}</h2>
            </section>

            {/* AI Content Tabs */}
            <section className="bg-white rounded-2xl shadow-md overflow-hidden border border-love-100">
               <div className="flex border-b border-love-100">
                 <button
                   onClick={() => setActiveTab('context')}
                   className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${activeTab === 'context' ? 'bg-love-50 text-love-700 border-b-2 border-love-500' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Contexto
                 </button>
                 <button
                   onClick={() => setActiveTab('christ')}
                   className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${activeTab === 'christ' ? 'bg-love-50 text-love-700 border-b-2 border-love-500' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Cristo
                 </button>
                 <button
                   onClick={() => setActiveTab('application')}
                   className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${activeTab === 'application' ? 'bg-love-50 text-love-700 border-b-2 border-love-500' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Aplicação
                 </button>
               </div>

               <div className="p-6 min-h-[160px]">
                 {activeTab === 'context' && (
                   <div className="animate-fade-in space-y-4">
                      <div className="flex gap-4">
                        <div className="w-1 bg-love-300 rounded-full flex-shrink-0"></div>
                        <div>
                          <h4 className="font-serif text-lg font-bold text-slate-800 mb-1">Cultural</h4>
                          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{sessionData.culturalContext}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1 bg-slate-300 rounded-full flex-shrink-0"></div>
                        <div>
                          <h4 className="font-serif text-lg font-bold text-slate-800 mb-1">Literário</h4>
                          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{sessionData.literaryContext}</p>
                        </div>
                      </div>
                   </div>
                 )}
                 {activeTab === 'christ' && (
                    <div className="animate-fade-in flex flex-col items-center text-center p-4">
                       <div className="w-12 h-12 bg-gold-400/20 text-gold-600 rounded-full flex items-center justify-center mb-4">
                         <Sparkles />
                       </div>
                       <p className="text-lg font-serif italic text-slate-700 max-w-lg">"{sessionData.christConnection}"</p>
                    </div>
                 )}
                 {activeTab === 'application' && sessionData.applicationQuestions && (
                    <ul className="space-y-4 animate-fade-in">
                      {JSON.parse(sessionData.applicationQuestions as string).map((q: string, i: number) => (
                        <li key={i} className="flex gap-3 bg-rose-50/50 p-3 rounded-lg">
                           <span className="flex-shrink-0 w-6 h-6 bg-love-200 text-love-800 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">{i+1}</span>
                           <p className="text-slate-700 font-medium">{q}</p>
                        </li>
                      ))}
                    </ul>
                 )}
               </div>
            </section>

            {/* Split Screen Notes */}
            <section className="grid md:grid-cols-2 gap-6">
               {/* My Notes */}
               <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col h-80 focus-within:ring-2 focus-within:ring-love-200 transition-shadow">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <Feather size={16} className="text-love-500" />
                    <span className="font-bold text-slate-700 text-sm">Suas Anotações</span>
                  </div>
                  <textarea
                    className="flex-1 w-full resize-none outline-none text-slate-600 leading-relaxed custom-scrollbar placeholder:text-slate-300"
                    placeholder="O que Deus falou ao seu coração? Escreva aqui..."
                    value={myNote}
                    onChange={handleNoteChange}
                  />
               </div>

               {/* Partner Notes */}
               <div className="bg-slate-50 rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col h-80">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                    <Heart size={16} className="text-love-400" />
                    <span className="font-bold text-slate-600 text-sm">Anotações de {partnerName}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {partnerNote ? (
                      <p className="text-slate-600 font-serif italic leading-relaxed whitespace-pre-wrap">{partnerNote}</p>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                        <Lock className="mb-2 opacity-50" />
                        Aguardando {partnerName} escrever...
                      </div>
                    )}
                  </div>
               </div>
            </section>

            {/* Finish Action */}
            <div className="flex justify-center pt-6 pb-12">
               <button
                 onClick={handleFinishSession}
                 disabled={sessionData.status === 'WAITING_PARTNER'}
                 className={`px-12 py-4 rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-3 ${
                    sessionData.status === 'WAITING_PARTNER' 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-love-600 text-white shadow-love-500/30 hover:scale-105 active:scale-95'
                 }`}
               >
                 {sessionData.status === 'WAITING_PARTNER' ? (
                    <>
                      <Loader2 className="animate-spin" /> Aguardando {partnerName}...
                    </>
                 ) : (
                    <>
                      <CheckCircle /> Concluir Devocional
                    </>
                 )}
               </button>
            </div>
          </main>
        )}
      </div>

    </div>
  );
}