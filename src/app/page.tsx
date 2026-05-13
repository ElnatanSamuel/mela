import { redirect } from "next/navigation";

export default function Home() {
  // Automatically send users to the dashboard
  // Since we have middleware, it will handle the login check
  redirect("/dashboard");
}
