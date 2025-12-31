"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";
export interface GeminiResponse {
  scriptureReference: string; // Referência bíblica validada/normalizada
  theme: string;
  culturalContext: string;
  literaryContext: string;
  christConnection: string;
  questions: string[];
}

export interface GeminiPremiumResponse extends GeminiResponse {
  centralTruth: string; // A principal lição teológica/espiritual do texto
  keyGreekHebrewTerms: string; // Termos chave no idioma original e seu significado
  comments: string; // O que os comentaristas geralmente explicam sobre o texto
}

// Ensure API key is present
// In Next.js, environment variables are exposed via process.env
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export interface DevotionalPlanResponse {
  title: string;
  days: {
    day: number;
    title: string;
    theme: string;
    scripture: string;
  }[];
}

export const generateDevotionalPlan = async (description: string, duration: number): Promise<DevotionalPlanResponse> => {
  const modelId = "gemini-3-flash-preview";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy and inspiring title for the entire devotional plan." },
      days: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER },
            title: { type: Type.STRING, description: "A specific title for this day's study." },
            theme: { type: Type.STRING, description: "The theological theme or topic for the day." },
            scripture: { type: Type.STRING, description: "The key scripture reference for the day." }
          },
          required: ["day", "title", "theme", "scripture"]
        }
      }
    },
    required: ["title", "days"]
  };

  const prompt = `
    Atue como um conselheiro cristão sábio.
    Crie um plano de devocional de ${duration} dias para um casal com a seguinte descrição/objetivo: "${description}".

    Para cada dia, forneça:
    - Um número do dia (1 a ${duration})
    - Um título específico e inspirador para o dia
    - Um tema teológico central
    - Uma referência bíblica chave que suporte o tema

    Também forneça um título criativo para o plano inteiro.
    Responda em PORTUGUÊS (Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No plan generated");
    
    return JSON.parse(text) as DevotionalPlanResponse;
  } catch (error) {
    console.error("Gemini API Error (Plan):", error);
    // Fallback simple plan
    return {
      title: "Plano de Exemplo (Fallback)",
      days: Array.from({ length: duration }, (_, i) => ({
        day: i + 1,
        title: `Dia ${i + 1}: Amor`,
        theme: "Amor",
        scripture: "1 Coríntios 13:4-7"
      }))
    };
  }
};

export const generateDevotionalContent = async (scripture: string, theme?: string): Promise<GeminiResponse> => {
  const modelId = "gemini-3-flash-preview";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      scriptureReference: { 
        type: Type.STRING, 
        description: "A referência bíblica EXATA e VÁLIDA no formato padrão brasileiro (ex: '1 Coríntios 13:4-7', 'Salmos 23', 'Gênesis 2:24'). DEVE ser um livro, capítulo e opcionalmente versículo(s) da Bíblia." 
      },
      theme: { type: Type.STRING, description: "A short, 2-3 word theme title for the devotional." },
      culturalContext: { type: Type.STRING, description: "Historical and cultural background of the passage." },
      literaryContext: { type: Type.STRING, description: "Where this fits in the book/chapter and literary style." },
      christConnection: { type: Type.STRING, description: "How this passage points to Jesus Christ or the Gospel." },
      questions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 specific questions for couples to discuss regarding this passage."
      }
    },
    required: ["scriptureReference", "theme", "culturalContext", "literaryContext", "christConnection", "questions"]
  };

  const themeInstruction = theme ? `O tema central deste estudo deve ser: "${theme}".` : "";

  const prompt = `
    Atue como um conselheiro cristão sábio e experiente em casamentos.
    
    O usuário digitou: "${scripture}"
    ${themeInstruction}
    
    PRIMEIRO, identifique se isso é uma referência bíblica válida:
    - Se for uma referência válida (ex: "1 cor 13", "salmo 23", "genesis 2:24"), normalize para o formato padrão brasileiro (ex: "1 Coríntios 13", "Salmos 23", "Gênesis 2:24")
    - Se NÃO for uma referência válida (ex: "alegria", "amor", "paciência"), encontre uma passagem bíblica relevante para casais sobre esse tema
    
    Depois, crie um estudo devocional curto e profundo para um casal baseado nessa passagem.
    
    O tom deve ser encorajador, teologicamente profundo mas acessível.
    Foque em como este texto se aplica à vida a dois.
    Responda em PORTUGUÊS (Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");
    
    return JSON.parse(text) as GeminiResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback for demo purposes if API fails or quota exceeded
    return {
      scriptureReference: "1 Coríntios 13:4-7",
      theme: "O Amor é Paciente (Fallback)",
      culturalContext: "Paulo escrevia aos Coríntios em uma época onde o amor era frequentemente visto como transacional ou puramente erótico. O conceito de ágape era revolucionário.",
      literaryContext: "Inserido no meio de instruções sobre dons espirituais, este capítulo funciona como o alicerce necessário para qualquer serviço cristão.",
      christConnection: "Jesus é a personificação perfeita deste amor. Ele foi paciente, benigno e tudo sofreu por nós na cruz.",
      questions: [
        "Em qual aspecto da descrição do amor você tem mais dificuldade hoje?",
        "Como a paciência de Cristo com você inspira sua paciência com seu cônjuge?",
        "Qual ação prática podemos tomar essa semana para demonstrar bondade um ao outro?"
      ]
    };
  }
};

// Lista pré-definida de referências bíblicas populares para devocionais de casal
const POPULAR_SCRIPTURES = [
  // --- Fundamentos e Unidade ---
  "Gênesis 2:24",
  "Gênesis 3",
  "Mateus 19:4-6",
  "Marcos 10:9",
  "Eclesiastes 4:9-12",
  "Salmos 34:3",
  "Salmos 133:1",
  "Amós 3:3",
  "Romanos 15:5-6",
  "Filipenses 2:1-2",
  "1 Pedro 3:8",
  
  // --- Amor e Compromisso ---
  "1 Coríntios 13:4-7",
  "1 Coríntios 13:13",
  "1 Coríntios 16:14",
  "Cantares 2:16",
  "Cantares 8:6-7",
  "Colossenses 3:14",
  "1 Pedro 4:8",
  "Provérbios 3:3-4",
  "João 15:12",
  "1 João 4:7-8",
  "1 João 4:18-19",
  "Romanos 13:8",
  
  // --- Papéis e Tratamento Mútuo ---
  "Efésios 5:21-33",
  "Efésios 5:25",
  "Colossenses 3:18-19",
  "1 Pedro 3:1-7",
  "Provérbios 31:10-31",
  "Provérbios 12:4",
  "Provérbios 18:22",
  "Provérbios 19:14",
  "Gálatas 5:13",
  
  // --- Comunicação e Sabedoria ---
  "Tiago 1:19",
  "Provérbios 15:1",
  "Provérbios 12:18",
  "Provérbios 16:24",
  "Provérbios 18:13",
  "Provérbios 25:11",
  "Efésios 4:29",
  "Salmos 19:14",
  "Colossenses 4:6",
  
  // --- Perdão e Paciência ---
  "Efésios 4:2-3",
  "Efésios 4:26-27",
  "Efésios 4:31-32",
  "Colossenses 3:12-13",
  "1 Pedro 3:9",
  "Provérbios 17:9",
  "Provérbios 19:11",
  "Tiago 5:16",
  "Lucas 6:37",
  "Mateus 6:14-15",
  
  // --- Intimidade e Romance ---
  "1 Coríntios 7:3-5",
  "Hebreus 13:4",
  "Provérbios 5:18-19",
  "Eclesiastes 9:9",
  "Cantares 1:2",
  "Cantares 4:7",
  "Cantares 2:10-13",
  
  // --- Casa e Família ---
  "Salmos 127:1",
  "Salmos 127:3-5",
  "Salmos 128:1-4",
  "Josué 24:15",
  "Provérbios 14:1",
  "Provérbios 24:3-4",
  "Deuteronômio 6:6-7",
  "3 João 1:2",
  
  // --- Encorajamento e Apoio ---
  "1 Tessalonicenses 5:11",
  "Hebreus 10:24-25",
  "Gálatas 6:2",
  "Romanos 12:10",
  "Romanos 12:12",
  "Romanos 12:15",
  "Filipenses 2:3-4",
  "Isaías 41:10",
  "Jeremias 29:11",

  // --- Proteção e Oração a Dois ---
  "Mateus 18:19-20",       // O poder de orar juntos
  "Salmos 91:1-2",         // Refúgio em tempos difíceis
  "2 Tessalonicenses 3:3", // Proteção contra o mal
  "Filipenses 4:6-7",      // Trocando ansiedade por oração
  "Jó 1:10",               // A cerca de proteção ao redor da casa
  "Números 6:24-26",       // A bênção sacerdotal (ótimo para orar um pelo outro)
  
  // --- Lealdade e Fidelidade ---
  "Rute 1:16-17",          // Compromisso inabalável
  "Malaquias 2:14-15",     // O Senhor como testemunha da aliança
  "Provérbios 20:6",       // A raridade do homem fiel
  "Salmos 15:4",           // Cumprir a palavra mesmo com prejuízo
  "Apocalipse 2:10",       // Fidelidade até o fim

  // --- Finanças e Contentamento ---
  "Hebreus 13:5",          // Contentamento
  "1 Timóteo 6:10",        // O perigo do amor ao dinheiro
  "Provérbios 22:7",       // Dívida e servidão
  "Provérbios 21:5",       // Planejamento vs. Pressa
  "Lucas 14:28",           // Planejamento de custos
  "Mateus 6:21",           // Onde está o tesouro, está o coração
  "Filipenses 4:11-13",    // Saber viver com pouco ou muito

  // --- Gerenciamento da Ira e Conflito ---
  "Tiago 1:20",            // A ira não produz justiça
  "Provérbios 29:11",      // O tolo expande a sua ira
  "Provérbios 15:18",      // O homem paciente apazigua a briga
  "Romanos 12:18",         // Viver em paz com todos
  "Salmos 4:4",            // Irai-vos e não pequeis
  "Mateus 5:23-24",        // Reconciliação antes da oferta
  
  // --- Bondade e Serviço ---
  "Gálatas 6:9-10",        // Não cansar de fazer o bem
  "Miquéias 6:8",          // Praticar a justiça e amar a misericórdia
  "Provérbios 11:25",      // O generoso prosperará
  "Marcos 10:45",          // Servir e não ser servido
  "Atos 20:35",            // Mais bem-aventurado dar do que receber

  // --- Esperança e Futuro ---
  "Jeremias 29:11",        // Planos de paz e esperança
  "Lamentações 3:22-23",   // As misericórdias se renovam
  "Isaías 40:31",          // Esperar no Senhor renova as forças
  "Habacuque 3:17-18",     // Alegria mesmo na escassez
  "Romanos 8:28",          // Tudo coopera para o bem
  "Salmos 37:5",           // Entrega o teu caminho ao Senhor

  // --- Sabedoria Prática ---
  "Salmos 90:12",          // Ensinar a contar os dias
  "Provérbios 4:23",       // Guarda o teu coração
  "Provérbios 13:20",      // Quem anda com sábios será sábio
  "Provérbios 27:17",      // Ferro afia ferro (crescimento mútuo)
  "Mateus 7:24-27",        // A casa sobre a rocha
  "1 Coríntios 10:13",     // Deus dá o escape na tentação
  
  // --- TEXTOS LONGOS: Capítulos e Grandes Porções ---
  "Gênesis 2",             // Criação do casal (capítulo completo)
  "Gênesis 24",            // História de Isaque e Rebeca (narrativa completa)
  "Rute 1",                // Compromisso de Rute com Noemi (história completa)
  "Rute 2",                // Rute e Boaz (encontro e bondade)
  "Rute 3",                // Rute e Boaz (proposta de casamento)
  "Rute 4",                // Casamento de Rute e Boaz
  "Cantares 1",            // Cântico dos Cânticos - capítulo 1
  "Cantares 2",            // Cântico dos Cânticos - capítulo 2
  "Cantares 3",            // Cântico dos Cânticos - capítulo 3
  "Cantares 4",            // Cântico dos Cânticos - capítulo 4
  "Cantares 5",            // Cântico dos Cânticos - capítulo 5
  "Cantares 8",            // Cântico dos Cânticos - capítulo 8
  "Salmos 23",             // O Senhor é meu pastor (completo)
  "Salmos 34",             // Salmo completo de louvor e confiança
  "Salmos 37",             // Confiança e paciência (grande porção)
  "Salmos 91",             // Proteção divina (capítulo completo)
  "Salmos 103",            // Misericórdia e bondade (capítulo completo)
  "Salmos 121",            // Ajuda vem do Senhor (completo)
  "Salmos 139",            // Conhecimento íntimo de Deus (capítulo completo)
  "Provérbios 5",          // Advertências sobre adultério e fidelidade
  "Provérbios 31",         // A mulher virtuosa (capítulo completo)
  "Eclesiastes 3",         // Tempo para todas as coisas
  "Eclesiastes 4",         // Valor da companhia (grande porção)
  "Isaías 40",             // Consolo e renovação (grande porção)
  "Isaías 55",             // Convite à vida abundante
  "Jeremias 31",           // Nova aliança e restauração
  "Mateus 5",              // Sermão do Monte - bem-aventuranças e relacionamentos
  "Mateus 6",              // Oração, jejum e confiança (grande porção)
  "Mateus 7",              // Julgamento, oração e casa sobre a rocha
  "Lucas 15",              // Parábolas da ovelha perdida, moeda e filho pródigo
  "João 15",               // A videira e os ramos (amor e permanência)
  "Romanos 8",             // Vida no Espírito e amor de Deus (grande porção)
  "Romanos 12",            // Vida cristã prática (capítulo completo)
  "1 Coríntios 7",         // Casamento e celibato (grande porção)
  "1 Coríntios 13",        // O capítulo do amor (completo)
  "Efésios 4",             // Unidade e renovação (capítulo completo)
  "Efésios 5",             // Andar em amor e relacionamentos (capítulo completo)
  "Filipenses 2",          // Humildade e unidade (grande porção)
  "Filipenses 4",          // Alegria e contentamento (capítulo completo)
  "Colossenses 3",         // Vida nova em Cristo (capítulo completo)
  "1 Tessalonicenses 4",   // Santificação e amor fraternal
  "1 Tessalonicenses 5",   // Exortações finais e encorajamento
  "1 Pedro 3",             // Relacionamentos e submissão (grande porção)
  "1 João 4",              // Amor de Deus e amor uns pelos outros (grande porção)
  
  // --- HISTÓRIAS DE CASAIS BÍBLICOS (Narrativas) ---
  "Gênesis 12:10-20",      // Abraão e Sara no Egito (confiança e proteção)
  "Gênesis 18",            // Abraão, Sara e a promessa de Isaque
  "Gênesis 20",            // Abraão e Sara em Gerar (proteção divina)
  "Gênesis 26:6-11",       // Isaque e Rebeca em Gerar
  "Gênesis 29:15-30",      // Jacó, Raquel e Lia (amor e trabalho)
  "1 Samuel 1",            // Ana e Elcana (oração e fidelidade)
  "1 Samuel 25",           // Davi, Abigail e Nabal (sabedoria e proteção)
  "Ester 1-2",             // Ester e Assuero (preparação e propósito)
  "Ester 4-5",             // Ester intercede pelo povo (coragem a dois)
  "Lucas 1",               // Zacarias e Isabel (fidelidade e promessa)
  "Atos 18:1-3",           // Áquila e Priscila (trabalho e ministério juntos)
  "Atos 18:24-28",         // Áquila e Priscila ensinam Apolo (ministério conjunto)
  
  // --- PARÁBOLAS E ENSINOS RELEVANTES ---
  "Mateus 13:1-23",        // Parábola do semeador (crescimento juntos)
  "Mateus 18:21-35",       // Parábola do servo impiedoso (perdão)
  "Mateus 25:1-13",        // Parábola das dez virgens (preparação)
  "Mateus 25:14-30",       // Parábola dos talentos (mordomia)
  "Lucas 10:38-42",        // Maria e Marta (prioridades)
  "Lucas 12:22-34",        // Não andeis ansiosos (confiança)
  "João 2:1-11",           // Bodas de Caná (primeiro milagre de Jesus)
  "João 4:1-42",           // Jesus e a mulher samaritana (restauração)
  "João 11",               // Morte e ressurreição de Lázaro (esperança)
  
  // --- TEXTOS MENOS ÓBVIOS MAS PODEROSOS ---
  "Gênesis 1:26-28",       // Imagem de Deus e multiplicação
  "Gênesis 9:1-7",         // Bênção de Noé e família
  "Deuteronômio 24:5",     // Ano de felicidade para o recém-casado
  "Jó 2:9-10",             // Jó e sua mulher (fidelidade na provação)
  "Salmos 1",              // Bem-aventurança do justo
  "Salmos 8",              // Majestade de Deus e dignidade humana
  "Salmos 16",             // Herança e alegria
  "Salmos 25",             // Confiança e direção
  "Salmos 32",             // Felicidade do perdão
  "Salmos 46",             // Deus é nosso refúgio
  "Salmos 51",             // Arrependimento e restauração
  "Salmos 62",             // Confiança somente em Deus
  "Salmos 73",             // Inveja e contentamento
  "Salmos 84",             // Bem-aventurança dos que habitam na casa do Senhor
  "Salmos 100",            // Entrai pelas portas com ações de graças
  "Salmos 112",            // Bem-aventurança do que teme ao Senhor
  "Salmos 119:1-16",       // Bem-aventurança dos retos
  "Salmos 133",            // Quão bom e quão suave
  "Salmos 145",            // Grandeza e bondade de Deus
  "Provérbios 1:7",        // Temor do Senhor é o princípio
  "Provérbios 2",          // Buscar sabedoria
  "Provérbios 3",          // Confiança e sabedoria
  "Provérbios 6:20-35",    // Advertência sobre adultério
  "Provérbios 8",          // Sabedoria chama
  "Provérbios 9",          // Sabedoria vs. insensatez
  "Provérbios 10",         // Provérbios de Salomão
  "Provérbios 14:12",      // Há caminho que parece direito
  "Provérbios 16:3",       // Entrega teus caminhos ao Senhor
  "Provérbios 17:17",      // O amigo ama em todo tempo
  "Provérbios 19:20-21",   // Escuta conselho e recebe instrução
  "Provérbios 20:22",      // Não digas: vingar-me-ei
  "Provérbios 22:6",       // Ensina a criança no caminho
  "Provérbios 27:1",       // Não te glories do dia de amanhã
  "Eclesiastes 9:7-10",     // Goza a vida com a mulher que amas
  "Eclesiastes 12:13-14",   // Temer a Deus e guardar os mandamentos
  "Isaías 26:3",           // Tu guardarás em paz
  "Isaías 41:13",          // Eu te ajudo
  "Isaías 43:1-3",         // Não temas, porque eu te remi
  "Isaías 54:5",           // Teu marido é o teu Criador
  "Jeremias 17:7-8",       // Bendito o homem que confia no Senhor
  "Lamentações 3:22-26",   // As misericórdias do Senhor
  "Oséias 2:19-20",        // Desposar-te-ei para sempre
  "Malaquias 3:16",        // Livro de memória
  "Mateus 11:28-30",       // Vinde a mim todos os que estais cansados
  "Mateus 22:37-40",       // Amar a Deus e ao próximo
  "Marcos 12:30-31",       // Amar a Deus e ao próximo
  "Lucas 1:37",            // Para Deus nada é impossível
  "Lucas 11:9-13",         // Pedi e dar-se-vos-á
  "João 3:16-17",          // Porque Deus amou o mundo
  "João 14:1-3",           // Não se turbe o vosso coração
  "João 14:27",            // Deixo-vos a paz
  "João 16:33",            // Tende bom ânimo
  "Atos 1:8",              // Recebereis poder
  "Romanos 5:8",           // Deus prova seu amor
  "Romanos 8:1",           // Nenhuma condenação
  "Romanos 8:38-39",       // Nada nos separará do amor
  "Romanos 14:19",         // Sigamos as coisas da paz
  "1 Coríntios 6:19-20",   // Sois templo do Espírito
  "1 Coríntios 11:3",      // Cabeça de todo homem
  "2 Coríntios 5:17",      // Nova criatura
  "2 Coríntios 9:8",       // Deus pode fazer abundar
  "Gálatas 2:20",          // Já não sou eu quem vive
  "Gálatas 5:22-23",       // Fruto do Espírito
  "Efésios 1:3",           // Bendito o Deus e Pai
  "Efésios 2:10",          // Obra-prima de Deus
  "Efésios 3:20",          // Poder de fazer muito mais
  "Efésios 6:10-18",       // Armadura de Deus
  "Filipenses 1:6",        // Aquele que começou a boa obra
  "Filipenses 3:13-14",    // Prossigo para o alvo
  "Colossenses 1:15-20",   // Cristo é a imagem do Deus invisível
  "Colossenses 2:6-7",     // Andai nele
  "1 Tessalonicenses 3:12", // Aumente o amor
  "1 Timóteo 4:12",        // Sê exemplo
  "2 Timóteo 1:7",         // Espírito de poder
  "Tito 2:4-5",            // Ensinar as mulheres jovens
  "Hebreus 4:16",          // Cheguemos com confiança
  "Hebreus 11:1",          // Fé é a certeza
  "Hebreus 12:1-2",        // Corramos com perseverança
  "Hebreus 13:8",          // Jesus Cristo é o mesmo
  "Tiago 1:2-4",           // Provai de gozo
  "Tiago 1:17",            // Toda boa dádiva
  "Tiago 4:7-8",           // Sujeitai-vos a Deus
  "1 Pedro 1:3-5",         // Esperança viva
  "1 Pedro 2:9",           // Geração eleita
  "1 Pedro 4:8",           // Amor cobre multidão
  "1 Pedro 5:7",           // Lançai sobre ele toda vossa ansiedade
  "2 Pedro 1:5-7",         // Aumentai vossa fé
  "1 João 1:9",            // Se confessarmos os pecados
  "1 João 3:1",            // Vede que grande amor
  "1 João 5:14-15",        // Se pedirmos segundo sua vontade
  "Apocalipse 3:20",       // Eis que estou à porta
  "Apocalipse 21:1-4"      // Novo céu e nova terra
];

export const generateDevotionalContentPremium = async (scripture: string, theme?: string): Promise<GeminiPremiumResponse> => {
  const modelId = "gemini-3-flash-preview";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      scriptureReference: { 
        type: Type.STRING, 
        description: "A referência bíblica EXATA e VÁLIDA no formato padrão brasileiro (ex: '1 Coríntios 13:4-7', 'Salmos 23', 'Gênesis 2:24'). DEVE ser um livro, capítulo e opcionalmente versículo(s) da Bíblia." 
      },
      theme: { 
        type: Type.STRING, 
        description: "Um título curto de 2-3 palavras para o tema do devocional." 
      },
      culturalContext: { 
        type: Type.STRING, 
        description: "Contexto histórico e cultural da passagem, incluindo informações sobre a época, costumes, práticas sociais e situações que os leitores originais enfrentavam." 
      },
      literaryContext: { 
        type: Type.STRING, 
        description: "Onde esta passagem se encaixa no livro/capítulo e seu estilo literário (narrativa, poesia, carta, profecia, etc.)." 
      },
      christConnection: { 
        type: Type.STRING, 
        description: "Como esta passagem aponta para Jesus Cristo ou o Evangelho. Inclua conexões cristológicas e teológicas profundas." 
      },
      questions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 questões específicas e profundas para casais discutirem sobre esta passagem."
      },
      centralTruth: {
        type: Type.STRING,
        description: "A principal lição teológica/espiritual do texto. Deve ser uma verdade central extraída do texto que seja aplicável ao relacionamento do casal. Seja específico e teologicamente preciso."
      },
      keyGreekHebrewTerms: {
        type: Type.STRING,
        description: "Termos chave no idioma original (grego ou hebraico) e seu significado. Inclua a transliteração, o termo original quando relevante, e uma explicação do significado que enriquece a compreensão do texto. Foque em termos que têm significado teológico ou prático importante para casais."
      },
      comments: {
        type: Type.STRING,
        description: "O que os comentaristas bíblicos geralmente explicam sobre este texto. Inclua insights de estudiosos respeitados, interpretações históricas, e perspectivas teológicas que aprofundam a compreensão da passagem. Seja acadêmico mas acessível."
      }
    },
    required: [
      "scriptureReference", 
      "theme", 
      "culturalContext", 
      "literaryContext", 
      "christConnection", 
      "questions",
      "centralTruth",
      "keyGreekHebrewTerms",
      "comments"
    ]
  };

    const themeInstruction = theme ? `O tema central deste estudo deve ser: "${theme}".` : "";

  const prompt = `
    Atue como um erudito bíblico cristão, especialista em estudos teológicos e exegéticos, com profundo conhecimento de grego e hebraico, e experiência em aconselhamento de casais.
    
    O usuário digitou: "${scripture}"
    ${themeInstruction}
    
    PRIMEIRO, identifique se isso é uma referência bíblica válida:
    - Se for uma referência válida (ex: "1 cor 13", "salmo 23", "genesis 2:24"), normalize para o formato padrão brasileiro (ex: "1 Coríntios 13", "Salmos 23", "Gênesis 2:24")
    - Se NÃO for uma referência válida (ex: "alegria", "amor", "paciência"), encontre uma passagem bíblica relevante para casais sobre esse tema
    
    Depois, crie um estudo devocional PREMIUM, extenso e profundamente teológico para um casal baseado nessa passagem.
    
    Este é um devocional PREMIUM, então deve incluir:
    1. Análise teológica profunda com a verdade central extraída do texto
    2. Termos chave em grego/hebraico com suas transliterações e significados que enriquecem a compreensão
    3. Insights de comentaristas bíblicos respeitados e perspectivas históricas
    
    O tom deve ser:
    - Erudito mas acessível
    - Teologicamente profundo e preciso
    - Aplicável à vida a dois
    - Encorajador e edificante
    
    Foque em como este texto se aplica profundamente à vida conjugal, mas mantenha a integridade exegética e teológica.
    Responda em PORTUGUÊS (Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8, // Temperatura um pouco mais alta para respostas mais criativas e profundas
      },
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");
    
    return JSON.parse(text) as GeminiPremiumResponse;
  } catch (error) {
    console.error("Gemini API Error (Premium):", error);
    // Fallback para demonstração se a API falhar ou exceder a cota
    return {
      scriptureReference: "1 Coríntios 13:4-7",
      theme: "O Amor é Paciente (Fallback Premium)",
      culturalContext: "Paulo escrevia aos Coríntios em uma época onde o amor era frequentemente visto como transacional ou puramente erótico. O conceito de ágape era revolucionário. Na cultura greco-romana, o amor era muitas vezes baseado em reciprocidade e benefício mútuo, mas Paulo apresenta um amor que é incondicional e sacrificial.",
      literaryContext: "Inserido no meio de instruções sobre dons espirituais (capítulos 12-14), este capítulo funciona como o alicerce necessário para qualquer serviço cristão. É um poema sobre o amor que contrasta com os dons espirituais, mostrando que sem amor, mesmo os maiores dons são vazios.",
      christConnection: "Jesus é a personificação perfeita deste amor. Ele foi paciente, benigno e tudo sofreu por nós na cruz. O amor ágape descrito aqui encontra sua expressão máxima na encarnação, vida, morte e ressurreição de Cristo. Este amor não é apenas um ideal, mas uma realidade encarnada em Jesus.",
      questions: [
        "Em qual aspecto da descrição do amor você tem mais dificuldade hoje?",
        "Como a paciência de Cristo com você inspira sua paciência com seu cônjuge?",
        "Qual ação prática podemos tomar essa semana para demonstrar bondade um ao outro?"
      ],
      centralTruth: "O amor verdadeiro (ágape) é a essência e o fundamento de toda vida cristã e relacionamento. Sem este amor sacrificial, paciente e incondicional, todas as outras virtudes e dons são vazios. Este amor encontra sua origem e modelo em Deus, e sua expressão máxima em Cristo Jesus.",
      keyGreekHebrewTerms: "Ágape (ἀγάπη): O termo grego usado aqui para 'amor' não se refere ao amor romântico (eros) ou ao amor fraternal (philia), mas ao amor divino, sacrificial e incondicional. É o amor que escolhe o bem do outro independentemente de sentimentos ou reciprocidade. Paciente (μακροθυμέω): Literalmente 'longo de ânimo', significa ter paciência prolongada, especialmente diante de provocações. Não se trata apenas de esperar, mas de manter a calma e a bondade mesmo quando ferido.",
      comments: "Comentaristas como John Stott e Gordon Fee destacam que este capítulo não é apenas poético, mas profundamente teológico. Fee observa que Paulo está contrastando os dons espirituais (que os coríntios valorizavam excessivamente) com o amor (que eles negligenciavam). Stott enfatiza que este amor não é um sentimento, mas uma decisão e uma ação. Para casais, isso significa que o amor conjugal deve ser ativo, não apenas reativo. Comentaristas históricos como Matthew Henry também notam que cada atributo do amor descrito aqui é uma escolha diária, não um sentimento passageiro."
    };
  }
};

export const suggestScripture = async (): Promise<string> => {
  // Escolhe aleatoriamente da lista (instantâneo, sem chamada de IA)
  const randomIndex = Math.floor(Math.random() * POPULAR_SCRIPTURES.length);
  return POPULAR_SCRIPTURES[randomIndex];
}