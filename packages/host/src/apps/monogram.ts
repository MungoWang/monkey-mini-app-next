/**
 * Two-character gallery badge. A manifest acronym wins. Latin letters are
 * uppercased. Otherwise the first two letters or digits of the name. If the
 * name has fewer, the first two characters.
 * @param name - manifest name, already non-empty
 * @param acronym - author acronym, already two letters or digits when present
 */
export function monogram(name: string, acronym?: string): string {
  if (acronym !== undefined) {
    return /^[A-Za-z]{2}$/.test(acronym) ? acronym.toUpperCase() : acronym
  }
  const letters = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
  if (letters.length === 2) return letters
  return name.trim().slice(0, 2).toUpperCase()
}
