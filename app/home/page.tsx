'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import MainPage from '@/views/Users/HomePage/MainPage/MainPage';

export default function HomePage() {
  return (
    <UserLayout>
      <MainPage />
    </UserLayout>
  );
}
