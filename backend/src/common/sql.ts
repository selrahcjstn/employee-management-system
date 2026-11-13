/** Escapes % _ and \ so a user's search text is matched literally by LIKE / ILIKE. */
export const escapeLike = (term: string) =>
  term.replace(/[\\%_]/g, (char) => `\\${char}`);
