import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';

export function FAQ({ items, title = 'Frequently asked questions' }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <Section>
      <SectionHeader eyebrow="FAQ" title={title} />
      <div className="mx-auto mt-10 max-w-2xl divide-y divide-mk-line rounded-2xl border border-mk-line">
        {items.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              {f.q}
              <span className="ml-4 text-mk-brand transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-mk-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}