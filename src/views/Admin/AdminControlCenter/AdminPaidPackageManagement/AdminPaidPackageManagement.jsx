import { useEffect, useMemo, useState } from 'react';
import { createPaidPackage, getPaymentPackages } from '@/services/TransactionController';
import { showError, showSuccess } from '@/utils/toastUtils';
import './AdminPaidPackageManagement.css';

const VND_FORMATTER = new Intl.NumberFormat('vi-VN');

const getMinimumPoints = (price) => Math.ceil((Number(price) * 5) / 1000);

const normalizeName = (name) => name.trim().toLowerCase();

export default function AdminPaidPackageManagement() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [packageName, setPackageName] = useState('');
  const [price, setPrice] = useState('');
  const [paidPoints, setPaidPoints] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getPaymentPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading paid packages:', error);
      setLoadError('Unable to load paid packages.');
    } finally {
      setLoading(false);
    }
  };

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }, [packages]);

  const packageAddErrors = useMemo(() => {
    const errors = {};
    const trimmedName = packageName.trim();
    const numericPrice = Number(price);
    const numericPaidPoints = Number(paidPoints);

    if (trimmedName) {
      const nameExists = packages.some(pkg => normalizeName(pkg.packageName || '') === normalizeName(trimmedName));
      if (nameExists) {
        errors.packageName = `${trimmedName} package already exists`;
      }
    }

    if (price) {
      const priceExists = packages.some(pkg => Number(pkg.price) === numericPrice);
      if (priceExists) {
        errors.price = `There is already a package with the ${price} price tag`;
      } else if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        errors.price = 'Price must be greater than 0 VND';
      }
    }

    if (paidPoints) {
      if (!Number.isFinite(numericPaidPoints) || numericPaidPoints <= 0) {
        errors.paidPoints = 'Paid points must be greater than 0';
      } else if (Number.isFinite(numericPrice) && numericPrice > 0 && numericPaidPoints < getMinimumPoints(numericPrice)) {
        errors.paidPoints = 'Cannot go lower than 5 Points/1000\u0111';
      }
    }

    return errors;
  }, [packageName, packages, paidPoints, price]);

  const visibleErrors = formTouched ? packageAddErrors : {};

  const resetForm = () => {
    setPackageName('');
    setPrice('');
    setPaidPoints('');
    setDescription('');
    setFormTouched(false);
  };

  const validateRequiredFields = () => {
    const errors = {};
    if (!packageName.trim()) errors.packageName = 'Package name is required';
    if (!price) errors.price = 'Price is required';
    if (!paidPoints) errors.paidPoints = 'Paid points are required';
    if (!description.trim()) errors.description = 'Description is required';
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormTouched(true);

    const requiredErrors = validateRequiredFields();
    const submitErrors = { ...packageAddErrors, ...requiredErrors };
    if (Object.keys(submitErrors).length > 0) {
      showError('Please fix the highlighted package fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createPaidPackage({
        packageName: packageName.trim(),
        price: Number(price),
        paidPoints: Number(paidPoints),
        description: description.trim()
      });

      if (response?.success) {
        showSuccess('Paid package created successfully');
        resetForm();
        fetchPackages();
      } else {
        showError(response?.message || 'Failed to create paid package');
      }
    } catch (error) {
      console.error('Create paid package error:', error);
      showError('An error occurred while creating the paid package');
    } finally {
      setSubmitting(false);
    }
  };

  const minPointsLabel = price && Number(price) > 0
    ? `Minimum: ${getMinimumPoints(price)} points for ${VND_FORMATTER.format(Number(price))} VND`
    : 'Rate rule: at least 5 Points for every 1,000\u0111';

  return (
    <div className='paid-package-management'>
      <div className='paid-package-header'>
        <div>
          <h1>Paid Package Management</h1>
          <p className='paid-package-subtitle'>Review existing paid point packages and create new purchase options.</p>
        </div>
        <button className='ppm-refresh-btn' onClick={fetchPackages} disabled={loading}>
          {loading ? 'Loading...' : '\u21bb Refresh'}
        </button>
      </div>

      <div className='paid-package-window'>
        <section className='paid-package-list-panel'>
          <div className='ppm-panel-title-row'>
            <h2>Current Packages</h2>
            <span>{packages.length} package{packages.length !== 1 ? 's' : ''}</span>
          </div>

          <div className='paid-package-list-scroll'>
            {loading ? (
              <div className='ppm-status'>Loading paid packages...</div>
            ) : loadError ? (
              <div className='ppm-status ppm-error'>{loadError}</div>
            ) : sortedPackages.length === 0 ? (
              <div className='ppm-status'>No paid packages available.</div>
            ) : (
              sortedPackages.map((pkg) => (
                <article className='paid-package-card' key={pkg.id}>
                  <div className='paid-package-card-top'>
                    <div>
                      <div className='paid-package-id'>#{pkg.id}</div>
                      <h3>{pkg.packageName}</h3>
                    </div>
                    <span className='paid-package-points'>{pkg.paidPoints} pts</span>
                  </div>
                  <div className='paid-package-price'>{VND_FORMATTER.format(Number(pkg.price || 0))} VND</div>
                  <p>{pkg.description || 'No description provided.'}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className='paid-package-create-panel'>
          <div className='ppm-panel-title-row'>
            <h2>Create Package</h2>
          </div>

          <form className='paid-package-form' onSubmit={handleSubmit}>
            <label>
              <span>Package Name<p>*</p></span>
              <input
                type='text'
                value={packageName}
                onBlur={() => setFormTouched(true)}
                onChange={(event) => setPackageName(event.target.value)}
                placeholder='e.g., 500 Bonus Points'
              />
              {visibleErrors.packageName && <span className='showPackageAddError'>{visibleErrors.packageName}</span>}
            </label>

            <label>
              <span>Price (VND)<p>*</p></span>
              <input
                type='number'
                value={price}
                onBlur={() => setFormTouched(true)}
                onChange={(event) => setPrice(event.target.value)}
                placeholder='Enter price in VND, e.g., 10000'
              />
              {visibleErrors.price && <span className='showPackageAddError'>{visibleErrors.price}</span>}
            </label>

            <label>
              <span>Paid Points<p>*</p></span>
              <input
                type='number'
                value={paidPoints}
                onBlur={() => setFormTouched(true)}
                onChange={(event) => setPaidPoints(event.target.value)}
                placeholder={'At least 5 points per 1,000\u0111'}
                min='1'
              />
              <span className='ppm-field-hint'>{minPointsLabel}</span>
              {visibleErrors.paidPoints && <span className='showPackageAddError'>{visibleErrors.paidPoints}</span>}
            </label>

            <label>
              <span>Description<p>*</p></span>
              <textarea
                value={description}
                onBlur={() => setFormTouched(true)}
                onChange={(event) => setDescription(event.target.value)}
                placeholder='Describe why this package is worth buying.'
                rows={5}
              />
              {formTouched && !description.trim() && <span className='showPackageAddError'>Description is required</span>}
            </label>

            <div className='paid-package-preview'>
              <div className='ppm-preview-label'>Preview</div>
              <div className='ppm-preview-name'>{packageName.trim() || 'New paid package'}</div>
              <div className='ppm-preview-price'>{price ? VND_FORMATTER.format(Number(price)) : '0'} VND</div>
              <div className='ppm-preview-points'>{paidPoints || '0'} Points</div>
            </div>

            <div className='paid-package-actions'>
              <button type='button' className='ppm-cancel-btn' onClick={resetForm} disabled={submitting}>
                Clear
              </button>
              <button type='submit' className='ppm-create-btn' disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
