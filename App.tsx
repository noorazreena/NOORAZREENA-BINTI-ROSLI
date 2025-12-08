import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, UserMinus, Clock, Ban, ArrowRightCircle, FileText, LayoutGrid, CheckCircle, ChevronLeft, ChevronRight, Download, BarChart2, Trash2, RefreshCcw, Edit3, Lock, Unlock, ShieldCheck, Users, CalendarDays } from 'lucide-react';

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

  // States
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

  // Persistence
  useEffect(() => {
    const savedOverrides = localStorage.getItem('rosterOverrides');
    if (savedOverrides) setOverrides(JSON.parse(savedOverrides));
    
    const savedLogs = localStorage.getItem('dailyDutyLogs');
    if (savedLogs) setDailyDutyLogs(JSON.parse(savedLogs));

    const savedStaff = localStorage.getItem('staffList');
    if (savedStaff) setStaffList(JSON.parse(savedStaff));
  }, []);

  useEffect(() => {
    localStorage.setItem('rosterOverrides', JSON.stringify(overrides));
    localStorage.setItem('dailyDutyLogs', JSON.stringify(dailyDutyLogs));
    localStorage.setItem('staffList', JSON.stringify(staffList));
  }, [overrides, dailyDutyLogs, staffList]);

  // Logic
  let genYear = currentYear;
  let genMonth = currentMonth;
  if (viewMode === 'DAILY') {
    const d = selectedDailyDate.getDate();
    const m = selectedDailyDate.getMonth();
    const y = selectedDailyDate.getFullYear();
    if (d >= 26) {
       if (m === 11) { genMonth = 0; genYear = y + 1; } else { genMonth = m + 1; genYear = y; }
    } else { genMonth = m; genYear = y; }
  }

  const rosterData = useMemo(() => {
    const activeOverrides = viewMode === 'PLAN' ? overrides.filter(o => o.category === 'PLANNED' || !o.category) : overrides;
    return generateRoster(genYear, genMonth, activeOverrides, staffList);
  }, [genYear, genMonth, overrides, viewMode, staffList]);
  
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

  // Modals Handlers
  const handleApproveMaster = (name: string, rank: string) => setMasterApproval({ approverName: name, approverRank: rank, date: new Date().toLocaleDateString(), isApproved: true });
  const handleUnlockMaster = () => setMasterApproval(null);
  const handleNoOTSubmit = (sid: string, d: string) => { const date=new Date(d); setOverrides(p=>[...p, {staffId:sid, year:date.getFullYear(), month:date.getMonth(), day:date.getDate(), type:'NO_OT', category: viewMode==='ACTUAL'?'UNPLANNED':'PLANNED'}]); setIsNoOTModalOpen(false); };
  const handleCFPHSubmit = (sid: string, d: string) => { const date=new Date(d); setOverrides(p=>[...p, {staffId:sid, year:date.getFullYear(), month:date.getMonth(), day:date.getDate(), type:'LEAVE', leaveType: ShiftCode.CFPH, category:'PLANNED'}]); setIsCFPHModalOpen(false); };
  const handleLeaveSubmit = (sid: string, type: ShiftCode, start: string, end: string) => {
     const s = new Date(start); const e = new Date(end);
     const newO: RosterOverride[] = [];
     for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)) {
        newO.push({staffId:sid, year:d.getFullYear(), month:d.getMonth(), day:d.getDate(), type:'LEAVE', leaveType:type, category: viewMode==='ACTUAL'?'UNPLANNED':'PLANNED'});
     }
     setOverrides(p=>[...p, ...newO]); setIsLeaveModalOpen(false);
  };
  const handleSwapSubmit = (sidA: string, sidB: string, d: string) => { alert("Swap Logic Placeholder"); setIsSwapModalOpen(false); };
  const handleChangeShiftSubmit = (sid: string, d: any, code: ShiftCode) => { 
      let dateObj;
      if (typeof d === 'string') {
        // Jika d adalah string "YYYY-MM-DD"
        dateObj = new Date(d);
      } else if (typeof d === 'number') {
        // Jika d adalah nombor hari (1-31), kita guna genYear/genMonth
        dateObj = new Date(genYear, genMonth, d);
      } else {
        return; 
      }
      
      setOverrides(p=>[...p, {
          staffId:sid, 
          year:dateObj.getFullYear(), 
          month:dateObj.getMonth(), 
          day:dateObj.getDate(), 
          type:'LEAVE', 
          leaveType:code, 
          category: viewMode==='ACTUAL'?'UNPLANNED':'PLANNED'
      }]); 
      setIsChangeShiftModalOpen(false); 
  };
  const handleStaffUpdate = (newStaff: Staff[]) => { setStaffList(newStaff); setIsManageStaffModalOpen(false); };
  
  const handleDailyDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { const d = new Date(e.target.value); if(!isNaN(d.getTime())) setSelectedDailyDate(d); };
  const handlePrevDay = () => { const d = new Date(selectedDailyDate); d.setDate(d.getDate()-1); setSelectedDailyDate(d); };
  const handleNextDay = () => { const d = new Date(selectedDailyDate); d.setDate(d.getDate()+1); setSelectedDailyDate(d); };
  const handleDailyDetailsUpdate = (d: DailyDutyDetails) => setDailyDutyLogs(p => ({...p, [selectedDailyDate.toISOString().split('T')[0]]: d}));
  const currentDailyDetails = dailyDutyLogs[selectedDailyDate.toISOString().split('T')[0]] || null;

  const handleReset = () => { if(window.confirm("Reset All Data?")) { localStorage.clear(); window.location.reload(); }};

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-gray-100 text-gray-900">
      {viewMode !== 'DAILY' && (
      <div className="bg-white p-6 shadow-md mb-6 border-t-8 border-blue-900 relative">
        <div className="flex justify-between items-center mb-4">
           <div>
              <h1 className="text-2xl font-bold">POLIS BANTUAN ECOWORLD</h1>
              <p className="text-sm text-gray-500 uppercase font-bold">{getPeriodString()}</p>
           </div>
           {masterApproval?.isApproved && <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-bold border border-green-300">APPROVED</div>}
        </div>

        <div className="no-print flex gap-2 mb-4 flex-wrap items-center">
           <button onClick={prevMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold">&lt;</button>
           <span className="font-bold px-2 uppercase min-w-[150px] text-center">{MONTH_NAMES[currentMonth]} {currentYear}</span>
           <button onClick={nextMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold">&gt;</button>
           
           <div className="w-px h-6 bg-gray-300 mx-2"></div>
           
           <button onClick={() => setIsManageStaffModalOpen(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs shadow hover:bg-blue-700 flex items-center gap-1"><Users className="w-3 h-3"/> Staff</button>
           <button onClick={() => setIsHolidaysModalOpen(true)} className="bg-orange-500 text-white px-3 py-1 rounded text-xs shadow hover:bg-orange-600 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Holidays</button>
           <button onClick={() => setIsApprovalModalOpen(true)} className="bg-green-600 text-white px-3 py-1 rounded text-xs shadow hover:bg-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Approve</button>
           {masterApproval?.isApproved && <button onClick={() => setIsUnlockModalOpen(true)} className="bg-red-600 text-white px-3 py-1 rounded text-xs shadow hover:bg-red-700 flex items-center gap-1"><Unlock className="w-3 h-3"/> Unlock</button>}
        </div>
        
        <div className="no-print flex gap-2 mb-2 flex-wrap">
            <button onClick={() => setIsChangeShiftModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50">Change Shift</button>
            <button onClick={() => setIsSwapModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50">Swap Shift</button>
            <button onClick={() => setIsLeaveModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50">Leave</button>
            <button onClick={() => setIsRDOTModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50">RDOT</button>
            <button onClick={() => setIsCFPHModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50">CFPH</button>
            <button onClick={() => setIsNoOTModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50">No OT</button>
        </div>
      </div>
      )}

      {/* VIEW SWITCHER */}
      <div className="no-print bg-gray-800 text-white p-3 rounded-lg mb-6 flex justify-between items-center shadow-lg">
         <div className="flex gap-2">
            <button onClick={() => setViewMode('PLAN')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${viewMode==='PLAN'?'bg-blue-600 shadow-inner':'hover:bg-gray-700'}`}><LayoutGrid className="w-4 h-4"/> Plan</button>
            <button onClick={() => setViewMode('ACTUAL')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${viewMode==='ACTUAL'?'bg-green-600 shadow-inner':'hover:bg-gray-700'}`}><CheckCircle className="w-4 h-4"/> Actual</button>
            <button onClick={() => setViewMode('DAILY')} className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${viewMode==='DAILY'?'bg-indigo-600 shadow-inner':'hover:bg-gray-700'}`}><FileText className="w-4 h-4"/> Daily</button>
         </div>
         <div className="flex items-center gap-4">
             {viewMode === 'DAILY' && (
                <div className="flex items-center gap-2 bg-gray-700 p-1 rounded">
                   <button onClick={handlePrevDay} className="p-1 hover:text-blue-400"><ChevronLeft className="w-4 h-4"/></button>
                   <input type="date" className="text-black px-2 rounded text-sm h-7" value={selectedDailyDate.toISOString().split('T')[0]} onChange={handleDailyDateChange} />
                   <button onClick={handleNextDay} className="p-1 hover:text-blue-400"><ChevronRight className="w-4 h-4"/></button>
                </div>
             )}
             <button onClick={() => setIsStatsModalOpen(true)} className="bg-purple-600 px-3 py-1 rounded text-xs font-bold hover:bg-purple-500 flex items-center gap-1"><BarChart2 className="w-3 h-3"/> Stats</button>
             <button onClick={downloadCSV} className="bg-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-500 flex items-center gap-1"><Download className="w-3 h-3"/> CSV</button>
             <button onClick={handlePrint} className="bg-white text-black px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 flex items-center gap-1"><Printer className="w-3 h-3"/> Print</button>
         </div>
      </div>

      {viewMode !== 'DAILY' ? (
         <div className="bg-white p-2 rounded shadow overflow-x-auto">
             <RosterTable rosterData={rosterData} dailyStrength={dailyStrength} viewMode={viewMode} onCellClick={handleChangeShiftSubmit} />
         </div>
      ) : (
         <DailyRoster date={selectedDailyDate} rosterData={rosterData} details={currentDailyDetails} onDetailsUpdate={handleDailyDetailsUpdate} staffList={staffList} />
      )}

      <div className="no-print mt-8 text-center border-t pt-4">
          <button onClick={handleReset} className="text-red-500 hover:text-red-700 text-xs flex items-center justify-center gap-1 mx-auto"><Trash2 className="w-3 h-3"/> Reset All Data</button>
      </div>

      {/* MODALS */}
      <ManageStaffModal isOpen={isManageStaffModalOpen} onClose={() => setIsManageStaffModalOpen(false)} staffList={staffList} onUpdate={handleStaffUpdate} />
      <SwapShiftModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} onSubmit={handleSwapSubmit} staffList={staffList} />
      <ApprovalModal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} onSubmit={handleApproveMaster} title="Approve Master" />
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
