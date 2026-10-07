export type ChartDownloadOptions = {
    filename: string;
};

export function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export async function exportElementAsPng(
    node: HTMLElement,
    options: ChartDownloadOptions | string,
) {
    await document.fonts?.ready;

    const { toPng } = await import('html-to-image');
    const rootStyles = getComputedStyle(document.documentElement);
    const nodeStyles = getComputedStyle(node);
    const themeVariables = [
        '--color-primary',
        '--color-secondary',
        '--color-accent',
        '--color-info',
        '--color-warning',
        '--color-success',
        '--color-error',
        '--color-base-100',
        '--color-base-200',
        '--color-base-300',
        '--color-base-content',
    ];
    const themeStyles = Object.fromEntries(
        themeVariables.map((name) => [name, rootStyles.getPropertyValue(name).trim()]),
    );
    const nodeBackground = nodeStyles.backgroundColor;
    const backgroundProbe = document.createElement('div');
    backgroundProbe.style.backgroundColor = 'var(--color-base-100)';
    backgroundProbe.style.position = 'fixed';
    backgroundProbe.style.visibility = 'hidden';
    document.body.appendChild(backgroundProbe);
    const baseBackground = getComputedStyle(backgroundProbe).backgroundColor;
    backgroundProbe.remove();
    const isSolid = (color: string) =>
        color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)';
    const backgroundColor = isSolid(nodeBackground)
        ? nodeBackground
        : isSolid(baseBackground)
          ? baseBackground
          : rootStyles.backgroundColor;
    const filename = typeof options === 'string' ? options : options.filename;

    const dataUrl = await toPng(node, {
        backgroundColor,
        style: themeStyles,
        pixelRatio: 2,
        cacheBust: true,
        filter: (el) => !(el instanceof HTMLElement && el.dataset.exportIgnore !== undefined),
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename.replace(/\.png$/i, '')}.png`;
    a.click();
}
