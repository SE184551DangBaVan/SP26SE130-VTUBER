'use client';

import { useRouter } from 'next/navigation';
import './PaymentSuccess.css';

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <div className='payment-result-page payment-success-page'>
      <div className='result-container'>
        <div className='result-icon success-icon'>✓</div>
        <h1 className='result-title success-title'>Transaction Successful</h1>
        <p className='result-message'>Your points have been added to your account.</p>
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
