'use client';

import { useEffect, useState } from 'react';
import { useSideBar } from '@/contexts/SideBarContext';
import { Search } from '@mui/icons-material';
import { getShopItems } from '@/services/ShopController';
import './ShopPage.css';

import LoadingImg1 from '../../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../../assets/Decor/loading-6.gif'

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

export default function ShopPage() {
  const { sideBarRetractor } = useSideBar();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [randomLoadingImage, setRandomLoadingImage] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setRandomLoadingImage(loadingImages[randomIndex]);
  }, []);

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
          LOADING SHOP
          {randomLoadingImage && (
            <img
              className='loading-animation'
              src={randomLoadingImage.src}
              alt=""
              onError={(e) => {
                e.target.src = "/picture-not-available-photo.jpg";
              }}
            />
          )}
          <div className="loading-wrapper">
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-shadow"></div>
            <div className="loading-shadow"></div>
            <div className="loading-shadow"></div>
          </div>
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
      
      <div className="shop-items-grid">
        {filteredItems.length === 0 ? (
          <div className="shop-empty-message">
            {searchQuery ? 'No items match your search.' : 'No items available in the shop.'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.shopItemId} className="shop-item-card">
  <div className="shop-item-inner">

    {/* Image Area */}
    <div className="shop-item-image-container">
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.itemName} className="shop-item-image" />
            )}

            {/* Price overlay (top-right like reference) */}
            <div className="shop-item-price-overlay">
              <span>$</span> {item.price}
            </div>

            <div className="shop-item-border-accent"></div>
            <div className="shop-item-pixel-effect"></div>
          </div>
        </div>
        <div className="shop-item-info">
          <h3 className="shop-item-name">{item.itemName}</h3>
        </div>
      </div>
          ))
        )}
      </div>
    </div>
  );
}
