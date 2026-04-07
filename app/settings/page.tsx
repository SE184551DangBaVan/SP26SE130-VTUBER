"use client";

import UserLayout from "@/components/UserLayout/UserLayout";
import SettingsPage from "@/views/Users/SettingsPage/SettingsPage";

export default function SettingsRoute() {
  return (
    <UserLayout>
      <SettingsPage />
    </UserLayout>
  );
}
