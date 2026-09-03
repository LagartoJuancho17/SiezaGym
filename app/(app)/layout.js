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
      <div className="mx-auto flex min-h-screen max-w-md flex-col pt-[52px] sm:max-w-xl md:max-w-2xl md:pt-8 lg:max-w-5xl">
        {children}
        <div className="min-h-[30px] flex-1 md:min-h-0" />
        <BottomNav />
      </div>
    </AppShell>
  );
}
