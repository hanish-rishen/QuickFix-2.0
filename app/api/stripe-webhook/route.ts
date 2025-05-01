import { NextRequest, NextResponse } from "next/server";
// Fix the Stripe initialization
const Stripe = require("stripe");
import { headers } from "next/headers";
import {
  doc,
  getFirestore,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "@/lib/firebase";

// Initialize Stripe with the correct test API key
const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY ||
    "sk_test_51R4perCZKlOueHnd549WP0M4QT6QKH7gA00lfgMfhkLxFHSiLFjqRSvUuwAbcFLVo3kazJyPlSCmdUrCaoVf6wOI00ao2IIDMG"
);

// Use your test webhook secret or a placeholder for testing
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_12345";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headersList = headers();
  const sig = headersList.get("stripe-signature") as string;

  let event;

  try {
    // For testing without a webhook signature, we can bypass signature verification
    if (process.env.NODE_ENV === "development" && !sig) {
      // Parse the payload directly for development
      event = JSON.parse(payload);
    } else {
      // Verify the webhook signature in production
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    // In development, proceed anyway for testing
    if (process.env.NODE_ENV === "development") {
      try {
        event = JSON.parse(payload);
      } catch (e) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Extract metadata
    const { requestId, userId, repairerId } = session.metadata || {};

    if (requestId) {
      try {
        const db = getFirestore(app);

        // Update the repair request status
        const collectionsToCheck = ["repair-requests", "repairRequests"];
        let docRef;
        let docExists = false;

        for (const collectionName of collectionsToCheck) {
          docRef = doc(db, collectionName, requestId);
          const docSnap = await getDocs(
            query(collection(db, collectionName), where("id", "==", requestId))
          );

          if (!docSnap.empty) {
            docExists = true;
            break;
          }
        }

        if (docExists && docRef) {
          await updateDoc(docRef, {
            status: "paid",
            updatedAt: new Date(),
          });

          console.log(`Updated repair request ${requestId} status to paid`);
        }

        // Update payment record
        const paymentsRef = collection(db, "payments");
        const paymentQuery = query(
          paymentsRef,
          where("repairRequestId", "==", requestId),
          where("stripeSessionId", "==", session.id)
        );

        const paymentDocs = await getDocs(paymentQuery);

        if (!paymentDocs.empty) {
          const paymentDoc = paymentDocs.docs[0];
          await updateDoc(doc(db, "payments", paymentDoc.id), {
            status: "completed",
            updatedAt: new Date(),
          });

          console.log(`Updated payment record for repair request ${requestId}`);
        }
      } catch (error) {
        console.error("Error processing payment webhook:", error);
        return NextResponse.json(
          { error: "Error processing payment" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
