import { useEffect, useState, useMemo, useRef } from 'react';
import { getAllItems, createItem, deleteItem, editItem } from '@/services/ItemController';
import { itemCategories } from '@/constants/itemCategories';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import { showSuccess, showError } from '@/utils/toastUtils';
import './AdminItemManagement.css';

const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export default function AdminItemManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(itemCategories[0]);
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
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError('Unable to load items.');
    } finally {
      setLoading(false);
    }
  };

  const itemsByCategory = useMemo(() => {
    return items.reduce((groups, item) => {
      const categoryKey = (item.category || 'Uncategorized').toUpperCase();
      groups[categoryKey] = groups[categoryKey] || [];
      groups[categoryKey].push(item);
      return groups;
    }, {});
  }, [items]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const resetForm = () => {
    setItemName('');
    setCategory(itemCategories[0]);
    setDescription('');
    setSize(115);
    setXaxis(0);
    setYaxis(0);
    setImageFile(null);
    setImagePreview('');
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingItem(null);
    resetForm();
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setItemName(item.itemName || '');
    setCategory(item.category || itemCategories[0]);
    setDescription(item.description || '');
    setSize(item.size || 115);
    setXaxis(item.xaxis || 0);
    setYaxis(item.yaxis || 0);
    setImagePreview(item.imageUrl || '');
    setShowEditModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (showAddModal && (!itemName || !category || !description || !imageFile)) {
      showError('All fields are required for new items.');
      return;
    }

    setSubmitting(true);

    try {
      const itemData = {
        itemName,
        description,
        category: category.toUpperCase(),
        size: Number(size),
        xaxis: Number(xaxis),
        yaxis: Number(yaxis)
      };

      let response;
      if (showEditModal && editingItem) {
        response = await editItem(editingItem.id, itemData, imageFile);
      } else {
        response = await createItem(itemData, imageFile);
      }

      if (response?.success) {
        showSuccess(showEditModal ? 'Item updated successfully' : 'Item created successfully');
        handleCloseModal();
        fetchItems();
      } else {
        showError(response?.message || 'Action failed');
      }
    } catch (err) {
      showError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setDeletingId(itemId);
    try {
      const response = await deleteItem(itemId);
      if (response?.success) {
        showSuccess('Item deleted successfully');
        fetchItems();
      } else {
        showError(response?.message || 'Failed to delete item');
      }
    } catch (err) {
      showError('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className='item-management'>
      <div className='item-management-header'>
        <div>
          <h1>Global Item Management</h1>
          <p className='item-management-subtitle'>Manage global items available across the platform.</p>
        </div>
        <div className="header-actions">
          <button className='add-item-btn' onClick={() => setShowAddModal(true)}>
            + Add Item
          </button>
          <button className='refresh-btn' onClick={fetchItems}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className='item-management-grid'>
        <div className='item-management-list-panel full-width'>
          <div className='item-management-list-scroll'>
            {loading ? (
              <div className='item-management-status'>Loading items...</div>
            ) : error ? (
              <div className='item-management-status item-management-error'>{error}</div>
            ) : Object.keys(itemsByCategory).length === 0 ? (
              <div className='item-management-status'>No items available.</div>
            ) : (
              Object.entries(itemsByCategory).map(([categoryKey, categoryItems]) => (
                <section className='item-management-category-section' key={categoryKey}>
                  <div className='item-management-category-header'>
                    <div className='item-management-category-title'>{categoryKey}</div>
                    <span className='item-management-category-count'>{categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className='item-management-card-row'>
                    {categoryItems.map((item) => (
                      <article className='item-card-admin' key={item.id}>
                        <div className='item-image-wrap'>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName} />
                          ) : (
                            <div className='item-image-placeholder'>No Image</div>
                          )}
                          <div className="item-card-actions">
                            <button 
                              className='edit-item-btn' 
                              onClick={() => handleEditClick(item)}
                            >
                              ✎
                            </button>
                            <button 
                              className='delete-item-btn' 
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? '...' : '×'}
                            </button>
                          </div>
                        </div>
                        <div className='item-card-body'>
                          <div className='item-card-title-row'>
                            <h3>{item.itemName}</h3>
                            <span className='item-id-tag'>#{item.id}</span>
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className='window modal-overlay' onClick={handleCloseModal}>
          <div className='modal-content gim-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Create New Global Item</h2>
              <button className='modal-close' onClick={handleCloseModal}>×</button>
            </div>

            <div className='modal-body'>
              <form className='gim-form' onSubmit={handleSubmit}>
                <div className="gim-form-grid">
                  <div className="gim-form-fields">
                    <label>
                      Item Name
                      <input
                        type='text'
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder='Rare Frame'
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
                        placeholder='Provide a detailed description of the item...'
                        rows={4}
                        required
                      />
                    </label>
                    <label className='file-input-label'>
                      Item Image
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                  </div>

                  <div className="gim-preview-section">
                    <h3>Frame Preview</h3>
                    <div className="gim-preview-container">
                      <div className={`gim-preview-wrapper ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}>
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
                              className="gim-drag-handle" 
                              onMouseDown={handleDragStart}
                              title="Drag to move"
                            />
                            <div 
                              className="gim-resize-handle" 
                              onMouseDown={handleResizeStart}
                              title="Drag up/down to resize"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="gim-adjustment-fields horizontal">
                      <label>
                        Size (%)
                        <input
                          type='number'
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                        />
                      </label>
                      <label>
                        X Axis
                        <input
                          type='number'
                          value={xaxis}
                          onChange={(e) => setXaxis(e.target.value)}
                        />
                      </label>
                      <label>
                        Y Axis
                        <input
                          type='number'
                          value={yaxis}
                          onChange={(e) => setYaxis(e.target.value)}
                        />
                      </label>
                    </div>
                    <p className="gim-preview-hint">Drag frame to MOVE. Drag corner to RESIZE.</p>
                  </div>
                </div>

                <div className='modal-footer'>
                  <button className='cancel-btn' type="button" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button className='gim-submit-btn' type='submit' disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className='window modal-overlay' onClick={handleCloseModal}>
          <div className='modal-content gim-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Edit Global Item #{editingItem?.id}</h2>
              <button className='modal-close' onClick={handleCloseModal}>×</button>
            </div>

            <div className='modal-body'>
              <form className='gim-form' onSubmit={handleSubmit}>
                <div className="gim-form-grid">
                  <div className="gim-form-fields">
                    <label>
                      Item Name
                      <input
                        type='text'
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder='Rare Frame'
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
                        placeholder='Provide a detailed description of the item...'
                        rows={4}
                        required
                      />
                    </label>
                    <label className='file-input-label'>
                      Change Image (Optional)
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  <div className="gim-preview-section">
                    <h3>Frame Preview</h3>
                    <div className="gim-preview-container">
                      <div className={`gim-preview-wrapper ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}>
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
                              className="gim-drag-handle" 
                              onMouseDown={handleDragStart}
                              title="Drag to move"
                            />
                            <div 
                              className="gim-resize-handle" 
                              onMouseDown={handleResizeStart}
                              title="Drag up/down to resize"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="gim-adjustment-fields horizontal">
                      <label>
                        Size (%)
                        <input
                          type='number'
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                        />
                      </label>
                      <label>
                        X Axis
                        <input
                          type='number'
                          value={xaxis}
                          onChange={(e) => setXaxis(e.target.value)}
                        />
                      </label>
                      <label>
                        Y Axis
                        <input
                          type='number'
                          value={yaxis}
                          onChange={(e) => setYaxis(e.target.value)}
                        />
                      </label>
                    </div>
                    <p className="gim-preview-hint">Drag frame to MOVE. Drag corner to RESIZE.</p>
                  </div>
                </div>

                <div className='modal-footer'>
                  <button className='cancel-btn' type="button" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button className='gim-submit-btn' type='submit' disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
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
