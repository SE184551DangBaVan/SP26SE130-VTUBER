import { useSideBar } from '@/contexts/SideBarContext';
import './NewsPage.css'

export default function NewsPage() {
    
  const { sideBarRetractor } = useSideBar();
  
  return (
    <div className={`news-feed-page-container ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <h1>Sex?</h1>
    </div>
  )
}
