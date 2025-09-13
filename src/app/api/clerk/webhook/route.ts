import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { api } from "../../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Create Convex client lazily to avoid build-time issues
function getConvexClient() {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error("CONVEX_URL environment variable is not set");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses } = evt.data;
    
    const email = email_addresses[0]?.email_address;
    
    if (!email) {
      console.error("No email found for user:", id);
      return new Response("No email found", { status: 400 });
    }

    try {
      const convex = getConvexClient();
      // Create user in Convex database
      await convex.mutation(api.users.createUser, {
        clerkId: id,
        email: email,
        plan: "trial", // Default to trial plan
      });

      console.log("User created successfully:", { id, email });
    } catch (error) {
      console.error("Error creating user in Convex:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses } = evt.data;
    
    const email = email_addresses[0]?.email_address;
    
    if (!email) {
      console.error("No email found for user:", id);
      return new Response("No email found", { status: 400 });
    }

    try {
      const convex = getConvexClient();
      // Update user's last active time
      await convex.mutation(api.users.updateLastActive, {
        clerkId: id,
      });

      console.log("User updated successfully:", { id, email });
    } catch (error) {
      console.error("Error updating user in Convex:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}