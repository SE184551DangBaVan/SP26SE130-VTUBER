'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import PaymentCancelPage from '@/views/Users/PaymentPage/PaymentCancelPage/PaymentCancelPage';

export default function PaymentCancelRoute() {
  return (
    <UserLayout>
      <PaymentCancelPage />
    </UserLayout>
  );
}
