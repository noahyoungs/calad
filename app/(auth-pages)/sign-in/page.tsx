import { redirect } from "next/navigation";

// Google sign-in also registers new users, so it is closed with registration.
export default function Login() {
  redirect("/closed");
}
