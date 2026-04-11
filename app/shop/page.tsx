'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import ShopPage from '@/views/Users/ShopPage/ShopPage';

export default function ShopPageRoute() {
  return (
    <UserLayout>
      <ShopPage />
    </UserLayout>
  );
}
