import Link from "next/link";

export const metadata = { title: "Service closed | cal.ad" };

export default function ClosedPage() {
  return (
    <section className="flex min-h-[calc(100dvh-var(--closure-banner-height))] items-center justify-center bg-[#7f8ee2] px-6 py-16 text-white">
      <div className="max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest">cal.ad</p>
        <h1 className="mb-6 text-4xl font-semibold">Service closed</h1>
        <p className="mb-8 text-lg leading-relaxed">
          Sign-in and account features are no longer available. New registrations,
          upgrades, and purchases are also closed. Thank you for trying cal.ad.
        </p>
        <Link href="/" className="inline-block rounded-full bg-white px-6 py-3 font-medium text-[#343c72]">
          Return home
        </Link>
      </div>
    </section>
  );
}
