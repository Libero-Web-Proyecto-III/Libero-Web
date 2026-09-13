// # Este bloque tiene como objetivo proveer un filtro de seguridad y moderación de contenido para detectar lenguaje grosero, insultos y profanidades en múltiples idiomas (Español / Inglés)
export const BANNED_WORDS: string[] = [
  // Español (Colombia, LATAM, España)
  'puta', 'puto', 'putas', 'putos', 'putaero', 'puteria',
  'perra', 'perro', 'perras', 'perros',
  'gonorrea', 'gonorreas',
  'hijueputa', 'hijaputa', 'hijo de puta', 'hija de puta', 'hijuetuta', 'hp',
  'pendejo', 'pendeja', 'pendejos', 'pendejas', 'pendejada',
  'mierda', 'comemierda',
  'malparido', 'malparida', 'malparidos', 'malparidas',
  'maricon', 'maricón', 'maricones', 'marica', 'maricas',
  'cabron', 'cabrón', 'cabrones', 'cabrona',
  'chupa', 'chupada', 'tetas', 'verga', 'picha', 'pene', 'vagina', 'panocha', 'bolas',
  'carechimba', 'chimba', 'guevon', 'huevo', 'huevon', 'huevón', 'guevón',
  'bastardo', 'bastarda',
  'zorra', 'zorras',
  'idiota', 'estupido', 'estúpido', 'imbecil', 'imbécil', 'tarado', 'subnormal',
  'perrazo', 'perraza',

  // Inglés
  'fuck', 'fucking', 'fucker', 'fucks',
  'shit', 'shitting', 'shitty',
  'bitch', 'bitches', 'bitching',
  'asshole', 'ass', 'bastard',
  'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigger', 'faggot',
];

// # Este bloque normaliza el texto quitando tildes, caracteres especiales y reemplazando variaciones de leetspeak (ej. p0ta, p3rra, p*ta)
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/[\*\.\-\_\+\=\#]/g, '');
}

// # Este bloque evalúa si un texto contiene alguna palabra o expresión del listado de lenguaje no permitido
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const normalized = normalizeText(text);

  for (const word of BANNED_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalizedWord.length <= 2) {
      const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
      if (regex.test(normalized)) return true;
    } else {
      const regex = new RegExp(`\\b${normalizedWord}|${normalizedWord}\\b`, 'i');
      if (regex.test(normalized)) return true;
    }
  }

  return false;
}
