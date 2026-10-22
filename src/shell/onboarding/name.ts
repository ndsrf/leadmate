export const DOG_NAME_MAX = 20;

/** The Dog's name as entered: trimmed, 1 to 20 characters; null when blank, too long or not text. */
export function cleanDogName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  return name.length >= 1 && name.length <= DOG_NAME_MAX ? name : null;
}
