'use client';

import Link from 'next/link';
import { FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <FileSearch size={40} style={{ color: 'var(--neon-cyan)' }} />
      </div>
      
      <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        404
      </h1>
      
      <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Page Not Found
      </h2>
      
      <p className="max-w-md mb-8" style={{ color: 'var(--text-muted)' }}>
        The page or invoice you are looking for doesn't exist, has been moved, or you don't have access to view it.
      </p>
      
      <div className="flex gap-4">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="btn-outline"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
