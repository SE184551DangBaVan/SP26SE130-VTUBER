'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import SelectedPostPage from '@/views/Users/PostsPage/SelectedPostPage';

export default function SelectedPostPageRoute() {
  return (
    <UserLayout>
      <SelectedPostPage />
    </UserLayout>
  );
}
