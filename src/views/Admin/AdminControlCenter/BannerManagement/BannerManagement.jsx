import { useEffect, useMemo, useState } from 'react';
import {
  getAllBanners,
  createBanner,
  getBannerItems,
  addBannerItem,
  activateBanner,
  deactivateBanner,
} from '@/services/GachaBannerController';
import { showSuccess, showError } from '@/utils/toastUtils';
import './BannerManagement.css';

const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

const formatDateToISO = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return '';
  // datetimeLocalValue is in format "2026-04-22T23:59"
  const date = new Date(datetimeLocalValue);
  return date.toISOString();
};

const formatDateRange = (startTime, endTime) => {
  if (!startTime || !endTime) return 'No dates set';
  const now = new Date();
  const end = new Date(endTime);
  const diffMs = end - now;
  if (diffMs <= 0) return 'Expired';
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days > 1) return `${days}d left`;
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  return `${hours}h left`;
};

export default function BannerManagement() {
  const [view, setView] = useState('banners'); // 'banners' or 'bannerItems'
  const [banners, setBanners] = useState([]);
  const [bannerItems, setBannerItems] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingBannerId, setProcessingBannerId] = useState(null);

  // Banner creation form
  const [bannerName, setBannerName] = useState('');
  const [bannerStartTime, setBannerStartTime] = useState('');
  const [bannerEndTime, setBannerEndTime] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerGachaCost, setBannerGachaCost] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState('');
  const [bannerSubmitting, setBannerSubmitting] = useState(false);

  // Banner item creation form
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemMultiplier, setItemMultiplier] = useState('');
  const [itemType, setItemType] = useState('MAIN_REWARD');
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState('');
  const [itemSubmitting, setItemSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBanners();
      setBanners(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError('Unable to load banners.');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = async (banner) => {
    setSelectedBanner(banner);
    setView('bannerItems');
    const items = await getBannerItems(banner.bannerId);
    setBannerItems(Array.isArray(items) ? items : []);
    resetItemForm();
  };

  const handleBackToBanners = () => {
    setView('banners');
    setSelectedBanner(null);
    setBannerItems([]);
  };

  const handleBannerFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setBannerImageFile(file);
    setBannerImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleItemFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setItemImageFile(file);
    setItemImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const resetBannerForm = () => {
    setBannerName('');
    setBannerStartTime('');
    setBannerEndTime('');
    setBannerDescription('');
    setBannerGachaCost('');
    setBannerImageFile(null);
    setBannerImagePreview('');
  };

  const resetItemForm = () => {
    setItemName('');
    setItemDescription('');
    setItemCategory('');
    setItemMultiplier('');
    setItemType('MAIN_REWARD');
    setItemImageFile(null);
    setItemImagePreview('');
  };

  const handleBannerSubmit = async (event) => {
    event.preventDefault();

    if (!bannerName || !bannerStartTime || !bannerEndTime || !bannerGachaCost) {
      showError('Banner name, dates, and gacha cost are required.');
      return;
    }

    setBannerSubmitting(true);

    try {
      const response = await createBanner({
        name: bannerName,
        startTime: formatDateToISO(bannerStartTime),
        endTime: formatDateToISO(bannerEndTime),
        description: bannerDescription,
        gachaCost: Number(bannerGachaCost),
        bannerImageFile,
      });

      if (response?.success) {
        showSuccess('Banner created successfully');
        resetBannerForm();
        fetchBanners();
      } else {
        showError(response?.message || 'Failed to create banner');
      }
    } catch (submitError) {
      showError('Failed to create banner');
    } finally {
      setBannerSubmitting(false);
    }
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();

    if (!itemName || !itemMultiplier) {
      showError('Item name and multiplier are required.');
      return;
    }
    console.log('Submitting item with data:', {
      bannerId: selectedBanner.bannerId,
      itemName,
      itemDescription,
      itemCategory,
      itemMultiplier,
      itemType,
      itemImageFile,
    });
    setItemSubmitting(true);

    try {
      const response = await addBannerItem(selectedBanner.bannerId, {
        itemName,
        description: itemDescription,
        category: itemCategory,
        multiplier: Number(itemMultiplier),
        type: itemType,
        imageFile: itemImageFile,
      });

      if (response?.success) {
        showSuccess('Banner item added successfully');
        resetItemForm();
        const items = await getBannerItems(selectedBanner.bannerId);
        setBannerItems(Array.isArray(items) ? items : []);
      } else {
        showError(response?.message || 'Failed to add banner item');
      }
    } catch (submitError) {
      showError('Failed to add banner item');
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleActivateBanner = async (bannerId, event) => {
    event.stopPropagation();
    if (processingBannerId === bannerId) return;
    
    setProcessingBannerId(bannerId);
    try {
      const response = await activateBanner(bannerId);
      if (response?.success) {
        showSuccess('Banner activated successfully');
        fetchBanners();
      } else {
        showError(response?.message || 'Failed to activate banner');
      }
    } catch (err) {
      showError('Failed to activate banner');
    } finally {
      setProcessingBannerId(null);
    }
  };

  const handleDeactivateBanner = async (bannerId, event) => {
    event.stopPropagation();
    if (processingBannerId === bannerId) return;
    
    setProcessingBannerId(bannerId);
    try {
      const response = await deactivateBanner(bannerId);
      if (response?.success) {
        showSuccess('Banner deactivated successfully');
        fetchBanners();
      } else {
        showError(response?.message || 'Failed to deactivate banner');
      }
    } catch (err) {
      showError('Failed to deactivate banner');
    } finally {
      setProcessingBannerId(null);
    }
  };

  if (view === 'banners') {
    return (
      <div className='banner-management'>
        <div className='banner-management-header'>
          <div>
            <h1>Banner Management</h1>
            <p className='banner-management-subtitle'>Create banners and manage gacha pulls.</p>
          </div>
          <button className='refresh-btn' onClick={fetchBanners}>
            ↻ Refresh
          </button>
        </div>

        <div className='banner-management-grid'>
          <div className='banner-list-panel'>
            <div className='banner-list-scroll'>
              {loading ? (
                <div className='banner-status'>Loading banners...</div>
              ) : error ? (
                <div className='banner-status banner-error'>{error}</div>
              ) : banners.length === 0 ? (
                <div className='banner-status'>No banners available.</div>
              ) : (
                banners.map((banner) => (
                  <article
                    className='banner-card'
                    key={banner.bannerId}
                    onClick={() => handleBannerClick(banner)}
                  >
                    <div className='banner-card-actions'>
                      {banner.isActive ? (
                        <button
                          className='banner-action-btn deactivate-btn'
                          onClick={(e) => handleDeactivateBanner(banner.bannerId, e)}
                          disabled={processingBannerId === banner.bannerId}
                        >
                          {processingBannerId === banner.bannerId ? 'Processing...' : 'Deactivate'}
                        </button>
                      ) : (
                        <button
                          className='banner-action-btn activate-btn'
                          onClick={(e) => handleActivateBanner(banner.bannerId, e)}
                          disabled={processingBannerId === banner.bannerId}
                        >
                          {processingBannerId === banner.bannerId ? 'Processing...' : 'Activate'}
                        </button>
                      )}
                    </div>
                    <div className='banner-card-image-wrap'>
                      {banner.bannerImgUrl ? (
                        <img src={banner.bannerImgUrl} alt={banner.name} />
                      ) : (
                        <div className='banner-card-image-placeholder'>No Image</div>
                      )}
                    </div>
                    <div className='banner-card-body'>
                      <h3>{banner.name}</h3>
                      <div className='banner-card-meta'>
                        <span className='banner-cost'>Cost: {banner.gachaCost} pts</span>
                        <span className={`banner-status-badge ${banner.isActive ? 'active' : 'inactive'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className='banner-time-left'>{formatDateRange(banner.startTime, banner.endTime)}</p>
                      <p>{truncateText(banner.description, 80)}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className='banner-form-panel'>
            <div className='banner-form-card'>
              <h2>Create New Banner</h2>
              <form className='banner-form' onSubmit={handleBannerSubmit}>
                <label>
                  Banner Name
                  <input
                    type='text'
                    value={bannerName}
                    onChange={(e) => setBannerName(e.target.value)}
                    placeholder='One Of A Kind Banner!'
                    required
                  />
                </label>
                <label>
                  Start Time
                  <input
                    type='datetime-local'
                    value={bannerStartTime}
                    onChange={(e) => setBannerStartTime(e.target.value)}
                    required
                  />
                </label>
                <label>
                  End Time
                  <input
                    type='datetime-local'
                    value={bannerEndTime}
                    onChange={(e) => setBannerEndTime(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Gacha Cost (Points)
                  <input
                    type='number'
                    value={bannerGachaCost}
                    onChange={(e) => setBannerGachaCost(e.target.value)}
                    placeholder='10'
                    min='0'
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={bannerDescription}
                    onChange={(e) => setBannerDescription(e.target.value)}
                    placeholder='Describe this banner...'
                    rows={5}
                  />
                </label>
                <label className='file-input-label'>
                  Banner Image
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleBannerFileChange}
                    required
                  />
                </label>
                {bannerImagePreview && (
                  <div className='banner-image-preview'>
                    <img src={bannerImagePreview} alt='Preview' />
                  </div>
                )}
                <button className='banner-submit-btn' type='submit' disabled={bannerSubmitting}>
                  {bannerSubmitting ? 'Creating...' : 'Create Banner'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'bannerItems' && selectedBanner) {
    return (
      <div className='banner-management'>
        <div className='banner-management-header'>
          <div>
            <button className='back-btn' onClick={handleBackToBanners}>
              ← Back to Banners
            </button>
            <h1>Banner Items: {selectedBanner.name}</h1>
            <p className='banner-management-subtitle'>Manage items in this banner.</p>
          </div>
          <button className='refresh-btn' onClick={() => getBannerItems(selectedBanner.bannerId)}>
            ↻ Refresh
          </button>
        </div>

        <div className='banner-management-grid'>
          <div className='banner-list-panel'>
            <div className='banner-list-scroll'>
              {bannerItems.length === 0 ? (
                <div className='banner-status'>No items in this banner yet.</div>
              ) : (
                bannerItems.map((item) => (
                  <article className='banner-item-card' key={item.bannerItemId}>
                    <div className='banner-item-image-wrap'>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName} />
                      ) : (
                        <div className='banner-item-image-placeholder'>No Image</div>
                      )}
                    </div>
                    <div className='banner-item-card-body'>
                      <h3>{item.itemName}</h3>
                      <div className='banner-item-meta'>
                        <span className={`banner-item-type ${item.type.toLowerCase()}`}>
                          {item.type}
                        </span>
                        <span className='banner-item-multiplier'>{item.multiplier}%</span>
                      </div>
                      {item.category && <p className='banner-item-category'>{item.category}</p>}
                      {item.description && <p>{truncateText(item.description, 80)}</p>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className='banner-form-panel'>
            <div className='banner-form-card'>
              <h2>Add Item to Banner</h2>
              <form className='banner-form' onSubmit={handleItemSubmit}>
                <label>
                  Item Name
                  <input
                    type='text'
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder='Epic Frame'
                  />
                </label>
                <label>
                  Item Type
                  <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
                    <option value='MAIN_REWARD'>Main Reward</option>
                    <option value='GOOD_LUCK'>Good Luck</option>
                  </select>
                </label>
                <label>
                  Drop Rate Multiplier (%)
                  <input
                    type='number'
                    value={itemMultiplier}
                    onChange={(e) => setItemMultiplier(e.target.value)}
                    placeholder='20 (means 20% drop rate)'
                    min='0'
                    max='100'
                  />
                </label>
                <label>
                  Category (Optional)
                  <input
                    type='text'
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder='FRAME, PET, etc.'
                  />
                </label>
                <label>
                  Description (Optional)
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder='Describe this item...'
                    rows={5}
                  />
                </label>
                <label className='file-input-label'>
                  Item Image (Optional)
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleItemFileChange}
                  />
                </label>
                {itemImagePreview && (
                  <div className='banner-image-preview'>
                    <img src={itemImagePreview} alt='Preview' />
                  </div>
                )}
                <button className='banner-submit-btn' type='submit' disabled={itemSubmitting}>
                  {itemSubmitting ? 'Adding...' : 'Add Item'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
