import { useEffect, useMemo, useState, useRef } from 'react';
import { getShopItems, addShopItem, editShopItem, deleteShopItem } from '@/services/ShopController';
import { getAllItems } from '@/services/ItemController';
import { itemCategories } from '@/constants/itemCategories';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import { showSuccess, showError } from '@/utils/toastUtils';
import './ShopItemsManagement.css';

const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export default function ShopItemsManagement() {
  const [shopItems, setShopItems] = useState([]);
  const [globalItems, setGlobalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShopItem, setEditingShopItem] = useState(null);
  const [addMethod, setAddMethod] = useState('new'); // 'new' or 'existing'
  
  // Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(itemCategories[0] || 'FRAME');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState(115);
  const [xaxis, setXaxis] = useState(0);
  const [yaxis, setYaxis] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Drag & Resize Logic
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0, initialSize: 0 });

  const handleDragStart = (e) => {
    if (!imagePreview) return;
    if (addMethod === 'existing' && !showEditModal) return;

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
    if (!imagePreview) return;
    if (addMethod === 'existing' && !showEditModal) return;

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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopData, globalData] = await Promise.all([
        getShopItems(),
        getAllItems()
      ]);
      setShopItems(Array.isArray(shopData) ? shopData : []);
      setGlobalItems(Array.isArray(globalData) ? globalData : []);
    } catch (fetchError) {
      setError('Unable to load items.');
    } finally {
      setLoading(false);
    }
  };

  const shopItemsByCategory = useMemo(() => {
    return shopItems.reduce((groups, item) => {
      const categoryKey = (item.category || 'Uncategorized').toUpperCase();
      groups[categoryKey] = groups[categoryKey] || [];
      groups[categoryKey].push(item);
      return groups;
    }, {});
  }, [shopItems]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleGlobalItemSelect = (id) => {
    setSelectedItemId(String(id));
    const selectedItem = globalItems.find(item => item.id === Number(id));
    if (selectedItem) {
      setSize(selectedItem.size || 115);
      setXaxis(selectedItem.xaxis || 0);
      setYaxis(selectedItem.yaxis || 0);
      setImagePreview(selectedItem.imageUrl || '');
      setCategory(selectedItem.category || 'FRAME');
      setItemName(selectedItem.itemName || '');
      setDescription(selectedItem.description || '');
    } else {
      setImagePreview('');
    }
  };

  const resetForm = () => {
    setSelectedItemId('');
    setEditingShopItem(null);
    setItemName('');
    setPrice('');
    setCategory(itemCategories[0] || 'FRAME');
    setDescription('');
    setSize(115);
    setXaxis(0);
    setYaxis(0);
    setImageFile(null);
    setImagePreview('');
    setAddMethod('new');
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const handleEditClick = (item) => {
    setEditingShopItem(item);
    setItemName(item.itemName || '');
    setPrice(item.price || '');
    setCategory(item.category || itemCategories[0]);
    setDescription(item.description || '');
    setSize(item.size || 115);
    setXaxis(item.xaxis || 0);
    setYaxis(item.yaxis || 0);
    setImagePreview(item.imageUrl || '');
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this item from the shop?')) return;
    setDeletingId(id);
    try {
      const res = await deleteShopItem(id);
      if (res?.success) {
        showSuccess('Item removed from shop');
        fetchData();
      } else {
        showError(res?.message || 'Failed to delete');
      }
    } catch (err) {
      showError('Error deleting item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!showEditModal) {
      if (addMethod === 'new') {
        if (!itemName || !price || !category || !description || !imageFile) {
          showError('All fields are required for new items.');
          return;
        }
      } else {
        if (!selectedItemId || !price) {
          showError('Global Item and Price are required.');
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        itemId: (addMethod === 'existing' && !showEditModal) ? Number(selectedItemId) : null,
        itemName,
        description,
        category: category.toUpperCase(),
        price: Number(price),
        size: Number(size),
        xaxis: Number(xaxis),
        yaxis: Number(yaxis),
        imageFile: imageFile,
      };

      let response;
      if (showEditModal && editingShopItem) {
        response = await editShopItem(editingShopItem.shopItemId, payload);
      } else {
        response = await addShopItem(payload);
      }

      if (response?.success) {
        showSuccess(showEditModal ? 'Shop item updated' : 'Shop item added successfully');
        handleCloseModal();
        fetchData();
      } else {
        showError(response?.message || 'Action failed');
      }
    } catch (submitError) {
      showError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='shop-items-management'>
      <div className='shop-items-header'>
        <div>
          <h1>Shop Items Management</h1>
          <p className='shop-items-subtitle'>Review and manage shop products grouped by category.</p>
        </div>
        <div className="header-actions">
          <button className='add-item-btn' onClick={() => setShowAddModal(true)}>
            + Add Shop Item
          </button>
          <button className='refresh-btn' onClick={fetchData}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className='shop-items-grid'>
        <div className='shop-items-list-panel full-width'>
          <div className='shop-items-list-scroll'>
            {loading ? (
              <div className='shop-items-status'>Loading shop items...</div>
            ) : error ? (
              <div className='shop-items-status shop-items-error'>{error}</div>
            ) : Object.keys(shopItemsByCategory).length === 0 ? (
              <div className='shop-items-status'>No shop items available.</div>
            ) : (
              Object.entries(shopItemsByCategory).map(([categoryKey, categoryItems]) => (
                <section className='shop-items-category-section' key={categoryKey}>
                  <div className='shop-items-category-header'>
                    <div className='shop-items-category-title'>{categoryKey}</div>
                    <span className='shop-items-category-count'>{categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className='shop-items-card-row'>
                    {categoryItems.map((item) => (
                      <article className='shop-item-card-admin' key={item.shopItemId}>
                        <div className='shop-item-image-wrap'>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName} />
                          ) : (
                            <div className='shop-item-image-placeholder'>No Image</div>
                          )}
                          <div className="shop-item-card-actions">
                            <button 
                              className='sim-edit-btn' 
                              onClick={() => handleEditClick(item)}
                            >
                              ✎
                            </button>
                            <button 
                              className='sim-delete-btn' 
                              onClick={() => handleDelete(item.shopItemId)}
                              disabled={deletingId === item.shopItemId}
                            >
                              {deletingId === item.shopItemId ? '...' : '×'}
                            </button>
                          </div>
                        </div>
                        <div className='shop-item-card-body'>
                          <div className='shop-item-card-title-row'>
                            <h3>{item.itemName}</h3>
                            <span className='shop-item-price-tag'>{item.price} Pts.</span>
                          </div>
                          <p>{truncateText(item.description, 110)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className='window modal-overlay' onClick={handleCloseModal}>
          <div className='modal-content sim-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>{showEditModal ? `Edit Shop Item #${editingShopItem?.shopItemId}` : 'Add New Shop Item'}</h2>
              <button className='modal-close' onClick={handleCloseModal}>×</button>
            </div>

            <div className='modal-body'>
              {!showEditModal && (
                <div className="sim-method-toggle">
                  <button 
                    className={`sim-method-btn ${addMethod === 'new' ? 'active' : ''}`}
                    onClick={() => setAddMethod('new')}
                  >
                    Create New Item
                  </button>
                  <button 
                    className={`sim-method-btn ${addMethod === 'existing' ? 'active' : ''}`}
                    onClick={() => setAddMethod('existing')}
                  >
                    Select From Existing
                  </button>
                </div>
              )}

              <form className='sim-form' onSubmit={handleSubmit}>
                <div className="sim-form-grid">
                  <div className="sim-form-fields">
                    {(addMethod === 'existing' && !showEditModal) ? (
                      <>
                        <div className="sim-global-selection">
                          <label>Select Global Item</label>
                          <div className="sim-global-list">
                            {globalItems.map(item => (
                              <div 
                                key={item.id} 
                                className={`sim-global-option ${selectedItemId === String(item.id) ? 'selected' : ''}`}
                                onClick={() => handleGlobalItemSelect(item.id)}
                              >
                                <div className="sim-option-img">
                                  <img src={item.imageUrl} alt={item.itemName} />
                                </div>
                                <div className="sim-option-info">
                                  <span className="sim-option-name">{item.itemName}</span>
                                  <span className="sim-option-id">#{item.id}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <label>
                          Item Name
                          <input
                            type='text'
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder='Premium Frame'
                            required
                          />
                        </label>
                        <label>
                          Category
                          <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder='A premium design!'
                            rows={3}
                            required
                          />
                        </label>
                        <label className='file-input-label'>
                          {showEditModal ? 'Change Image (Optional)' : 'Item Image'}
                          <input
                            type='file'
                            accept='image/*'
                            onChange={handleFileChange}
                            required={!showEditModal}
                          />
                        </label>
                      </>
                    )}

                    <label>
                      Price (Points)
                      <input
                        type='number'
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder='10'
                        min='0'
                        required
                      />
                    </label>
                  </div>

                  <div className="sim-preview-section">
                    <h3>Frame Preview</h3>
                    <div className="sim-preview-container">
                      <div className={`sim-preview-wrapper ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}>
                        <UserAvatar 
                          size="xlarge"
                          avatarFrame={imagePreview}
                          frameSize={size}
                          frameX={Number(xaxis)}
                          frameY={Number(yaxis)}
                        />
                        {imagePreview && (
                          <>
                            <div 
                              className="sim-drag-handle" 
                              onMouseDown={handleDragStart}
                              title="Drag to move"
                            />
                            <div 
                              className="sim-resize-handle" 
                              onMouseDown={handleResizeStart}
                              title="Drag up/down to resize"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="sim-adjustment-fields horizontal">
                      <label>
                        Size (%)
                        <input
                          type='number'
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          disabled={addMethod === 'existing' && !showEditModal}
                        />
                      </label>
                      <label>
                        X Axis
                        <input
                          type='number'
                          value={xaxis}
                          onChange={(e) => setXaxis(e.target.value)}
                          disabled={addMethod === 'existing' && !showEditModal}
                        />
                      </label>
                      <label>
                        Y Axis
                        <input
                          type='number'
                          value={yaxis}
                          onChange={(e) => setYaxis(e.target.value)}
                          disabled={addMethod === 'existing' && !showEditModal}
                        />
                      </label>
                    </div>
                    <p className="sim-preview-hint">
                      { (addMethod === 'existing' && !showEditModal) 
                        ? "Inherited from Global Item." 
                        : "Drag frame to MOVE. Drag corner to RESIZE."}
                    </p>
                  </div>
                </div>

                <div className='modal-footer'>
                  <button className='cancel-btn' type="button" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button className='confirm-btn' type='submit' disabled={submitting}>
                    {submitting ? 'Processing...' : (showEditModal ? 'Save Changes' : 'Add to Shop')}
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
