export type Palette = Record<'ivory'|'red'|'metal'|'glass'|'cyan'|'gold'|'rock'|'planet'|'light', string>;
export function readPalette(): Palette {
 const css = getComputedStyle(document.documentElement);
 const color = (name: string) => css.getPropertyValue(`--scene-${name}`).trim();
 return Object.fromEntries(['ivory','red','metal','glass','cyan','gold','rock','planet','light'].map(k => [k,color(k)])) as Palette;
}
