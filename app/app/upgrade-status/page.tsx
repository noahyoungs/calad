"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify-icon/react";

import { SpecksAnimation } from "@/components/SpecksAnimation";
import { fetchUserSubscription } from "@/actions/settings-actions";

export default function UpgradeStatusPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Verifying your cal.ad Plus upgrade... Please wait.");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 12; // Poll for up to 1 minute (12 attempts * 5 seconds)
    let intervalId: NodeJS.Timeout | null = null;

    const checkSubscription = async () => {
      attempts++;
      try {
        const result = await fetchUserSubscription();
        if (result.success && result.data?.isPro) {
          setStatusMessage("Thank you for your purchase! Upgrade confirmed. Redirecting...");
          setIsVerifying(false);
          setIsError(false);
          if (intervalId) clearInterval(intervalId);
          setTimeout(() => {
            router.push("/app/start");
          }, 2000); // Short delay before redirect
          return true; // Stop polling
        } else if (attempts >= maxAttempts) {
          setStatusMessage("Could not confirm your Plus upgrade in time. Please check your account or contact support.");
          setIsVerifying(false);
          setIsError(true);
          if (intervalId) clearInterval(intervalId);
          return true; // Stop polling
        }
        return false; // Continue polling
      } catch (error) {
        console.error("Error checking subscription:", error);
        setStatusMessage("An error occurred while verifying your upgrade. Please try refreshing or contact support.");
        setIsVerifying(false);
        setIsError(true);
        if (intervalId) clearInterval(intervalId);
        return true; // Stop polling
      }
    };

    // Initial check immediately
    checkSubscription().then(stopPolling => {
      if (!stopPolling) {
        // If not stopped, start the interval
        intervalId = setInterval(async () => {
          const stopped = await checkSubscription();
          if (stopped && intervalId) {
            clearInterval(intervalId);
          }
        }, 5000);
      }
    });

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [router]);

  return (
    <div className="flex h-[100dvh] w-screen w-full items-center justify-center p-2 !text-white">
      <SpecksAnimation />
      <div className="flex flex-col items-center gap-8 z-10 w-full">
        <div className="w-36">
          <Image
            src="/calad_logo_white.svg"
            alt="cal.ad Logo"
            width={100}
            height={34}
            priority
            unoptimized
            className="w-full"
          />
        </div>
        <div className="bg-[rgba(29,35,61,0.1)] rounded-[24px] w-[90%] xs:w-[70%] md:w-[450px]">
          <div className="flex w-full flex-col gap-4 rounded-[24px] px-8 pb-8 pt-8 backdrop-blur-sm border-2 border-white/25 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] text-center">
            {isVerifying && (
              <Icon icon="line-md:loading-twotone-loop" width={48} height={48} className="mx-auto mb-4" />
            )}
            {!isVerifying && !isError && (
              <Icon icon="tabler:circle-check-filled" width={48} height={48} className="mx-auto mb-4 text-green-400" />
            )}
            {!isVerifying && isError && (
              <Icon icon="tabler:alert-circle-filled" width={48} height={48} className="mx-auto mb-4 text-red-400" />
            )}
            <h1 className="text-xl font-medium">
              {statusMessage}
            </h1>
            {!isVerifying && isError && (
                 <p className="text-sm mt-2 text-default-400">
                 You can manually check your <a href="/settings?tab=billing" className="font-semibold underline hover:text-primary transition-colors">billing settings</a> or try refreshing this page.
               </p>
            )}
             {!isVerifying && !isError && !statusMessage.toLowerCase().includes("redirecting") && (
                <p className="text-sm mt-2 text-default-400">
                    If redirection doesn't occur, please go to <a href="/app/start" className="font-semibold underline hover:text-primary transition-colors">get started</a>.
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 