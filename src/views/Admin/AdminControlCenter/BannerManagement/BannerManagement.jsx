import { useEffect, useMemo, useState, useRef } from 'react';
import {
  getAllBanners,
  createBanner,
  getBannerItems,
  addBannerItem,
  activateBanner,
  deactivateBanner,
  deleteBanner,
  deleteBannerItem,
  editBannerItem,
} from '@/services/GachaBannerController';
import { getAllItems } from '@/services/ItemController';
import { itemCategories } from '@/constants/itemCategories';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import { showSuccess, showError } from '@/utils/toastUtils';
import './BannerManagement.css';

const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

const formatDateToISO = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return '';
  const [datePart, timePart] = datetimeLocalValue.split('T');
  const date = new Date(`${datePart}T${timePart}:00`);
  const isoString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
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
  const [globalItems, setGlobalItems] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingBannerId, setProcessingBannerId] = useState(null);
  const [deletingBannerId, setDeletingBannerId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

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

  // Banner item creation form (Modal)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMethod, setAddMethod] = useState('new'); // 'new' or 'existing'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState(itemCategories[0] || 'FRAME');
  const [itemMultiplier, setItemMultiplier] = useState('');
  const [itemType, setItemType] = useState('MAIN_REWARD');
  const [size, setSize] = useState(115);
  const [xaxis, setXaxis] = useState(0);
  const [yaxis, setYaxis] = useState(0);
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemImagePreview, setItemImagePreview] = useState('');
  const [itemSubmitting, setItemSubmitting] = useState(false);

  // Drag & Resize Logic
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0, initialSize: 0 });

  const handleDragStart = (e) => {
    if (!itemImagePreview) return;
    if (addMethod === 'existing') return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: Number(xaxis),
      initialY: Number(yaxis)
    };
  };

  const handleResizeStart = (e) => {
    if (!itemImagePreview) return;
    if (addMethod === 'existing') return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    dragStart.current = {
      y: e.clientY,
      initialSize: Number(size)
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        setXaxis(Math.round(dragStart.current.initialX + deltaX));
        setYaxis(Math.round(dragStart.current.initialY + deltaY));
      } else if (isResizing) {
        const deltaY = dragStart.current.y - e.clientY; 
        const newSize = Math.max(50, Math.min(300, dragStart.current.initialSize + deltaY));
        setSize(Math.round(newSize));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  useEffect(() => {
    fetchBanners();
    fetchGlobalItems();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBanners();
      const now = new Date();
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => {
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        const aIsActive = a.isActive && aStart <= now && aEnd > now;
        const bIsActive = b.isActive && bStart <= now && bEnd > now;
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        const aIsUpcoming = aStart > now;
        const bIsUpcoming = bStart > now;
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
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

  const fetchGlobalItems = async () => {
    try {
      const data = await getAllItems();
      setGlobalItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch global items');
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

  const totalMultiplier = useMemo(() => {
    return bannerItems.reduce((sum, item) => sum + (Number(item.multiplier) || 0), 0);
  }, [bannerItems]);

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

  const handleGlobalItemSelect = (id) => {
    setSelectedItemId(String(id));
    const selectedItem = globalItems.find(item => item.id === Number(id));
    if (selectedItem) {
      setSize(selectedItem.size || 115);
      setXaxis(selectedItem.xaxis || 0);
      setYaxis(selectedItem.yaxis || 0);
      setItemImagePreview(selectedItem.imageUrl || '');
      setItemCategory(selectedItem.category || 'FRAME');
      setItemName(selectedItem.itemName || '');
      setItemDescription(selectedItem.description || '');
    } else {
      setItemImagePreview('');
    }
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
    setSelectedItemId('');
    setItemName('');
    setItemDescription('');
    setItemCategory(itemCategories[0] || 'FRAME');
    setItemMultiplier('');
    setItemType('MAIN_REWARD');
    setSize(115);
    setXaxis(0);
    setYaxis(0);
    setItemImageFile(null);
    setItemImagePreview('');
    setAddMethod('new');
    setIsEditing(false);
    setEditingItemId(null);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setEditingItemId(item.bannerItemId);
    setItemName(item.itemName || '');
    setItemDescription(item.description || '');
    setItemCategory(item.category || 'FRAME');
    setItemMultiplier(item.multiplier || '');
    setItemType(item.type || 'MAIN_REWARD');
    setSize(item.size || 115);
    setXaxis(item.xaxis || 0);
    setYaxis(item.yaxis || 0);
    setItemImagePreview(item.imageUrl || '');
    setAddMethod('new');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetItemForm();
  };

  const isBannerNameUnique = (name) => {
    return !banners.some(b => b.name.toLowerCase() === name.toLowerCase());
  };

  const validateBannerForm = () => {
    setBannerValidationError('');
    if (!bannerName.trim()) { setBannerValidationError('Banner name is required'); return false; }
    if (!bannerDescription.trim()) { setBannerValidationError('Banner description is required'); return false; }
    if (!bannerStartTime) { setBannerValidationError('Start date is required'); return false; }
    if (!bannerEndTime) { setBannerValidationError('End date is required'); return false; }
    const now = new Date();
    const startDate = new Date(bannerStartTime);
    const endDate = new Date(bannerEndTime);
    if (startDate < now) { setBannerValidationError('Start date cannot be in the past'); return false; }
    if (startDate >= endDate) { setBannerValidationError('Start date must be before end date'); return false; }
    if (!bannerGachaCost || Number(bannerGachaCost) <= 0) { setBannerValidationError('Gacha cost must be greater than 0'); return false; }
    if (!bannerImageFile) { setBannerValidationError('Banner image is required'); return false; }
    const maxFileSize = 50 * 1024 * 1024;
    if (bannerImageFile.size > maxFileSize) { setBannerValidationError('Image file size must not exceed 50MB'); return false; }
    return true;
  };

  const canActivateBanner = (banner) => {
    const now = new Date();
    const endDate = new Date(banner.endTime);
    if (endDate <= now) return false;
    return true;
  };

  const handleBannerSubmit = async (event) => {
      console.log("SUBMIT BUTTON CLICKED")
    event.preventDefault();
    if (!validateBannerForm()) return;
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
      const response = await createBanner(requestPayload);
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
    if (!isEditing) {
      if (addMethod === 'new') {
        if (!itemName || !itemMultiplier || !itemCategory || !itemImageFile) {
          showError('All required fields must be filled for new items.');
          return;
        }
      } else {
        if (!selectedItemId || !itemMultiplier) {
          showError('Global Item and Multiplier are required.');
          return;
        }
      }
    }

    setItemSubmitting(true);
    try {
      const requestPayload = {
        itemId: addMethod === 'existing' ? Number(selectedItemId) : null,
        itemName,
        description: itemDescription,
        category: itemCategory,
        multiplier: Number(itemMultiplier),
        type: itemType,
        size: Number(size),
        xaxis: Number(xaxis),
        yaxis: Number(yaxis),
        imageFile: itemImageFile,
      };

      let response;
      if (isEditing) {
        response = await editBannerItem(editingItemId, requestPayload);
      } else {
        response = await addBannerItem(selectedBanner.bannerId, requestPayload);
      }

      if (response?.success) {
        showSuccess(isEditing ? 'Banner item updated successfully' : 'Banner item added successfully');
        handleCloseModal();
        const items = await getBannerItems(selectedBanner.bannerId);
        setBannerItems(Array.isArray(items) ? items : []);
      } else {
        showError(response?.message || `Failed to ${isEditing ? 'update' : 'add'} banner item`);
      }
    } catch (submitError) {
      showError(`Failed to ${isEditing ? 'update' : 'add'} banner item`);
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleActivateBanner = async (bannerId, event) => {
    event.stopPropagation();
    if (processingBannerId === bannerId) return;
    try {
      const items = await getBannerItems(bannerId);
      if (!Array.isArray(items) || items.length === 0) {
        showError('Add at least 2 items before activating');
        return;
      }
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

  const handleDeleteBanner = async (bannerId, event) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setDeletingBannerId(bannerId);
    try {
      const response = await deleteBanner(bannerId);
      if (response?.success) {
        showSuccess('Banner deleted successfully');
        fetchBanners();
      } else {
        showError(response?.message || 'Failed to delete banner');
      }
    } catch (err) {
      showError('Failed to delete banner');
    } finally {
      setDeletingBannerId(null);
    }
  };

  const handleDeleteBannerItem = async (bannerItemId) => {
    if (!window.confirm('Are you sure you want to remove this item from the banner?')) return;
    setDeletingItemId(bannerItemId);
    try {
      const response = await deleteBannerItem(bannerItemId);
      if (response?.success) {
        showSuccess('Item removed from banner');
        const items = await getBannerItems(selectedBanner.bannerId);
        setBannerItems(Array.isArray(items) ? items : []);
      } else {
        showError(response?.message || 'Failed to remove item');
      }
    } catch (err) {
      showError('Failed to remove item');
    } finally {
      setDeletingItemId(null);
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
                      <button 
                        className='banner-delete-btn'
                        onClick={(e) => handleDeleteBanner(banner.bannerId, e)}
                        disabled={deletingBannerId === banner.bannerId}
                        title="Delete Banner"
                      >
                        {deletingBannerId === banner.bannerId ? '...' : '🗑'}
                      </button>
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
          <div className="header-actions">
            <button className='add-item-btn' onClick={() => setShowAddModal(true)}>
              + Add Item
            </button>
            <button className='refresh-btn' onClick={async () => {
              const items = await getBannerItems(selectedBanner.bannerId);
              setBannerItems(Array.isArray(items) ? items : []);
            }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className='banner-management-grid full-width'>
          <div className='banner-list-panel'>
            <div className='banner-list-scroll'>
              {bannerItems.length === 0 ? (
                <div className='banner-status'>No items in this banner yet.</div>
              ) : (
                <div className="banner-items-grid-list">
                  {bannerItems.map((item) => (
                    <article className='banner-item-card' key={item.bannerItemId}>
                      <div className='banner-item-image-wrap'>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.itemName} />
                        ) : (
                          <div className='banner-item-image-placeholder'>No Image</div>
                        )}
                        <button 
                          className='banner-item-delete-btn'
                          onClick={() => handleDeleteBannerItem(item.bannerItemId)}
                          disabled={deletingItemId === item.bannerItemId}
                          title="Remove from Banner"
                        >
                          {deletingItemId === item.bannerItemId ? '...' : '×'}
                        </button>
                        <button 
                          className='banner-item-edit-btn'
                          onClick={() => handleEditClick(item)}
                          title="Edit Item"
                        >
                          ✎
                        </button>
                      </div>
                      <div className='banner-item-card-body'>
                        <h3>{item.itemName}</h3>
                        <div className='banner-item-meta'>
                          <span className={`banner-item-type ${item.type?.toLowerCase()}`}>
                            {item.type}
                          </span>
                          <span className='banner-item-multiplier'>Weight: {item.multiplier}</span>
                          <span className='banner-item-percentage'>
                            ({totalMultiplier > 0 ? ((item.multiplier / totalMultiplier) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        {item.category && <p className='banner-item-category'>{item.category}</p>}
                        {item.description && <p>{truncateText(item.description, 80)}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className='window modal-overlay' onClick={handleCloseModal}>
            <div className='modal-content bim-modal' onClick={(e) => e.stopPropagation()}>
              <div className='modal-header'>
                <h2>{isEditing ? `Edit Item: ${itemName}` : `Add Item to ${selectedBanner.name}`}</h2>
                <button className='modal-close' onClick={handleCloseModal}>×</button>
              </div>

              <div className='modal-body'>
                {!isEditing && (
                  <div className="bim-method-toggle">
                    <button 
                      className={`bim-method-btn ${addMethod === 'new' ? 'active' : ''}`}
                      onClick={() => setAddMethod('new')}
                    >
                      Create New Item
                    </button>
                    <button 
                      className={`bim-method-btn ${addMethod === 'existing' ? 'active' : ''}`}
                      onClick={() => setAddMethod('existing')}
                    >
                      Select From Existing
                    </button>
                  </div>
                )}

                <form className='bim-form' onSubmit={handleItemSubmit}>
                  <div className="bim-form-grid">
                    <div className="bim-form-fields">
                      {addMethod === 'existing' ? (
                        <div className="bim-global-selection">
                          <label>Select Global Item</label>
                          <div className="bim-global-list">
                            {globalItems.map(item => (
                              <div 
                                key={item.id} 
                                className={`bim-global-option ${selectedItemId === String(item.id) ? 'selected' : ''}`}
                                onClick={() => handleGlobalItemSelect(item.id)}
                              >
                                <div className="bim-option-img">
                                  <img src={item.imageUrl} alt={item.itemName} />
                                </div>
                                <div className="bim-option-info">
                                  <span className="bim-option-name">{item.itemName}</span>
                                  <span className="bim-option-id">#{item.id}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
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
                            Category *
                            <select 
                              value={itemCategory} 
                              onChange={(e) => setItemCategory(e.target.value)}
                              required
                            >
                              {itemCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Description
                            <textarea
                              value={itemDescription}
                              onChange={(e) => setItemDescription(e.target.value)}
                              placeholder='Describe this item...'
                              rows={3}
                            />
                          </label>
                          <label className='file-input-label'>
                            Item Image {isEditing ? '(Optional)' : '*'}
                            <input
                              type='file'
                              accept='image/*'
                              onChange={handleItemFileChange}
                              required={!isEditing}
                            />
                          </label>
                        </>
                      )}

                      <label>
                        Item Type *
                        <select value={itemType} onChange={(e) => setItemType(e.target.value)} required>
                          <option value='MAIN_REWARD'>Main Reward</option>
                          <option value='GOOD_LUCK'>Good Luck</option>
                        </select>
                      </label>
                      <label>
                        Multiplier (Weight) *
                        <input
                          type='number'
                          value={itemMultiplier}
                          onChange={(e) => setItemMultiplier(e.target.value)}
                          placeholder='e.g., 5'
                          min='1'
                          required
                        />
                      </label>
                    </div>

                    <div className="bim-preview-section">
                      <h3>Frame Preview</h3>
                      <div className="bim-preview-container">
                        <div className={`bim-preview-wrapper ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}>
                          <UserAvatar 
                            size="xlarge"
                            avatarFrame={itemImagePreview}
                            frameSize={size}
                            frameX={Number(xaxis)}
                            frameY={Number(yaxis)}
                          />
                          {itemImagePreview && addMethod === 'new' && (
                            <>
                              <div 
                                className="bim-drag-handle" 
                                onMouseDown={handleDragStart}
                                title="Drag to move"
                              />
                              <div 
                                className="bim-resize-handle" 
                                onMouseDown={handleResizeStart}
                                title="Drag up/down to resize"
                              />
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="bim-adjustment-fields horizontal">
                        <label>
                          Size (%)
                          <input
                            type='number'
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            disabled={addMethod === 'existing'}
                          />
                        </label>
                        <label>
                          X Axis
                          <input
                            type='number'
                            value={xaxis}
                            onChange={(e) => setXaxis(e.target.value)}
                            disabled={addMethod === 'existing'}
                          />
                        </label>
                        <label>
                          Y Axis
                          <input
                            type='number'
                            value={yaxis}
                            onChange={(e) => setYaxis(e.target.value)}
                            disabled={addMethod === 'existing'}
                          />
                        </label>
                      </div>
                      <p className="bim-preview-hint">
                        { addMethod === 'existing' 
                          ? "Inherited from Global Item." 
                          : "Drag frame to MOVE. Drag corner to RESIZE."}
                      </p>
                    </div>
                  </div>

                  <div className='modal-footer'>
                    <button className='cancel-btn' type="button" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button className='confirm-btn' type='submit' disabled={itemSubmitting}>
                      {itemSubmitting 
                        ? (isEditing ? 'Saving...' : 'Adding...') 
                        : (isEditing ? 'Save Changes' : 'Add to Banner')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
