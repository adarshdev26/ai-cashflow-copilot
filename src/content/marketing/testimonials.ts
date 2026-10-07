export type Testimonial = {
    quote: string;
    name: string;
    role: string;
    initials: string;
};

// TODO: replace with real, permissioned customer quotes before launch.
// Use `export const testimonials: Testimonial[] = [];` to hide the section.
export const testimonials: Testimonial[] = [
    {
        quote: 'Placeholder: a real quote about keeping family spending clear goes here.',
        name: 'Customer name',
        role: 'Family workspace',
        initials: 'CN',
    },
    {
        quote: 'Placeholder: a real quote about tracking small-team expenses goes here.',
        name: 'Customer name',
        role: 'Small business owner',
        initials: 'CN',
    },
];
