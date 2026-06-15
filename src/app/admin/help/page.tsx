import { Suspense } from "react";
import SupportHelpPage from "@/components/Admin/Help/SupportHelpPage";

export default function AdminHelpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          Ачааллаж байна...
        </div>
      }
    >
      <SupportHelpPage />
    </Suspense>
  );
}
