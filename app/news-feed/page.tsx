'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import NewsPage from '@/views/Users/NewsPage/NewsPage';

export default function NewsFeed() {
  return (
    <UserLayout>
        <NewsPage />
    </UserLayout>
  );
}