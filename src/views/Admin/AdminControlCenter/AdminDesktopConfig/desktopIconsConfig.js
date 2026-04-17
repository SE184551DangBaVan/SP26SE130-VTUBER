import VtuberApplicationContent from '../AdminVtuberApplication/VtuberApplicationContent';
import ShopItemsContent from '../AdminShopItems/ShopItemsManagement';
import AnalyticsContent from '../AdminAnalytics/AnalyticsContent';
import AdminFeedback from '../AdminFeedback/AdminFeedback';

import ApplicationIco from '../../../../assets/UI-Elements/note.svg';
import ShopItemIco from '../../../../assets/UI-Elements/shopping-cart.svg';
import BannerItemIco from '../../../../assets/UI-Elements/stock.svg';
import AnalyticIco from '../../../../assets/UI-Elements/analytics.svg';
import FeedbackIco from '../../../../assets/UI-Elements/feedback.svg';

export const DESKTOP_ICONS_CONFIG = [
    {
        id: 'analytics',
        label: 'Analytics',
        icon: <img src={AnalyticIco.src} alt="Analytics" style={{ width: '42px', height: '42px' }} />,
        component: AnalyticsContent,
        windowTitle: 'ANALYTICS_VIEWER.exe'
    },
    {
        id: 'vtuber-applications',
        label: 'Vtuber Applications',
        icon: <img src={ApplicationIco.src} alt="Vtuber Applications" style={{ width: '36px', height: '36px' }} />,
        component: VtuberApplicationContent,
        windowTitle: 'VTUBER_APPLICATION_MANAGER.exe'
    },
    {
        id: 'shop-items',
        label: 'Shop Items',
        icon: <img src={ShopItemIco.src} alt="Shop Items" style={{ width: '48px', height: '48px' }} />,
        component: ShopItemsContent,
        windowTitle: 'SHOP_ITEMS_MANAGER.exe'
    },
    
    {
        id: 'view-feedback',
        label: 'View Feedback',
        icon: <img src={FeedbackIco.src} alt="View Feedback" style={{ width: '52px', height: '52px', transform: 'translate(12%, 0)' }} />,
        component: AdminFeedback,
        windowTitle: 'VIEW_FEEDBACK.exe'
    }
];
