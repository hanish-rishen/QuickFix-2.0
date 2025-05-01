"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  PenTool as Tool,
  Zap,
  UserCheck,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import Header from "@/components/layout/header"; // Import Header
import Footer from "@/components/layout/footer"; // Import Footer

export default function Home() {
  const { user } = useAuth(); // Get user from auth context

  return (
    <div className="flex flex-col min-h-screen">
      {" "}
      {/* Ensure flex column layout */}
      <Header /> {/* Add Header */}
      <main className="flex-1">
        {" "}
        {/* Make main content flexible */}
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 to-blue-400 py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Fast, reliable repairs for your items
                </h1>
                <p className="mt-4 text-lg md:text-xl text-blue-100 max-w-xl">
                  Connect with skilled repairers in your area. Upload a photo,
                  get an AI diagnosis, and only pay when the job is done.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                  {/* Conditionally render Request a Repair button */}
                  {(!user || user.role !== "repairer") && (
                    <Button
                      size="lg"
                      asChild
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      <Link href="/repair-request">
                        Request Repair <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white text-white bg-blue-700"
                  >
                    <Link href="/how-it-works">How It Works</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 mt-12 md:mt-0">
                <div className="relative mx-auto max-w-md">
                  <div className="rounded-lg bg-white shadow-xl overflow-hidden">
                    <img
                      src="https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                      alt="Repair service in action"
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                      <div className="text-white">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wider">
                          Verified Repair
                        </span>
                        <p className="mt-2 font-semibold">
                          Electronics repair completed in 24 hours
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-yellow-400 rounded-full p-4 shadow-lg animate-pulse">
                    <Zap className="h-8 w-8 text-yellow-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Curved wave shape at bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 120"
              className="w-full h-auto fill-white dark:fill-gray-900"
            >
              <path d="M0,96L80,80C160,64,320,32,480,32C640,32,800,64,960,69.3C1120,75,1280,53,1360,42.7L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
            </svg>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                How QuickFix Works
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Our simple process gets your items repaired quickly and
                efficiently
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 h-full">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 rounded-full p-4 shadow-lg">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6 text-center">
                    Upload Your Item
                  </h3>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                    Take a photo of your broken item and provide a description
                    of the issue. Our AI will analyze it.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Tool className="h-16 w-16 text-blue-400 dark:text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 h-full">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 rounded-full p-4 shadow-lg">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6 text-center">
                    Get Matched
                  </h3>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                    Based on your location and item diagnostics, we&apos;ll
                    connect you with the perfect skilled repairer.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <UserCheck className="h-16 w-16 text-blue-400 dark:text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 h-full">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 rounded-full p-4 shadow-lg">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6 text-center">
                    Secure Payment
                  </h3>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                    Your repair is verified by our AI. Only pay when you&apos;re
                    completely satisfied with the results.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Shield className="h-16 w-16 text-blue-400 dark:text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              {/* Conditionally render Start Your Repair Request button */}
              {(!user || user.role !== "repairer") && (
                <Button size="lg" asChild>
                  <Link href="/repair-request">Start Your Repair Request</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
        {/* Services Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                What We Can Repair
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Our network of skilled repairers can fix almost anything
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Service 1 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                <img
                  src="https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Electronics Repair"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Electronics
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Smartphones, laptops, TVs, and other electronic devices
                  </p>
                </div>
              </div>

              {/* Service 2 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                <img
                  src="https://images.pexels.com/photos/6444/pencil-typography-black-design.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Furniture Repair"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Furniture
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Wooden furniture, upholstery, and other home furnishings
                  </p>
                </div>
              </div>

              {/* Service 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                <img
                  src="https://images.pexels.com/photos/5710837/pexels-photo-5710837.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Appliance Repair"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Appliances
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Refrigerators, washing machines, and kitchen appliances
                  </p>
                </div>
              </div>

              {/* Service 4 */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                <img
                  src="https://images.pexels.com/photos/5802282/pexels-photo-5802282.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Clothing Repair"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Clothing
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Tailoring, alterations, and garment repairs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Testimonials */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                What Our Customers Say
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Don&apos;t just take our word for it - see what people are
                saying about QuickFix
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    JD
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      John Doe
                    </h4>
                    <div className="flex text-yellow-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  &quot;My laptop screen was cracked and I needed it fixed
                  urgently for work. QuickFix connected me with a technician who
                  came to my house the same day. Fantastic service!&quot;
                </p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    JA
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Jane Agarwal
                    </h4>
                    <div className="flex text-yellow-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  &quot;The AI diagnostic tool was spot on! It correctly
                  identified the issue with my washing machine, and the repairer
                  knew exactly what parts to bring. Saved so much time!&quot;
                </p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    MS
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Michael Smith
                    </h4>
                    <div className="flex text-yellow-400">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  &quot;I love that I only had to pay after the repair was
                  verified. The map feature made it easy to find a nearby
                  repairer, and the whole process was smooth from start to
                  finish.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="bg-blue-600 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to get your items fixed?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of satisfied customers who have used QuickFix for
              fast, reliable repairs.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              {/* Conditionally render Request a Repair button */}
              {(!user || user.role !== "repairer") && (
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <Link href="/repair-request">Request a Repair</Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white text-white hover:bg-blue-700"
              >
                <Link href="/signup">Create an Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer /> {/* Add Footer */}
    </div>
  );
}
