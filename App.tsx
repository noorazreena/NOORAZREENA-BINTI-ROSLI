import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, UserMinus, Clock, Ban, ArrowRightCircle, FileText, LayoutGrid, CheckCircle, ChevronLeft, ChevronRight, Download, BarChart2, Trash2, RefreshCcw, Edit3, Lock, Unlock, ShieldCheck, Users, CalendarDays } from 'lucide-react';

// IMPORT YANG DIBETULKAN (Mesti pakai {})
import { RosterTable } from './components/RosterTable';
import { DailyRoster } from './components/DailyRoster';
import { generateRoster, calculateDailyStrength } from './services/rosterGenerator'; 

import { MONTH_NAMES, SHIFT_COLORS, STAFF_LIST as DEFAULT_STAFF_LIST } from './constants';
import { ShiftCode, RosterOverride, DailyDutyDetails, ApprovalRecord, Staff, Rank } from './types'; 
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { RequestRDOTModal } from './components/RequestRDOTModal';
import { RequestNoOTModal } from './components/RequestNoOTModal';
import { RequestCFPHModal } from './components/RequestCFPHModal';
import { SwapShiftModal } from './components/SwapShiftModal';
import { ChangeShiftModal } from './components/ChangeShiftModal';
import { StatsModal } from './components/StatsModal';
import { ApprovalModal } from './components/ApprovalModal';
import { UnlockModal } from './components/UnlockModal';
import { ManageStaffModal } from './components/ManageStaffModal';
import { PublicHolidaysModal } from './components/PublicHolidaysModal';

function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<'PLAN' | 'ACTUAL' | 'DAILY'>('PLAN');
  const [selectedDailyDate, setSelectedDailyDate] = useState<Date>(today);
  const [overrides, setOverrides] = useState<RosterOverride[]>([]);
  const [dailyDutyLogs, setDailyDutyLogs] = useState<Record<string, DailyDutyDetails>>({});
  const [masterApproval, setMasterApproval] = useState<ApprovalRecord | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>(DEFAULT_STAFF_LIST);

  // States untuk Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isRDOTModalOpen, setIsRDOTModalOpen] = useState(false);
  const [isNoOTModalOpen, setIsNoOTModalOpen] = useState(false);
  const [isCFPHModalOpen, setIsCFPHModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isChangeShiftModalOpen, setIsChangeShiftModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isManageStaffModalOpen, setIsManageStaffModalOpen] = useState(false);
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);

  // LOGIC ROSTER
  let rosterGenerationYear = currentYear;
  let rosterGenerationMonth = currentMonth;

  if (viewMode === 'DAILY') {
    const d = selectedDailyDate.getDate();
    const m = selectedDailyDate.getMonth();
    const y = selectedDailyDate.getFullYear();
    if (d >= 26) {
      if (m === 11) { rosterGenerationMonth = 0; rosterGenerationYear = y + 1; } 
      else { rosterGenerationMonth = m + 1; rosterGenerationYear = y; }
    } else {
      rosterGenerationMonth = m; rosterGenerationYear = y;
    }
  }

  const basePlan = useMemo(() => generateRoster(rosterGenerationYear, rosterGenerationMonth, [], staffList), [rosterGenerationYear, rosterGenerationMonth, staffList]);
  
  const rosterData = useMemo(() => {
    const activeOverrides = viewMode === 'PLAN' ? overrides.filter(o => o.category === 'PLANNED' || !o.category) : overrides;
    return generateRoster(rosterGenerationYear, rosterGenerationMonth, activeOverrides, staffList);
  }, [rosterGenerationYear, rosterGenerationMonth, overrides, viewMode, staffList]);
  
  const dailyStrength = useMemo(() => calculateDailyStrength(rosterData), [rosterData]);

  // Handlers
  const handlePrint = () => window.print();
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else { setCurrentMonth(m => m + 1); } };
  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else { setCurrentMonth(m => m - 1); } };
  const getPeriodString = () => {
    const y = genYear; const m = genMonth;
    const prevDate = new Date(y, m - 1, 26); const currDate = new Date(y, m, 25);
    return `26 ${MONTH_NAMES[prevDate.getMonth()]} - 25 ${MONTH_NAMES[currDate.getMonth()]} ${currDate.getFullYear()}`;
  };

  const handleApproveMaster = (name: string, rank: string) => setMasterApproval({ approverName: name, approverRank: rank, date: new Date().toLocaleDateString(), isApproved: true });
  const handleUnlockMaster = () => setMasterApproval(null);
  
  // Dummy handlers for modals (replace with actual logic if needed)
  const handleNoOTSubmit = () => setIsNoOTModalOpen(false);
  const handleCFPHSubmit = () => setIsCFPHModalOpen(false);
  const handleLeaveSubmit = () => setIsLeaveModalOpen(false);
  const handleSwapSubmit = () => setIsSwapModalOpen(false);
  const handleChangeShiftSubmit = () => setIsChangeShiftModalOpen(false);
  const handleStaffUpdate = (newStaff: Staff[]) => { setStaffList(newStaff); setIsManageStaffModalOpen(false); };
  
  const handleDailyDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { const d = new Date(e.target.value); if(!isNaN(d.getTime())) setSelectedDailyDate(d); };
  const handlePrevDay = () => { const d = new Date(selectedDailyDate); d.setDate(d.getDate()-1); setSelectedDailyDate(d); };
  const handleNextDay = () => { const d = new Date(selectedDailyDate); d.setDate(d.getDate()+1); setSelectedDailyDate(d); };
  const handleDailyDetailsUpdate = (d: DailyDutyDetails) => setDailyDutyLogs(p => ({...p, [selectedDailyDate.toISOString().split('T')[0]]: d}));
  const currentDailyDetails = dailyDutyLogs[selectedDailyDate.toISOString().split('T')[0]] || null;

  const handleReset = () => { if(window.confirm("Reset All Data?")) { localStorage.clear(); window.location.reload(); }};

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-gray-100">
      {viewMode !== 'DAILY' && (
      <div className="bg-white p-6 shadow-md mb-6 border-t-8 border-blue-900 relative">
        <div className="flex justify-between items-center mb-4">
           <div>
              <h1 className="text-2xl font-bold">POLIS BANTUAN ECOWORLD</h1>
              <p className="text-sm text-gray-500">{getPeriodString()}</p>
           </div>
           {masterApproval?.isApproved && <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-bold">APPROVED</div>}
        </div>

        <div className="no-print flex gap-2 mb-4 flex-wrap">
           <button onClick={prevMonth} className="px-2 py-1 bg-gray-200 rounded">&lt;</button>
           <span className="font-bold px-2 py-1">{MONTH_NAMES[currentMonth]} {currentYear}</span>
           <button onClick={nextMonth} className="px-2 py-1 bg-gray-200 rounded">&gt;</button>
           
           <div className="w-px h-6 bg-gray-300 mx-2"></div>
           <button onClick={() => setIsManageStaffModalOpen(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Manage Staff</button>
           <button onClick={() => setIsSwapModalOpen(true)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Swap Shift</button>
           <button onClick={() => setIsApprovalModalOpen(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
        </div>
      </div>
      )}

      {/* VIEW SWITCHER */}
      <div className="no-print bg-gray-800 text-white p-3 rounded-lg mb-6 flex justify-between items-center">
         <div className="flex gap-2">
            <button onClick={() => setViewMode('PLAN')} className={`px-3 py-1 rounded ${viewMode==='PLAN'?'bg-blue-600':''}`}>Plan</button>
            <button onClick={() => setViewMode('ACTUAL')} className={`px-3 py-1 rounded ${viewMode==='ACTUAL'?'bg-green-600':''}`}>Actual</button>
            <button onClick={() => setViewMode('DAILY')} className={`px-3 py-1 rounded ${viewMode==='DAILY'?'bg-indigo-600':''}`}>Daily</button>
         </div>
         {viewMode === 'DAILY' && (
            <div className="flex items-center gap-2">
               <button onClick={handlePrevDay}>&lt;</button>
               <input type="date" className="text-black px-2 rounded" value={selectedDailyDate.toISOString().split('T')[0]} onChange={handleDailyDateChange} />
               <button onClick={handleNextDay}>&gt;</button>
            </div>
         )}
      </div>

      {viewMode !== 'DAILY' ? (
         <RosterTable rosterData={rosterData} dailyStrength={dailyStrength} viewMode={viewMode} />
      ) : (
         <DailyRoster date={selectedDailyDate} rosterData={rosterData} details={currentDailyDetails} onDetailsUpdate={handleDailyDetailsUpdate} staffList={staffList} />
      )}

      {/* MODALS */}
      <ManageStaffModal isOpen={isManageStaffModalOpen} onClose={() => setIsManageStaffModalOpen(false)} staffList={staffList} onUpdate={handleStaffUpdate} />
      <SwapShiftModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} onSubmit={handleSwapSubmit} staffList={staffList} />
      <ApprovalModal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} onSubmit={handleApproveMaster} title="Approve Master" />
      
      {/* Other modals placeholder (untuk elak error import) */}
      <LeaveRequestModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} onSubmit={handleLeaveSubmit} staffList={staffList} />
      <RequestRDOTModal isOpen={isRDOTModalOpen} onClose={() => setIsRDOTModalOpen(false)} staffList={staffList} />
      <RequestNoOTModal isOpen={isNoOTModalOpen} onClose={() => setIsNoOTModalOpen(false)} onSubmit={handleNoOTSubmit} staffList={staffList} />
      <RequestCFPHModal isOpen={isCFPHModalOpen} onClose={() => setIsCFPHModalOpen(false)} onSubmit={handleCFPHSubmit} staffList={staffList} />
      <ChangeShiftModal isOpen={isChangeShiftModalOpen} onClose={() => setIsChangeShiftModalOpen(false)} onSubmit={handleChangeShiftSubmit} staffList={staffList} />
      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} rosterData={rosterData} />
      <UnlockModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} onSubmit={handleUnlockMaster} />
      <PublicHolidaysModal isOpen={isHolidaysModalOpen} onClose={() => setIsHolidaysModalOpen(false)} />
    </div>
  );
}

export default App;
