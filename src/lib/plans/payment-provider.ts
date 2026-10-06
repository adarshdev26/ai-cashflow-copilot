import 'server-only';
import type { PlanId } from './constants';

export interface PaymentProvider {
    createCheckout(input: { userId: string; plan: PlanId }): Promise<{ checkoutId: string }>;
    confirmPayment(input: { checkoutId: string }): Promise<{ paid: boolean; reference: string }>;
}

/** Logs safe identifiers only. Never log card data, tokens or request bodies. */
class DummyPaymentProvider implements PaymentProvider {
    async createCheckout({ userId, plan }: { userId: string; plan: PlanId }) {
        const checkoutId = `dummy_chk_${Date.now()}`;
        console.log('[billing:dummy] createCheckout', { userId, plan, checkoutId });
        return { checkoutId };
    }
    async confirmPayment({ checkoutId }: { checkoutId: string }) {
        console.log('[billing:dummy] confirmPayment', { checkoutId, paid: true });
        return { paid: true, reference: `dummy_pay_${checkoutId}` };
    }
}

export const paymentProvider: PaymentProvider = new DummyPaymentProvider();

/** The dummy flow grants Premium for free, so it must never run in production by accident. */
export const isBillingDemoEnabled = () =>
    process.env.BILLING_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
