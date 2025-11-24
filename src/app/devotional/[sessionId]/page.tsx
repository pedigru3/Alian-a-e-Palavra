import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

interface DevotionalReviewPageProps {
  params: { sessionId: string };
}

async function fetchCurrentUser(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      couple: {
        include: { users: true },
      },
    },
  });
}

export default async function DevotionalReviewPage({ params }: DevotionalReviewPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  const currentUser = await fetchCurrentUser(session.user.email);

  if (!currentUser) {
    redirect('/');
  }

  const devotionalSession = await prisma.devotionalSession.findUnique({
    where: { id: params.sessionId },
    include: {
      user: {
        include: {
          couple: {
            include: { users: true },
          },
        },
      },
    },
  });

  if (!devotionalSession) {
    notFound();
  }

  const allowedUserIds = new Set<string>();
  if (currentUser.couple) {
    currentUser.couple.users.forEach((user) => allowedUserIds.add(user.id));
  } else {
    allowedUserIds.add(currentUser.id);
  }

  if (!allowedUserIds.has(devotionalSession.userId)) {
    notFound();
  }

  const coupleUsers = devotionalSession.user.couple?.users ?? [];
  const partner = coupleUsers.find((user) => user.id !== devotionalSession.userId) ?? null;

  let partnerSessionId: string | null = null;
  if (partner) {
    const partnerSession = await prisma.devotionalSession.findFirst({
      where: {
        userId: partner.id,
        scriptureReference: devotionalSession.scriptureReference,
      },
      orderBy: { date: 'desc' },
    });
    partnerSessionId = partnerSession?.id ?? null;
  }

  const noteSessionIds = [devotionalSession.id];
  if (partnerSessionId) {
    noteSessionIds.push(partnerSessionId);
  }

  const notes = await prisma.note.findMany({
    where: { sessionId: { in: noteSessionIds } },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });

  const participants = coupleUsers.length > 0 ? coupleUsers : [devotionalSession.user];

  const questions: string[] = (() => {
    try {
      return devotionalSession.applicationQuestions
        ? JSON.parse(devotionalSession.applicationQuestions as string)
        : [];
    } catch {
      return [];
    }
  })();

  const formatDate = new Date(devotionalSession.date).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-rose-50 text-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-love-400 font-semibold mb-2">Devocional concluído</p>
            <h1 className="font-serif text-4xl text-love-900">{devotionalSession.scriptureReference}</h1>
            <p className="text-sm text-slate-500">{formatDate}</p>
          </div>
          <Link
            href="/"
            className="text-love-600 text-sm font-semibold hover:underline"
          >
            ← Voltar para o painel
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-rose-100 p-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-love-500 uppercase tracking-widest mb-2">Tema</p>
            <p className="font-serif text-2xl text-slate-900">{devotionalSession.theme}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-love-500 uppercase tracking-widest mb-2">Status</p>
            <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              Concluído em casal
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-2">Contexto Cultural</h2>
            <p className="text-slate-700 leading-relaxed">{devotionalSession.culturalContext}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-2">Contexto Literário</h2>
            <p className="text-slate-700 leading-relaxed">{devotionalSession.literaryContext}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-rose-100">
          <h2 className="text-sm font-semibold text-love-500 uppercase tracking-widest mb-2">Cristo nas Escrituras</h2>
          <p className="text-lg font-serif italic text-slate-800">"{devotionalSession.christConnection}"</p>
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
                        {new Date(participantNote.createdAt).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
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

