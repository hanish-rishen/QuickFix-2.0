"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; // Import next/image component
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useFirebase } from "@/contexts/firebase-context";
import { RepairRequest, RepairerProfile, DiagnosticReport } from "@/types";
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
  Loader2,
  AlertCircle,
  PenTool as Tool,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Star,
  Edit,
  DollarSign,
  Upload,
  Send,
  Camera,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function RepairerDashboard() {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [repairerProfile, setRepairerProfile] =
    useState<RepairerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Move useState out of conditional block
  const [availableRequests, setAvailableRequests] = useState<RepairRequest[]>(
    []
  );
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(
    null
  );
  const [diagnosticReport, setDiagnosticReport] =
    useState<DiagnosticReport | null>(null);
  const [completionImage, setCompletionImage] = useState<File | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [repairPrice, setRepairPrice] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "details" | "complete" | "price"
  >("details");
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isVerificationFailed, setIsVerificationFailed] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  const { toast } = useToast();

  const router = useRouter();
  const { user } = useAuth();
  const {
    getRepairerProfile,
    getRepairerAssignedRequests,
    getAvailableRequests,
    getDiagnosticReport,
    uploadImage,
    verifyRepairCompletion,
    updateRepairRequestStatus,
    requestPaymentFromUser,
    generateDiagnosticReport, // Make sure this is available in your Firebase context
  } = useFirebase();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError("You must be logged in to view your dashboard");
        setLoading(false);
        return;
      }

      if (user.role !== "repairer") {
        setError("This dashboard is only for repairers");
        setLoading(false);
        return;
      }

      try {
        // Fetch repairer profile
        const profile = await getRepairerProfile(user.id);
        if (profile) {
          setRepairerProfile(profile);
        }

        // Fetch assigned repair requests
        console.log("Fetching repair requests for repairer:", user.id);
        const requests = await getRepairerAssignedRequests(user.id);
        console.log("Fetched repair requests:", requests); // Debugging log

        // Examine each request to check status and other properties
        requests.forEach((req) => {
          console.log(
            `Request ${req.id}: status=${req.status}, repairerId=${req.repairerId}`
          );
        });

        setRepairRequests(requests || []);
      } catch (err) {
        console.error("Error fetching repairer data:", err);
        setError("Failed to load your data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getRepairerProfile, getRepairerAssignedRequests]);

  // Move useEffect out of conditional block
  useEffect(() => {
    const fetchAvailableRequests = async () => {
      if (!user || !repairerProfile || !repairerProfile.location) return;

      try {
        // Assuming getAvailableRequests is a function in Firebase context
        // that takes repairer location, categories, and service area
        const available = await getAvailableRequests(
          repairerProfile.location,
          repairerProfile.categories || [],
          repairerProfile.serviceArea || 25
        );

        setAvailableRequests(available || []);
      } catch (error) {
        console.error("Error fetching available requests:", error);
      }
    };

    if (repairerProfile) {
      fetchAvailableRequests();
    }
  }, [user, repairerProfile, getAvailableRequests]);

  if (!user) {
    router.push("/login");
    return null;
  }

  if (user.role !== "repairer") {
    router.push("/dashboard");
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
        return "Accepted";
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
  const activeRequests = repairRequests.filter((request) =>
    ["accepted", "in_progress", "awaiting_repairer", "diagnosed"].includes(
      request.status
    )
  );

  const completedRequests = repairRequests.filter((request) =>
    ["completed", "verified", "paid"].includes(request.status)
  );

  // Add function to fetch diagnostic report
  const fetchDiagnosticReport = async (requestId: string) => {
    setIsLoadingReport(true);
    setDiagnosticReport(null);

    try {
      console.log("Fetching diagnostic report for request:", requestId);
      const report = await getDiagnosticReport(requestId);
      console.log("Received diagnostic report:", report);

      if (!report) {
        console.log("No existing report found, generating with Gemini AI...");
        // Try to generate a report if none exists
        if (selectedRequest) {
          setIsGeneratingReport(true);
          toast({
            title: "Generating Diagnostic Report",
            description: "Using Gemini AI to analyze the repair request...",
            variant: "default",
          });

          try {
            // Assuming your function needs the request data to generate a report
            const generatedReport = await generateDiagnosticReport(
              selectedRequest
            );
            if (generatedReport) {
              console.log("Successfully generated report:", generatedReport);
              setDiagnosticReport(generatedReport);
              toast({
                title: "Report Generated",
                description: "AI diagnostic report successfully created",
                variant: "default",
              });
              return;
            }
          } catch (genError) {
            console.error("Error generating diagnostic report:", genError);
            toast({
              title: "Generation Failed",
              description: "Could not generate AI diagnostic report",
              variant: "destructive",
            });
          } finally {
            setIsGeneratingReport(false);
          }
        }

        // If we reach here, we couldn't generate a report
        toast({
          title: "Report Not Found",
          description:
            "No diagnostic report available for this repair request.",
          variant: "default",
        });
        return;
      }

      setDiagnosticReport(report);
    } catch (error) {
      console.error("Error fetching diagnostic report:", error);
      toast({
        title: "Error",
        description: "Failed to load diagnostic report",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Add function to handle completion image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCompletionImage(files[0]);
      toast({
        title: "Image selected",
        description: "Your completion image has been selected successfully",
      });
    }
  };

  // Modified function to handle completion submission with robust error handling
  const handleSubmitCompletion = async () => {
    if (!selectedRequest || !completionImage) {
      toast({
        title: "Missing information",
        description: "Please provide a completion photo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setIsVerificationFailed(false);

    try {
      // Check if the document exists first before trying to update it
      if (selectedRequest.status !== "completed") {
        try {
          console.log(
            "Checking and updating status to completed for request:",
            selectedRequest.id
          );

          // Proper error handling with document verification
          if (!selectedRequest.id) {
            throw new Error("Invalid request ID");
          }

          // Update with a try/catch to handle any potential Firebase errors
          await updateRepairRequestStatus(selectedRequest.id, "completed");
          console.log("Status successfully updated to completed");
        } catch (statusError) {
          console.error("Error updating status to completed:", statusError);

          // Handle different types of errors
          if (
            statusError instanceof Error &&
            (statusError.message.includes("No document to update") ||
              statusError.message.includes("not found") ||
              statusError.message.includes("does not exist"))
          ) {
            toast({
              title: "Document Error",
              description:
                "This repair request no longer exists in the database. Please refresh your dashboard.",
              variant: "destructive",
            });
            setIsDialogOpen(false);
            return; // Exit early since we can't proceed with a non-existent document
          } else {
            // For other errors, log but continue with the process
            toast({
              title: "Status Update Warning",
              description:
                "Could not update the repair status, but we'll try to continue with verification.",
              variant: "default",
            });
          }
        }
      }

      // Upload completion image
      const imagePath = `repair-completions/${
        selectedRequest.id
      }/${Date.now()}`;
      const imageUrl = await uploadImage(completionImage, imagePath);

      // Verify completion with Gemini
      setIsVerifying(true);
      try {
        const verificationResult = await verifyRepairCompletion(
          selectedRequest.id,
          imageUrl,
          completionNote,
          selectedRequest.imageUrls // Original images for comparison
        );

        if (verificationResult.verified) {
          // Try to update status to verified but handle failure gracefully
          try {
            await updateRepairRequestStatus(selectedRequest.id, "verified");
          } catch (updateError) {
            console.error("Error updating to verified status:", updateError);

            if (
              updateError instanceof Error &&
              updateError.message.includes("No document to update")
            ) {
              toast({
                title: "Document Error",
                description:
                  "This repair request no longer exists in the database. It may have been deleted.",
                variant: "destructive",
              });
              setIsDialogOpen(false);
              return; // Exit early since we can't proceed with a non-existent document
            }
            // Otherwise continue the process
          }

          // Save the verification message for display in the UI
          setVerificationMessage(
            verificationResult.message ||
              "Gemini AI has verified your repair completion. You can now proceed to request payment."
          );

          toast({
            title: "Success!",
            description:
              "Repair has been verified. You can now request payment.",
            variant: "default",
          });

          // Close current dialog and open pricing dialog
          setDialogType("price");
        } else {
          setIsVerificationFailed(true);
          setVerificationMessage(
            verificationResult.message ||
              "Gemini couldn't verify the repair. Please try again with clearer images."
          );

          toast({
            title: "Verification failed",
            description:
              verificationResult.message ||
              "Gemini couldn't verify the repair. Please try again with clearer images.",
            variant: "destructive",
          });
        }
      } catch (verificationError) {
        console.error("Error during verification:", verificationError);

        if (
          verificationError instanceof Error &&
          verificationError.message.includes("No document")
        ) {
          toast({
            title: "Document Error",
            description:
              "This repair request no longer exists in the database. It may have been deleted.",
            variant: "destructive",
          });
          setIsDialogOpen(false);
          return;
        } else {
          setIsVerificationFailed(true);
          setVerificationMessage(
            "There was a problem connecting to our verification service. Please try again."
          );

          toast({
            title: "Verification Error",
            description: "Failed to complete verification",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error completing repair:", error);
      toast({
        title: "Error",
        description: "Failed to process completion",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsVerifying(false);

      // Refresh repair requests data to update the UI with new status
      try {
        const requests = await getRepairerAssignedRequests(user!.id);
        setRepairRequests(requests || []);
      } catch (refreshError) {
        console.error("Error refreshing requests:", refreshError);
      }
    }
  };

  // Add function to request payment with enhanced error handling
  const handleRequestPayment = async () => {
    if (!selectedRequest || repairPrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid repair price",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update repair request with final price and change status to await payment
      try {
        await requestPaymentFromUser(selectedRequest.id, repairPrice);

        toast({
          title: "Payment requested",
          description:
            "The customer has been notified about the payment request",
          variant: "default",
        });

        // Refresh repair requests data
        const requests = await getRepairerAssignedRequests(user!.id);
        setRepairRequests(requests || []);

        // Close dialog
        setIsDialogOpen(false);
      } catch (paymentError) {
        console.error("Error requesting payment:", paymentError);

        if (
          paymentError instanceof Error &&
          paymentError.message.includes("No document to update")
        ) {
          toast({
            title: "Document Error",
            description:
              "This repair request no longer exists in the database. It may have been deleted.",
            variant: "destructive",
          });
          setIsDialogOpen(false);
        } else {
          toast({
            title: "Payment Request Error",
            description:
              "Failed to request payment. Please try again or contact support.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error in payment request flow:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during the payment request",
        variant: "destructive",
      });
    }
  };

  // Modified function to handle marking a repair as complete with document existence check
  const handleMarkAsComplete = async (requestId: string) => {
    try {
      console.log("Attempting to mark as complete request with ID:", requestId);

      // First, check if requestId is valid
      if (!requestId || requestId.trim() === "") {
        console.error("Invalid request ID:", requestId);
        toast({
          title: "Error",
          description: "Invalid request ID. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Find the request in our local state FIRST
      const currentRequest = repairRequests.find((req) => req.id === requestId);
      if (!currentRequest) {
        console.error("Could not find request with ID:", requestId);
        toast({
          title: "Error",
          description:
            "Could not locate the repair request in your assignments.",
          variant: "destructive",
        });
        return;
      }

      // Open the completion dialog without attempting to update status first
      // This ensures the dialog will open even if there's an issue with the update
      openCompletionDialog(currentRequest);

      console.log("Opened completion dialog for request:", requestId);
    } catch (error) {
      console.error("Error in mark as complete flow:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred. The dialog should still be open for you to proceed.",
        variant: "destructive",
      });
    }
  };

  const openRepairDetails = (request: RepairRequest) => {
    setSelectedRequest(request);
    fetchDiagnosticReport(request.id);
    setDialogType("details");
    setIsDialogOpen(true);
  };

  const openCompletionDialog = (request: RepairRequest) => {
    console.log("Opening completion dialog for request:", request.id);
    setSelectedRequest(request);
    setCompletionImage(null);
    setCompletionNote("");
    setDialogType("complete");
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Repairer Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Manage your repair jobs and profile
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/repairer/profile">Update Profile</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg">Loading your dashboard...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md p-4 flex">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Repairer Profile Summary */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1 mb-4 md:mb-0 md:mr-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Your Profile
                  </h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {user.displayName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Service Area
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {repairerProfile?.serviceArea
                            ? `${repairerProfile.serviceArea} km radius`
                            : "Not set"}
                          {repairerProfile?.location?.address
                            ? ` from ${repairerProfile.location.address}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Rating
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {repairerProfile?.rating
                            ? `${repairerProfile.rating.toFixed(1)} (${
                                repairerProfile.reviewCount
                              } reviews)`
                            : "No reviews yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Repair Categories
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {repairerProfile?.categories?.length ? (
                        repairerProfile.categories.map((category, index) => {
                          // Try to get readable category name from matching id
                          const categoryName = (() => {
                            const categoryMap: Record<string, string> = {
                              electronics: "Electronics",
                              appliances: "Appliances",
                              furniture: "Furniture",
                              clothing: "Clothing",
                              jewelry: "Jewelry",
                              automotive: "Automotive",
                              other: "Other",
                            };
                            return categoryMap[category] || category;
                          })();

                          return (
                            <Badge key={index} variant="secondary">
                              {categoryName}
                            </Badge>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No repair categories added yet. Update your profile to
                          add categories.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start space-y-2 flex-shrink-0">
                  <div className="text-left md:text-right mb-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {repairerProfile?.completedRepairs || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Completed repairs
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full md:w-auto"
                  >
                    <Link href="/repairer/profile">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Repair Requests Tabs */}
            <div className="mb-8">
              <Tabs defaultValue="active" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">
                    Active Jobs ({activeRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({completedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="available">
                    Available Nearby ({availableRequests.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                  {activeRequests.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        You don&apos;t have any active repair jobs.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeRequests.map((request) => (
                        <Card key={request.id || `request-${Math.random()}`}>
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
                              Accepted on{" "}
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                              {request.description}
                            </p>
                            {request.location && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="truncate">
                                  {request.location.address}
                                </span>
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="flex flex-col gap-3 pt-4">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => openRepairDetails(request)}
                            >
                              View Details
                            </Button>

                            {request.status === "accepted" && (
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  updateRepairRequestStatus(
                                    request.id,
                                    "in_progress"
                                  );
                                  // Refresh data after status update
                                  setTimeout(() => {
                                    getRepairerAssignedRequests(user!.id).then(
                                      (requests) => {
                                        setRepairRequests(requests || []);
                                      }
                                    );
                                  }, 500);
                                }}
                              >
                                <Tool className="mr-2 h-4 w-4" />
                                Start Job
                              </Button>
                            )}

                            {/* Show Mark as Complete button for in_progress and diagnosed status */}
                            {(request.status === "in_progress" ||
                              request.status === "diagnosed" ||
                              request.status === "awaiting_repairer") && (
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleMarkAsComplete(request.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Complete
                              </Button>
                            )}

                            {request.status === "completed" && (
                              <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => openCompletionDialog(request)}
                              >
                                <Camera className="mr-2 h-4 w-4" />
                                Upload Verification Images
                              </Button>
                            )}
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
                        You haven&apos;t completed any repair jobs yet.
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
                            {request.price && (
                              <div className="mt-2 text-sm font-medium">
                                Payment: ₹{request.price.toFixed(0)}
                              </div>
                            )}
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

                <TabsContent value="available" className="space-y-4">
                  {availableRequests.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        There are no available repair requests in your area at
                        the moment.
                      </p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Check back later or update your service area to see more
                        requests.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableRequests.map((request) => (
                        <Card key={request.id || `available-${Math.random()}`}>
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
                              Requested on{" "}
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                              {request.description}
                            </p>
                            {request.location && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="truncate">
                                  {request.location.address}
                                </span>
                              </div>
                            )}
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
            </div>
          </>
        )}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {dialogType === "details" && selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequest.title}</DialogTitle>
                <DialogDescription>
                  Submitted on{" "}
                  {new Date(selectedRequest.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Request Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedRequest.description}
                  </p>

                  {selectedRequest.location && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{selectedRequest.location.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {selectedRequest.imageUrls &&
                      selectedRequest.imageUrls.map((url, index) => (
                        <Image
                          key={index}
                          src={url}
                          alt={`Image ${index + 1}`}
                          width={200}
                          height={150}
                          className="rounded-md object-cover w-full h-32"
                        />
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    AI Diagnostic Report
                  </h3>
                  {isLoadingReport ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      {isGeneratingReport && (
                        <p className="ml-2 text-sm">
                          Generating report with Gemini AI...
                        </p>
                      )}
                    </div>
                  ) : diagnosticReport ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      {/* Replace the simple text display with the markdown renderer */}
                      <div className="mb-4">
                        <MarkdownRenderer
                          content={
                            diagnosticReport.formattedAnalysis ||
                            diagnosticReport.analysis
                          }
                          className="text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">
                            Estimated Complexity
                          </p>
                          <p className="font-medium">
                            {diagnosticReport.estimatedComplexity}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Estimated Cost
                          </p>
                          <p className="font-medium">
                            {diagnosticReport.estimatedCost.minInr ? (
                              <>
                                ₹
                                {diagnosticReport.estimatedCost.minInr.toFixed(
                                  0
                                )}{" "}
                                - ₹
                                {diagnosticReport.estimatedCost.maxInr?.toFixed(
                                  0
                                )}
                              </>
                            ) : (
                              <>
                                ₹
                                {(
                                  diagnosticReport.estimatedCost.min * 75
                                ).toFixed(0)}{" "}
                                - ₹
                                {(
                                  diagnosticReport.estimatedCost.max * 75
                                ).toFixed(0)}
                              </>
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Estimated Time
                          </p>
                          <p className="font-medium">
                            {diagnosticReport.estimatedTime.min} -{" "}
                            {diagnosticReport.estimatedTime.max} hours
                          </p>
                        </div>

                        {/* ...existing code for suggested parts... */}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No diagnostic report available for this request.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          if (selectedRequest) {
                            fetchDiagnosticReport(selectedRequest.id);
                          }
                        }}
                      >
                        <Loader2 className="mr-2 h-4 w-4" />
                        Generate with AI
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}

          {dialogType === "complete" && selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Upload Verification Images</DialogTitle>
                <DialogDescription>
                  Upload photos of the completed repair for verification
                  {selectedRequest.status === "in_progress" &&
                    " (This will mark the repair as complete)"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="completion-image">Completion Photo</Label>
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 mt-1">
                    {completionImage ? (
                      <div className="relative w-full">
                        <Image
                          src={URL.createObjectURL(completionImage)}
                          alt="Completion"
                          width={300}
                          height={200}
                          className="h-48 w-full object-contain rounded-md mx-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setCompletionImage(null)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4 flex flex-col text-sm leading-6 text-gray-600">
                          <p className="mb-2">
                            Take a photo of the completed repair
                          </p>

                          {/* Add a visible upload button */}
                          <Button
                            onClick={() =>
                              document.getElementById("file-upload")?.click()
                            }
                            className="mx-auto mb-2"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Photo
                          </Button>

                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="completion-note">Notes (Optional)</Label>
                  <Textarea
                    id="completion-note"
                    placeholder="Describe what was fixed and any parts that were replaced"
                    rows={3}
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                  />
                </div>

                {isVerificationFailed && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Verification Failed
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {verificationMessage}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                          Try uploading a clearer image that shows the completed
                          repair properly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show success animation when verification succeeds with Gemini's response */}
                {!isVerificationFailed &&
                  isVerifying === false &&
                  completionImage && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                            Verification Successful
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {verificationMessage ||
                              "Gemini AI has verified your repair completion. You can now proceed to request payment."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    What happens after you submit?
                  </h4>
                  <ol className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside">
                    <li>Your repair will be marked as completed</li>
                    <li>Our AI will analyze the before and after photos</li>
                    <li>If verified, you&apos;ll be able to request payment</li>
                    <li>
                      The customer will be notified of the completed repair
                    </li>
                  </ol>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUploading || isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCompletion}
                  disabled={!completionImage || isUploading || isVerifying}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isVerifying ? "Verifying with AI..." : "Uploading..."}
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogType === "price" && selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Request Payment</DialogTitle>
                <DialogDescription>
                  Set the final price for this repair
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {diagnosticReport && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md mb-4">
                    <p className="text-sm font-medium">
                      AI Estimated Cost Range
                    </p>
                    <p className="text-lg font-bold">
                      {diagnosticReport.estimatedCost.minInr ? (
                        <>
                          ₹{diagnosticReport.estimatedCost.minInr.toFixed(0)} -
                          ₹{diagnosticReport.estimatedCost.maxInr?.toFixed(0)}
                        </>
                      ) : (
                        <>
                          ₹
                          {(diagnosticReport.estimatedCost.min * 75).toFixed(0)}{" "}
                          - ₹
                          {(diagnosticReport.estimatedCost.max * 75).toFixed(0)}
                        </>
                      )}
                    </p>
                  </div>
                )}

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="repair-price">Final Repair Price (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <Input
                      id="repair-price"
                      type="number"
                      min="0"
                      step="1"
                      className="pl-7"
                      value={repairPrice || ""}
                      onChange={(e) => setRepairPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestPayment}
                  disabled={!repairPrice || repairPrice <= 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Request Payment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
