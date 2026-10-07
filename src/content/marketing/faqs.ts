export type FaqItem = { q: string; a: string };

// TODO: confirm each answer against your real billing setup.
export const pricingFaqs: FaqItem[] = [
    {
        q: 'Is there a free plan?',
        a: 'Yes. The Free plan lets you track transactions in a workspace with no payment details needed.',
    },
    {
        q: 'Can I switch plans later?',
        a: 'Yes. You can upgrade or downgrade at any time from your settings.',
    },
    {
        q: 'How does annual billing work?',
        a: 'Annual plans are billed once a year at a lower monthly rate. Use the toggle above the plans to compare.',
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Yes. There are no long-term contracts. Cancel whenever you like and keep access until the end of your billing period.',
    },
    {
        q: 'What happens to my data if I downgrade?',
        a: "Your data stays. If you go over a plan's limits, such as workspaces, you may need to choose which ones stay active. TODO: confirm this behavior.",
    },
    {
        q: 'Which payment methods do you accept?',
        a: 'TODO: list your supported payment methods.',
    },
];
