import Link from "next/link";

// Retain a safe fallback for any legacy import of the upgrade component.
export default function PlusUpgradeClientFlow() {
  return <Link href="/closed">New purchases and upgrades are no longer available.</Link>;
}
