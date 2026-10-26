import { CLOSURE_MESSAGE } from "@/utils/site-closure";

export default function ClosureBanner() {
  return (
    <aside aria-label="Service closure notice" className="closure-banner">
      <p>{CLOSURE_MESSAGE}</p>
    </aside>
  );
}
