"use client";

import React, { createContext, useContext, useCallback } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  serverTimestamp,
  Timestamp,
  getFirestore,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, app } from "@/lib/firebase";
import {
  RepairRequest,
  DiagnosticReport,
  Payment,
  RepairerProfile,
  User,
  RepairStatus,
} from "@/types";
import { calculateDistance, deg2rad } from "@/lib/tomtom";

// Create a type for the repairer data returned from Firestore
interface RepairerData {
  id: string;
  displayName?: string;
  email?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string; // Make address optional to fix type compatibility
  };
  serviceArea?: number;
  skills?: string[];
  categories?: string[]; // Add categories property to fix TypeScript error
  distance?: number; // Used for sorting
}

interface FirebaseContextType {
  // User methods
  getUser: (userId: string) => Promise<User | null>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<void>;
  updateUserLocation: (
    userId: string,
    latitude: number,
    longitude: number,
    address: string
  ) => Promise<void>;

  // Repairer methods
  getRepairerProfile: (repairerId: string) => Promise<RepairerProfile | null>;
  createRepairerProfile: (
    userId: string,
    data: Partial<RepairerProfile>
  ) => Promise<void>;
  updateRepairerProfile: (
    repairerId: string,
    data: Partial<RepairerProfile>
  ) => Promise<void>;
  getNearbyRepairers: (
    latitude: number,
    longitude: number,
    radius: number,
    category?: string
  ) => Promise<RepairerProfile[]>;

  // Repair request methods
  createRepairRequest: (
    data: Omit<RepairRequest, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateRepairRequest: (
    requestId: string,
    data: Partial<RepairRequest>
  ) => Promise<void>;
  getRepairRequest: (requestId: string) => Promise<RepairRequest | null>;
  getUserRepairRequests: (userId: string) => Promise<RepairRequest[]>;
  getRepairerAssignedRequests: (repairerId: string) => Promise<RepairRequest[]>;
  getAvailableRequests: (
    location: { latitude: number; longitude: number },
    categories: string[],
    serviceArea: number
  ) => Promise<RepairRequest[]>;

  // Image upload
  uploadImage: (file: File, path: string) => Promise<string>;

  // Diagnostic report
  createDiagnosticReport: (
    data: Omit<DiagnosticReport, "id" | "createdAt">
  ) => Promise<string>;
  getDiagnosticReport: (reportId: string) => Promise<DiagnosticReport | null>;

  // Payment
  createPayment: (
    data: Omit<Payment, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updatePayment: (paymentId: string, data: Partial<Payment>) => Promise<void>;
  getPayment: (paymentId: string) => Promise<Payment | null>;

  // New methods
  updateRepairRequestStatus: (
    requestId: string,
    status: RepairStatus
  ) => Promise<void>;
  verifyRepairCompletion: (
    requestId: string,
    completionImageUrl: string,
    completionNote: string,
    originalImages: string[]
  ) => Promise<{ verified: boolean; message?: string }>;
  requestPaymentFromUser: (requestId: string, price: number) => Promise<void>;
  generateDiagnosticReport: (
    request: RepairRequest
  ) => Promise<DiagnosticReport | null>;

  // Add new Stripe payment method
  createStripeCheckoutSession: (
    requestId: string,
    userId: string,
    repairerId: string,
    amount: number,
    description: string
  ) => Promise<string>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  // User methods
  const getUser = async (userId: string): Promise<User | null> => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }

      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  };

  const updateUserProfile = async (
    userId: string,
    data: Partial<User>
  ): Promise<void> => {
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { ...data, updatedAt: new Date() });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const updateUserLocation = async (
    userId: string,
    latitude: number,
    longitude: number,
    address: string
  ): Promise<void> => {
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        location: { latitude, longitude, address },
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating user location:", error);
      throw error;
    }
  };

  // Repairer methods
  const getRepairerProfile = async (
    repairerId: string
  ): Promise<RepairerProfile | null> => {
    try {
      const repairerDocRef = doc(db, "repairers", repairerId);
      const repairerDoc = await getDoc(repairerDocRef);

      if (repairerDoc.exists()) {
        return { id: repairerDoc.id, ...repairerDoc.data() } as RepairerProfile;
      }

      return null;
    } catch (error) {
      console.error("Error getting repairer profile:", error);
      throw error;
    }
  };

  const createRepairerProfile = async (
    userId: string,
    data: Partial<RepairerProfile>
  ): Promise<void> => {
    try {
      const repairerDocRef = doc(db, "repairers", userId);
      await setDoc(repairerDocRef, {
        ...data,
        id: userId,
        role: "repairer",
        rating: 0,
        reviewCount: 0,
        completedRepairs: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating repairer profile:", error);
      throw error;
    }
  };

  const updateRepairerProfile = async (
    repairerId: string,
    data: Partial<RepairerProfile>
  ): Promise<void> => {
    try {
      const repairerDocRef = doc(db, "repairers", repairerId);
      await updateDoc(repairerDocRef, { ...data, updatedAt: new Date() });
    } catch (error) {
      console.error("Error updating repairer profile:", error);
      throw error;
    }
  };

  // Define calculateDistance function ONCE (remove any other declarations)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km
      return distance;
    },
    []
  );

  // Get nearby repairers based on location and category
  const getNearbyRepairers = useCallback(
    async (
      latitude: number,
      longitude: number,
      radiusKm: number = 50,
      category: string = ""
    ): Promise<RepairerProfile[]> => {
      try {
        console.log(
          `Searching for repairers near ${latitude}, ${longitude} with radius ${radiusKm}km and category '${category}'`
        );

        // First, get all repairer profiles
        const repairersRef = collection(db, "repairers");
        const repairersSnap = await getDocs(repairersRef);

        // Filter repairers based on location and categories
        const nearbyRepairers: RepairerData[] = [];

        repairersSnap.forEach((doc) => {
          const repairerData = { id: doc.id, ...doc.data() } as RepairerData;

          // Skip repairers without location
          if (!repairerData.location) {
            console.log(`Repairer ${repairerData.id} skipped: no location`);
            return;
          }

          // Calculate distance using Haversine formula from lib/tomtom
          const distance = calculateDistance(
            latitude,
            longitude,
            repairerData.location.latitude,
            repairerData.location.longitude
          );

          console.log(
            `Repairer ${repairerData.id} at distance: ${distance.toFixed(
              2
            )}km, service area: ${repairerData.serviceArea || 10}km`
          );
          console.log(
            `Repairer location: ${repairerData.location.latitude}, ${repairerData.location.longitude}`
          );
          console.log(`User location: ${latitude}, ${longitude}`);

          // Check if repairer is within the service area
          const repairerServiceArea = repairerData.serviceArea || 10; // Default 10km

          // Get repairer categories only
          const repairerCategories = repairerData.categories || [];
          console.log(`Repairer categories: ${repairerCategories.join(", ")}`);

          // Use a small epsilon value to account for floating point comparison
          const epsilon = 0.0001;
          const isVeryClose = distance < epsilon;

          // Check category match - direct category matching only
          const hasMatchingCategory =
            !category || repairerCategories.includes(category);

          console.log(
            `Category matching: ${
              category
                ? hasMatchingCategory
                  ? "YES"
                  : "NO"
                : "No category specified"
            }`
          );

          // Only include if:
          // 1. Repairer is within our search radius OR locations are practically identical
          // 2. Location is within the repairer's service area OR locations are practically identical
          // 3. Repairer can repair this category of items
          if (
            (distance <= radiusKm || isVeryClose) &&
            (distance <= repairerServiceArea || isVeryClose) &&
            hasMatchingCategory
          ) {
            console.log(
              `Repairer ${repairerData.id} MATCHED criteria and will be included`
            );
            // Add distance to the repairer data for sorting
            nearbyRepairers.push({
              ...repairerData,
              distance,
            });
          } else {
            console.log(`Repairer ${repairerData.id} did NOT match criteria`);
            if (distance > radiusKm)
              console.log(
                `- Outside search radius (${distance.toFixed(
                  2
                )}km > ${radiusKm}km)`
              );
            if (distance > repairerServiceArea)
              console.log(
                `- Outside service area (${distance.toFixed(
                  2
                )}km > ${repairerServiceArea}km)`
              );
            if (category && !hasMatchingCategory)
              console.log(`- Does not repair '${category}' category items`);
          }
        });

        // Sort by distance
        const sorted = nearbyRepairers.sort(
          (a, b) => (a.distance || 0) - (b.distance || 0)
        );

        console.log(`Found ${sorted.length} nearby repairers`);
        return sorted as unknown as RepairerProfile[]; // Cast to expected return type
      } catch (error) {
        console.error("Error fetching nearby repairers:", error);
        throw error;
      }
    },
    [calculateDistance] // No dependencies needed
  );

  // Repair request methods
  const createRepairRequest = async (
    data: Omit<RepairRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    try {
      // Clean the data object to remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const repairRequestRef = collection(db, "repairRequests");
      const docRef = await addDoc(repairRequestRef, {
        ...cleanedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating repair request:", error);
      throw error;
    }
  };

  const updateRepairRequest = async (
    requestId: string,
    data: Partial<RepairRequest>
  ): Promise<void> => {
    try {
      const requestDocRef = doc(db, "repairRequests", requestId);
      await updateDoc(requestDocRef, { ...data, updatedAt: new Date() });
    } catch (error) {
      console.error("Error updating repair request:", error);
      throw error;
    }
  };

  const getRepairRequest = async (
    requestId: string
  ): Promise<RepairRequest | null> => {
    try {
      const requestDocRef = doc(db, "repairRequests", requestId);
      const requestDoc = await getDoc(requestDocRef);

      if (requestDoc.exists()) {
        return { id: requestDoc.id, ...requestDoc.data() } as RepairRequest;
      }

      return null;
    } catch (error) {
      console.error("Error getting repair request:", error);
      throw error;
    }
  };

  const getUserRepairRequests = async (
    userId: string
  ): Promise<RepairRequest[]> => {
    try {
      const requestsRef = collection(db, "repairRequests");
      const q = query(
        requestsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const requestsSnapshot = await getDocs(q);
      const requests: RepairRequest[] = [];

      requestsSnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as RepairRequest);
      });

      return requests;
    } catch (error) {
      console.error("Error getting user repair requests:", error);
      throw error;
    }
  };

  const getRepairerAssignedRequests = async (
    repairerId: string
  ): Promise<RepairRequest[]> => {
    try {
      const requests: RepairRequest[] = [];

      // Check both collection formats to ensure compatibility
      const collectionsToCheck = ["repairRequests", "repair-requests"];

      for (const collectionName of collectionsToCheck) {
        const requestsRef = collection(db, collectionName);
        const q = query(
          requestsRef,
          where("repairerId", "==", repairerId),
          orderBy("createdAt", "desc")
        );

        const requestsSnapshot = await getDocs(q);

        requestsSnapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure date objects are properly converted
          requests.push({
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.() || data.createdAt || new Date(),
            updatedAt:
              data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
          } as RepairRequest);
        });
      }

      console.log(
        `Found ${requests.length} assigned requests for repairer ${repairerId}`
      );
      return requests;
    } catch (error) {
      console.error("Error getting repairer assigned requests:", error);
      throw error;
    }
  };

  const getAvailableRequests = async (
    location: { latitude: number; longitude: number },
    categories: string[],
    serviceArea: number
  ): Promise<RepairRequest[]> => {
    try {
      const db = getFirestore(app);
      const repairRequestsRef = collection(db, "repair-requests");

      // Get requests that are pending diagnosis or awaiting repairer
      const q = query(
        repairRequestsRef,
        where("status", "in", ["pending_diagnosis", "awaiting_repairer"])
      );

      const repairRequestsSnapshot = await getDocs(q);

      const repairRequests: RepairRequest[] = [];
      repairRequestsSnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        const request = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as RepairRequest;

        // Filter by location (client-side) - calculate if within service area
        if (request.location && location) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            request.location.latitude,
            request.location.longitude
          );

          // Only include if within service area and matching category (if categories provided)
          if (
            distance <= serviceArea &&
            (categories.length === 0 || categories.includes(request.category))
          ) {
            repairRequests.push(request);
          }
        }
      });

      return repairRequests;
    } catch (error) {
      console.error("Error getting available repair requests:", error);
      throw error;
    }
  };

  // Image upload - Modified to use Firestore for image storage instead of Firebase Storage
  const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
      // Instead of using Firebase Storage, we'll convert the image to Base64
      // and store it directly in Firestore (for smaller images)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64data = reader.result as string;

          // For larger applications, you'd want to limit the size
          // but for this demo we'll just use the base64 directly
          resolve(base64data);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Diagnostic report
  const createDiagnosticReport = async (
    data: Omit<DiagnosticReport, "id" | "createdAt">
  ): Promise<string> => {
    try {
      const reportRef = collection(db, "diagnosticReports");
      const docRef = await addDoc(reportRef, {
        ...data,
        createdAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating diagnostic report:", error);
      throw error;
    }
  };

  const getDiagnosticReport = async (
    reportId: string
  ): Promise<DiagnosticReport | null> => {
    try {
      const reportDocRef = doc(db, "diagnosticReports", reportId);
      const reportDoc = await getDoc(reportDocRef);

      if (reportDoc.exists()) {
        return { id: reportDoc.id, ...reportDoc.data() } as DiagnosticReport;
      }

      return null;
    } catch (error) {
      console.error("Error getting diagnostic report:", error);
      throw error;
    }
  };

  // New methods
  const updateRepairRequestStatus = async (
    requestId: string,
    status: RepairStatus
  ): Promise<void> => {
    try {
      // Check both collection formats since we have inconsistent naming
      const collectionsToCheck = ["repair-requests", "repairRequests"];
      let docRef;
      let docExists = false;
      let collectionUsed = "";

      // Try each collection until we find the document
      for (const collectionName of collectionsToCheck) {
        docRef = doc(db, collectionName, requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          docExists = true;
          collectionUsed = collectionName;
          break; // Found the document, no need to check other collections
        }
      }

      if (!docExists) {
        console.error(
          `Document does not exist in any collection: ${requestId}`
        );
        throw new Error(
          `No document to update: projects/the-quick-fix/databases/(default)/documents/repair-requests/${requestId}`
        );
      }

      // Document exists, proceed with update using the correct collection reference
      console.log(
        `Found repair request in '${collectionUsed}' collection, updating status to ${status}`
      );
      await updateDoc(docRef!, {
        status,
        updatedAt: serverTimestamp(),
      });

      console.log(
        `Successfully updated repair request ${requestId} status to ${status}`
      );
    } catch (error) {
      console.error("Error updating repair request status:", error);
      throw error; // Re-throw to allow proper handling in components
    }
  };

  const verifyRepairCompletion = async (
    requestId: string,
    completionImageUrl: string,
    completionNote: string,
    originalImages: string[]
  ): Promise<{ verified: boolean; message?: string }> => {
    try {
      // In a real implementation, you would:
      // 1. Call Gemini API to compare original vs completion images
      // 2. Analyze if the repair seems complete

      // For now, simulating the verification response
      // In a production app, this would integrate with Gemini's API
      const simulateVerificationResult = {
        verified: true, // Simulate success for now
        message:
          "Repair verification complete. The item appears to be fixed correctly.",
      };

      // Record verification result
      const db = getFirestore(app);
      const verificationsRef = collection(db, "repairVerifications");
      await addDoc(verificationsRef, {
        repairRequestId: requestId,
        completionImageUrl,
        completionNote,
        verificationResult: simulateVerificationResult,
        timestamp: new Date(),
      });

      return simulateVerificationResult;
    } catch (error) {
      console.error("Error verifying repair completion:", error);
      return { verified: false, message: "Verification service unavailable" };
    }
  };

  const requestPaymentFromUser = async (
    requestId: string,
    price: number
  ): Promise<void> => {
    try {
      // Check both collection formats since we have inconsistent naming
      const collectionsToCheck = ["repair-requests", "repairRequests"];
      let docRef;
      let docExists = false;
      let collectionUsed = "";

      // Try each collection until we find the document
      for (const collectionName of collectionsToCheck) {
        docRef = doc(db, collectionName, requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          docExists = true;
          collectionUsed = collectionName;
          break; // Found the document, no need to check other collections
        }
      }

      if (!docExists) {
        console.error(
          `Document does not exist in any collection: ${requestId}`
        );
        throw new Error(
          `No document to update: projects/the-quick-fix/databases/(default)/documents/repair-requests/${requestId}`
        );
      }

      // Document exists, proceed with update using the correct collection reference
      console.log(
        `Found repair request in '${collectionUsed}' collection, updating for payment`
      );

      // Update the repair request with the price and change status to await payment
      await updateDoc(docRef!, {
        status: "awaiting_payment" as RepairStatus,
        price: price,
        updatedAt: new Date(),
      });

      console.log(
        `Successfully updated repair request ${requestId} to await payment with price ${price}`
      );

      // Optionally create a payment record
      const paymentsRef = collection(db, "payments");
      await addDoc(paymentsRef, {
        repairRequestId: requestId,
        amount: price,
        status: "pending",
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error requesting payment:", error);
      throw error;
    }
  };

  // Add Stripe checkout session creation
  const createStripeCheckoutSession = async (
    requestId: string,
    userId: string,
    repairerId: string,
    amount: number,
    description: string
  ): Promise<string> => {
    try {
      console.log(
        `Creating Stripe checkout session for repair request ${requestId}`
      );

      // Make an API call to your server endpoint that creates a Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          userId,
          repairerId,
          amount,
          description,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=canceled`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create checkout session: ${errorText}`);
      }

      const { sessionId, url } = await response.json();

      // Update the payment record with the Stripe session ID
      const paymentsRef = collection(db, "payments");
      const q = query(
        paymentsRef,
        where("repairRequestId", "==", requestId),
        where("status", "==", "pending")
      );
      const paymentDocs = await getDocs(q);

      if (!paymentDocs.empty) {
        const paymentDoc = paymentDocs.docs[0];
        await updateDoc(doc(db, "payments", paymentDoc.id), {
          stripeSessionId: sessionId,
          updatedAt: new Date(),
        });
      }

      console.log(`Stripe checkout session created: ${sessionId}`);

      // Return the URL to redirect the user to Stripe Checkout
      return url;
    } catch (error) {
      console.error("Error creating Stripe checkout session:", error);
      throw error;
    }
  };

  // Generate a diagnostic report using Gemini AI
  const generateDiagnosticReport = async (
    request: RepairRequest
  ): Promise<DiagnosticReport | null> => {
    try {
      console.log("Generating diagnostic report for request:", request.id);

      // Prepare the prompt for Gemini AI
      const imageUrls = request.imageUrls || [];
      const prompt = `Analyze this repair request:
Title: ${request.title}
Description: ${request.description}
Category: ${request.category}
${
  imageUrls.length > 0
    ? "Image references are provided."
    : "No images provided."
}

Please provide:
1. A detailed analysis of the issue
2. The estimated complexity (low, medium, or high)
3. An estimated cost range in dollars (min and max)
4. An estimated time range in hours to complete the repair (min and max)
5. Any suggested parts that might be needed

Format your response using markdown for readability. Also include the cost in Indian Rupees (INR) alongside dollars, using an approximate conversion rate of 1 USD = 75 INR.`;

      // Make API call to Gemini
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      console.log(
        "Using Gemini API key:",
        apiKey ? "Key exists" : "Key missing"
      );

      // Update the endpoint to use the Gemini 1.5 Flash model
      // Note: Using the correct API endpoint for Gemini API
      const apiUrl =
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

      console.log("Making request to Gemini API:", apiUrl);
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API response:", data);

      // Extract the generated text from the response
      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        console.error("Unexpected Gemini API response format:", data);
        throw new Error("Invalid response format from Gemini API");
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      // Create the report data structure with default values before parsing
      const reportData: Omit<DiagnosticReport, "id" | "createdAt"> = {
        repairRequestId: request.id,
        analysis: generatedText.substring(0, 800), // Increased character limit for markdown content
        estimatedComplexity: "medium", // Default
        estimatedCost: {
          min: 50,
          max: 150,
          minInr: 3750, // Default INR values
          maxInr: 11250,
        },
        estimatedTime: {
          min: 1,
          max: 3,
        },
        suggestedParts: ["Required parts will be determined after inspection"],
        formattedAnalysis: generatedText, // Store the full markdown text
      };

      // Parse Gemini response to extract structured data
      const complexityMatch = generatedText.match(
        /complexity:\s*(low|medium|high)/i
      );
      if (complexityMatch) {
        reportData.estimatedComplexity = complexityMatch[1].toLowerCase() as
          | "low"
          | "medium"
          | "high";
      }

      const costMatch = generatedText.match(/cost.*?(\d+).*?(\d+)/i);
      if (costMatch) {
        const minUsd = parseInt(costMatch[1]);
        const maxUsd = parseInt(costMatch[2]);
        reportData.estimatedCost = {
          min: minUsd,
          max: maxUsd,
          minInr: Math.round(minUsd * 75), // Convert to INR
          maxInr: Math.round(maxUsd * 75), // Convert to INR
        };
      }

      const timeMatch = generatedText.match(/time.*?(\d+).*?(\d+)/i);
      if (timeMatch) {
        reportData.estimatedTime = {
          min: parseInt(timeMatch[1]),
          max: parseInt(timeMatch[2]),
        };
      }

      // Fix: Replace 's' flag with an alternative approach for dotAll behavior
      const partsSection = generatedText.match(
        /suggested parts:([\s\S]*?)(?=\n\n|$)/i
      );
      if (partsSection && partsSection[1]) {
        const parts = partsSection[1]
          .split("\n")
          .map((line: string) => line.trim())
          .filter(
            (line: string) =>
              line &&
              !line.toLowerCase().includes("n/a") &&
              !line.toLowerCase().includes("none")
          );

        if (parts.length > 0) {
          reportData.suggestedParts = parts;
        }
      }

      // Save the report to Firestore
      const reportId = await createDiagnosticReport(reportData);

      // Update the repair request to reference the new report
      try {
        const db = getFirestore(app);

        // First check if the document exists in either collection name format
        let requestRef;
        let docExists = false;
        let collectionUsed = "";

        // Check in "repairRequests" collection first
        requestRef = doc(db, "repairRequests", request.id);
        const requestDoc = await getDoc(requestRef);

        if (requestDoc.exists()) {
          docExists = true;
          collectionUsed = "repairRequests";
        } else {
          // Fallback to "repair-requests" collection format
          requestRef = doc(db, "repair-requests", request.id);
          const altRequestDoc = await getDoc(requestRef);

          if (altRequestDoc.exists()) {
            docExists = true;
            collectionUsed = "repair-requests";
          }
        }

        if (!docExists) {
          console.warn(
            `Repair request document ${request.id} not found in either collection`
          );
          // Don't attempt the update if document doesn't exist
        } else {
          console.log(`Found repair request in '${collectionUsed}' collection`);

          // Use the correct collection-specific reference
          requestRef = doc(db, collectionUsed, request.id);

          // Update document with the new report ID
          // Important: Make sure to include the current user's ID as repairerId
          // This is critical for the request to appear in the repairer dashboard

          // Fix: Explicitly type the updateData object to include all potential properties
          const updateData: {
            diagnosticReportId: string;
            status: RepairStatus;
            updatedAt: Date;
            repairerId?: string; // Add optional repairerId property to the type
          } = {
            diagnosticReportId: reportId,
            status: "diagnosed" as RepairStatus,
            updatedAt: new Date(),
          };

          // Only set repairerId if it doesn't already exist
          if (!request.repairerId) {
            console.log("Adding current user as repairerId");
            // Assuming we have access to the current user context or the request has this info
            updateData.repairerId = request.userId; // This should be the repairer's ID
          } else {
            console.log(`Keeping existing repairerId: ${request.repairerId}`);
          }

          await updateDoc(requestRef, updateData);

          console.log(
            `Updated repair request ${request.id} with diagnostic report ${reportId}`
          );
        }
      } catch (updateError) {
        console.error(
          "Error updating repair request with diagnostic report ID:",
          updateError
        );
        // Continue - we still want to return the report even if the update fails
      }

      // Return the complete report
      return {
        id: reportId,
        ...reportData,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error generating diagnostic report:", error);
      return null;
    }
  };

  // Payment
  const createPayment = async (
    data: Omit<Payment, "id" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    try {
      const paymentRef = collection(db, "payments");
      const docRef = await addDoc(paymentRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  };

  const updatePayment = async (
    paymentId: string,
    data: Partial<Payment>
  ): Promise<void> => {
    try {
      const paymentDocRef = doc(db, "payments", paymentId);
      await updateDoc(paymentDocRef, { ...data, updatedAt: new Date() });
    } catch (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
  };

  const getPayment = async (paymentId: string): Promise<Payment | null> => {
    try {
      const paymentDocRef = doc(db, "payments", paymentId);
      const paymentDoc = await getDoc(paymentDocRef);

      if (paymentDoc.exists()) {
        return { id: paymentDoc.id, ...paymentDoc.data() } as Payment;
      }

      return null;
    } catch (error) {
      console.error("Error getting payment:", error);
      throw error;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        getUser,
        updateUserProfile,
        updateUserLocation,
        getRepairerProfile,
        createRepairerProfile,
        updateRepairerProfile,
        getNearbyRepairers,
        createRepairRequest,
        updateRepairRequest,
        getRepairRequest,
        getUserRepairRequests,
        getRepairerAssignedRequests,
        getAvailableRequests,
        uploadImage,
        createDiagnosticReport,
        getDiagnosticReport,
        createPayment,
        updatePayment,
        getPayment,
        updateRepairRequestStatus,
        verifyRepairCompletion,
        requestPaymentFromUser,
        generateDiagnosticReport,
        createStripeCheckoutSession, // Add the new method
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
