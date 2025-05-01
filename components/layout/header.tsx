"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Wrench, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isHomePage = pathname === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage
          ? "bg-white dark:bg-gray-900 shadow-sm" // Always white/dark on homepage
          : isScrolled
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm" // Scrolled on other pages
          : "bg-transparent" // Not scrolled on other pages
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                QuickFix
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                pathname === "/"
                  ? "text-blue-500"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Home
            </Link>
            {(!user || user.role !== "repairer") && (
              <Link
                href="/repair-request"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  pathname === "/repair-request"
                    ? "text-blue-500"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                Request Repair
              </Link>
            )}
            <Link
              href="/how-it-works"
              className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                pathname === "/how-it-works"
                  ? "text-blue-500"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              How It Works
            </Link>
            {user?.role === "repairer" && (
              <Link
                href="/repairer/dashboard"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  pathname === "/repairer/dashboard"
                    ? "text-blue-500"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                Repairer Dashboard
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  pathname === "/admin/dashboard"
                    ? "text-blue-500"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback>
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            {(!user || user.role !== "repairer") && (
              <Link
                href="/repair-request"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/repair-request"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                onClick={closeMobileMenu}
              >
                Request Repair
              </Link>
            )}
            <Link
              href="/how-it-works"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/how-it-works"
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
              onClick={closeMobileMenu}
            >
              How It Works
            </Link>
            {user?.role === "repairer" && (
              <Link
                href="/repairer/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/repairer/dashboard"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                onClick={closeMobileMenu}
              >
                Repairer Dashboard
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/admin/dashboard"
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
                onClick={closeMobileMenu}
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
