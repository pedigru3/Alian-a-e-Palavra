'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronDown,
  Feather,
  LogOut,
  Loader2,
  History,
  Trash2,
} from 'lucide-react';
import { generateDevotionalContent, suggestScripture } from '@/services/geminiService';
import {
  User,
  DevotionalSession,
  WeeklyProgress,
  Note,
  Couple,
  DevotionalSessionUserProgress,
} from '@prisma/client';
import { ProgressBar } from '@/components/ProgressBar';
import { DayBadge } from '@/components/DayBadge';
import { AuthForm } from '@/components/AuthForm';
import { CoupleConnect } from '@/components/CoupleConnect';
import { XpToast } from '@/components/XpToast';
import Link from 'next/link';
import { isSameLocalizedDay } from '@/lib/timezone';

// Calcula XP necessário para o próximo nível: 20 * level
function getXpForLevel(level: number): number {
  return 20 * level;
}

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

interface UserWithCouple extends User {
  couple: (Couple & { users: User[] }) | null;
}

type ProgressWithUser = DevotionalSessionUserProgress & { user: User };
type NoteWithUser = Note & { user: User };

type SessionWithTemplate = DevotionalSession & {
  template: {
    id: string;
    scriptureReference: string;
    theme: string;
    culturalContext: string;
    literaryContext: string;
    christConnection: string;
    applicationQuestions: string;
    scriptureText: string | null;
    isAiGenerated: boolean;
  };
};

type SessionWithProgress = SessionWithTemplate & {
  userProgress: ProgressWithUser[];
};

type SessionWithRelations = SessionWithProgress & {
  notes: NoteWithUser[];
  couple: Couple & { users: User[] };
};

type XpResult = {
  previousLevel: number;
  previousXp: number;
  newLevel: number;
  newXp: number;
  leveledUp: boolean;
  xpGained: number;
} | null;

type SessionApiResponse = SessionWithRelations & {
  xpResult?: XpResult;
};

export default function Home() {
  // --- Authentication State ---
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const loadingSession = status === 'loading';
  const userId = session?.user?.id;

  // --- Local State Management ---
  const [isGeneratingDevotional, setIsGeneratingDevotional] = useState(false);
  const [isFinishingDevotional, setIsFinishingDevotional] = useState(false);
  const [isSuggestingScripture, setIsSuggestingScripture] = useState(false);
  const [sessionData, setSessionData] = useState<SessionWithRelations | null>(null);

  const [scriptureInput, setScriptureInput] = useState('');
  const [activeTab, setActiveTab] = useState<'context' | 'christ' | 'application'>('context');

  // Notes Local State (for immediate typing feedback)
  const [myNote, setMyNote] = useState('');
  const previousSessionIdRef = useRef<string | null>(null);

  // XP Toast State
  const [xpToast, setXpToast] = useState<{ xpGained: number; leveledUp: boolean; newLevel?: number } | null>(null);
  const [animateXp, setAnimateXp] = useState(false);

  // --- SWR Hooks ---
  const { data: user, error: userError, mutate: mutateUser } = useSWR<UserWithCouple>(
    userId ? `/api/users/${userId}` : null,
    fetcher
  );

  // Derive partnerName from user.couple
  const partner = user?.couple?.users?.find((u: User) => u.id !== userId);
  const partnerName = partner?.name;
  const coupleCode = user?.couple?.code;

  // Verificar se já gerou devocional hoje
  const hasGeneratedToday = (() => {
    if (!user?.couple?.lastGeneratedAt) return false;
    return isSameLocalizedDay(new Date(user.couple.lastGeneratedAt), new Date());
  })();

  const { data: progress, mutate: mutateProgress } = useSWR<WeeklyProgress>(
    userId && user?.coupleId ? `/api/weekly-progress/${userId}` : null,
    fetcher
  );

  const { data: progressHistory } = useSWR<WeeklyProgress[]>(
    userId && user?.coupleId ? '/api/weekly-progress/history' : null,
    fetcher
  );

  const { data: history } = useSWR<SessionWithProgress[]>(
    userId ? '/api/sessions/history' : null,
    fetcher
  );

  const { data: notes, mutate: mutateNotes } = useSWR<Note[]>(
    sessionData ? `/api/notes/session/${sessionData.id}` : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  // Poll for current active session for the couple
  const { data: currentSession, mutate: mutateCurrentSession } = useSWR<SessionWithRelations | null>(
    user?.coupleId ? '/api/sessions/current' : null,
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds to check for partner's new session
  );

  const activeSession = currentSession && currentSession.status !== 'COMPLETED' ? currentSession : null;
  const historyWithActive = useMemo<SessionWithProgress[]>(() => {
    if (!history && !activeSession) return [];
    const baseHistory = history ?? [];
    if (!activeSession) return baseHistory;
    const alreadyPresent = baseHistory.some((session) => session.id === activeSession.id);
    if (alreadyPresent) return baseHistory;
    const { notes: _notes, couple: _couple, ...rest } = activeSession;
    return [{ ...(rest as SessionWithProgress) }, ...baseHistory];
  }, [history, activeSession]);

  const mySessionProgress =
    sessionData?.userProgress.find((progress) => progress.userId === userId) ?? null;
  const partnerSessionProgress =
    partner?.id && sessionData
      ? sessionData.userProgress.find((progress) => progress.userId === partner.id) ?? null
      : null;
  const activeSessionMyProgress =
    activeSession?.userProgress.find((progress) => progress.userId === userId) ?? null;
  const userHasCompleted = mySessionProgress?.status === 'COMPLETED';
  const partnerHasCompleted = partnerSessionProgress?.status === 'COMPLETED';

  // Auto-set session data if an active session is found and we aren't already in one
  useEffect(() => {
    if (!sessionData) return;

    if (!currentSession) {
      setSessionData(null);
      setScriptureInput('');
      mutateProgress();
      return;
    }

    if (currentSession.id === sessionData.id && currentSession.status !== sessionData.status) {
      setSessionData(currentSession);
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

  // Progress is now auto-created by the GET endpoint when missing, no need for client-side initialization

  // Sync Notes from SWR to Local State
  const partnerNote = partner
    ? notes?.find(n => n.userId === partner.id)?.content || ''
    : '';

  useEffect(() => {
    if (sessionData?.id) {
      if (previousSessionIdRef.current !== sessionData.id) {
        previousSessionIdRef.current = sessionData.id;
        setMyNote('');
      }
    } else {
      previousSessionIdRef.current = null;
      setMyNote('');
    }
  }, [sessionData]);

  useEffect(() => {
    if (!notes || !userId || !sessionData?.id) return;
    if (myNote !== '') return;

    const serverMyNote = notes.find(n => n.userId === userId && n.sessionId === sessionData.id);
    if (serverMyNote) {
      setMyNote(serverMyNote.content);
    }
  }, [notes, userId, sessionData?.id, myNote]);

  // --- Handlers ---
  const handleCoupleConnected = () => {
    // Force re-fetch user data to get updated coupleId (and potential partnerName from couple)
    mutateUser();
    // No explicit state change needed here, conditional rendering will pick it up
  };

  const handleGetSuggestion = async () => {
    setIsSuggestingScripture(true);
    try {
      const sugg = await suggestScripture();
      setScriptureInput(sugg);
    } finally {
      setIsSuggestingScripture(false);
    }
  };

  const handleStartDevotional = async () => {
    if (!scriptureInput || !user) return;

    // If there is already an active session, just retake it instead of creating a new one
    if (activeSession) {
      handleResumeDevotional();
      return;
    }
    setIsGeneratingDevotional(true);

    try {
      const content = await generateDevotionalContent(scriptureInput);

      const newSessionPayload = {
        scriptureReference: content.scriptureReference, // Usar referência validada pela IA
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

      if (sessionRes.status === 409) {
        const conflictData = await sessionRes.json();
        if (conflictData?.session) {
          setSessionData(conflictData.session);
          setScriptureInput('');
          return;
        }
        console.warn(conflictData?.message || 'Já existe um devocional em andamento.');
        return;
      }

      if (sessionRes.status === 429) {
        const errorData = await sessionRes.json();
        alert(errorData?.message || 'Você já gerou um devocional hoje. Tente novamente amanhã.');
        mutateUser(); // Atualiza dados do usuário para refletir lastGeneratedAt
        return;
      }

      if (sessionRes.ok) {
        const createdSession: SessionWithRelations = await sessionRes.json();
        setSessionData(createdSession);
        setMyNote('');
        setActiveTab('context');
        setScriptureInput('');
        mutateCurrentSession();
        mutateUser(); // Atualiza dados do usuário para refletir lastGeneratedAt
      } else {
        const errorData = await sessionRes.json().catch(() => ({}));
        console.error('Failed to create session:', errorData?.message || sessionRes.statusText);
        alert(errorData?.message || 'Erro ao criar devocional. Tente novamente.');
      }
    } catch (error) {
      console.error('Error starting devotional:', error);
    } finally {
      setIsGeneratingDevotional(false);
    }
  };

  const handleNoteChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMyNote(newContent);

    if (!sessionData || !user || !notes) return;

    const myNoteObj = notes.find((n) => n.userId === user.id && n.sessionId === sessionData.id);

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

    setIsFinishingDevotional(true);
    try {
      const res = await fetch(`/api/sessions/${sessionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const response: SessionApiResponse = await res.json();
      const { xpResult, ...updatedSession } = response;

      if (updatedSession) {
        setSessionData(updatedSession);
      }

      if (updatedSession?.status === 'COMPLETED') {
        setSessionData(null);
        setScriptureInput('');
        mutateProgress();
        
        // Se ganhou XP, mostrar toast e animar barra
        if (xpResult) {
          setAnimateXp(true);
          setXpToast({
            xpGained: xpResult.xpGained,
            leveledUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel,
          });
          // Atualiza dados do usuário para refletir novo XP/Level
          mutateUser();
        }
      }

      mutateCurrentSession();
    } catch (error) {
      console.error('Error finishing session:', error);
    } finally {
      setIsFinishingDevotional(false);
    }
  };

  const handleCancelDevotional = () => {
    setSessionData(null);
    setMyNote('');
    setActiveTab('context');
    setScriptureInput('');
  };

  const handleResumeDevotional = () => {
    const sessionToResume = activeSession ?? currentSession;
    if (!sessionToResume) return;
    setSessionData(sessionToResume);
    setScriptureInput(sessionToResume.template.scriptureReference);
    setActiveTab('context');
    setMyNote('');
  };

  const handleDeleteDevotional = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir este devocional? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Refresh history and current session
        mutate('/api/sessions/history');
        mutateCurrentSession();
        // If we're viewing this session, go back to dashboard
        if (sessionData?.id === sessionId) {
          setSessionData(null);
        }
      } else {
        const error = await res.json();
        alert(`Erro ao excluir: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Erro ao excluir devocional. Tente novamente.');
    }
  };

  // --- Views ---

  // Show loading while session status is being determined or app-specific loading is active
  if (loadingSession) {
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
    <div className="min-h-screen bg-rose-50 text-slate-800 font-sans selection:bg-rose-200 relative">
      {(isGeneratingDevotional || isFinishingDevotional) && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white border border-love-100 shadow-2xl rounded-3xl px-8 py-6 flex flex-col items-center gap-3 text-center max-w-sm">
            <Loader2 className="text-love-500 animate-spin" size={36} />
            <p className="text-lg font-semibold text-love-700">
              {isGeneratingDevotional ? 'Gerando devocional com a IA...' : 'Finalizando devocional...'}
            </p>
            <p className="text-sm text-slate-500">
              {isGeneratingDevotional
                ? 'Isso pode levar alguns segundos enquanto montamos o estudo completo.'
                : 'Atualizando progresso do casal e sincronizando com seu parceiro(a).'}
            </p>
          </div>
        </div>
      )}
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <Heart className="absolute top-10 left-10 text-rose-100 opacity-50 animate-float" size={120} />
        <Heart className="absolute bottom-20 right-10 text-rose-100 opacity-50 animate-float" style={{ animationDelay: '2s' }} size={80} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="mb-8 bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-sm border border-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 self-center">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-love-800 flex items-center gap-2">
                <Users size={20} className="text-love-600 sm:w-6 sm:h-6" />
                <span className="truncate">Aliança & Palavra</span>
              </h1>
              <p className="text-xs sm:text-sm text-love-900/60 truncate">Bem-vindo, {user.name} {partnerName ? `& ${partnerName}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
             <div className="flex-1 sm:flex-initial min-w-[140px] sm:min-w-[200px] sm:max-w-[240px]">
               <ProgressBar 
                 level={user.couple?.level ?? 1} 
                 xp={user.couple?.xp ?? 0} 
                 maxXp={getXpForLevel(user.couple?.level ?? 1)}
                 animate={animateXp}
               />
             </div>
             <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-love-400 to-love-600 flex items-center justify-center text-white font-serif font-bold text-lg sm:text-xl shadow-lg flex-shrink-0">
               {user.name.charAt(0)}
             </div>
             <button
               onClick={() => signOut({ callbackUrl: '/' })}
               className="p-2 rounded-full bg-love-100 text-love-600 hover:bg-love-200 transition-colors flex-shrink-0"
               title="Sair"
             >
               <LogOut size={18} className="sm:w-5 sm:h-5" />
             </button>
          </div>
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

              {/* Week History */}
              {progressHistory && progressHistory.length > 1 && (
                <div className="mt-6 pt-4 border-t border-rose-100">
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Semanas anteriores</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {progressHistory.slice(1, 9).map((week) => {
                      const daysCount = week.daysCompleted.split(',').filter(d => d === 'true').length;
                      const weekStartDate = new Date(week.weekStart);
                      const weekLabel = weekStartDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                      return (
                        <div
                          key={week.id}
                          className="flex flex-col items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
                          title={`Semana de ${weekLabel}`}
                        >
                          <span className="text-[10px] text-slate-400 uppercase">{weekLabel}</span>
                          <span className={`text-sm font-bold ${daysCount >= 5 ? 'text-green-600' : daysCount >= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                            {daysCount}/7
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {activeSession && (
              <section className="bg-gradient-to-br from-white to-rose-50 rounded-3xl p-6 shadow-xl border border-rose-100 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-slate-800">Devocional em andamento</h2>
                    <p className="text-slate-500 text-sm">
                      Você começou "{activeSession.template.scriptureReference}" e pode retomar quando quiser.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                      activeSessionMyProgress?.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : activeSession.status === 'WAITING_PARTNER'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-love-100 text-love-700'
                    }`}
                  >
                    {activeSessionMyProgress?.status === 'COMPLETED'
                      ? 'Você já concluiu'
                      : activeSession.status === 'WAITING_PARTNER'
                      ? 'Aguardando parceiro(a)'
                      : 'Em progresso'}
                  </span>
                </div>
                <div className="flex w-56 flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleResumeDevotional}
                    className="flex-1 bg-love-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-love-700 transition"
                  >
                    Retomar agora
                  </button>
                  
                </div>
              </section>
            )}

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
                      disabled={isSuggestingScripture}
                      className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                        isSuggestingScripture
                          ? 'text-love-300 cursor-not-allowed'
                          : 'text-love-400 hover:text-love-600 hover:bg-love-50'
                      }`}
                      title="Sugerir passagem automaticamente"
                     >
                      {isSuggestingScripture ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={20} />}
                     </button>
                   </div>

                 
                  <button
                    onClick={handleStartDevotional}
                    disabled={isGeneratingDevotional || !scriptureInput || !!activeSession || hasGeneratedToday}
                    className="w-full bg-love-600 hover:bg-love-700 disabled:bg-love-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-love-200/50 transition-all flex items-center justify-center gap-2 group"
                  >
                    {isGeneratingDevotional ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Preparando devocional...
                      </>
                    ) : activeSession ? (
                      <>Já existe um devocional em andamento</>
                    ) : hasGeneratedToday ? (
                      <>Você já gerou um devocional hoje</>
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
            {historyWithActive.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-xl font-semibold text-slate-700 flex items-center gap-2">
                  <CheckCircle className="text-green-500" /> Histórico de Devocionais
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {historyWithActive.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center text-left hover:-translate-y-1 hover:shadow-md transition-all group relative"
                  >
                    <Link
                      href={`/devotional/${session.id}`}
                      className="flex-1 flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold text-slate-800">{session.template.scriptureReference}</h3>
                        <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold tracking-wider mt-1">
                          {session.template.theme.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                           session.status === 'COMPLETED'
                             ? 'text-green-600 bg-green-50'
                             : 'text-orange-700 bg-orange-50'
                         }`}>
                           {session.status === 'COMPLETED' ? 'Concluído' : 'Em progresso'}
                         </span>
                         <span className="text-[10px] text-love-500 font-semibold underline decoration-dotted">
                           {session.status === 'COMPLETED' ? 'Rever anotações' : 'Continuar depois'}
                         </span>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => handleDeleteDevotional(session.id, e)}
                      className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir devocional"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                      {userHasCompleted
                        ? `Você concluiu sua parte! Aguardando ${partnerName ?? 'seu parceiro(a)'} finalizar para encerrar.`
                        : partnerHasCompleted
                        ? `${partnerName ?? 'Seu parceiro(a)'} já concluiu! Finalize sua parte para concluir o devocional.`
                        : 'Sincronizando com seu parceiro(a)...'}
                      {userHasCompleted && (
                        <button
                          onClick={() => mutateCurrentSession()}
                          className="ml-2 font-bold underline hover:text-orange-800"
                        >
                          Verificar agora
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Title Bar */}
            <div className="flex items-center justify-between">
              <button onClick={handleCancelDevotional} className="text-love-600 hover:underline text-sm">
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
                 {sessionData.template.theme.toUpperCase()}
               </span>
               <h2 className="font-serif text-4xl font-bold text-slate-800 mb-2">{sessionData.template.scriptureReference}</h2>
            </section>

            {sessionData.template.scriptureText && (
              <section className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="text-love-500" size={18} />
                  <span className="text-xs font-semibold uppercase tracking-widest text-love-500">Leitura bíblica (ARA)</span>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {sessionData.template.scriptureText}
                </p>
              </section>
            )}

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
                          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{sessionData.template.culturalContext}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1 bg-slate-300 rounded-full flex-shrink-0"></div>
                        <div>
                          <h4 className="font-serif text-lg font-bold text-slate-800 mb-1">Literário</h4>
                          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{sessionData.template.literaryContext}</p>
                        </div>
                      </div>
                   </div>
                 )}
                 {activeTab === 'christ' && (
                    <div className="animate-fade-in flex flex-col items-center text-center p-4">
                       <div className="w-12 h-12 bg-gold-400/20 text-gold-600 rounded-full flex items-center justify-center mb-4">
                         <Sparkles />
                       </div>
                       <p className="text-lg font-serif italic text-slate-700 max-w-lg">"{sessionData.template.christConnection}"</p>
                    </div>
                 )}
                 {activeTab === 'application' && sessionData.template.applicationQuestions && (
                    <ul className="space-y-4 animate-fade-in">
                      {JSON.parse(sessionData.template.applicationQuestions as string).map((q: string, i: number) => (
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
                 disabled={isFinishingDevotional || userHasCompleted}
                 className={`px-12 py-4 rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-3 ${
                    isFinishingDevotional || userHasCompleted
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-love-600 text-white shadow-love-500/30 hover:scale-105 active:scale-95'
                 }`}
               >
                 {isFinishingDevotional ? (
                    <>
                      <Loader2 className="animate-spin" /> Salvando progresso...
                    </>
                 ) : userHasCompleted ? (
                    <>
                      <CheckCircle /> Você já concluiu
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

      {/* XP Toast Notification */}
      {xpToast && (
        <XpToast
          xpGained={xpToast.xpGained}
          leveledUp={xpToast.leveledUp}
          newLevel={xpToast.newLevel}
          onClose={() => {
            setXpToast(null);
            setAnimateXp(false);
          }}
        />
      )}
    </div>
  );
}