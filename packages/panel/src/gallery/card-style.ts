import { galleryCardStyles, type GalleryCardStyle } from './list.ts'

const cardStyleKey = 'mini-app.panel.card-style'

/** Fallback when nothing is stored. Not a host field. */
export const defaultCardStyle: GalleryCardStyle = 'glass'

/** Last card style chosen in this browser. Not a host field. */
export function readCardStyle(): GalleryCardStyle {
  if (typeof localStorage === 'undefined') return defaultCardStyle
  try {
    const value = localStorage.getItem(cardStyleKey)
    if (value !== null && (galleryCardStyles as readonly string[]).includes(value)) return value as GalleryCardStyle
  } catch {
    // Private mode can reject storage reads.
  }
  return defaultCardStyle
}

/** Remember the choice across panel reloads. */
export function writeCardStyle(style: GalleryCardStyle): void {
  try {
    localStorage.setItem(cardStyleKey, style)
  } catch {
    // A failed write still changes the current view.
  }
}
