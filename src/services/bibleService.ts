// Mapeamento de nomes em português para abreviações da API ABíbliaDigital
const bookAbbreviations: Record<string, string> = {
  // Antigo Testamento
  'genesis': 'gn',
  'gênesis': 'gn',
  'gn': 'gn',
  'exodo': 'ex',
  'êxodo': 'ex',
  'ex': 'ex',
  'levitico': 'lv',
  'levítico': 'lv',
  'lv': 'lv',
  'numeros': 'nm',
  'números': 'nm',
  'nm': 'nm',
  'deuteronomio': 'dt',
  'deuteronômio': 'dt',
  'dt': 'dt',
  'josue': 'js',
  'josué': 'js',
  'js': 'js',
  'juizes': 'jz',
  'juízes': 'jz',
  'jz': 'jz',
  'rute': 'rt',
  'rt': 'rt',
  '1 samuel': '1sm',
  '1samuel': '1sm',
  '1sm': '1sm',
  '2 samuel': '2sm',
  '2samuel': '2sm',
  '2sm': '2sm',
  '1 reis': '1rs',
  '1reis': '1rs',
  '1rs': '1rs',
  '2 reis': '2rs',
  '2reis': '2rs',
  '2rs': '2rs',
  '1 cronicas': '1cr',
  '1 crônicas': '1cr',
  '1cronicas': '1cr',
  '1crônicas': '1cr',
  '1cr': '1cr',
  '2 cronicas': '2cr',
  '2 crônicas': '2cr',
  '2cronicas': '2cr',
  '2crônicas': '2cr',
  '2cr': '2cr',
  'esdras': 'ed',
  'ed': 'ed',
  'neemias': 'ne',
  'ne': 'ne',
  'ester': 'et',
  'et': 'et',
  'jo': 'jó',
  'jó': 'jó',
  'job': 'jó',
  'salmos': 'sl',
  'salmo': 'sl',
  'sl': 'sl',
  'proverbios': 'pv',
  'provérbios': 'pv',
  'pv': 'pv',
  'eclesiastes': 'ec',
  'ec': 'ec',
  'canticos': 'ct',
  'cânticos': 'ct',
  'cantares': 'ct',
  'cantico dos canticos': 'ct',
  'cântico dos cânticos': 'ct',
  'ct': 'ct',
  'isaias': 'is',
  'isaías': 'is',
  'is': 'is',
  'jeremias': 'jr',
  'jr': 'jr',
  'lamentacoes': 'lm',
  'lamentações': 'lm',
  'lm': 'lm',
  'ezequiel': 'ez',
  'ez': 'ez',
  'daniel': 'dn',
  'dn': 'dn',
  'oseias': 'os',
  'oséias': 'os',
  'os': 'os',
  'joel': 'jl',
  'jl': 'jl',
  'amos': 'am',
  'amós': 'am',
  'am': 'am',
  'obadias': 'ob',
  'ob': 'ob',
  'jonas': 'jn',
  'jn': 'jn',
  'miqueias': 'mq',
  'miquéias': 'mq',
  'mq': 'mq',
  'naum': 'na',
  'na': 'na',
  'habacuque': 'hc',
  'hc': 'hc',
  'sofonias': 'sf',
  'sf': 'sf',
  'ageu': 'ag',
  'ag': 'ag',
  'zacarias': 'zc',
  'zc': 'zc',
  'malaquias': 'ml',
  'ml': 'ml',
  // Novo Testamento
  'mateus': 'mt',
  'mt': 'mt',
  'marcos': 'mc',
  'mc': 'mc',
  'lucas': 'lc',
  'lc': 'lc',
  'joao': 'jo',
  'joão': 'jo',
  'atos': 'at',
  'at': 'at',
  'romanos': 'rm',
  'rm': 'rm',
  '1 corintios': '1co',
  '1 coríntios': '1co',
  '1corintios': '1co',
  '1coríntios': '1co',
  '1co': '1co',
  '2 corintios': '2co',
  '2 coríntios': '2co',
  '2corintios': '2co',
  '2coríntios': '2co',
  '2co': '2co',
  'galatas': 'gl',
  'gálatas': 'gl',
  'gl': 'gl',
  'efesios': 'ef',
  'efésios': 'ef',
  'ef': 'ef',
  'filipenses': 'fp',
  'fp': 'fp',
  'colossenses': 'cl',
  'cl': 'cl',
  '1 tessalonicenses': '1ts',
  '1tessalonicenses': '1ts',
  '1ts': '1ts',
  '2 tessalonicenses': '2ts',
  '2tessalonicenses': '2ts',
  '2ts': '2ts',
  '1 timoteo': '1tm',
  '1 timóteo': '1tm',
  '1timoteo': '1tm',
  '1timóteo': '1tm',
  '1tm': '1tm',
  '2 timoteo': '2tm',
  '2 timóteo': '2tm',
  '2timoteo': '2tm',
  '2timóteo': '2tm',
  '2tm': '2tm',
  'tito': 'tt',
  'tt': 'tt',
  'filemom': 'fm',
  'filemon': 'fm',
  'fm': 'fm',
  'hebreus': 'hb',
  'hb': 'hb',
  'tiago': 'tg',
  'tg': 'tg',
  '1 pedro': '1pe',
  '1pedro': '1pe',
  '1pe': '1pe',
  '2 pedro': '2pe',
  '2pedro': '2pe',
  '2pe': '2pe',
  '1 joao': '1jo',
  '1 joão': '1jo',
  '1joao': '1jo',
  '1joão': '1jo',
  '1jo': '1jo',
  '2 joao': '2jo',
  '2 joão': '2jo',
  '2joao': '2jo',
  '2joão': '2jo',
  '2jo': '2jo',
  '3 joao': '3jo',
  '3 joão': '3jo',
  '3joao': '3jo',
  '3joão': '3jo',
  '3jo': '3jo',
  'judas': 'jd',
  'jd': 'jd',
  'apocalipse': 'ap',
  'ap': 'ap',
};

interface ParsedReference {
  abbrev: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

function parseScriptureReference(reference: string): ParsedReference | null {
  // Normaliza a referência
  const normalized = reference
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  // Regex para capturar: "Livro Capítulo:Versículo-Versículo" ou "Livro Capítulo"
  // Exemplos: "Salmos 1", "João 3:16", "Romanos 8:28-30", "1 Coríntios 13:4-8"
  const match = normalized.match(/^(.+?)\s*(\d+)(?:\s*[:,.]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/);

  if (!match) {
    return null;
  }

  const [, bookName, chapterStr, verseStartStr, verseEndStr] = match;
  const cleanBookName = bookName.trim();
  
  // Busca a abreviação do livro
  const abbrev = bookAbbreviations[cleanBookName];
  if (!abbrev) {
    console.error(`Livro não encontrado: "${cleanBookName}"`);
    return null;
  }

  return {
    abbrev,
    chapter: parseInt(chapterStr, 10),
    verseStart: verseStartStr ? parseInt(verseStartStr, 10) : undefined,
    verseEnd: verseEndStr ? parseInt(verseEndStr, 10) : undefined,
  };
}

interface BibleVerse {
  number: number;
  text: string;
}

interface BibleChapterResponse {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: BibleVerse[];
}

interface BibleVerseResponse {
  book: {
    abbrev: { pt: string; en: string };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: number;
  number: number;
  text: string;
}

const BIBLE_VERSION = 'nvi'; // Nova Versão Internacional
const API_BASE_URL = 'https://www.abibliadigital.com.br/api';

export async function fetchBiblePassageText(scriptureReference: string): Promise<string | null> {
  if (!scriptureReference) {
    return null;
  }

  const parsed = parseScriptureReference(scriptureReference);
  if (!parsed) {
    console.error(`Não foi possível interpretar a referência: "${scriptureReference}"`);
    return null;
  }

  const { abbrev, chapter, verseStart, verseEnd } = parsed;

  try {
    // Se temos versículos específicos, buscamos apenas esses
    if (verseStart !== undefined) {
      if (verseEnd !== undefined && verseEnd > verseStart) {
        // Intervalo de versículos - precisamos buscar o capítulo inteiro e filtrar
        const url = `${API_BASE_URL}/verses/${BIBLE_VERSION}/${abbrev}/${chapter}`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) {
          console.error(`API Bíblia respondeu com status ${response.status} para ${url}`);
          return null;
        }

        const data: BibleChapterResponse = await response.json();
        
        if (!data.verses || data.verses.length === 0) {
          return null;
        }

        // Filtra os versículos no intervalo
        const filteredVerses = data.verses.filter(
          (v) => v.number >= verseStart && v.number <= verseEnd
        );

        if (filteredVerses.length === 0) {
          return null;
        }

        return filteredVerses
          .map((v) => `${v.number}. ${v.text.trim()}`)
          .join('\n')
          .trim();
      } else {
        // Versículo único
        const url = `${API_BASE_URL}/verses/${BIBLE_VERSION}/${abbrev}/${chapter}/${verseStart}`;
        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) {
          console.error(`API Bíblia respondeu com status ${response.status} para ${url}`);
          return null;
        }

        const data: BibleVerseResponse = await response.json();
        
        if (!data.text) {
          return null;
        }

        return `${data.number}. ${data.text.trim()}`;
      }
    } else {
      // Capítulo inteiro
      const url = `${API_BASE_URL}/verses/${BIBLE_VERSION}/${abbrev}/${chapter}`;
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        console.error(`API Bíblia respondeu com status ${response.status} para ${url}`);
        return null;
      }

      const data: BibleChapterResponse = await response.json();
      
      if (!data.verses || data.verses.length === 0) {
        return null;
      }

      return data.verses
        .map((v) => `${v.number}. ${v.text.trim()}`)
        .join('\n')
        .trim();
    }
  } catch (error) {
    console.error('Falha ao buscar texto bíblico:', error);
    return null;
  }
}
