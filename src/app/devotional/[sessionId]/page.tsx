import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { DeleteDevotionalButton } from '@/components/DeleteDevotionalButton';
import { getAppTimeZone } from '@/lib/timezone';
import { decryptNote, ensureCoupleEncryptionKey } from '@/lib/encryption';
import { ShieldCheck } from 'lucide-react';

interface DevotionalReviewPageProps {
  params: { sessionId: string };
}

async function fetchCurrentUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      couple: {
        include: { users: true },
      },
    },
  });
  
  return user;
}

async function getCoupleEncryptionKey(coupleId: string): Promise<string | null> {
  // Busca diretamente do banco para garantir que pegamos o campo encryptionKey
  // mesmo que o Prisma Client ainda não tenha sido regenerado
  const result = await prisma.$queryRaw<{ encryptionKey: string | null }[]>`
    SELECT "encryptionKey" FROM "Couple" WHERE id = ${coupleId}
  `;
  return result[0]?.encryptionKey ?? null;
}

export default async function DevotionalReviewPage({ params }: DevotionalReviewPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/app');
  }

  const currentUser = await fetchCurrentUser(session.user.email);

  if (!currentUser) {
    redirect('/app');
  }

  const devotionalSession = await prisma.devotionalSession.findUnique({
    where: { id: params.sessionId },
    include: {
      template: true,
      couple: { include: { users: true } },
      userProgress: { include: { user: true } },
      notes: { include: { user: true } },
    },
  });

  if (!devotionalSession) {
    notFound();
  }

  if (!currentUser.coupleId || currentUser.coupleId !== devotionalSession.coupleId) {
    notFound();
  }

  const coupleUsers = devotionalSession.couple.users;
  const partner = coupleUsers.find((user) => user.id !== currentUser.id) ?? null;
  const partnerFirstName = partner?.name?.split(' ')[0] ?? null;
  const viewerProgress =
    devotionalSession.userProgress.find((progress) => progress.userId === currentUser.id) ?? null;
  const partnerProgress =
    partner?.id
      ? devotionalSession.userProgress.find((progress) => progress.userId === partner.id) ?? null
      : null;

  // Garante que o casal tenha uma chave de criptografia (gera se não existir)
  const coupleId = currentUser.couple?.id;
  const existingKey = coupleId ? await getCoupleEncryptionKey(coupleId) : null;
  const encryptionKey = coupleId
    ? await ensureCoupleEncryptionKey(coupleId, existingKey)
    : null;

  // Descriptografa as notas antes de exibir
  const notes = devotionalSession.notes
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((note) => ({
      ...note,
      content: encryptionKey && note.content ? decryptNote(note.content, encryptionKey) : note.content,
    }));

  const participants = coupleUsers;

  const questions: string[] = (() => {
    try {
      return devotionalSession.template.applicationQuestions
        ? JSON.parse(devotionalSession.template.applicationQuestions as string)
        : [];
    } catch {
      return [];
    }
  })();

  const appTimeZone = getAppTimeZone();
  const formatDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: appTimeZone,
  }).format(new Date(devotionalSession.date));

  const waitingLabel = (() => {
    if (!partnerFirstName) {
      return viewerProgress?.status === 'COMPLETED' ? 'Aguardando parceiro(a)' : 'Aguardando confirmação';
    }
    if (viewerProgress?.status === 'COMPLETED') {
      return `Aguardando ${partnerFirstName}`;
    }
    if (partnerProgress?.status === 'COMPLETED') {
      return 'Aguardando você';
    }
    return 'Em sincronização';
  })();

  const waitingHeading =
    viewerProgress?.status === 'COMPLETED'
      ? `Devocional aguardando ${partnerFirstName ?? 'confirmação do parceiro'}`
      : partnerProgress?.status === 'COMPLETED'
      ? 'Devocional aguardando sua confirmação'
      : 'Devocional em andamento';

  const statusMap: Record<string, { label: string; badge: string; text: string; heading: string }> = {
    COMPLETED: {
      label: 'Concluído em casal',
      badge: 'bg-green-100',
      text: 'text-green-700',
      heading: 'Devocional concluído',
    },
    WAITING_PARTNER: {
      label: waitingLabel,
      badge: 'bg-orange-100',
      text: 'text-orange-700',
      heading: waitingHeading,
    },
    IN_PROGRESS: {
      label: 'Em progresso',
      badge: 'bg-blue-100',
      text: 'text-blue-700',
      heading: 'Devocional em andamento',
    },
  };

  const statusStyles =
    statusMap[devotionalSession.status] ?? {
      label: 'Status desconhecido',
      badge: 'bg-slate-100',
      text: 'text-slate-600',
      heading: 'Devocional',
    };

  return (
    <div className="min-h-screen bg-rose-50 text-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-love-400 font-semibold mb-2">
              {statusStyles.heading}
            </p>
            <h1 className="font-serif text-4xl text-love-900">{devotionalSession.template.scriptureReference}</h1>
            <p className="text-sm text-slate-500">{formatDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <DeleteDevotionalButton sessionId={devotionalSession.id} />
            <Link
              href="/app"
              className="text-love-600 text-sm font-semibold hover:underline"
            >
              ← Voltar para o painel
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-rose-100 p-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-love-500 uppercase tracking-widest mb-2">Tema</p>
            <p className="font-serif text-2xl text-slate-900">{devotionalSession.template.theme}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-love-500 uppercase tracking-widest mb-2">Status</p>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusStyles.badge} ${statusStyles.text}`}
            >
              {statusStyles.label}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-2">Contexto Cultural</h2>
            <p className="text-slate-700 leading-relaxed">{devotionalSession.template.culturalContext}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-2">Contexto Literário</h2>
            <p className="text-slate-700 leading-relaxed">{devotionalSession.template.literaryContext}</p>
          </div>
        </div>

        {devotionalSession.template.scriptureText && (
          <div className="bg-white rounded-3xl shadow-lg border border-rose-100 p-6">
            <p className="text-xs font-semibold text-love-500 uppercase tracking-[0.3em] mb-3">Leitura bíblica (ARA)</p>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{devotionalSession.template.scriptureText}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-rose-100">
          <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-2">Cristo nas Escrituras</h2>
          <p className="text-lg font-serif italic text-slate-800">"{devotionalSession.template.christConnection}"</p>
        </div>

        {questions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-4">Perguntas de aplicação</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              {questions.map((question, index) => (
                <li key={`question-${index}`}>{question}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Security indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-2 mx-auto w-fit">
          <ShieldCheck size={14} />
          <span className="font-medium">Anotações criptografadas e privadas do casal</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {participants.map((participant) => {
            const participantNote = notes.find((note) => note.userId === participant.id);

            return (
              <div
                key={participant.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-love-100 text-love-600 flex items-center justify-center font-serif font-bold">
                    {participant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-love-500 font-semibold">{participant.name}</p>
                    {participantNote && (
                      <p className="text-[11px] text-slate-400">
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          timeZone: appTimeZone,
                        }).format(new Date(participantNote.createdAt))}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {participantNote?.content || 'Sem anotações registradas.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

