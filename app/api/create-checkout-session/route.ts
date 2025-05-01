import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "../../../lib/firebase";

// Initialize Stripe with your API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { requestId, userId, repairerId, amount, description } =
      await request.json();

    // Validate input
    if (!requestId || !userId || !repairerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields or invalid amount" },
        { status: 400 }
      );
    }

    // Convert amount to paise (1 rupee = 100 paise)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Get the origin from the request headers or use a fallback
    const origin =
      request.headers.get("origin") ||
      request.headers.get("host") ||
      "http://localhost:3000";

    // Determine if we need to use https based on headers
    const protocol = origin.startsWith("http") ? "" : "http://";
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}${origin}`;

    // Create a checkout session with proper currency display
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr", // Use INR for Indian Rupees
            product_data: {
              name: "Repair Service",
              description: description || `Repair request #${requestId}`,
            },
            unit_amount: amountInSmallestUnit,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?payment_success=true&request_id=${requestId}`,
      cancel_url: `${baseUrl}/dashboard?payment_cancelled=true`,
      metadata: {
        requestId,
        userId,
        repairerId,
      },
    });

    // Update repair request status to awaiting_payment in the database
    try {
      const db = getFirestore(app);

      // Try to find the document in different possible collections
      const collectionsToCheck = ["repair-requests", "repairRequests"];
      let docRef;
      let collectionUsed;

      for (const collectionName of collectionsToCheck) {
        const requestsQuery = query(
          collection(db, collectionName),
          where("id", "==", requestId)
        );

        const snapshot = await getDocs(requestsQuery);

        if (!snapshot.empty) {
          // Found the document
          docRef = doc(db, collectionName, snapshot.docs[0].id);
          collectionUsed = collectionName;
          break;
        }
      }

      if (docRef) {
        // Update the document status to awaiting_payment
        await updateDoc(docRef, {
          status: "awaiting_payment",
          updatedAt: new Date(),
        });

        console.log(
          `Updated repair request ${requestId} in ${collectionUsed} to awaiting_payment status`
        );
      }
    } catch (updateError) {
      console.error("Error updating repair request status:", updateError);
      // Continue with the response even if update fails - webhook should handle it
    }

    // Return both the session ID and URL to match what the Firebase context expects
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json(
      {
        error: "Error creating checkout session",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
