import Link from "next/link";
import { SpecksAnimation } from "@/components/SpecksAnimation";
import Image from "next/image";
import { Button } from "@heroui/react";
import { Icon } from "@iconify-icon/react";

export default function EmailVerified() {
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
          <div className="flex w-full flex-col gap-4 rounded-[24px] px-8 pb-6 pt-6 backdrop-blur-sm border-2 border-white/25 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
            <h1 className="pb-2 text-2xl font-medium text-center">
              Email Verified Successfully! ✅
            </h1>
            <p className="text-center text-sm">
              You can now send emails to <a href={`mailto:${process.env.MAILGUN_EMAIL || 'hello@cal.ad'}`} className="font-bold underline hover:text-blue-300 transition-colors">{process.env.MAILGUN_EMAIL || 'hello@cal.ad'}</a> to create calendar events and more! ✨
            </p>
            <p className="text-center text-sm mt-1">
              Just email what you need — meetings, reminders, birthdays, travel plans — and your calendar assistant will take care of the rest! 
            </p>
            
            <div className="flex gap-4 justify-center mt-3">
              <Button
                as="a"
                href="/downloads/calad_assistant.vcf"
                download
                variant="flat"
                className="!text-white"
                startContent={<Icon icon="tabler:address-book" width={20} height={20}/>}
                // endContent={<Icon icon="tabler:download" width={20} height={20}/>}
              >
                Download Contact
              </Button>
              <Button
              as={Link}
              href="/app/chat"
              variant="flat"
              className="!text-white mx-auto"
              startContent={<Icon icon="tabler:message-chatbot" width={20} height={20}/>}
              endContent={<Icon icon="tabler:arrow-back-up" width={20} height={20}/>}
            >
              Return to Chat
            </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 