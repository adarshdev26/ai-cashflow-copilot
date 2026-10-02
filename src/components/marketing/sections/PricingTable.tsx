"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Section } from "../primitives/Section";
import { SectionHeader } from "../primitives/SectionHeader";
import { cx } from "../primitives/cx";
import type { Plan } from "@/content/marketing/pricing";

type Props = {
  title: string;
  subtitle?: string;
  plans: Plan[];
  tone?: "default" | "muted";
};

type Billing = "monthly" | "annual";

export function PricingTable({ title, subtitle, plans, tone = "default" }: Props) {
  const [billing, setBilling] = useState<Billing>("monthly");

  // Only show the toggle if at least one paid plan has a different annual price.
  const hasAnnualDiscount = plans.some(
    (p) => p.priceMonthly && p.priceAnnual !== null && p.priceAnnual < p.priceMonthly,
  );

  return (
    <Section tone={tone}>
      <SectionHeader eyebrow="Plans" title={title} subtitle={subtitle} />

      {hasAnnualDiscount && (
        <div className="mt-8 flex justify-center">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex rounded-full border border-mk-line bg-mk-surface p-1"
          >
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={billing === b}
                onClick={() => setBilling(b)}
                className={cx(
                  "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition",
                  billing === b ? "bg-mk-brand text-mk-brand-fg" : "text-mk-muted hover:text-mk-fg",
                )}
              >
                {b}
                {b === "annual" && <span className="ml-1.5 text-xs opacity-80">Save</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={cx(
          "mx-auto mt-14 grid gap-6",
          plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : "",
        )}
      >
        {plans.map((plan) => {
          const price = billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
          return (
            <div
              key={plan.id}
              className={cx(
                "relative flex flex-col rounded-2xl border bg-mk-bg p-6 sm:p-8",
                plan.highlighted ? "border-mk-brand shadow-xl ring-1 ring-mk-brand" : "border-mk-line",
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-mk-brand px-3 py-1 text-xs font-semibold text-mk-brand-fg">
                  {plan.badge}
                </span>
              )}

              <h3 className="mk-heading text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 min-h-12 text-sm text-mk-muted">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                {price === null ? (
                  <span className="mk-heading text-4xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="mk-heading text-4xl font-bold">
                      {plan.currency}
                      {price}
                    </span>
                    {price > 0 && <span className="text-mk-muted">/month</span>}
                  </>
                )}
              </div>
              <p className="mt-1 h-5 text-xs text-mk-muted">
                {price !== null && price > 0 && billing === "annual" ? "Billed yearly" : ""}
              </p>

              <Link
                href={plan.cta.href}
                className={cx(
                  "mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-brand",
                  plan.highlighted
                    ? "bg-mk-brand text-mk-brand-fg hover:opacity-90"
                    : "border border-mk-line bg-mk-bg hover:bg-mk-surface",
                )}
              >
                {plan.cta.label}
              </Link>

              <ul className="mt-8 space-y-3 border-t border-mk-line pt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check size={18} className="mt-0.5 shrink-0 text-mk-brand" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}