import { Quote } from "lucide-react";
import { Section } from "../primitives/Section";
import { SectionHeader } from "../primitives/SectionHeader";
import type { Testimonial } from "@/content/marketing/testimonials";

type Props = {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
  tone?: "default" | "muted";
};

export function Testimonials({ title, subtitle, testimonials, tone = "default" }: Props) {
  if (testimonials.length === 0) return null;

  return (
    <Section tone={tone}>
      <SectionHeader eyebrow="Testimonials" title={title} subtitle={subtitle} />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <figure
            key={`${t.name}-${i}`}
            className="flex flex-col rounded-2xl border border-mk-line bg-mk-bg p-6"
          >
            <Quote size={22} className="text-mk-brand" aria-hidden />
            <blockquote className="mt-4 flex-1 text-mk-fg">{t.quote}</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full bg-mk-brand/10 text-sm font-semibold text-mk-brand"
              >
                {t.initials}
              </span>
              <span>
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="block text-sm text-mk-muted">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}