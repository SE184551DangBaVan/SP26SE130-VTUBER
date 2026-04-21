'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import VtuberApplicationPage from '@/views/Users/VtuberApplicationPage/VtuberApplicationPage';

export default function VtuberApplicationPageRoute() {
  return (
    <UserLayout>
      <VtuberApplicationPage />
    </UserLayout>
  );
}
