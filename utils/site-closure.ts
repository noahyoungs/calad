export const CLOSURE_MESSAGE =
  "cal.ad is no longer accepting new sign-ups. Thank you to everyone who tried it.";

// Include legacy and conventional registration and payment entry points.
export function isClosedEntryPath(pathname: string) {
  return /\/(?:sign-up|signup|register|registration|pricing|checkout|create-checkout-session|upgrade|plus-upgrade|upgrade-status)(?:\/|$)/i.test(pathname);
}
