import { AppHeader } from "@/components/layout/app-header";
import { HomeLanding } from "@/components/home/home-landing";

export default function HomePage() {
  return (
    <div className="relative z-[1] flex min-h-screen flex-col bg-background">
      <AppHeader />
      <HomeLanding />
    </div>
  );
}
