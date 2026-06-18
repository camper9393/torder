"use client";

import AdminStaffPage from "@/components/Admin/Staff";
import PasscodePanel from "@/components/Admin/Settings/sections/PasscodePanel";
import { useSettingsRestaurantId } from "@/components/Admin/Settings/SettingsRestaurantContext";
import type { PublicUser } from "@/service/userAuth";

export default function StaffSettingsSection({
  currentUser,
}: {
  currentUser: PublicUser;
}) {
  const settingsRestaurantId = useSettingsRestaurantId();

  return (
    <div className="space-y-0">
      <AdminStaffPage
        currentUser={currentUser}
        defaultRestaurantId={settingsRestaurantId ?? undefined}
        hideRestaurantSelector
      />
      <PasscodePanel />
    </div>
  );
}
