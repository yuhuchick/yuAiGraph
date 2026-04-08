import { AppHeader } from "@/components/layout/app-header";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">管理后台</h1>
        <AdminNav />
        {children}
      </main>
    </>
  );
}
