'use client';

import { useRouter } from 'next/navigation';
import './PaymentCancel.css';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className='payment-result-page payment-cancel-page'>
      <div className='result-container'>
        <div className='result-icon cancel-icon'>✕</div>
        <h1 className='result-title cancel-title'>Transaction Cancelled</h1>
        <p className='result-message'>Your payment was not processed. Please try again.</p>
        <button 
          className='result-return-btn'
          onClick={() => router.push('/home')}
        >
          ← Return to Home
        </button>
      </div>
    </div>
  );
}
