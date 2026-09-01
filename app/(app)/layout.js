import BottomNav from "@/components/nav/BottomNav";

export default function AppLayout({ children }) {
  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-md flex-col pt-[52px] lg:max-w-5xl">
        {children}
        <div className="min-h-[30px] flex-1" />
        <BottomNav />
      </div>
    </main>
  );
}
