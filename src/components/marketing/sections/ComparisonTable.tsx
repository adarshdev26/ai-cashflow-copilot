import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { Section } from "../primitives/Section";
import { SectionHeader } from "../primitives/SectionHeader";
import { cx } from "../primitives/cx";
import { plans as defaultPlans } from "@/content/marketing/pricing";
import type { ComparisonRow, ComparisonValue, Plan } from "@/content/marketing/pricing";

type Props = {
  title: string;
  subtitle?: string;
  rows: ComparisonRow[];
  plans?: Plan[]; // defaults to the plans in content/marketing/pricing
  tone?: "default" | "muted";
};

function Cell({ value }: { value: ComparisonValue | undefined }) {
  if (value === true) {
    return (
      <>
        <Check size={18} className="mx-auto text-mk-brand" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false || value === undefined) {
    return (
      <>
        <Minus size={18} className="mx-auto text-mk-muted/60" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function ComparisonTable({ title, subtitle, rows, plans = defaultPlans, tone = "muted" }: Props) {
  return (
    <Section tone={tone}>
      <SectionHeader eyebrow="Compare" title={title} subtitle={subtitle} />

      {/* Wide content scrolls inside its own container, never the page body */}
      <div className="mx-auto mt-12 max-w-5xl overflow-x-auto rounded-2xl border border-mk-line bg-mk-bg">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Feature comparison across plans</caption>
          <thead>
            <tr className="border-b border-mk-line">
              <th scope="col" className="sticky left-0 bg-mk-bg px-4 py-4 text-sm font-semibold sm:px-6">
                Features
              </th>
              {plans.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className={cx(
                    "px-4 py-4 text-center text-sm font-semibold sm:px-6",
                    p.highlighted && "bg-mk-brand/5 text-mk-brand",
                  )}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const showGroup = row.group && row.group !== rows[i - 1]?.group;
              return (
                <Fragment key={`${row.group ?? ""}-${row.feature}`}>
                  {showGroup && (
                    <tr className="bg-mk-surface">
                      <th
                        scope="rowgroup"
                        colSpan={plans.length + 1}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-mk-muted sm:px-6"
                      >
                        {row.group}
                      </th>
                    </tr>
                  )}
                  <tr className="border-t border-mk-line">
                    <th
                      scope="row"
                      className="sticky left-0 bg-mk-bg px-4 py-3.5 text-sm font-normal sm:px-6"
                    >
                      {row.feature}
                    </th>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={cx(
                          "px-4 py-3.5 text-center sm:px-6",
                          p.highlighted && "bg-mk-brand/5",
                        )}
                      >
                        <Cell value={row.values[p.id]} />
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}