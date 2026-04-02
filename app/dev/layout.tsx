"use server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = [
  "matt@amplifyforlawyers.com",
  "matt@exsisto.ai",
];

export default async function DevLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    redirect("/login?next=/dev");
  }

  return <>{children}</>;
}
