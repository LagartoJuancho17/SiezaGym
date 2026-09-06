import BottomNav from "@/components/nav/BottomNav";
import TopNavbar from "@/components/nav/TopNavbar";
import AppShell from "@/components/nav/AppShell";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user.uid) : null;

  return (
    <AppShell>
      <TopNavbar user={user} profile={profile} />
      <main className="w-full min-h-screen">
        {children}
      </main>
      <BottomNav />
    </AppShell>
  );
}
