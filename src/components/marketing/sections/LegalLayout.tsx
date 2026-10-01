import { Container } from '../primitives/Container';

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <Container className="py-16 sm:py-24">
      <article className="mx-auto max-w-2xl [&_h2]:mk-heading [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-mk-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-mk-muted">
        <h1 className="mk-heading text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-mk-muted">Last updated: {updated}</p>
        {children}
      </article>
    </Container>
  );
}