'use client';

import dynamic from 'next/dynamic';

const ScannerComponent = dynamic(
  () => import('./scanner-content'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-screen text-white">Loading...</div> }
);

export default function ScannerWrapper() {
  return <ScannerComponent />;
}