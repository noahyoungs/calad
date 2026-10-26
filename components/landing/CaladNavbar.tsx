import Image from "next/image";
import Link from "next/link";

export default function CaladNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/20 bg-[#5969b7] px-6 py-4 text-white" aria-label="Main navigation">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link href="/">
          <Image src="/calad_logo_white.svg" alt="cal.ad" width={1269} height={343} style={{ width: 100, height: "auto" }} priority />
        </Link>
        <Link href="/" className="text-sm underline underline-offset-4">Home</Link>
      </div>
    </nav>
  );
}
