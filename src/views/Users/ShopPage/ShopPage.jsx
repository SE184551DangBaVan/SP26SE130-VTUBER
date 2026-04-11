'use client';

import { useEffect, useState } from 'react';
import { useSideBar } from '@/contexts/SideBarContext';
import { Search } from '@mui/icons-material';
import { getShopItems } from '@/services/ShopController';
import './ShopPage.css';

export default function ShopPage() {
  const { sideBarRetractor } = useSideBar();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch shop items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await getShopItems();
        setItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error('Error fetching shop items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className={`shop-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="shop-loading">
          <div className="loading-spinner"></div>
          <p>Loading Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`shop-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Header with Search */}
      <div className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <div className="shop-search-container">
          <Search className="shop-search-icon" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="shop-search-input"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="shop-items-grid">
        {filteredItems.length === 0 ? (
          <div className="shop-empty-message">
            {searchQuery ? 'No items match your search.' : 'No items available in the shop.'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.itemId} className="shop-item-card">
              {/* Item Image Area with Pixel Effect */}
              <div className="shop-item-image-container">
                {item.image && (
                  <img src={item.image} alt={item.itemName} className="shop-item-image" />
                )}
                <div className="shop-item-pixel-effect"></div>
              </div>

              {/* Item Info */}
              <div className="shop-item-info">
                <div className="shop-item-category">{item.category}</div>
                <h3 className="shop-item-name">{item.itemName}</h3>
                <p className="shop-item-description">{item.description}</p>
                <div className="shop-item-price">
                  <span className="shop-item-price-value">{item.price}</span>
                  <span className="shop-item-price-label">points</span>
                </div>
              </div>

              {/* Bottom Border Accent */}
              <div className="shop-item-border-accent"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
