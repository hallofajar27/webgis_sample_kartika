"use client";

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./components/MapClient'), { ssr: false });

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-green-800 text-white px-6 py-3 shadow-md flex items-center gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold leading-tight">
            WebGIS Survei Kualitas Sayuran &amp; Sungai
          </h1>
          <p className="text-green-200 text-xs">
            Kecamatan Sumowono, Kabupaten Semarang — Hasil Pengukuran Logam Berat (Pb &amp; Cd)
          </p>
        </div>
      </header>

      <main className="flex-1 relative">
        <MapClient />
      </main>
    </div>
  );
}
