import { auth } from "@/lib/auth";
import { dashboardPathForRole, normalizeCampusVoiceRole } from "@/lib/auth-routes";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  const role = normalizeCampusVoiceRole(session?.user?.role);

  if (session?.accessToken && role) {
    redirect(dashboardPathForRole(role));
  }

  redirect("/login");
}
