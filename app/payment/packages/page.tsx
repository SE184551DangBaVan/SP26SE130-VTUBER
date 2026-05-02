'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import PaymentPackagesPage from '@/views/Users/PaymentPage/PaymentPackagesPage/PaymentPackagesPage';

export default function PaymentPackagesRoute() {
  return (
    <UserLayout>
      <PaymentPackagesPage />
    </UserLayout>
  );
}
