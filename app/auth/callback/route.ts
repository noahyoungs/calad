import { NextResponse } from "next/server";

// OAuth used to create users here. Do not exchange codes while registration is closed.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/closed", request.url), 303);
}
