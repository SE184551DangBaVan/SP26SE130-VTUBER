import VtuberApplicationContent from '../AdminVtuberApplication/VtuberApplicationContent';
import ShopItemsContent from '../AdminShopItems/ShopItemsManagement';
import BannerManageContent from '../BannerManagement/BannerManagement';
import AnalyticsContent from '../AdminAnalytics/AnalyticsContent';
import AdminFeedback from '../AdminFeedback/AdminFeedback';
import AdminHubManagement from '../AdminHubManagement/AdminHubManagement';
import AdminItemManagement from '../AdminItemManagement/AdminItemManagement';
import AdminPaidPackageManagement from '../AdminPaidPackageManagement/AdminPaidPackageManagement';

import ApplicationIco from '../../../../assets/UI-Elements/note.svg';
import ItemIco from '../../../../assets/UI-Elements/cardboard.svg';
import ShopItemIco from '../../../../assets/UI-Elements/shopping-cart.svg';
import BannerItemIco from '../../../../assets/UI-Elements/stock.svg';
import AnalyticIco from '../../../../assets/UI-Elements/analytics.svg';
import FeedbackIco from '../../../../assets/UI-Elements/feedback.svg';
import FanHubIco from '../../../../assets/UI-Elements/fanhub.svg';
import PaidPackageIco from '../../../../assets/UI-Elements/credit-card-payment.svg';

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
        id: 'fan-hub-management',
        label: 'Fan Hub Management',
        icon: <img src={FanHubIco.src} alt="Fan Hub Management" style={{ width: '42px', height: '42px' }} />,
        component: AdminHubManagement,
        windowTitle: 'ADMIN_HUB_MANAGER.exe'
    },
    {
        id: 'item-management',
        label: 'Item Management',
        icon: <img src={ItemIco.src} alt="Item Management" style={{ width: '42px', height: '42px' }} />,
        component: AdminItemManagement,
        windowTitle: 'ITEM_MANAGEMENT.exe'
    },
    {
        id: 'shop-items',
        label: 'Shop Items',
        icon: <img src={ShopItemIco.src} alt="Shop Items" style={{ width: '48px', height: '48px' }} />,
        component: ShopItemsContent,
        windowTitle: 'SHOP_ITEMS_MANAGER.exe'
    },
    {
        id: 'banner-management',
        label: 'Banner Management',
        icon: <img src={BannerItemIco.src} alt="Banner Management" style={{ width: '42px', height: '42px' }} />,
        component: BannerManageContent,
        windowTitle: 'BANNER_MANAGEMENT.exe'
    },
    {
        id: 'view-feedback',
        label: 'View Feedback',
        icon: <img src={FeedbackIco.src} alt="View Feedback" style={{ width: '50px', height: '50px', transform: 'translate(12%, 0) rotate(-15deg)' }} />,
        component: AdminFeedback,
        windowTitle: 'VIEW_FEEDBACK.exe'
    },
    {
        id: 'view-paidpackage',
        label: 'Paid Packages',
        icon: <img src={PaidPackageIco.src} alt="View Feedback" style={{ width: '60px', height: '60px', transform: 'translate(2%, 8px)' }} />,
        component: AdminPaidPackageManagement,
        windowTitle: 'PAID_PACKAGES_MANAGER.exe'
    }
];
