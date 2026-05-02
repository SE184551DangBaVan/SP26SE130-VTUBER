'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import PaymentSuccessPage from '@/views/Users/PaymentPage/PaymentSuccessPage/PaymentSuccessPage';

export default function PaymentSuccessRoute() {
  return (
    <UserLayout>
      <PaymentSuccessPage />
    </UserLayout>
  );
}
