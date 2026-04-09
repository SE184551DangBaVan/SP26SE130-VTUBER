'use client';
import UserLayout from '@/components/UserLayout/UserLayout';
import CreatePostPage from '@/views/Users/PostsPage/CreatePostPage';

export default function CreatePost() {
  return (
      <UserLayout>
          <CreatePostPage />
      </UserLayout>
  )
}
