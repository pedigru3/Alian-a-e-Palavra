'use client';

import Link from 'next/link';
import { ArrowRight, Heart, BookOpen, Users, CheckCircle, Sparkles, Lock, Calendar } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Devocionais completos',
    description: 'Estudos bíblicos com contexto histórico, conexão com Cristo, perguntas de reflexão e aplicações práticas para o relacionamento.',
  },
  {
    icon: Users,
    title: 'Experiência compartilhada',
    description: 'O casal acessa o mesmo devocional. Cada um vê o progresso do outro, deixa anotações e conclui no seu tempo.',
  },
  {
    icon: CheckCircle,
    title: 'Conclusão em conjunto',
    description: 'O devocional só é marcado como concluído quando ambos terminarem. Uma forma de caminharem juntos na fé.',
  },
  {
    icon: Calendar,
    title: 'Sequência semanal',
    description: 'Acompanhem juntos o progresso da semana. Os 7 dias ficam visíveis para os dois, celebrando consistência e retomando onde pararam.',
  },
  {
    icon: Sparkles,
    title: 'Geração com IA',
    description: 'Crie devocionais personalizados em segundos. Escolha o tema, informe o contexto e receba um roteiro completo adaptado ao momento do casal.',
  },
  {
    icon: Heart,
    title: 'Aproximação de Deus',
    description: 'Mais do que um app, uma ferramenta para fortalecer o relacionamento do casal com Deus e entre vocês.',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Conecte-se com seu parceiro',
    description: 'Crie sua conta e conecte-se com seu cônjuge usando um código único. Vocês terão acesso ao mesmo espaço.',
  },
  {
    step: 2,
    title: 'Gere ou acesse devocionais',
    description: 'Crie devocionais personalizados com IA ou acesse estudos preparados especialmente para casais.',
  },
  {
    step: 3,
    title: 'Estudem juntos',
    description: 'Cada um lê no seu tempo, faz anotações pessoais e compartilha insights. Vejam o progresso um do outro.',
  },
  {
    step: 4,
    title: 'Concluam em conjunto',
    description: 'Quando ambos terminarem, o devocional é marcado como concluído. A jornada é feita juntos, passo a passo.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 text-slate-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-64 h-64 sm:w-96 sm:h-96 bg-rose-200/40 rounded-full blur-3xl -top-10 -left-10" />
          <div className="absolute w-72 h-72 sm:w-[420px] sm:h-[420px] bg-love-200/30 rounded-full blur-3xl bottom-10 right-0" />
        </div>

        <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20 space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-8 pt-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-rose-200 px-4 py-1 text-sm font-semibold text-love-600 shadow-sm">
              <Heart className="w-4 h-4 fill-love-500" />
              Devocionais para casais
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-love-900 leading-tight">
                Aproximem-se de Deus
                <br />
                <span className="text-love-600">juntos</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Uma plataforma para casais estudarem a Bíblia juntos. Gere devocionais personalizados, compartilhe anotações e caminhem lado a lado na fé.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-love-600 text-white px-8 py-4 text-lg font-semibold shadow-lg shadow-love-500/30 hover:bg-love-700 transition-all hover:scale-105"
              >
                Entrar
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-slate-500">
                Não tem conta? <Link href="/app" className="text-love-600 hover:underline font-semibold">Cadastre-se gratuitamente</Link>
              </p>
            </div>
          </section>

          {/* Features Grid */}
          <section className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-love-900">
                Tudo que vocês precisam
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Uma experiência completa pensada para fortalecer o relacionamento do casal com Deus e entre vocês.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/85 border border-rose-100 rounded-3xl p-6 shadow-lg shadow-rose-100/60 space-y-4 hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-love-50 text-love-600 flex items-center justify-center shadow-inner">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-serif text-love-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-gradient-to-br from-white via-rose-50 to-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/60 p-8 sm:p-12 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-love-900">
                Como funciona
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Uma jornada simples para vocês caminharem juntos na fé.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item) => (
                <div key={item.step} className="bg-white rounded-2xl border border-rose-100 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-love-50 text-love-600 flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </span>
                    <h3 className="font-semibold text-love-900 text-lg">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Key Differentiator */}
          <section className="bg-gradient-to-br from-love-600 to-love-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl shadow-love-500/40 space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold">
                Só conclui quando os dois terminarem
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                O devocional só é marcado como concluído quando ambos finalizarem. É uma forma de garantir que vocês caminhem juntos, 
                incentivando a consistência e o compromisso mútuo na jornada de fé.
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-6 bg-white/80 rounded-3xl border border-rose-100 shadow-xl p-10">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-love-900">
              Comece sua jornada hoje
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Cadastre-se gratuitamente e comece a fortalecer seu relacionamento com Deus e com seu parceiro.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-love-600 text-white px-10 py-4 text-lg font-semibold shadow-lg shadow-love-500/30 hover:bg-love-700 transition-all hover:scale-105"
            >
              Entrar agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-500 pb-8 space-y-3">
            <p>© {new Date().getFullYear()} Aliança & Palavra · Um projeto para fortalecer casamentos em Cristo.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="mailto:contato@aliancaepalavra.com" className="inline-flex items-center gap-1 text-love-600 hover:text-love-700">
                contato@aliancaepalavra.com
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
