'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSideBar } from '@/contexts/SideBarContext';
import { Search, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getShopItems, getMyItems, purchaseShopItem } from '@/services/ShopController';
import useLiveUserPoints from '@/hooks/useLiveUserPoints';
import PointsIco from '../../../assets/UI-Elements/Coin.png';
import './ShopPage.css';

import LoadingImg1 from '../../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../../assets/Decor/loading-6.gif'
import RetroWindow from '@/components/RetroWindow/RetroWindow';

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

/**
 * Sort items: non-purchased first, then purchased sorted by itemId ascending.
 */
function sortItems(items, purchasedItemIds) {
  return [...items].sort((a, b) => {
    const aPurchased = purchasedItemIds.has(a.itemId) ? 1 : 0;
    const bPurchased = purchasedItemIds.has(b.itemId) ? 1 : 0;
    if (aPurchased !== bPurchased) return aPurchased - bPurchased;
    // Both purchased: sort by itemId ascending
    if (aPurchased && bPurchased) return a.itemId - b.itemId;
    // Both non-purchased: keep original order (stable)
    return 0;
  });
}

/** Horizontal carousel row for a single category */
function CategoryCarousel({ category, items, userPoints, purchasedItemIds, onItemSelect }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const sortedItems = sortItems(items, purchasedItemIds);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -300 : 300;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="category-section">
      <h2 className="category-title">
        <div className="category-line"></div>
        <span className="category-title-text">{category}</span>
      </h2>
      <div className="carousel-wrapper">
        {showLeft && (
          <button className="carousel-btn carousel-btn-left" onClick={() => scroll('left')}>
            <ChevronLeft />
          </button>
        )}
        <div className="carousel-track" ref={scrollRef}>
          {sortedItems.map((item) => {
            const isPurchased = purchasedItemIds.has(item.itemId);
            const canAfford = userPoints >= item.price;
            return (
              <div
                key={item.shopItemId}
                className={`shop-item-card ${isPurchased ? 'card-purchased' : ''}`}
                onClick={() => !isPurchased && onItemSelect(item)}
                style={{ cursor: isPurchased ? 'default' : 'pointer' }}
              >
                <div className="shop-item-inner">
                  <div className="shop-item-image-container">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.itemName} className="shop-item-image" />
                    )}
                    <div className={`shop-item-price-overlay ${!canAfford ? 'price-unaffordable' : ''}`}>
                      <span>$</span> {item.price}
                    </div>
                    {isPurchased && (
                      <div className="shop-item-purchased-overlay">
                        <span>Purchased</span>
                      </div>
                    )}
                    <div className={`shop-item-border-accent ${item.price <= 20 && 'cheap'} ${item.price > 20 && item.price <= 50 && 'elite'} ${item.price > 50 && item.price <= 100 && 'epic'} ${item.price > 100 && 'legendary'}`}></div>
                    <div className="shop-item-pixel-effect"></div>
                  </div>
                </div>
                <div className="shop-item-info">
                  <h3 className="shop-item-name">{item.itemName}</h3>
                </div>
              </div>
            );
          })}
        </div>
        {showRight && (
          <button className="carousel-btn carousel-btn-right" onClick={() => scroll('right')}>
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}

/** Render a single shop item card (for search results grid) */
function ShopItemCard({ item, userPoints, purchasedItemIds, onItemSelect }) {
  const isPurchased = purchasedItemIds.has(item.itemId);
  const canAfford = userPoints >= item.price;

  return (
    <div
      className={`shop-item-card ${isPurchased ? 'card-purchased' : ''}`}
      onClick={() => !isPurchased && onItemSelect(item)}
      style={{ cursor: isPurchased ? 'default' : 'pointer' }}
    >
      <div className="shop-item-inner">
        <div className="shop-item-image-container">
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.itemName} className="shop-item-image" />
          )}
          <div className={`shop-item-price-overlay ${!canAfford ? 'price-unaffordable' : ''}`}>
            <span>$</span> {item.price}
          </div>
          {isPurchased && (
            <div className="shop-item-purchased-overlay">
              <span>Purchased</span>
            </div>
          )}
          <div className="shop-item-border-accent"></div>
          <div className="shop-item-pixel-effect"></div>
        </div>
      </div>
      <div className="shop-item-info">
        <h3 className="shop-item-name">{item.itemName}</h3>
      </div>
    </div>
  );
}

/** Purchase confirmation modal */
function PurchaseModal({ item, userPoints, onConfirm, onCancel }) {
  if (!item) return null;

  const canAfford = userPoints >= item.price;

  return (
    <div className="purchase-modal-backdrop" onClick={onCancel}>
      <div className="purchase-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-corner-tl"></div>
        <div className="modal-corner-br"></div>
        <div className='modal-item-preview-layout'>
          <div className="modal-item-preview">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.itemName} className="modal-item-image" />
            )}
          </div>

          <div className='modal-item-information-block'>
            <div className='modal-item-row'>
              <h2 className={`modal-item-name ${item.price <= 20 && 'cheap'} ${item.price > 20 && item.price <= 50 && 'elite'} ${item.price > 50 && item.price <= 100 && 'epic'} ${item.price > 100 && 'legendary'}`}>{item.itemName}</h2>
              <div className="modal-price-row">
                <span className="modal-price-label">Price</span>
                <span className={`modal-price-value ${!canAfford ? 'price-unaffordable' : ''}`}>
                  {item.price} pts
                </span>
              </div>
            </div>
            <p className="modal-item-description">{item.description}</p>

            <div className="modal-item-category">
              <span className="modal-category-badge">{item.category}</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          {canAfford && (
            <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Insufficient points toast */
function InsufficientToast({ visible }) {
  if (!visible) return null;
  return (
    <div className="insufficient-toast">
      Insufficient Points
    </div>
  );
}

/** Floating price deduction animation (pops from center of points display, drifts down, fades out) */
function PointsDeductionAnim({ amount, onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="points-deduction-anim">
      -{amount}
    </div>
  );
}

export default function ShopPage() {
  const { sideBarRetractor } = useSideBar();
  const [allItems, setAllItems] = useState([]);
  const { userPoints, refreshUserPoints } = useLiveUserPoints();
  const [purchasedItemIds, setPurchasedItemIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Purchase modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Points deduction animation
  const [deductionAmount, setDeductionAmount] = useState(null);

  // Insufficient points toast
  const [showInsufficientToast, setShowInsufficientToast] = useState(false);
  const [pointsBlink, setPointsBlink] = useState(false);

  const [randomLoadingImage, setRandomLoadingImage] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setRandomLoadingImage(loadingImages[randomIndex]);
  }, []);

  // Fetch ALL items, user profile, and purchased items
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Fetch shop items (paginate all pages)
        let collected = [];
        let pageNo = 0;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
          const data = await getShopItems(pageNo, pageSize, 'id');
          if (!data || data.length === 0) {
            hasMore = false;
          } else {
            collected = [...collected, ...data];
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              pageNo += 1;
            }
          }
        }
        setAllItems(collected);

        // Fetch purchased items
        const myItems = await getMyItems();
        const purchasedSet = new Set(myItems.map((mi) => mi.itemId));
        setPurchasedItemIds(purchasedSet);
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Derive search results (also sorted)
  const searchResults = searchQuery.trim()
    ? sortItems(
      allItems.filter((item) =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      purchasedItemIds
    )
    : [];

  // Group items by category
  const categoriesMap = {};
  allItems.forEach((item) => {
    const cat = item.category || 'OTHER';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(item);
  });

  // Stable category order
  const orderedCategories = [];
  const seen = new Set();
  allItems.forEach((item) => {
    const cat = item.category || 'OTHER';
    if (!seen.has(cat)) {
      seen.add(cat);
      orderedCategories.push(cat);
    }
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleItemSelect = (item) => {
    if (purchasedItemIds.has(item.itemId)) return;

    if (userPoints < item.price) {
      setShowInsufficientToast(true);
      setPointsBlink(true);
      setTimeout(() => {
        setShowInsufficientToast(false);
      }, 2000);
      setTimeout(() => {
        setPointsBlink(false);
      }, 5000);
      return;
    }

    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;

    const result = await purchaseShopItem(selectedItem.shopItemId);

    if (result.success) {
      // Update purchased set immediately
      setPurchasedItemIds((prev) => {
        const next = new Set(prev);
        next.add(selectedItem.itemId);
        return next;
      });

      // Close modal first
      setShowModal(false);
      setSelectedItem(null);

      // Show floating deduction animation
      setDeductionAmount(selectedItem.price);
    } else {
      // Purchase failed (e.g. race condition on points)
      setShowInsufficientToast(true);
      setPointsBlink(true);
      setTimeout(() => {
        setShowInsufficientToast(false);
      }, 2000);
      setTimeout(() => {
        setPointsBlink(false);
      }, 5000);
      setShowModal(false);
      setSelectedItem(null);
    }
  };

  // Called when the deduction animation finishes — refetch fresh profile data
  const handleDeductionDone = useCallback(async () => {
    setDeductionAmount(null);
    await refreshUserPoints();
  }, [refreshUserPoints]);

  if (loading) {
    return (
      <div className={`shop-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <RetroWindow
          windowWidth="98%"
          windowHeight="80vh"
          windowColor="blue" //there is only red, blue, yellow
          windowTitle="Shop"
          windowContent={(
            <div className="shop-loading">
              LOADING SHOP
              {randomLoadingImage && (
                <img
                  className="loading-animation"
                  src={randomLoadingImage.src}
                  alt=""
                  onError={(e) => {
                    e.target.src = '/picture-not-available-photo.jpg';
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
            </div>)}
        />
      </div>

    );
  }

  return (
    <div className={`shop-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <div className="background-grid-vfx"></div>
      <RetroWindow
        windowWidth="98%"
        windowHeight="85vh"
        windowColor="blue" //there is only red, blue, yellow
        windowTitle="💎Shop"
        windowContent={(
          <div className="shop-page-overlay retro-custom-scroll">
            <div className="shop-header">
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

            <div className="shop-points-display">
              <img className="points-icon" src={PointsIco.src} alt="Points" />
              <span className={`points-value ${pointsBlink ? 'points-value-blink' : ''}`}>
                {userPoints}
              </span>
              <InsufficientToast visible={showInsufficientToast} />
              {deductionAmount !== null && (
                <PointsDeductionAnim amount={deductionAmount} onFinish={handleDeductionDone} />
              )}
            </div>

            {/* Search Results Block */}
            {searchQuery.trim() && (
              <div className="search-results-section">
                <h2 className="search-results-title">
                  Search Results ({searchResults.length})
                </h2>
                {searchResults.length === 0 ? (
                  <div className="shop-empty-message">No items match your search.</div>
                ) : (
                  <div className="search-results-grid">
                    {searchResults.map((item) => (
                      <ShopItemCard
                        key={item.shopItemId}
                        item={item}
                        userPoints={userPoints}
                        purchasedItemIds={purchasedItemIds}
                        onItemSelect={handleItemSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category Carousels */}
            {!searchQuery.trim() &&
              orderedCategories.map((category) => (
                <CategoryCarousel
                  key={category}
                  category={category}
                  items={categoriesMap[category]}
                  userPoints={userPoints}
                  purchasedItemIds={purchasedItemIds}
                  onItemSelect={handleItemSelect}
                />
              ))}

            {/* When searching, still show categories below */}
            {searchQuery.trim() && searchResults.length > 0 && orderedCategories.length > 0 && (
              <>
                <h2 className="section-divider-title">All Categories</h2>
                {orderedCategories.map((category) => (
                  <CategoryCarousel
                    key={category}
                    category={category}
                    items={categoriesMap[category]}
                    userPoints={userPoints}
                    purchasedItemIds={purchasedItemIds}
                    onItemSelect={handleItemSelect}
                  />
                ))}
              </>
            )}
          </div>
        )}
      />
      {/* Purchase Confirmation Modal */}
      {showModal && selectedItem && (
        <PurchaseModal
          item={selectedItem}
          userPoints={userPoints}
          onConfirm={handleConfirmPurchase}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
}
