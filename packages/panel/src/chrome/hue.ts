/** Stable hue from an app id. Used by gallery card art. */
export function galleryHue(id: string): number {
  let hue = 0
  for (let index = 0; index < id.length; index += 1) hue = (hue * 31 + id.charCodeAt(index)) % 360
  return hue
}
