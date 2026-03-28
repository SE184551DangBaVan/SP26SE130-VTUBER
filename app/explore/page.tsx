'use client';

import UserLayout from '@/components/UserLayout/UserLayout';
import ExplorePageComponent from '@/views/Users/ExplorePage/ExplorePage';

export default function ExplorePageRoute() {
  return (
    <UserLayout>
      <ExplorePageComponent />
    </UserLayout>
  );
}
