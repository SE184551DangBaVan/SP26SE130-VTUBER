import { useEffect, useMemo, useState } from 'react';
import { getShopItems, addShopItem } from '@/services/ShopController';
import { showSuccess, showError } from '@/utils/toastUtils';
import './ShopItemsManagement.css';

const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export default function ShopItemsManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShopItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError('Unable to load shop items.');
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
    setPrice('');
    setCategory('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!itemName || !price || !category || !description || !imageFile) {
      showError('All fields are required, including the image.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await addShopItem({
        itemName,
        description,
        category: category.toUpperCase(),
        price: Number(price),
        imageFile,
      });

      if (response?.success) {
        showSuccess('Shop item created successfully');
        resetForm();
        fetchItems();
      } else {
        showError(response?.message || 'Failed to create shop item');
      }
    } catch (submitError) {
      showError('Failed to create shop item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='shop-items-management'>
      <div className='shop-items-header'>
        <div>
          <h1>Shop Items Management</h1>
          <p className='shop-items-subtitle'>Create items and review all existing products grouped by category.</p>
        </div>
        <button className='refresh-btn' onClick={fetchItems}>
          ↻ Refresh
        </button>
      </div>

      <div className='shop-items-grid'>
        <div className='shop-items-list-panel'>
          <div className='shop-items-list-scroll'>
            {loading ? (
              <div className='shop-items-status'>Loading shop items...</div>
            ) : error ? (
              <div className='shop-items-status shop-items-error'>{error}</div>
            ) : Object.keys(itemsByCategory).length === 0 ? (
              <div className='shop-items-status'>No shop items available.</div>
            ) : (
              Object.entries(itemsByCategory).map(([categoryKey, categoryItems]) => (
                <section className='shop-items-category-section' key={categoryKey}>
                  <div className='shop-items-category-header'>
                    <div className='shop-items-category-title'>{categoryKey}</div>
                    <span className='shop-items-category-count'>{categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className='shop-items-card-row'>
                    {categoryItems.map((item) => (
                      <article className='shop-item-card-admin' key={item.shopItemId || item.itemId}>
                        <div className='shop-item-image-wrap'>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.itemName} />
                          ) : (
                            <div className='shop-item-image-placeholder'>No Image</div>
                          )}
                        </div>
                        <div className='shop-item-card-body'>
                          <div className='shop-item-card-title-row'>
                            <h3>{item.itemName}</h3>
                            <span className='shop-item-price-tag'>${item.price}</span>
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

        <div className='shop-items-form-panel'>
          <div className='shop-items-form-card'>
            <h2>Create New Shop Item</h2>
            <form className='shop-items-form' onSubmit={handleSubmit}>
              <label>
                Item Name
                <input
                  type='text'
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder='Premium Frame'
                />
              </label>
              <label>
                Price
                <input
                  type='number'
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder='10 Pts'
                  min='0'
                />
              </label>
              <label>
                Category
                <input
                  type='text'
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder='FRAME, PET, .etc'
                />
              </label>
              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='A premium design for those of great wealth!'
                  rows={5}
                />
              </label>
              <label className='file-input-label'>
                Item Image
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                />
              </label>
              {imagePreview && (
                <div className='shop-item-image-preview'>
                  <img src={imagePreview} alt='Preview' />
                </div>
              )}
              <button className='shop-item-submit-btn' type='submit' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Item'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
