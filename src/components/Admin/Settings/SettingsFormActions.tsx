"use client";

import { Button } from "@/components/ui/button";

export default function SettingsFormActions({
  saving,
  onSave,
  onCancel,
}: {
  saving?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
      <Button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="min-h-10 bg-slate-900 hover:bg-slate-800 touch-manipulation"
      >
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={saving}
        className="min-h-10 touch-manipulation"
      >
        Цуцлах
      </Button>
    </div>
  );
}
