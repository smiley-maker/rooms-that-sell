import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

// Note: Stripe webhook objects have additional properties not in the TypeScript definitions

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;

          if (userId && plan) {
            await convex.mutation(api.stripe.handleSubscriptionCreated, {
              userId: userId as Id<"users">, // Convert string to Convex ID
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              plan,
              status: subscription.status,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currentPeriodStart: (subscription as any).current_period_start * 1000,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currentPeriodEnd: (subscription as any).current_period_end * 1000,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        await convex.mutation(api.stripe.handleSubscriptionUpdated, {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentPeriodStart: (subscription as any).current_period_start * 1000,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentPeriodEnd: (subscription as any).current_period_end * 1000,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // Handle subscription renewal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((invoice as any).subscription && invoice.billing_reason === "subscription_cycle") {
          await convex.mutation(api.stripe.handleSubscriptionRenewal, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stripeSubscriptionId: (invoice as any).subscription as string,
            currentPeriodStart: invoice.period_start * 1000,
            currentPeriodEnd: invoice.period_end * 1000,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await convex.mutation(api.stripe.handleSubscriptionUpdated, {
          stripeSubscriptionId: subscription.id,
          status: "canceled",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentPeriodStart: (subscription as any).current_period_start * 1000,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentPeriodEnd: (subscription as any).current_period_end * 1000,
          cancelAtPeriodEnd: true,
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}