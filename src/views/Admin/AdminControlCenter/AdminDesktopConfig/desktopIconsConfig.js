import VtuberApplicationContent from '../AdminVtuberApplication/VtuberApplicationContent';
import ShopItemsContent from '../AdminWindowContents/ShopItemsContent';
import AnalyticsContent from '../AdminWindowContents/AnalyticsContent';

import ApplicationIco from '../../../../assets/UI-Elements/note.svg';
import ShopItemIco from '../../../../assets/UI-Elements/shopping-cart.svg';
import BannerItemIco from '../../../../assets/UI-Elements/stock.svg';
import AnalyticIco from '../../../../assets/UI-Elements/analytics.svg';

export const DESKTOP_ICONS_CONFIG = [
    {
        id: 'analytics',
        label: 'Analytics',
        icon: <img src={AnalyticIco.src} alt="Analytics" style={{ width: '42px', height: '42px' }} />,
        component: AnalyticsContent,
        windowTitle: 'ANALYTICS_MANAGER.exe'
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
    }
];
