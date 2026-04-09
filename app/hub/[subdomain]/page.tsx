'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import HubPage from '@/views/Users/HubPage/HubPage';

export default function HubPageRoute() {
  return (
    <UserLayout>
      <HubPage ownedHub={null} />
    </UserLayout>
  );
}
