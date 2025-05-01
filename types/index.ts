export type UserRole = "user" | "repairer" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface RepairerProfile {
  id: string;
  userId?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;
  skills?: string[];
  categories?: string[]; // Add categories array
  rating?: number;
  reviewCount?: number;
  completedRepairs?: number;
  serviceArea?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type RepairStatus =
  | "pending_diagnosis"
  | "diagnosed"
  | "awaiting_repairer"
  | "accepted"
  | "in_progress"
  | "completed"
  | "verified"
  | "awaiting_payment" // New status for when awaiting payment after verification
  | "paid"
  | "cancelled";

export interface RepairRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrls: string[];
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: RepairStatus;
  diagnosticReport?: DiagnosticReport;
  repairerId?: string;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticReport {
  id: string;
  repairRequestId: string;
  analysis: string;
  formattedAnalysis?: string; // Full markdown content
  estimatedComplexity: "low" | "medium" | "high";
  estimatedCost: {
    min: number;
    max: number;
    minInr?: number; // Cost in Indian Rupees
    maxInr?: number; // Cost in Indian Rupees
  };
  estimatedTime: {
    min: number; // in hours
    max: number; // in hours
  };
  suggestedParts?: string[];
  createdAt: Date;
}

export interface Payment {
  id: string;
  repairRequestId: string;
  userId: string;
  repairerId: string;
  amount: number;
  status: "pending" | "completed" | "refunded";
  stripeSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
