"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Import the Image component
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useFirebase } from "@/contexts/firebase-context";
import { RepairRequest } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  AlertCircle,
  PenTool as Tool,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Fix the import path

export default function Dashboard() {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccessDialogOpen, setPaymentSuccessDialogOpen] =
    useState(false);
  const [successfulRequestId, setSuccessfulRequestId] = useState<string | null>(
    null
  );
  // Add a state to track requests in payment process
  const [requestsInPayment, setRequestsInPayment] = useState<string[]>([]);

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getUserRepairRequests, createStripeCheckoutSession } = useFirebase();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchRepairRequests = async () => {
      if (!user) {
        setError("You must be logged in to view your dashboard");
        setLoading(false);
        return;
      }

      try {
        const requests = await getUserRepairRequests(user.id);
        setRepairRequests(requests);

        // Check for successful payment return
        const payment_success = searchParams.get("payment_success");
        const request_id = searchParams.get("request_id");

        if (payment_success === "true" && request_id) {
          setSuccessfulRequestId(request_id);
          setPaymentSuccessDialogOpen(true);

          // Find the request that was paid for
          const paidRequest = requests.find((req) => req.id === request_id);

          if (paidRequest) {
            // Update local state to show paid status immediately and ensure it goes to completed tab
            setRepairRequests((prevRequests) =>
              prevRequests.map((req) =>
                req.id === request_id ? { ...req, status: "paid" } : req
              )
            );
          } else {
            // Request not found in current state, refetch to get updated data
            const updatedRequests = await getUserRepairRequests(user.id);
            setRepairRequests(updatedRequests);
          }

          // Clear the URL parameters after processing
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Error fetching repair requests:", err);
        setError("Failed to load your repair requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRepairRequests();
  }, [user, getUserRepairRequests, searchParams, router]);

  if (!user) {
    router.push("/login");
    return null;
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending_diagnosis":
        return "Awaiting Diagnosis";
      case "diagnosed":
        return "Diagnosed";
      case "awaiting_repairer":
        return "Finding Repairer";
      case "accepted":
        return "Repairer Assigned";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "verified":
        return "Verified";
      case "paid":
        return "Paid";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending_diagnosis":
        return "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "diagnosed":
        return "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "awaiting_repairer":
        return "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "accepted":
        return "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "in_progress":
        return "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "completed":
        return "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "verified":
        return "bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "paid":
        return "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_diagnosis":
        return <Clock className="h-4 w-4" />;
      case "diagnosed":
      case "awaiting_repairer":
      case "accepted":
      case "in_progress":
        return <Tool className="h-4 w-4" />;
      case "completed":
      case "verified":
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Filter repair requests by status
  const activeRequests = repairRequests.filter(
    (request) =>
      !["paid", "completed", "verified", "cancelled"].includes(
        request.status
      ) && !requestsInPayment.includes(request.id) // Exclude requests in payment process
  );

  const completedRequests = repairRequests.filter(
    (request) =>
      ["paid", "completed", "verified"].includes(request.status) ||
      requestsInPayment.includes(request.id) // Include requests in payment process
  );

  const cancelledRequests = repairRequests.filter(
    (request) => request.status === "cancelled"
  );

  // Add this function to handle payment
  const handlePayment = async (request: RepairRequest) => {
    try {
      if (!request.repairerId) {
        toast({
          title: "Payment Error",
          description:
            "Cannot process payment: No repairer assigned to this request.",
          variant: "destructive",
        });
        return;
      }

      // Create a checkout session
      const checkoutUrl = await createStripeCheckoutSession(
        request.id,
        request.userId,
        request.repairerId,
        request.price || 0,
        `Payment for repair: ${request.title}`
      );

      // Track this request as being in payment process
      setRequestsInPayment((prev) => [...prev, request.id]);

      // Also update the local state to show as "awaiting_payment" immediately
      setRepairRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === request.id ? { ...req, status: "awaiting_payment" } : req
        )
      );

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating payment session:", error);
      toast({
        title: "Payment Error",
        description:
          "Could not initiate payment. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Success Dialog */}
        <Dialog
          open={paymentSuccessDialogOpen}
          onOpenChange={setPaymentSuccessDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Payment Successful
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Your payment has been processed successfully. The repair request
                has been marked as paid.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setPaymentSuccessDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Your Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Manage your repair requests and account
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/repair-request">New Repair Request</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg">
              Loading your repair requests...
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md p-4 flex">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {repairRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <Tool className="h-full w-full" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No repair requests
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You haven&apos;t submitted any repair requests yet.
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/repair-request">
                      Create your first repair request
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="active" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">
                    Active Requests ({activeRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({completedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled ({cancelledRequests.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                  {activeRequests.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        You don&apos;t have any active repair requests.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeRequests.map((request) => (
                        <Card key={request.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg line-clamp-1">
                                {request.title}
                              </CardTitle>
                              <Badge
                                className={`${getStatusColor(
                                  request.status
                                )} flex items-center space-x-1`}
                              >
                                {getStatusIcon(request.status)}
                                <span>{getStatusLabel(request.status)}</span>
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              Submitted on{" "}
                              {new Date(request.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {request.imageUrls &&
                              request.imageUrls.length > 0 && (
                                <Image
                                  src={request.imageUrls[0]}
                                  alt={request.title}
                                  width={400}
                                  height={240}
                                  className="w-full h-32 object-cover rounded-md mb-4"
                                />
                              )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {request.description}
                            </p>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2 pt-2">
                            {request.status === "awaiting_payment" && (
                              <>
                                <Button
                                  onClick={() => handlePayment(request)}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  Pay Now ₹{request.price?.toFixed(0) || "0"}
                                </Button>
                                <div className="text-xs text-gray-500 text-center mt-1 space-y-1">
                                  <p>Test mode card numbers:</p>
                                  <p>Success: 4242 4242 4242 4242</p>
                                  <p>Auth required: 4000 0025 0000 3155</p>
                                  <p>Decline: 4000 0000 0000 0002</p>
                                  <p>Use any future date and any CVC</p>
                                </div>
                              </>
                            )}
                            <Button
                              asChild
                              variant="outline"
                              className="w-full"
                            >
                              <Link href={`/repair-request/${request.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {completedRequests.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        You don&apos;t have any completed repair requests.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedRequests.map((request) => (
                        <Card key={request.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg line-clamp-1">
                                {request.title}
                              </CardTitle>
                              <Badge
                                className={`${getStatusColor(
                                  request.status
                                )} flex items-center space-x-1`}
                              >
                                {getStatusIcon(request.status)}
                                <span>{getStatusLabel(request.status)}</span>
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              Completed on{" "}
                              {new Date(request.updatedAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {request.imageUrls &&
                              request.imageUrls.length > 0 && (
                                <Image
                                  src={request.imageUrls[0]}
                                  alt={request.title}
                                  width={400}
                                  height={240}
                                  className="w-full h-32 object-cover rounded-md mb-4"
                                />
                              )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {request.description}
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button
                              asChild
                              variant="outline"
                              className="w-full"
                            >
                              <Link href={`/repair-request/${request.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                  {cancelledRequests.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        You don&apos;t have any cancelled repair requests.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cancelledRequests.map((request) => (
                        <Card key={request.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg line-clamp-1">
                                {request.title}
                              </CardTitle>
                              <Badge
                                className={`${getStatusColor(
                                  request.status
                                )} flex items-center space-x-1`}
                              >
                                {getStatusIcon(request.status)}
                                <span>{getStatusLabel(request.status)}</span>
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              Cancelled on{" "}
                              {new Date(request.updatedAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {request.imageUrls &&
                              request.imageUrls.length > 0 && (
                                <Image
                                  src={request.imageUrls[0]}
                                  alt={request.title}
                                  width={400}
                                  height={240}
                                  className="w-full h-32 object-cover rounded-md mb-4"
                                />
                              )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {request.description}
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button
                              asChild
                              variant="outline"
                              className="w-full"
                            >
                              <Link href={`/repair-request/${request.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
  );
}
