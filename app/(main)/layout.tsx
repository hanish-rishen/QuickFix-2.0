"use client"; // Add this if not present

import { useAuth } from "@/contexts/auth-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter
import { useEffect } from "react"; // Import useEffect

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if auth check is complete, user is null, and not already on an auth page
    if (!loading && !user) {
      // Check if the current path is already an auth path to prevent redirect loops
      // This check might need adjustment based on your auth routes
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/signup")
      ) {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  // Only render layout if loading is finished and user exists (or handle public main routes differently if needed)
  if (!user) {
    // Or return null, or a minimal layout if some main pages are public
    // Returning null prevents rendering children before redirect happens
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Add padding-top, e.g., pt-16 or adjust based on header height */}
      <main className="flex-grow pt-16">{children}</main>
      <Footer />
    </div>
  );
}
