import { Container } from '../primitives/Container';

export function LegalLayout({
    title,
    updated,
    children,
}: {
    title: string;
    updated: string;
    children: React.ReactNode;
}) {
    return (
        <Container className="py-16 sm:py-24">
            <article className="[&_h2]:mk-heading [&_p]:text-mk-muted [&_ul]:text-mk-muted mx-auto max-w-2xl [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
                <h1 className="mk-heading mk-gradient-text text-4xl font-bold sm:text-5xl">
                    {title}
                </h1>
                <p className="text-mk-muted mt-3 text-sm">Last updated: {updated}</p>
                {children}
            </article>
        </Container>
    );
}
