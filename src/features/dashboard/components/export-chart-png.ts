import { toPng } from 'html-to-image';

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function exportElementAsPng(node: HTMLElement, fileName: string) {
  const rootStyles = getComputedStyle(document.documentElement);
  const bodyStyles = getComputedStyle(document.body);
  const themeVariables = [
    '--color-primary',
    '--color-success',
    '--color-error',
    '--color-base-300',
    '--color-base-content',
  ];

  const dataUrl = await toPng(node, {
    backgroundColor: bodyStyles.backgroundColor,
    style: Object.fromEntries(
      themeVariables.map((name) => [name, rootStyles.getPropertyValue(name).trim()])
    ) as Partial<CSSStyleDeclaration>,
    pixelRatio: 2,              // sharper image, about 2x the on-screen size
    cacheBust: true,
    // Leave out anything marked data-export-ignore (the range dropdown and the export button)
    filter: (el) => !(el instanceof HTMLElement && el.dataset.exportIgnore !== undefined),
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${fileName}.png`;
  a.click();
}
