'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import PostsPageComponent from '@/views/Users/PostsPage/PostsPage';

export default function PostsPageRoute() {
  return (
    <UserLayout>
      <PostsPageComponent />
    </UserLayout>
  );
}