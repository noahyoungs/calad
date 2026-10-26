import Link from "next/link";
import { SpecksAnimation } from "@/components/SpecksAnimation";
import Image from "next/image";
import { Button } from "@heroui/react";
import { Icon } from "@iconify-icon/react";

export default function NotFound() {
  return (
    <div className="flex h-[100dvh] w-screen w-full items-center justify-center p-2 !text-white" style={{ backgroundColor: "#7f8ee2" }}>
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
          <div className="flex w-full flex-col gap-4 rounded-[24px] px-8 pb-6 pt-6 backdrop-blur-sm border-2 border-white/25 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
            <h1 className="pb-2 text-2xl font-medium text-center">
              404 - Page Not Found 🙈
            </h1>
            <p className="text-center">
              Sorry, the page you're looking for doesn't exist.
            </p>
            <Button
              as={Link}
              href="/"
              variant="flat"
              className="mt-2 !text-white mx-auto"
              startContent={<Icon icon="tabler:home" width={20} height={20}/>}
              endContent={<Icon icon="tabler:arrow-right" width={20} height={20}/>}
            >
              Go Back Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
