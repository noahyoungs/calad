import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100dvh-var(--closure-banner-height))] flex-col bg-[#7f8ee2] px-6 text-white">
      <header className="mx-auto w-full max-w-5xl py-8">
        <Image src="/calad_logo_white.svg" alt="cal.ad" width={1269} height={343} style={{ width: 120, height: "auto" }} priority />
      </header>
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-16 text-center">
        <Image src="/calad_avatar.png" alt="" width={96} height={96} className="mb-8 rounded-full border-4 border-[#ffd125]" priority />
        <h1 className="mb-6 text-4xl font-semibold leading-tight sm:text-5xl">Thank you for trying cal.ad.</h1>
        <p className="max-w-xl text-lg leading-relaxed text-white/90">
          cal.ad has closed to new users. New sign-ups, upgrades, and payments are no longer available.
        </p>
      </section>
      <footer className="mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-6 border-t border-white/20 py-8 text-sm">
        <Link href="/legal/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>
        <Link href="/legal/terms-of-service" className="underline underline-offset-4">Terms of Service</Link>
      </footer>
    </div>
  );
}
