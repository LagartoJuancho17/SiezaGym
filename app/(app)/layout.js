import BottomNav from "@/components/nav/BottomNav";
import TopNavbar from "@/components/nav/TopNavbar";
import AppShell from "@/components/nav/AppShell";
import LegacyChrome from "@/components/nav/LegacyChrome";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/users/users";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user.uid) : null;

  return (
    <AppShell>
      <LegacyChrome top={<TopNavbar user={user} profile={profile} />} bottom={<BottomNav />}>
        {children}
      </LegacyChrome>
    </AppShell>
  );
}
