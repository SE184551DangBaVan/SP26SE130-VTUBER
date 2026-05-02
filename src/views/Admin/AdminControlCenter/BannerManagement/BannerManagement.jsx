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
  // datetimeLocalValue is in format "2026-04-22T23:59" (local time)
  // Split the date and time parts
  const [datePart, timePart] = datetimeLocalValue.split('T');
  
  // Create a date string that JavaScript will parse as local time
  const date = new Date(`${datePart}T${timePart}:00`);
  
  // Adjust for local timezone offset
  const isoString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  
  console.log('📅 Date Formatting Debug:');
  console.log('  Input (local):', datetimeLocalValue);
  console.log('  Date object:', date.toString());
  console.log('  Output (UTC):', isoString);
  console.log('  Timezone offset:', date.getTimezoneOffset(), 'minutes');
  
  return isoString;
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
  const [bannerValidationError, setBannerValidationError] = useState('');

  // Banner item creation form
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemMultiplier, setItemMultiplier] = useState('');
  const [itemType, setItemType] = useState('MAIN_REWARD');
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState('');
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemValidationError, setItemValidationError] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBanners();
      // Sort banners: active first, then upcoming, then expired at bottom
      const now = new Date();
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => {
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);

        // Active banners first
        const aIsActive = a.isActive && aStart <= now && aEnd > now;
        const bIsActive = b.isActive && bStart <= now && bEnd > now;
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;

        // Then upcoming
        const aIsUpcoming = aStart > now;
        const bIsUpcoming = bStart > now;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;

        // Expired at bottom
        if (aEnd <= now && bEnd > now) return 1;
        if (aEnd > now && bEnd <= now) return -1;

        return 0;
      }) : [];
      setBanners(sorted);
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
    setBannerValidationError('');
  };

  const resetItemForm = () => {
    setItemName('');
    setItemDescription('');
    setItemCategory('');
    setItemMultiplier('');
    setItemType('MAIN_REWARD');
    setItemImageFile(null);
    setItemImagePreview('');
    setItemValidationError('');
  };

  // Validation functions
  const isBannerNameUnique = (name) => {
    return !banners.some(b => b.name.toLowerCase() === name.toLowerCase());
  };

  const validateBannerForm = () => {
    setBannerValidationError('');

    if (!bannerName.trim()) {
      setBannerValidationError('Banner name is required');
      return false;
    }

    if (!isBannerNameUnique(bannerName)) {
      setBannerValidationError('Banner name must be unique');
      return false;
    }

    if (!bannerDescription.trim()) {
      setBannerValidationError('Banner description is required');
      return false;
    }

    if (!bannerStartTime) {
      setBannerValidationError('Start date is required');
      return false;
    }

    if (!bannerEndTime) {
      setBannerValidationError('End date is required');
      return false;
    }

    const now = new Date();
    const startDate = new Date(bannerStartTime);
    const endDate = new Date(bannerEndTime);

    if (startDate < now) {
      setBannerValidationError('Start date cannot be in the past');
      return false;
    }

    if (startDate >= endDate) {
      setBannerValidationError('Start date must be before end date');
      return false;
    }

    if (!bannerGachaCost || Number(bannerGachaCost) <= 0) {
      setBannerValidationError('Gacha cost must be greater than 0');
      return false;
    }

    if (!bannerImageFile) {
      setBannerValidationError('Banner image is required');
      return false;
    }

    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (bannerImageFile.size > maxFileSize) {
      setBannerValidationError('Image file size must not exceed 50MB');
      return false;
    }

    return true;
  };

  const validateItemForm = () => {
    setItemValidationError('');

    if (!itemName.trim()) {
      setItemValidationError('Item name is required');
      return false;
    }

    if (!itemCategory.trim()) {
      setItemValidationError('Item category is required');
      return false;
    }

    if (!itemMultiplier || Number(itemMultiplier) < 1 || Number(itemMultiplier) > 99) {
      setItemValidationError('Drop rate multiplier must be between 1-99% (cannot be 0% or 100%)');
      return false;
    }

    return true;
  };

  const canActivateBanner = (banner) => {
    const now = new Date();
    const endDate = new Date(banner.endTime);
    // Cannot activate if expired
    if (endDate <= now) return false;
    return true;
  };

  const handleBannerSubmit = async (event) => {
    event.preventDefault();

    if (!validateBannerForm()) {
      return;
    }

    setBannerSubmitting(true);

    try {
      const startISO = formatDateToISO(bannerStartTime);
      const endISO = formatDateToISO(bannerEndTime);

      const requestPayload = {
        name: bannerName,
        startTime: startISO,
        endTime: endISO,
        description: bannerDescription,
        gachaCost: Number(bannerGachaCost),
        bannerImageFile,
      };

      console.log('🎮 Banner Creation Request:');
      console.log('  Name:', bannerName);
      console.log('  Description:', bannerDescription);
      console.log('  Start Time (input):', bannerStartTime);
      console.log('  Start Time (ISO):', startISO);
      console.log('  End Time (input):', bannerEndTime);
      console.log('  End Time (ISO):', endISO);
      console.log('  Gacha Cost:', bannerGachaCost);
      console.log('  Image File:', bannerImageFile?.name, `(${(bannerImageFile?.size / 1024 / 1024).toFixed(2)}MB)`);
      console.log('  Full Payload:', requestPayload);

      const response = await createBanner(requestPayload);

      if (response?.success) {
        showSuccess('Banner created successfully');
        resetBannerForm();
        fetchBanners();
      } else {
        showError(response?.message || 'Failed to create banner');
      }
    } catch (submitError) {
      console.error('❌ Banner creation error:', submitError);
      showError('Failed to create banner');
    } finally {
      setBannerSubmitting(false);
    }
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();

    if (!validateItemForm()) {
      return;
    }

    setItemSubmitting(true);

    try {
      const requestPayload = {
        itemName,
        description: itemDescription,
        category: itemCategory,
        multiplier: Number(itemMultiplier),
        type: itemType,
        imageFile: itemImageFile,
      };

      console.log('🎁 Banner Item Creation Request:');
      console.log('  Item Name:', itemName);
      console.log('  Type:', itemType);
      console.log('  Category:', itemCategory);
      console.log('  Multiplier:', itemMultiplier + '%');
      console.log('  Description:', itemDescription);
      console.log('  Image File:', itemImageFile?.name || 'None');
      console.log('  Full Payload:', requestPayload);

      const response = await addBannerItem(selectedBanner.bannerId, requestPayload);

      if (response?.success) {
        showSuccess('Banner item added successfully');
        resetItemForm();
        const items = await getBannerItems(selectedBanner.bannerId);
        setBannerItems(Array.isArray(items) ? items : []);
      } else {
        showError(response?.message || 'Failed to add banner item');
      }
    } catch (submitError) {
      console.error('❌ Banner item creation error:', submitError);
      showError('Failed to add banner item');
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleActivateBanner = async (bannerId, event) => {
    event.stopPropagation();
    if (processingBannerId === bannerId) return;

    // First fetch items to check if banner has items
    try {
      const items = await getBannerItems(bannerId);
      if (!Array.isArray(items) || items.length === 0) {
        showError('Add at least 2 items before activating');
        return;
      }

      // Check if we have at least one of each type
      const hasTypes = new Set(items.map(item => item.type));
      if (hasTypes.size < 2) {
        showError('Add at least 1 MAIN_REWARD and 1 GOOD_LUCK item before activating');
        return;
      }
    } catch (err) {
      showError('Failed to validate banner items');
      return;
    }

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
                          disabled={processingBannerId === banner.bannerId || !canActivateBanner(banner)}
                          title={!canActivateBanner(banner) ? 'Cannot activate expired banner' : ''}
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
              {bannerValidationError && (
                <div className='banner-error-message' style={{ color: '#ff6348', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe5e5', borderRadius: '4px' }}>
                  ⚠️ {bannerValidationError}
                </div>
              )}
              <form className='banner-form' onSubmit={handleBannerSubmit}>
                <label>
                  Banner Name *
                  <input
                    type='text'
                    value={bannerName}
                    onChange={(e) => setBannerName(e.target.value)}
                    placeholder='One Of A Kind Banner!'
                    required
                  />
                </label>
                <label>
                  Description *
                  <textarea
                    value={bannerDescription}
                    onChange={(e) => setBannerDescription(e.target.value)}
                    placeholder='Describe this banner...'
                    rows={4}
                    required
                  />
                </label>
                <label>
                  Start Time *
                  <input
                    type='datetime-local'
                    value={bannerStartTime}
                    onChange={(e) => setBannerStartTime(e.target.value)}
                    required
                  />
                </label>
                <label>
                  End Time *
                  <input
                    type='datetime-local'
                    value={bannerEndTime}
                    onChange={(e) => setBannerEndTime(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Single Pull Cost (Points) *
                  <input
                    type='number'
                    value={bannerGachaCost}
                    onChange={(e) => setBannerGachaCost(e.target.value)}
                    placeholder='10'
                    min='1'
                    required
                  />
                </label>
                <label className='file-input-label'>
                  Featured Image (PNG/JPG, max 50MB) *
                  <input
                    type='file'
                    accept='image/png,image/jpeg'
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
                        <span className={`banner-item-type ${item.type?.toLowerCase()}`}>
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
              {itemValidationError && (
                <div className='banner-error-message' style={{ color: '#ff6348', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe5e5', borderRadius: '4px' }}>
                  ⚠️ {itemValidationError}
                </div>
              )}
              <div className='items-summary' style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '12px' }}>
                <strong>Current Items:</strong> {bannerItems.length}
              </div>
              <form className='banner-form' onSubmit={handleItemSubmit}>
                <label>
                  Item Name *
                  <input
                    type='text'
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder='Epic Frame'
                    required
                  />
                </label>
                <label>
                  Item Type *
                  <select value={itemType} onChange={(e) => setItemType(e.target.value)} required>
                    <option value='MAIN_REWARD'>Main Reward</option>
                    <option value='GOOD_LUCK'>Good Luck</option>
                  </select>
                </label>
                <label>
                  Drop Rate Multiplier (%) *
                  <input
                    type='number'
                    value={itemMultiplier}
                    onChange={(e) => setItemMultiplier(e.target.value)}
                    placeholder='30 (means 30% drop rate)'
                    min='1'
                    max='99'
                    required
                  />
                </label>
                <label>
                  Category *
                  <input
                    type='text'
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder='FRAME, PET, etc.'
                    required
                  />
                </label>
                <label>
                  Description (Optional)
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder='A rare item...'
                    rows={4}
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
