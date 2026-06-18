"use client";

import PasscodeManager from "@/components/Auth/PasscodeManager";
import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";

export default function PasscodePanel() {
  return (
    <SettingsSectionCard
      title="PIN нэвтрэлт"
      description="Төхөөрөмж дээр хурдан нэвтрэх 4 оронтой пин код."
      className="mt-6"
    >
      <PasscodeManager />
    </SettingsSectionCard>
  );
}
