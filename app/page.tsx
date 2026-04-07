import { AppHeader } from "@/components/layout/app-header";
import { HomeLanding } from "@/components/home/home-landing";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fb]">
      <AppHeader />
      <HomeLanding />
    </div>
  );
}
