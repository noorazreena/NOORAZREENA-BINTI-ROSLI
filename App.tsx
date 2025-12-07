import React, { useState, useMemo } from 'react';
import { RosterTable } from './components/RosterTable'; // Pastikan path betul
import { DailyRoster } from './components/DailyRoster'; // Pastikan path betul
import { StaffRoster, DailyDutyDetails, Staff } from './types'; // Pastikan path betul
import { Calendar, Layout, FileText, Activity } from 'lucide-react';

// --- CONTOH DATA DUMMY (Supaya tak error bila run) ---
// Nanti kau ganti dengan data sebenar dari database/state kau
const SAMPLE_STAFF: Staff[] = [
  { id: '1', bodyNumber: '12345', rank: 'SJN', name: 'MOHD KHAIRUL', walkieTalkie: 'W1', vehicle: 'MPV1' },
  { id: '2', bodyNumber: '67890', rank: 'KPL', name: 'KALAIARASU', walkieTalkie: 'W2', vehicle: 'MPV2' },
  // ... tambah lagi staff
];

const SAMPLE_ROSTER: StaffRoster[] = [
    // Struktur data roster kau kena masuk sini
]; 

const SAMPLE_STRENGTH = [
    { date: '2025-12-08', shiftSiang: 4, shiftMalam: 3, off: 2 }
]; 
// -----------------------------------------------------

export default function App() {
  // 1. STATE UNTUK CONTROL VIEW
  const [viewMode, setViewMode] = useState<'PLAN' | 'ACTUAL' | 'DAILY'>('PLAN');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State untuk data (Boleh link dengan database kemudian)
  const [rosterData, setRosterData] = useState<StaffRoster[]>(SAMPLE_ROSTER); // Guna data sebenar
  const [dailyDetails, setDailyDetails] = useState<DailyDutyDetails | null>(null);

  // Function tukar tab
  const renderContent = () => {
    switch (viewMode) {
      case 'PLAN':
        return (
          <div className="animate-fade-in">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <h2 className="font-bold text-blue-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> MASTER ROSTER PLAN
              </h2>
              <p className="text-sm text-blue-700">Paparan perancangan jadual asal.</p>
            </div>
            {/* Panggil komponen RosterTable untuk PLAN */}
            <RosterTable 
              rosterData={rosterData}
              dailyStrength={SAMPLE_STRENGTH} // Masukkan data strength sebenar
              viewMode="PLAN" 
            />
          </div>
        );

      case 'ACTUAL':
        return (
          <div className="animate-fade-in">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <h2 className="font-bold text-green-900 flex items-center gap-2">
                <Activity className="w-5 h-5" /> MASTER ACTUAL (REKOD SEBENAR)
              </h2>
              <p className="text-sm text-green-700">Paparan kehadiran sebenar, OT, dan perubahan shift.</p>
            </div>
            {/* Panggil komponen RosterTable untuk ACTUAL */}
            <RosterTable 
              rosterData={rosterData}
              dailyStrength={SAMPLE_STRENGTH}
              viewMode="ACTUAL" 
            />
          </div>
        );

      case 'DAILY':
        return (
          <div className="animate-fade-in">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 no-print">
              <div className="flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-purple-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" /> JADUAL HARIAN (DAILY ROSTER)
                    </h2>
                    <p className="text-sm text-purple-700">Paparan detail tugasan harian untuk dicetak.</p>
                </div>
                {/* Date Picker untuk Daily Roster */}
                <input 
                    type="date" 
                    className="border p-2 rounded"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
            </div>
            
            {/* Panggil komponen DailyRoster */}
            <DailyRoster 
              date={selectedDate}
              rosterData={rosterData}
              details={dailyDetails}
              onDetailsUpdate={(newDetails) => setDailyDetails(newDetails)}
              staffList={SAMPLE_STAFF} // Penting! Kau dah tambah prop ini dalam DailyRoster.tsx
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      {/* HEADER / NAVIGATION BAR */}
      <div className="max-w-[220mm] mx-auto mb-6 no-print">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">SISTEM PENGURUSAN ROSTER</h1>
        
        <div className="flex rounded-lg shadow-sm bg-white overflow-hidden border border-gray-200">
          <button 
            onClick={() => setViewMode('PLAN')}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'PLAN' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
          >
            <Calendar className="w-4 h-4" /> MASTER PLAN
          </button>
          
          <button 
            onClick={() => setViewMode('ACTUAL')}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'ACTUAL' ? 'bg-green-600 text-white' : 'hover:bg-gray-50'}`}
          >
            <Activity className="w-4 h-4" /> MASTER ACTUAL
          </button>
          
          <button 
            onClick={() => setViewMode('DAILY')}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'DAILY' ? 'bg-purple-600 text-white' : 'hover:bg-gray-50'}`}
          >
            <FileText className="w-4 h-4" /> DAILY ROSTER
          </button>
        </div>
      </div>

      {/* RUANG UTAMA (JADUAL AKAN KELUAR SINI) */}
      <div className="max-w-full overflow-x-auto">
         {renderContent()}
      </div>
    </div>
  );
}
