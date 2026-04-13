'use client';
import UserLayout from '@/components/UserLayout/UserLayout';
import CreateAnnouncementPage from '@/views/Users/PostsPage/CreateAnnouncementPage';

export default function CreateAnnouncement() {
  return (
    <UserLayout>
      <CreateAnnouncementPage />
    </UserLayout>
  );
}
