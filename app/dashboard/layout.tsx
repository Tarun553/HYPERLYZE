import { Sidebar } from "@/components/dashboard/sidebar";
import { syncUser } from "@/lib/syncUser";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await syncUser();

  return (
    <div className="flex min-h-screen bg-background text-foreground cyber-grid">
      <Sidebar />
      <main className="flex-1 pl-64 p-8 relative">
        <div className="absolute top-0 right-0 p-8">
          <div className="h-px w-32 bg-linear-to-l from-cyber-blue to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto pt-8">{children}</div>
      </main>
    </div>
  );
}
