'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Heart, Mail, Globe, Brain, Zap, Star, BookOpen, Users, CheckCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Por que existe um plano pago?',
    answer: 'Cada devocional gerado consome modelos de IA avançados (Google Gemini) e infraestrutura de nuvem. A assinatura garante que os custos sejam cobertos e o projeto continue evoluindo.'
  },
  {
    question: 'Ainda existe versão gratuita?',
    answer: 'Sim. O casal sempre terá acesso ao devocional do dia (curadoria manual), registro de notas e sequência semanal compartilhada. Nada disso exige pagamento.'
  },
  {
    question: 'Como funciona o plano pago?',
    answer: 'Os assinantes liberam o botão “Gerar com IA”, podendo criar devocionais ilimitados, escolher temas, receber aplicações personalizadas e registrar histórico completo.'
  },
  {
    question: 'Quando o devocional diário chegará?',
    answer: 'Estamos finalizando o módulo “Devocional do Dia”. Enquanto isso, o diferencial pago é a geração com IA, já disponível para os fundadores.'
  },
];

const steps = [
  {
    title: 'Devocional do Dia (Free)',
    description: 'Todo casal começa com um estudo curado diariamente, leitura bíblica integrada e espaço para registrar notas individuais e compartilhadas.',
  },
  {
    title: 'Sequência da Semana',
    description: 'Os 7 dias ficam visíveis para os dois. Vocês acompanham juntos o progresso, celebram consistência e retomam onde pararam.',
  },
  {
    title: 'Gerar com IA (Premium)',
    description: 'Quando quiser ir além, basta liberar o plano pago para criar devocionais sob medida. Escolha o tema, informe o contexto e receba um roteiro completo em segundos.',
  },
];

const modules = [
  {
    icon: BookOpen,
    heading: 'Devocionais completos',
    body: 'Estrutura com contexto histórico, conexão com Cristo, perguntas de reflexão e aplicações práticas para o relacionamento.',
  },
  {
    icon: Sparkles,
    heading: 'IA alinhada à fé',
    body: 'Usamos Gemini e ABíbliaDigital para gerar texto bíblico e insights confiáveis em português, sempre com revisão manual.',
  },
  {
    icon: Users,
    heading: 'Sessão compartilhada',
    body: 'O casal acessa o mesmo devocional. Cada um vê o progresso do outro, deixa anotações e conclui no seu tempo.',
  },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 text-slate-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-64 h-64 sm:w-96 sm:h-96 bg-rose-200/40 rounded-full blur-3xl -top-10 -left-10" />
          <div className="absolute w-72 h-72 sm:w-[420px] sm:h-[420px] bg-love-200/30 rounded-full blur-3xl bottom-10 right-0" />
        </div>

        <main className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-20 lg:py-24 space-y-20">
          {/* Hero */}
          <section className="text-center space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-rose-200 px-4 py-1 text-sm font-semibold text-love-600 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Novo app · Devocionais guiados para casais
            </p>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-love-900 leading-tight">
                Sua rotina devocional, finalmente compartilhada
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
                O Aliança & Palavra reúne tudo em um só lugar: devocional diário gratuito, sequência semanal sincronizada e geração instantânea com IA
                para quando vocês quiserem algo personalizado. Entre antes do lançamento oficial e nos ajude a inaugurar essa experiência.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="https://forms.gle/alianca-pre-venda"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-love-600 text-white px-8 py-3 font-semibold shadow-lg shadow-love-500/30 hover:bg-love-700 transition-colors"
              >
                Garantir minha vaga
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="mailto:contato@aliancaepalavra.com"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-love-600 px-8 py-3 font-semibold border border-love-100 hover:border-love-300 transition-colors"
              >
                Quero tirar dúvidas
                <Mail className="w-4 h-4" />
              </Link>
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Experiência completa · Free + Premium · Lançamento 2025
            </div>
          </section>

          {/* Ecosystem */}
          <section className="grid gap-5 lg:grid-cols-3">
            {modules.map((module) => (
              <div key={module.heading} className="bg-white/85 border border-white rounded-3xl p-7 shadow-lg shadow-rose-100/60 space-y-4">
                <div className="w-12 h-12 rounded-full bg-love-50 text-love-600 flex items-center justify-center shadow-inner">
                  <module.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif text-love-900">{module.heading}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{module.body}</p>
              </div>
            ))}
          </section>

          {/* Jornada */}
          <section className="bg-gradient-to-br from-white via-rose-50 to-white rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/60 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-love-600" />
              <div>
                <p className="text-xs uppercase font-semibold text-love-600 tracking-widest">Como funciona na prática</p>
                <h2 className="text-2xl font-serif text-love-900">3 etapas para viverem a mesma página</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="bg-white rounded-2xl border border-rose-100 p-5 flex flex-col gap-3">
                  <span className="w-8 h-8 rounded-full bg-love-50 text-love-600 flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-love-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Planos */}
          <section className="bg-white/80 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/50 p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-xs uppercase font-semibold text-love-600 tracking-widest">Do primeiro passo ao aprofundamento</p>
              <h2 className="text-3xl font-serif text-love-900">Tudo começa gratuito. Evoluir é opcional.</h2>
              <p className="text-sm sm:text-base text-slate-600">Queremos inaugurar o app com valores acessíveis e transparentes. O devocional diário será sempre aberto. A IA é o diferencial pago.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase font-semibold text-slate-500">
                  Plano gratuito
                  <Shield className="w-4 h-4" />
                </p>
                <h3 className="text-2xl font-serif text-love-900">Devocional do dia</h3>
                <p className="text-sm text-slate-600">Receba o estudo curado para o dia, registre notas e acompanhe a sequência semanal compartilhada.</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• 1 devocional novo por dia</li>
                  <li>• Notas individuais e compartilhadas</li>
                  <li>• Sequência da semana sincronizada</li>
                  <li>• Histórico básico</li>
                </ul>
                <p className="text-lg font-semibold text-love-700">R$ 0/mês · Lançamento global</p>
              </div>
              <div className="rounded-2xl border border-love-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-2xl shadow-rose-100 space-y-4">
                <p className="inline-flex items-center gap-2 text-xs uppercase font-semibold text-love-600">
                  Plano pago
                  <Sparkles className="w-4 h-4" />
                </p>
                <h3 className="text-2xl font-serif text-love-900">Devocionais com IA</h3>
                <p className="text-sm text-slate-600">Gere estudos ilimitados com perguntas personalizadas, salmos alternativos e aplicações adequadas ao momento do casal.</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Geração ilimitada via IA</li>
                  <li>• Escolha de temas e referências</li>
                  <li>• Texto bíblico + contexto + aplicações</li>
                  <li>• Prioridade nas novidades</li>
                </ul>
                <p className="text-lg font-semibold text-love-700">Pré-venda: R$ 19,90/mês por casal</p>
              </div>
            </div>
          </section>

          {/* Por que IA */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white/90 border border-rose-100 rounded-3xl p-8 shadow-lg space-y-5">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-love-600" />
                <div>
                  <p className="text-xs uppercase font-semibold text-love-600 tracking-widest">Mais do que texto</p>
                  <h2 className="text-2xl font-serif text-love-900">O que a IA entrega de diferente?</h2>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <Star className="w-4 h-4 text-love-500 mt-1" />
                  Respostas personalizadas: informe o contexto (alegria, luta, decisões) e a IA monta o estudo para esse momento específico.
                </li>
                <li className="flex gap-3">
                  <Star className="w-4 h-4 text-love-500 mt-1" />
                  Perguntas profundas: aplicação pensada para dialogar, não só responder mentalmente.
                </li>
                <li className="flex gap-3">
                  <Star className="w-4 h-4 text-love-500 mt-1" />
                  Velocidade: em segundos vocês recebem leitura bíblica, contexto histórico, conexão com Cristo e desafios práticos.
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-love-600 to-love-700 rounded-3xl p-8 text-white shadow-2xl shadow-love-500/40 space-y-5">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6" />
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold text-white/70">Como suportamos isso</p>
                  <h2 className="text-2xl font-serif">Seu apoio mantém o projeto vivo</h2>
                </div>
              </div>
              <p className="text-sm sm:text-base text-white/80">
                Cada geração usa modelos de IA avançados, além da infraestrutura segura que mantém as notas do casal protegidas. Com seu apoio conseguimos
                inaugurar o app para todo mundo, manter o devocional diário gratuito e continuar construindo recursos pedidos pela comunidade.
              </p>
              <Link
                href="https://forms.gle/alianca-pre-venda"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-love-600 px-6 py-3 font-semibold shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                Quero apoiar e gerar com IA
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="bg-white/90 border border-rose-100 rounded-3xl shadow-xl shadow-rose-100/50 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-love-600" />
              <div>
                <p className="text-xs uppercase font-semibold text-love-600 tracking-widest">Transparência</p>
                <h2 className="text-2xl font-serif text-love-900">Perguntas frequentes</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.question} className="p-5 rounded-2xl border border-slate-100 bg-white/80">
                  <p className="font-semibold text-love-900">{faq.question}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6 bg-gradient-to-br from-love-600 to-love-700 rounded-3xl p-10 text-white shadow-2xl shadow-love-500/30">
            <h2 className="text-3xl font-serif font-semibold">Inaugure o app com a gente</h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/80">
              Estamos liberando o acesso por lotes. Ao entrar agora você já testa o fluxo completo, gera devocionais com IA e ajuda a definir o futuro do produto.
              Quando o devocional diário gratuito for lançado, você já estará com tudo configurado.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="https://forms.gle/alianca-pre-venda"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-love-600 px-8 py-3 font-semibold shadow-lg hover:translate-y-0.5 transition-transform"
              >
                Quero participar da inauguração
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="mailto:contato@aliancaepalavra.com"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white px-8 py-3 font-semibold border border-white/30 hover:bg-white/20 transition-colors"
              >
                Falar com o time
                <Mail className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">
              Lote fundador · Cancelamento simples · Sem anúncios
            </p>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-500 pb-10 space-y-2">
            <p>© {new Date().getFullYear()} Aliança & Palavra · Um projeto para fortalecer casamentos em Cristo.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="mailto:contato@aliancaepalavra.com" className="inline-flex items-center gap-1 text-love-600 hover:text-love-700">
                <Mail className="w-3 h-3" /> contato@aliancaepalavra.com
              </Link>
              <Link href="https://aliancaepalavra.com" className="inline-flex items-center gap-1 text-love-600 hover:text-love-700">
                <Globe className="w-3 h-3" /> aliancaepalavra.com
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

