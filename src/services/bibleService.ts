const bookMappings: Record<string, string> = {
  'genesis': 'Genesis',
  'exodo': 'Exodus',
  'levitico': 'Leviticus',
  'numeros': 'Numbers',
  'deuteronomio': 'Deuteronomy',
  'josue': 'Joshua',
  'juizes': 'Judges',
  'rute': 'Ruth',
  '1 samuel': '1 Samuel',
  '2 samuel': '2 Samuel',
  '1 reis': '1 Kings',
  '2 reis': '2 Kings',
  '1 cronicas': '1 Chronicles',
  '2 cronicas': '2 Chronicles',
  'esdras': 'Ezra',
  'neemias': 'Nehemiah',
  'ester': 'Esther',
  'jo': 'Job',
  'salmos': 'Psalms',
  'salmo': 'Psalms',
  'proverbios': 'Proverbs',
  'eclesiastes': 'Ecclesiastes',
  'canticos': 'Song of Solomon',
  'cantico dos canticos': 'Song of Solomon',
  'cantico': 'Song of Solomon',
  'cantares': 'Song of Solomon',
  'isaias': 'Isaiah',
  'jeremias': 'Jeremiah',
  'lamentacoes': 'Lamentations',
  'ezequiel': 'Ezekiel',
  'daniel': 'Daniel',
  'oseias': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'obadias': 'Obadiah',
  'jonas': 'Jonah',
  'miqueias': 'Micah',
  'naum': 'Nahum',
  'habacuque': 'Habakkuk',
  'sofonias': 'Zephaniah',
  'ageu': 'Haggai',
  'zacarias': 'Zechariah',
  'malaquias': 'Malachi',
  'mateus': 'Matthew',
  'marcos': 'Mark',
  'lucas': 'Luke',
  'joao': 'John',
  'atos': 'Acts',
  'romanos': 'Romans',
  '1 corintios': '1 Corinthians',
  '2 corintios': '2 Corinthians',
  'galatas': 'Galatians',
  'efesios': 'Ephesians',
  'filipenses': 'Philippians',
  'colossenses': 'Colossians',
  '1 tesselonicenses': '1 Thessalonians',
  '2 tesselonicenses': '2 Thessalonians',
  '1 timoteo': '1 Timothy',
  '2 timoteo': '2 Timothy',
  'tito': 'Titus',
  'filemom': 'Philemon',
  'hebreus': 'Hebrews',
  'tiago': 'James',
  '1 pedro': '1 Peter',
  '2 pedro': '2 Peter',
  '1 joao': '1 John',
  '2 joao': '2 John',
  '3 joao': '3 John',
  'judas': 'Jude',
  'apocalipse': 'Revelation',
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buildBibleApiQuery = (reference: string): string => {
  const sanitized = reference.replace(/\s+/g, ' ').trim();
  const match = sanitized.match(/^(.*?)(\d+)(?:[:.]\s*([\d,\-\s]+))?$/);

  if (!match) {
    return encodeURIComponent(removeDiacritics(sanitized));
  }

  const [, rawBook, chapter, verses] = match;
  const normalizedBookKey = normalize(rawBook);
  const translatedBook = bookMappings[normalizedBookKey] ?? rawBook;
  const cleaned = `${translatedBook} ${chapter}${verses ? `:${verses.replace(/\s+/g, '')}` : ''}`;

  return encodeURIComponent(removeDiacritics(cleaned));
};

export async function fetchBiblePassageText(scriptureReference: string): Promise<string | null> {
  if (!scriptureReference) {
    return null;
  }

  const query = buildBibleApiQuery(scriptureReference);
  const url = `https://bible-api.com/${query}?translation=almeida`;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Bible API respondeu com status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data?.verses) && data.verses.length > 0) {
      return data.verses
        .map((verse: { verse: number; text: string }) => `${verse.verse}. ${verse.text.trim()}`)
        .join('\n')
        .trim();
    }

    if (typeof data?.text === 'string') {
      return data.text.trim();
    }

    return null;
  } catch (error) {
    console.error('Falha ao buscar texto bíblico:', error);
    return null;
  }
}

