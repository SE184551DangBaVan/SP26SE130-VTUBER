'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import FeedbackPage from '@/views/Users/FeedbackPage/FeedbackPage';

export default function page() {
  return (
    <UserLayout>
      <FeedbackPage />
    </UserLayout>
  )
}
