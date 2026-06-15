import { Suspense } from "react";
import PlatformSupportPage from "@/components/Platform/Support";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          Ачааллаж байна...
        </div>
      }
    >
      <PlatformSupportPage />
    </Suspense>
  );
}
