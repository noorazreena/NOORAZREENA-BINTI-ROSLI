import React, { useState } from 'react';
import { Calendar, Layout, FileText, Activity, Users, BarChart2, RefreshCcw, Briefcase, PlusCircle, AlertTriangle } from 'lucide-react';

// --- IMPORT SEMUA KOMPONEN CANGGIH KAU ---
import { RosterTable } from './components/RosterTable'; 
import { DailyRoster } from './components/DailyRoster'; 
import { ChangeShiftModal } from './components/ChangeShiftModal'; 
import { StatsModal } from './components/StatsModal';
import { SwapShiftModal } from './components/SwapShiftModal';
import { RequestCFPHModal } from './components/RequestCFPHModal';
import { RequestNoOTModal } from './components/RequestNoOTModal';
import { RequestRDOTModal } from './components/RequestRDOTModal';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { ManageStaffModal } from './components/ManageStaffModal';
import { PublicHolidaysModal } from './components/PublicHolidaysModal';

import { StaffRoster, DailyDutyDetails, Staff, ShiftCode, Rank } from './types'; 

// --- SENARAI 8 STAFF (DATA ASAL KAU) ---
const INITIAL_STAFF: Staff[] = [
  { id: '1', bodyNumber: '74722', rank: Rank.SJN, name: 'MOHD KHAIRUL AZWANDY', walkieTalkie: 'N01', vehicle: 'WXC 1234' },
  { id: '2', bodyNumber: '94340', rank: Rank.KPL, name: 'KALAIARASU A/L MUNIANDY', walkieTalkie: 'N02', vehicle: 'WXC 2345' },
  { id: '3', bodyNumber: '12345', rank: Rank.KONST, name: 'ALI BIN ABU', walkieTalkie: 'N03', vehicle: 'MPV 1' },
  { id: '4', bodyNumber: '67890', rank: Rank.KONST, name: 'AHMAD ZAKI', walkieTalkie: 'N04', vehicle: 'MPV 2' },
  { id: '5', bodyNumber: '11111', rank: Rank.KONST, name: 'SITI AMINAH', walkieTalkie: 'N05', vehicle: 'MPV 3' },
  { id: '6', bodyNumber: '22222', rank: Rank.KONST, name: 'RAHMAT BIN SAID', walkieTalkie: 'N06', vehicle: 'WXC 8888' },
  { id: '7', bodyNumber: '33333', rank: Rank.KONST, name: 'NOORAZREENA BINTI ROSLI', walkieTalkie: 'N07', vehicle: 'WXC 9999' },
  { id: '8', bodyNumber: '44444', rank: Rank.KONST, name: 'MUHAMMAD HAFIZ', walkieTalkie: 'N08', vehicle: 'MPV 4' },
];

const generateSampleRoster = (staffList: Staff[]): StaffRoster[] => {
  return staffList.map(staff => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      let code = ShiftCode.S;
      if (i % 6 === 0 || i % 6 === 5) code = ShiftCode.O;
      else if (i % 6 === 3 || i % 6 === 4) code = ShiftCode.M;
      
      days.push({
        date: i,
        month: 11, // Disember
        year: 2025,
        dayOfWeek: new Date(2025, 11, i).getDay(),
        code: code,
        originalCode: code,
        isRestDayOT: false,
        otHours: 0,
        mealAllowance: 10
      });
    }
    return {
      staff: staff,
      days: days,
      summary: { workdays: 22, restdays: 8, publicHolidays: 1, leave: 0, otHours: 0, meals: 220, rdot: 0, cfph: 0 },
      conflicts: []
    };
  });
};

const SAMPLE_STRENGTH = Array.from({ length: 31 }, (_, i) => ({
  date: `2025-12-${i + 1}`,
  shiftSiang: 4,
  shiftMalam: 3,
  off: 1
}));

export default function App() {
  const [viewMode, setViewMode] = useState<'PLAN' | 'ACTUAL' | 'DAILY'>('PLAN');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 11, 1)); 
  
  // STATE DATA UTAMA
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [rosterData, setRosterData] = useState<StaffRoster[]>(generateSampleRoster(INITIAL_STAFF));
  const [dailyDetails, setDailyDetails] = useState<DailyDutyDetails | null>(null);

  // STATE UNTUK SEMUA MODAL (Sistem Canggih Kau)
  const [isChangeShiftOpen, setChangeShiftOpen] = useState(false);
  const [isStatsOpen, setStatsOpen] = useState(false);
  const [isSwapOpen, setSwapOpen] = useState(false);
  const [isCFPHOpen, setCFPHOpen] = useState(false);
  const [isNoOTOpen, setNoOTOpen] = useState(false);
  const [isRDOTOpen, setRDOTOpen] = useState(false);
  const [isLeaveOpen, setLeaveOpen] = useState(false);
  const [isManageStaffOpen, setManageStaffOpen] = useState(false);
  const [isPublicHolidaysOpen, setPublicHolidaysOpen] = useState(false);

  const [selectedCell, setSelectedCell] = useState<{staffId: string, date: string} | null>(null);

  // --- LOGIC HANDLERS ---

  // 1. Handle Klik Kotak Jadual (Direct Edit)
  const handleCellClick = (staffId: string, dayDate: number, currentCode: ShiftCode) => {
    const dateStr = `2025-12-${dayDate.toString().padStart(2, '0')}`;
    setSelectedCell({ staffId, date: dateStr });
    setChangeShiftOpen(true);
  };

  // 2. Update Shift (Manual Change)
  const handleShiftChange = (staffId: string, dateStr: string, newCode: ShiftCode) => {
    const dayNum = parseInt(dateStr.split('-')[2]);
    const updated = rosterData.map(p => {
        if (p.staff.id !== staffId) return p;
        const newDays = p.days.map(d => d.date === dayNum ? { ...d, code: newCode, originalCode: newCode } : d);
        return { ...p, days: newDays };
    });
    setRosterData(updated);
    setChangeShiftOpen(false);
  };

  // 3. Update Staff List (Manage Staff Modal)
  const handleStaffUpdate = (newStaffList: Staff[]) => {
    setStaffList(newStaffList);
    // Regenerate roster structure for new staff (keep existing data if possible, but for now reset to sample)
    setRosterData(generateSampleRoster(newStaffList)); 
    setManageStaffOpen(false);
  };

  // 4. Dummy Handlers untuk Modal Lain (Sebab logik sebenar kompleks, kita buat basic update)
  const handleSwapSubmit = (staffA: string, staffB: string, date: string) => {
      alert(`Swap request submitted for Staff ${staffA} and ${staffB} on ${date}`);
      setSwapOpen(false);
  };

  const handleCFPHSubmit = (staffId: string, date: string) => {
      alert(`CFPH request submitted for Staff ${staffId} on ${date}`);
      setCFPHOpen(false);
  };

  const handleNoOTSubmit = (staffId: string, date: string) => {
      alert(`No OT request submitted for Staff ${staffId} on ${date}`);
      setNoOTOpen(false);
  };

  const handleLeaveSubmit = (staffId: string, type: ShiftCode, start: string, end: string) => {
      alert(`Leave (${type}) request submitted for Staff ${staffId} from ${start} to ${end}`);
      setLeaveOpen(false);
  };

  // --- RENDER ---
  const renderContent = () => {
    switch (viewMode) {
      case 'PLAN':
      case 'ACTUAL':
        return (
          <div className="animate-fade-in p-4">
            {/* ACTION BAR: Butang-butang Menu Canggih */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-gray-500 uppercase mr-2">Quick Actions:</span>
                
                <button onClick={() => setStatsOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded hover:bg-indigo-100 transition-colors">
                    <BarChart2 className="w-3.5 h-3.5" /> Stats & Fairness
                </button>
                
                <button onClick={() => setManageStaffOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded hover:bg-blue-100 transition-colors">
                    <Users className="w-3.5 h-3.5" /> Manage Staff
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                <button onClick={() => setSwapOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded hover:bg-purple-100 transition-colors">
                    <RefreshCcw className="w-3.5 h-3.5" /> Swap Shift
                </button>

                <button onClick={() => setLeaveOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded hover:bg-red-100 transition-colors">
                    <Briefcase className="w-3.5 h-3.5" /> Request Leave
                </button>

                <button onClick={() => setCFPHOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded hover:bg-green-100 transition-colors">
                    <PlusCircle className="w-3.5 h-3.5" /> Request CFPH
                </button>

                <button onClick={() => setPublicHolidaysOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded hover:bg-yellow-100 transition-colors ml-auto">
                    <Calendar className="w-3.5 h-3.5" /> Public Holidays
                </button>
            </div>

            {/* JADUAL UTAMA */}
            <div className={`border-l-4 p-4 mb-4 rounded shadow-sm ${viewMode === 'PLAN' ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
              <h2 className={`font-bold flex items-center gap-2 text-lg ${viewMode === 'PLAN' ? 'text-blue-900' : 'text-green-900'}`}>
                {viewMode === 'PLAN' ? <Calendar className="w-5 h-5" /> : <Activity className="w-5 h-5" />} 
                {viewMode === 'PLAN' ? 'MASTER ROSTER PLAN' : 'MASTER ACTUAL'} (DISEMBER 2025)
              </h2>
              <p className={`text-sm ${viewMode === 'PLAN' ? 'text-blue-700' : 'text-green-700'}`}>
                 Klik pada kotak untuk edit shift. Gunakan menu di atas untuk fungsi advanced.
              </p>
            </div>
            
            <RosterTable 
              rosterData={rosterData}
              dailyStrength={SAMPLE_STRENGTH}
              viewMode={viewMode}
              onCellClick={handleCellClick}
            />
          </div>
        );

      case 'DAILY':
        return (
          <div className="animate-fade-in p-4 flex flex-col items-center">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded shadow-sm w-full max-w-[210mm]">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="font-bold text-purple-900 flex items-center gap-2 text-lg">
                        <FileText className="w-5 h-5" /> JADUAL HARIAN (DAILY ROSTER)
                    </h2>
                    <p className="text-sm text-purple-700">Paparan detail tugasan harian untuk dicetak.</p>
                </div>
                <input 
                    type="date" 
                    className="border p-2 rounded shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
            </div>
            
            <DailyRoster 
              date={selectedDate}
              rosterData={rosterData}
              details={dailyDetails}
              onDetailsUpdate={(newDetails) => setDailyDetails(newDetails)}
              staffList={staffList} // Pass full staff list
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      {/* HEADER NAV */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                📅 SISTEM PENGURUSAN ROSTER
            </h1>
            <div className="flex rounded-lg shadow-sm bg-gray-100 p-1 overflow-hidden border border-gray-200">
                <button onClick={() => setViewMode('PLAN')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-md transition-all ${viewMode === 'PLAN' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><Calendar className="w-4 h-4" /> PLAN</button>
                <button onClick={() => setViewMode('ACTUAL')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-md transition-all ${viewMode === 'ACTUAL' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><Activity className="w-4 h-4" /> ACTUAL</button>
                <button onClick={() => setViewMode('DAILY')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-md transition-all ${viewMode === 'DAILY' ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><FileText className="w-4 h-4" /> DAILY</button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
         {renderContent()}
      </div>

      {/* --- SEMUA MODALS KAU ADA SINI --- */}
      {/* 1. Change Shift (Bila klik jadual) */}
      {isChangeShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <ChangeShiftModal 
                    isOpen={isChangeShiftOpen}
                    onClose={() => setChangeShiftOpen(false)}
                    onSubmit={handleShiftChange}
                    staffList={staffList}
                />
            </div>
        </div>
      )}

      {/* 2. Stats Modal */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setStatsOpen(false)} rosterData={rosterData} />

      {/* 3. Manage Staff Modal */}
      <ManageStaffModal isOpen={isManageStaffOpen} onClose={() => setManageStaffOpen(false)} staffList={staffList} onUpdate={handleStaffUpdate} />

      {/* 4. Swap Shift Modal */}
      <SwapShiftModal isOpen={isSwapOpen} onClose={() => setSwapOpen(false)} onSubmit={handleSwapSubmit} staffList={staffList} />

      {/* 5. CFPH Modal */}
      <RequestCFPHModal isOpen={isCFPHOpen} onClose={() => setCFPHOpen(false)} onSubmit={handleCFPHSubmit} staffList={staffList} />

      {/* 6. Leave Modal */}
      <LeaveRequestModal isOpen={isLeaveOpen} onClose={() => setLeaveOpen(false)} onSubmit={handleLeaveSubmit} staffList={staffList} />

      {/* 7. Public Holidays */}
      <PublicHolidaysModal isOpen={isPublicHolidaysOpen} onClose={() => setPublicHolidaysOpen(false)} />

      {/* 8. No OT & RDOT (Boleh tambah butang kalau perlu, modal dah standby) */}
      <RequestNoOTModal isOpen={isNoOTOpen} onClose={() => setNoOTOpen(false)} onSubmit={handleNoOTSubmit} staffList={staffList} />
      <RequestRDOTModal isOpen={isRDOTOpen} onClose={() => setRDOTOpen(false)} staffList={staffList} />

    </div>
  );
}
