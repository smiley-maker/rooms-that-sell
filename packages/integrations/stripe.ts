import Stripe from "stripe";
import { withRetry } from "@/lib/retry";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil",
});

const CheckoutParams = z.object({
  customerEmail: z.string().email(),
  priceId: z.string().min(1),
  userId: z.string().min(1),
  plan: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function createCheckoutSession(params: z.infer<typeof CheckoutParams>) {
  const p = CheckoutParams.parse(params);
  return withRetry(async () => {
    const session = await stripe.checkout.sessions.create({
      customer_email: p.customerEmail,
      payment_method_types: ["card"],
      line_items: [{ price: p.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      metadata: { userId: p.userId, plan: p.plan },
      subscription_data: { metadata: { userId: p.userId, plan: p.plan } },
    });
    return { sessionId: session.id, url: session.url } as const;
  });
}

const PortalParams = z.object({
  customerId: z.string().min(1),
  returnUrl: z.string().url(),
});

export async function createPortalSession(params: z.infer<typeof PortalParams>) {
  const p = PortalParams.parse(params);
  return withRetry(async () => {
    const session = await stripe.billingPortal.sessions.create({
      customer: p.customerId,
      return_url: p.returnUrl,
    });
    return { url: session.url } as const;
  });
}

const UpdateSubscriptionParams = z.object({
  subscriptionId: z.string().min(1),
  cancelAtPeriodEnd: z.boolean(),
});

export async function updateSubscription(params: z.infer<typeof UpdateSubscriptionParams>): Promise<void> {
  const p = UpdateSubscriptionParams.parse(params);
  await withRetry(async () => {
    await stripe.subscriptions.update(p.subscriptionId, {
      cancel_at_period_end: p.cancelAtPeriodEnd,
    });
  });
}


