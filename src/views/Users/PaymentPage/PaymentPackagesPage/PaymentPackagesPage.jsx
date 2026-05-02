'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { getPaymentPackages, createPaymentLink } from '@/services/TransactionController';
import './PaymentPackages.css';

export default function PaymentPackagesPage() {
  const router = useRouter();
  const { userAuth } = useAuth();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTransactionAnimation, setShowTransactionAnimation] = useState(false);

  useEffect(() => {
    if (!userAuth) {
      router.push('/login');
      return;
    }

    fetchPackages();
  }, [userAuth, router]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await getPaymentPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    const userID = localStorage.getItem('userID') || sessionStorage.getItem('userID');
    if (!selectedPackage || !userAuth) return;

    setIsProcessing(true);
    setShowTransactionAnimation(true);

    try {
      const paymentLink = await createPaymentLink({
        userId: userID,
        paidPackageId: selectedPackage.id,
        paidPackageName: selectedPackage.packageName,
        paidPackageDescription: selectedPackage.description,
        price: selectedPackage.price,
        returnUrl: 'http://vtuber-fanhub.site/payment/success',
        cancelUrl: 'http://vtuber-fanhub.site/payment/cancel'
      });

      if (paymentLink) {
        setTimeout(() => {
          window.location.href = paymentLink;
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      setShowTransactionAnimation(false);
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedPackage(null);
      alert('Failed to create payment link. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setSelectedPackage(null);
  };

  if (loading) {
    return (
      <div className='payment-packages-page'>
        <div className='packages-loading'>Loading packages...</div>
      </div>
    );
  }

  return (
    <div className='payment-packages-page'>
      <div className='packages-header'>
        <h1>Purchase Points</h1>
        <p>Select a package to buy paid points</p>
      </div>

      {packages.length === 0 ? (
        <div className='packages-empty'>
          <p>No packages available</p>
        </div>
      ) : (
        <div className='packages-grid'>
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`package-card-modern ${index === 1 ? 'featured' : ''}`}
              onClick={() => handlePackageClick(pkg)}
            >
              {index === 1 && (
                <div className='package-badge'>Best Value</div>
              )}

              <div className='package-header'>
                <h3>Package: {pkg.packageName}</h3>
                <p className='package-sub'>
                  {pkg.description || 'Premium package'}
                </p>
              </div>

              <div className='package-price-block'>
                <span className='currency'>&#8363;</span>
                <span className='price'>{pkg.price.toLocaleString()}</span>
              </div>

              <div className='package-points-modern'>
                {pkg.paidPoints} Points
              </div>

              <div className='package-divider-modern' />

              <button className='package-btn-modern'>
                Purchase
              </button>
            </div>
          ))}
        </div>
      )}

      {showConfirmModal && selectedPackage && (
        <div className='payment-modal-overlay' onClick={handleCancel}>
          <div className='payment-modal' onClick={(e) => e.stopPropagation()}>
            <h2 className='modal-title'>Confirm Purchase</h2>
            <div className='modal-content-payment'>
              <p className='modal-message'>
                Spend <span className='modal-highlight'>&#8363;{selectedPackage.price.toLocaleString()}</span> for <span className='modal-highlight'>{selectedPackage.paidPoints}</span> paid points?
              </p>
            </div>
            <div className='modal-buttons'>
              <button
                className='modal-btn modal-cancel-btn'
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className='modal-btn modal-confirm-btn'
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionAnimation && (
        <div className='payment-animation-overlay'>
          <div className='transaction-animation-container'>
            <div className='transaction-left-side'>
              <div className='transaction-card'>
                <div className='transaction-card-line'></div>
                <div className='transaction-buttons'></div>
              </div>
              <div className='transaction-post'>
                <div className='transaction-post-line'></div>
                <div className='transaction-screen'>
                  <div className='transaction-dollar'>$</div>
                </div>
                <div className='transaction-numbers'></div>
                <div className='transaction-numbers-line2'></div>
              </div>
            </div>
            <div className='transaction-right-side'>
              <div className='transaction-new'>New Transaction</div>
              <svg viewBox='0 0 451.846 451.847' height='512' width='512' xmlns='http://www.w3.org/2000/svg' className='transaction-arrow'>
                <path fill='#cfcfcf' data-old_color='#000000' className='active-path' data-original='#000000' d='M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z'></path>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
