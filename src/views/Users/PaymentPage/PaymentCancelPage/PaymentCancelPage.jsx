'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cancelPayment } from '@/services/TransactionController';
import './PaymentCancel.css';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [cancelMessage, setCancelMessage] = useState('Processing cancellation...');

  useEffect(() => {
    const processCancellation = async () => {
      try {
        const orderCode = searchParams.get('orderCode');

        if (!orderCode) {
          setCancelMessage('Invalid cancellation request. Order code not found.');
          setIsProcessing(false);
          return;
        }

        const response = await cancelPayment(orderCode);

        if (response?.success) {
          setCancelMessage('Your payment has been successfully cancelled.');
        } else {
          setCancelMessage(response?.message || 'Failed to cancel payment. Please try again.');
        }
      } catch (error) {
        console.error('Error processing cancellation:', error);
        setCancelMessage('An error occurred while cancelling the payment. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    processCancellation();
  }, [searchParams]);

  return (
    <div className='payment-result-page payment-cancel-page'>
      <div className='result-container'>
        <div className={`result-icon ${isProcessing ? 'processing-icon' : 'cancel-icon'}`}>
          {isProcessing ? <>&#9203;</> : <>&#10005;</>}
        </div>
        <h1 className={`result-title ${isProcessing ? 'processing-title' : 'cancel-title'}`}>
          {isProcessing ? 'Processing Cancellation...' : 'Transaction Cancelled'}
        </h1>
        <p className='result-message'>{cancelMessage}</p>
        {!isProcessing && (
          <button
            className='result-return-btn'
            onClick={() => router.push('/home')}
          >
            &#8592; Return to Home
          </button>
        )}
      </div>
    </div>
  );
}
