import React from "react";
import { SpecksAnimation } from "../../components/SpecksAnimation";
import CaladContact from "../../components/landing/CaladContact";
import CaladFooter from "../../components/landing/CaladFooter";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify-icon/react";

export default function ContactPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#7f8ee2] z-10">
      {/* Background Animation */}
      <SpecksAnimation />
      <div className="pt-[120px] relative z-10">
        {/* Simple Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-[100] w-full backdrop-blur-md">
          <div className="glass border-b border-white/10 bg-black/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <Link href="/">
                    <Image
                      src="/calad_logo_white.svg"
                      alt="cal.ad Logo"
                      width={100}
                      height={34}
                      style={{ height: "auto" }}
                      priority
                      unoptimized
                    />
                  </Link>
                </div>

                {/* Navigation */}
                <div className="hidden md:flex md:items-center md:space-x-8">
                  <Link
                    href="/"
                    className="text-sm font-medium text-white/60 hover:text-white/80 transition-colors duration-200"
                  >
                    Home
                  </Link>
                  <Link
                    href="/#features"
                    className="text-sm font-medium text-white/60 hover:text-white/80 transition-colors duration-200"
                  >
                    Features
                  </Link>
                  <Link
                    href="/#faq"
                    className="text-sm font-medium text-white/60 hover:text-white/80 transition-colors duration-200"
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm font-medium text-white transition-colors duration-200"
                  >
                    Contact
                  </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex md:hidden">
                  <Link href="/" className="text-white flex items-center">
                    <Icon icon="lucide:arrow-left" width={24} />
                    <span className="ml-2">Back to Home</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <CaladContact />
        <CaladFooter />
      </div>
    </div>
  );
}
