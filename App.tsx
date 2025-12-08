// (SILA PADAM DAN GANTI SEMUA KOD DALAM App.tsx)

import { useState, useMemo } from 'react';
import RosterTable from './components/RosterTable';
import DailyRoster from './components/DailyRoster';
import ManageStaffModal from './components/ManageStaffModal';
import StatsModal from './components/StatsModal';
import SwapShiftModal from './components/SwapShiftModal';
import ChangeShiftModal from './components/ChangeShiftModal';
import ApprovalModal from './components/ApprovalModal';
import LeaveRequestModal from './components/LeaveRequestModal';
import PublicHolidaysModal from './components/PublicHolidaysModal';
import RequestCFPHModal from './components/RequestCFPHModal';
import RequestRDOTModal from './components/RequestRDOTModal';
import RequestNoOTModal from './components/RequestNoOTModal';
import UnlockModal from './components/UnlockModal';

// *******************************************************************
// PATH FIX: Import yang betul untuk Roster Generator
// Pastikan nama fail di services/ adalah rosterGenerator.ts
import { generateRoster, calculateDailyStrength } from './services/rosterGenerator';
// *******************************************************************

import { 
  Staff, 
  Rank, 
  StaffRoster, 
  RosterOverride, 
  DailyStrength, 
  ShiftCode, 
  LeaveType, 
  PUBLIC_HOLIDAYS_2026 
} from './types';


// Data Staff Mock-Up (Contoh 8 Staff Penuh)
const MOCK_STAFF_DATA: Staff[] = [
  { id: 1, name: 'SJN MOHD KHAIRUL AZHARRY', rank: Rank.SJN, badgeNo: 34712, baseShift: ShiftCode.S },
  { id: 2, name: 'KPL KALAMUSI A/L MUNANDY', rank: Rank.KPL, badgeNo: 84342, baseShift: ShiftCode.S },
  { id: 3, name: 'KONST AZRI BIN ABU', rank: Rank.KONST, badgeNo: 12345, baseShift: ShiftCode.S },
  { id: 4, name: 'KONST AHMAD ZAKI', rank: Rank.KONST, badgeNo: 67890, baseShift: ShiftCode.S },
  { id: 5, name: 'KPL ZULKIFLI BIN HUSSIN', rank: Rank.KPL, badgeNo: 99112, baseShift: ShiftCode.S },
  { id: 6, name: 'KONST NORLI BINTI HASHIM', rank: Rank.KONST, badgeNo: 10234, baseShift: ShiftCode.S },
  { id: 7, name: 'KONST FAUZI BIN ISMAIL', rank: Rank.KONST, badgeNo: 55678, baseShift: ShiftCode.S },
  { id: 8, name: 'KONST NURUL HIDAYAH', rank: Rank.KONST, badgeNo: 14789, baseShift: ShiftCode.S },
  { id: 9, name: 'NOORAZREENA BINTI ROSLI', rank: Rank.KONST, badgeNo: 14789, baseShift: ShiftCode.S },
];

// Tarikh Semasa (Boleh diubah untuk test bulan lain)
const currentYear = 2026;
const currentMonth = 1; // Januari 2026 (0=Jan, 1=Feb...)

function App() {
  const [currentView, setCurrentView] = useState<'master' | 'daily'>('master');
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF_DATA);
  const [rosterOverrides, setRosterOverrides] = useState<RosterOverride[]>([]);
  const [isLocked, setIsLocked] = useState(true);

  // States untuk Modals
  const [isManageStaffModalOpen, setIsManageStaffModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isChangeShiftModalOpen, setIsChangeShiftModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isPHModalOpen, setIsPHModalOpen] = useState(false);
  const [isCFPHModalOpen, setIsCFPHModalOpen] = useState(false);
  const [isRDOTModalOpen, setIsRDOTModalOpen] = useState(false);
  const [isNoOTModalOpen, setIsNoOTModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Data untuk Modal Swap/Change
  const [swapData, setSwapData] = useState<{ date: Date | null, staff: Staff | null }>({ date: null, staff: null });
  const [changeShiftData, setChangeShiftData] = useState<{ date: Date | null, staff: Staff | null }>({ date: null, staff: null });

  // Panggil generateRoster dan calculateDailyStrength hanya bila staffList atau rosterOverrides berubah
  const rosters = useMemo(() => {
    return generateRoster(currentYear, currentMonth, rosterOverrides, staffList);
  }, [staffList, rosterOverrides]);

  const dailyStrength = useMemo(() => {
    return calculateDailyStrength(rosters);
  }, [rosters]);

  // Handler untuk Buka Modal Swap Shift
  const handleOpenSwapShiftModal = (date: Date, staff: Staff) => {
    setSwapData({ date, staff });
    setIsSwapModalOpen(true);
  };

  // Handler untuk Buka Modal Change Shift
  const handleOpenChangeShiftModal = (date: Date, staff: Staff) => {
    setChangeShiftData({ date, staff });
    setIsChangeShiftModalOpen(true);
  };

  // Handler untuk Apply Swap Shift
  const handleApplySwap = (date: Date, staff1: Staff, staff2: Staff) => {
    const newOverrides: RosterOverride[] = [];
    
    // Cari shift asal untuk staff1 pada tarikh tersebut
    const roster1 = rosters.find(r => r.staff.id === staff1.id);
    const day1 = roster1?.days.find(d => d.date === date.getDate() && d.month === date.getMonth());
    const shift1 = day1?.code || ShiftCode.S;

    // Cari shift asal untuk staff2 pada tarikh tersebut
    const roster2 = rosters.find(r => r.staff.id === staff2.id);
    const day2 = roster2?.days.find(d => d.date === date.getDate() && d.month === date.getMonth());
    const shift2 = day2?.code || ShiftCode.S;

    // Tambah override untuk swap: staff1 dapat shift2, staff2 dapat shift1
    if (day1 && day2) {
      newOverrides.push({
        id: Date.now(),
        staffId: staff1.id,
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        type: 'SHIFT_SWAP',
        shiftCode: shift2, // Staff 1 ambil shift Staff 2
      });
      newOverrides.push({
        id: Date.now() + 1,
        staffId: staff2.id,
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        type: 'SHIFT_SWAP',
        shiftCode: shift1, // Staff 2 ambil shift Staff 1
      });
      setRosterOverrides(prev => [...prev, ...newOverrides]);
    }
    setIsSwapModalOpen(false);
  };
  
  // Handler untuk Apply Change Shift
  const handleApplyChangeShift = (date: Date, staff: Staff, newShift: ShiftCode) => {
    const newOverride: RosterOverride = {
      id: Date.now(),
      staffId: staff.id,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      type: 'SHIFT_CHANGE',
      shiftCode: newShift,
    };
    setRosterOverrides(prev => [...prev, newOverride]);
    setIsChangeShiftModalOpen(false);
  };

  // Handler untuk Apply Leave (Percutian)
  const handleApplyLeave = (staff: Staff, startDate: Date, endDate: Date, leaveType: LeaveType) => {
    const newOverrides: RosterOverride[] = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
      const existingLeave = rosterOverrides.find(o => 
        o.staffId === staff.id &&
        o.year === current.getFullYear() &&
        o.month === current.getMonth() &&
        o.day === current.getDate() &&
        o.type === 'LEAVE'
      );

      if (!existingLeave) {
        newOverrides.push({
          id: Date.now() + newOverrides.length,
          staffId: staff.id,
          year: current.getFullYear(),
          month: current.getMonth(),
          day: current.getDate(),
          type: 'LEAVE',
          leaveType: leaveType,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    setRosterOverrides(prev => [...prev, ...newOverrides]);
    setIsLeaveModalOpen(false);
  };
  
  // Handler untuk Apply CFPH
  const handleApplyCFPH = (staff: Staff, date: Date) => {
    const newOverride: RosterOverride = {
      id: Date.now(),
      staffId: staff.id,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      type: 'CFPH',
    };
    setRosterOverrides(prev => [...prev, newOverride]);
    setIsCFPHModalOpen(false);
  };
  
  // Handler untuk Apply Rest Day OT (RDOT)
  const handleApplyRDOT = (staff: Staff, date: Date) => {
    const newOverride: RosterOverride = {
      id: Date.now(),
      staffId: staff.id,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      type: 'RDOT',
    };
    setRosterOverrides(prev => [...prev, newOverride]);
    setIsRDOTModalOpen(false);
  };
  
  // Handler untuk Apply No OT
  const handleApplyNoOT = (staff: Staff, date: Date) => {
    const newOverride: RosterOverride = {
      id: Date.now(),
      staffId: staff.id,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      type: 'NO_OT',
    };
    setRosterOverrides(prev => [...prev, newOverride]);
    setIsNoOTModalOpen(false);
  };
  
  // Fungsi untuk Reset Roster
  const handleResetRoster = () => {
    if (confirm('Anda pasti mahu reset semua pindaan shift?')) {
      setRosterOverrides([]);
      setIsLocked(true);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-800">SISTEM PENGURUSAN ROSTER</h1>
        <div className="flex space-x-2">
          {/* Main Navigation Buttons */}
          <button
            onClick={() => setCurrentView('master')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${
              currentView === 'master'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            MASTER PLAN (MASTER ACTUAL)
          </button>
          <button
            onClick={() => setCurrentView('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${
              currentView === 'daily'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            DAILY ROSTER
          </button>
        </div>
      </header>

      {/* Main Action Buttons */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={() => setIsStatsModalOpen(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition duration-150 text-sm font-medium"
        >
          📈 Stats & Summary
        </button>
        <button
          onClick={() => setIsManageStaffModalOpen(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition duration-150 text-sm font-medium"
        >
          🧑‍🤝‍🧑 Manage Staff
        </button>
        <button
          onClick={() => setIsSwapModalOpen(true)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600 transition duration-150 text-sm font-medium"
        >
          🔄 Swap Shift
        </button>
        <button
          onClick={() => setIsChangeShiftModalOpen(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition duration-150 text-sm font-medium"
        >
          ✏️ Pinda Shift
        </button>
        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg shadow hover:bg-pink-600 transition duration-150 text-sm font-medium"
        >
          ✈️ Cuti/Leave
        </button>
        <button
          onClick={() => setIsCFPHModalOpen(true)}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg shadow hover:bg-teal-600 transition duration-150 text-sm font-medium"
        >
          ➕ CFPH
        </button>
        <button
          onClick={() => setIsRDOTModalOpen(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition duration-150 text-sm font-medium"
        >
          💰 RDOT
        </button>
        <button
          onClick={() => setIsNoOTModalOpen(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition duration-150 text-sm font-medium"
        >
          🚫 No OT
        </button>
        <button
          onClick={() => setIsUnlockModalOpen(true)}
          className={`px-4 py-2 rounded-lg shadow transition duration-150 text-sm font-medium ${
            isLocked ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-lime-500 text-gray-900 hover:bg-lime-600'
          }`}
        >
          {isLocked ? '🔒 Lock Roster' : '🔓 Unlock Roster'}
        </button>
        <button
          onClick={handleResetRoster}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg shadow hover:bg-gray-500 transition duration-150 text-sm font-medium"
        >
          🗑️ Reset Roster
        </button>
      </div>

      {/* Main Content Area */}
      {currentView === 'master' && (
        <RosterTable
          rosters={rosters}
          year={currentYear}
          month={currentMonth}
          dailyStrength={dailyStrength}
          isLocked={isLocked}
          onOpenSwapShiftModal={handleOpenSwapShiftModal}
          onOpenChangeShiftModal={handleOpenChangeShiftModal}
        />
      )}
      
      {currentView === 'daily' && (
        <DailyRoster 
          rosters={rosters}
          dailyStrength={dailyStrength}
        />
      )}

      {/* Modals */}
      <ManageStaffModal
        isOpen={isManageStaffModalOpen}
        onClose={() => setIsManageStaffModalOpen(false)}
        staffList={staffList}
        setStaffList={setStaffList}
      />
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        rosters={rosters}
      />
      <SwapShiftModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        staffList={staffList}
        rosters={rosters}
        onApplySwap={handleApplySwap}
      />
      <ChangeShiftModal
        isOpen={isChangeShiftModalOpen}
        onClose={() => setIsChangeShiftModalOpen(false)}
        staffList={staffList}
        rosters={rosters}
        onApplyChangeShift={handleApplyChangeShift}
      />
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        staffList={staffList}
        onApplyLeave={handleApplyLeave}
      />
      <RequestCFPHModal
        isOpen={isCFPHModalOpen}
        onClose={() => setIsCFPHModalOpen(false)}
        staffList={staffList}
        rosters={rosters}
        onApplyCFPH={handleApplyCFPH}
      />
      <RequestRDOTModal
        isOpen={isRDOTModalOpen}
        onClose={() => setIsRDOTModalOpen(false)}
        staffList={staffList}
        rosters={rosters}
        onApplyRDOT={handleApplyRDOT}
      />
      <RequestNoOTModal
        isOpen={isNoOTModalOpen}
        onClose={() => setIsNoOTModalOpen(false)}
        staffList={staffList}
        rosters={rosters}
        onApplyNoOT={handleApplyNoOT}
      />
      <PublicHolidaysModal
        isOpen={isPHModalOpen}
        onClose={() => setIsPHModalOpen(false)}
        holidays={PUBLIC_HOLIDAYS_2026}
      />
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlock={() => {
          setIsLocked(false);
          setIsUnlockModalOpen(false);
        }}
        isLocked={isLocked}
      />

    </div>
  );
}

export default App;
