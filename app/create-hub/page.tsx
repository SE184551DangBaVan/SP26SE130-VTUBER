'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import CreateHubPageComponent from '@/views/Users/CreateHubPage/CreateHubPage';

export default function CreateHubPageRoute() {
  return (
    <UserLayout>
      <CreateHubPageComponent />
    </UserLayout>
  );
}
