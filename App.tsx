// (SILA PADAM SEMUA KOD LAMA DALAM App.tsx DAN GANTI DENGAN KOD INI)

import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Calendar, UserMinus, Clock, Ban, ArrowRightCircle, FileText, LayoutGrid, CheckCircle, ChevronLeft, ChevronRight, Download, BarChart2, Trash2, RefreshCcw, Edit3, Lock, Unlock, ShieldCheck, Users, CalendarDays } from 'lucide-react';

// FIX SEMUA IMPORT UNTUK KOMPONEN & LOGIK DENGAN CURLEY BRACES {}
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

  // --- PERSISTENT UI STATE ---
  const [currentYear, setCurrentYear] = useState(() => {
    try {
      const saved = localStorage.getItem('currentYear');
      return saved ? parseInt(saved) : today.getFullYear();
    } catch { return today.getFullYear(); }
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    try {
      const saved = localStorage.getItem('currentMonth');
      return saved ? parseInt(saved) : today.getMonth();
    } catch { return today.getMonth(); }
  });
  
  const [viewMode, setViewMode] = useState<'PLAN' | 'ACTUAL' | 'DAILY'>(() => {
    try {
      const saved = localStorage.getItem('viewMode');
      return (saved === 'PLAN' || saved === 'ACTUAL' || saved === 'DAILY') ? saved : 'PLAN';
    } catch { return 'PLAN'; }
  });

  const [selectedDailyDate, setSelectedDailyDate] = useState<Date>(today);

  // --- PERSISTENT DATA STATE ---
  const [overrides, setOverrides] = useState<RosterOverride[]>(() => {
    try {
      const saved = localStorage.getItem('rosterOverrides');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load overrides:", e);
      return [];
    }
  });
  
  const [dailyDutyLogs, setDailyDutyLogs] = useState<Record<string, DailyDutyDetails>>(() => {
    try {
      const saved = localStorage.getItem('dailyDutyLogs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load daily logs:", e);
      return {};
    }
  });

  const [masterApproval, setMasterApproval] = useState<ApprovalRecord | null>(() => {
    try {
      const saved = localStorage.getItem(`masterApproval_${currentYear}_${currentMonth}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // NEW: Dynamic Staff List (Guna DEFAULT_STAFF_LIST dari constants)
  const [staffList, setStaffList] = useState<Staff[]>(() => {
    try {
      const saved = localStorage.getItem('staffList');
      return saved ? JSON.parse(saved) : DEFAULT_STAFF_LIST;
    } catch {
      return DEFAULT_STAFF_LIST;
    }
  });

  // Load correct master approval when month/year changes
  useEffect(() => {
    const key = `masterApproval_${currentYear}_${currentMonth}`;
    const saved = localStorage.getItem(key);
    setMasterApproval(saved ? JSON.parse(saved) : null);
  }, [currentYear, currentMonth]);

  // Modals
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
  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false); // NEW

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => localStorage.setItem('currentYear', currentYear.toString()), [currentYear]);
  useEffect(() => localStorage.setItem('currentMonth', currentMonth.toString()), [currentMonth]);
  useEffect(() => localStorage.setItem('viewMode', viewMode), [viewMode]);
  useEffect(() => localStorage.setItem('rosterOverrides', JSON.stringify(overrides)), [overrides]);
  useEffect(() => localStorage.setItem('dailyDutyLogs', JSON.stringify(dailyDutyLogs)), [dailyDutyLogs]);
  useEffect(() => localStorage.setItem('staffList', JSON.stringify(staffList)), [staffList]);
  useEffect(() => {
    const key = `masterApproval_${currentYear}_${currentMonth}`;
    if (masterApproval) localStorage.setItem(key, JSON.stringify(masterApproval));
    else localStorage.removeItem(key);
  }, [masterApproval, currentYear, currentMonth]);

  // Handle Data Reset
  const handleFactoryReset = () => {
    if (window.confirm("⚠️ DANGER: This will delete ALL saved roster changes, leaves, and daily notes. This cannot be undone.\n\nAre you sure you want to reset the app?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- AUTO SYNC LOGIC ---
  let rosterGenerationYear = currentYear;
  let rosterGenerationMonth = currentMonth;

  if (viewMode === 'DAILY') {
    const d = selectedDailyDate.getDate();
    const m = selectedDailyDate.getMonth();
    const y = selectedDailyDate.getFullYear();
    
    // If date is 26th or later, it belongs to the NEXT month's payroll
    if (d >= 26) {
      if (m === 11) { 
        rosterGenerationMonth = 0; 
        rosterGenerationYear = y + 1; 
      } else { 
        rosterGenerationMonth = m + 1; 
        rosterGenerationYear = y; 
      }
    } else {
      // If date is 1st to 25th, it belongs to CURRENT month's payroll
      rosterGenerationMonth = m;
      rosterGenerationYear = y;
    }
  }

  const basePlan = useMemo(() => 
    generateRoster(rosterGenerationYear, rosterGenerationMonth, [], staffList), 
  [rosterGenerationYear, rosterGenerationMonth, staffList]);

  const rosterData = useMemo(() => {
    const activeOverrides = viewMode === 'PLAN' 
      ? overrides.filter(o => o.category === 'PLANNED' || !o.category) 
      : overrides;
    return generateRoster(rosterGenerationYear, rosterGenerationMonth, activeOverrides, staffList);
  }, [rosterGenerationYear, rosterGenerationMonth, overrides, viewMode, staffList]);
  
  const dailyStrength = useMemo(() => calculateDailyStrength(rosterData), [rosterData]);

  const handlePrint = () => { window.print(); };

  const downloadCSV = () => {
    const headers = ["Staff Name", "ID", "Rank", "Workdays", "Restdays", "OT Hours", "Meals (RM)"];
    const rows = rosterData.map(r => [
      r.staff.name,
      r.staff.id,
      r.staff.rank,
      r.summary.workdays,
      r.summary.restdays,
      r.summary.overtimeHours,
      r.summary.meals
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roster_export_${currentYear}_${currentMonth+1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } 
    else { setCurrentMonth(m => m + 1); }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } 
    else { setCurrentMonth(m => m - 1); }
  };

  const yearOptions = useMemo(() => {
    const years = [];
    const startYear = today.getFullYear() - 2;
    for (let i = 0; i < 8; i++) { years.push(startYear + i); }
    return years;
  }, []);

  const getPeriodString = () => {
    const y = rosterGenerationYear;
    const m = rosterGenerationMonth;

    const prevDate = new Date(y, m - 1, 26);
    const currDate = new Date(y, m, 25);
    const prevMonthName = MONTH_NAMES[prevDate.getMonth()];
    const currMonthName = MONTH_NAMES[currDate.getMonth()];
    
    if (prevDate.getFullYear() !== currDate.getFullYear()) {
      return `26 ${prevMonthName} ${prevDate.getFullYear()} - 25 ${currMonthName} ${currDate.getFullYear()}`;
    }
    return `26 ${prevMonthName} - 25 ${currMonthName} ${currDate.getFullYear()}`;
  };

  // Helper untuk count rank (diperlukan oleh DailyRoster UI)
  const countRank = (rank: Rank) => staffList.filter(s => s.rank === rank).length;
  const totalStaff = staffList.length;

  // ... handler functions remain largely the same ...
  const handleApproveMaster = (name: string, rank: string) => {
    setMasterApproval({
      approverName: name,
      approverRank: rank,
      date: new Date().toLocaleDateString(),
      isApproved: true
    });
  };

  const handleUnlockMaster = () => {
    setMasterApproval(null);
  };

  const handleNoOTSubmit = (staffId: string, dateStr: string) => {
    const d = new Date(dateStr);
    const category = viewMode === 'ACTUAL' ? 'UNPLANNED' : 'PLANNED';
    setOverrides(prev => [...prev, { staffId, day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), type: 'NO_OT', category }]);
  };

  const handleCFPHSubmit = (staffId: string, dateStr: string) => {
    const d = new Date(dateStr);
    setOverrides(prev => [...prev, { staffId, day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), type: 'LEAVE', leaveType: ShiftCode.CFPH, category: 'PLANNED' }]);
  };

  const handleLeaveSubmit = (staffId: string, leaveType: ShiftCode, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let category: 'PLANNED' | 'UNPLANNED' = 'PLANNED';
    if (viewMode === 'ACTUAL' || leaveType === ShiftCode.EL || leaveType === ShiftCode.CL) {
      category = 'UNPLANNED';
    }
    const newOverrides: RosterOverride[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      newOverrides.push({ staffId, year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), type: 'LEAVE', leaveType, category });
    }
    setOverrides(prev => [...prev, ...newOverrides]);
  };

  const handleSwapSubmit = (staffAId: string, staffBId: string, dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    const staffARoster = basePlan.find(r => r.staff.id === staffAId);
    const staffBRoster = basePlan.find(r => r.staff.id === staffBId);
    const staffADay = staffARoster?.days.find(d => d.date === day && d.month === month && d.year === year);
    const staffBDay = staffBRoster?.days.find(d => d.date === day && d.month === month && d.year === year);

    if (!staffADay || !staffBDay) { alert("Error: Could not determine original shifts for swap."); return; }

    const newOverrides: RosterOverride[] = [
      { staffId: staffAId, year, month, day, type: 'LEAVE', leaveType: staffBDay.code, category: 'UNPLANNED' },
      { staffId: staffBId, year, month, day, type: 'LEAVE', leaveType: staffADay.code, category: 'UNPLANNED' }
    ];
    setOverrides(prev => [...prev, ...newOverrides]);
  };

  const handleChangeShiftSubmit = (staffId: string, dateStr: string, newCode: ShiftCode) => {
    const d = new Date(dateStr);
    const category = viewMode === 'ACTUAL' ? 'UNPLANNED' : 'PLANNED';
    setOverrides(prev => [...prev, {
      staffId, year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), type: 'LEAVE', leaveType: newCode, category
    }]);
  };

  const handleDailyDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) setSelectedDailyDate(date);
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDailyDate);
    newDate.setDate(selectedDailyDate.getDate() - 1);
    setSelectedDailyDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDailyDate);
    newDate.setDate(selectedDailyDate.getDate() + 1);
    setSelectedDailyDate(newDate);
  };

  const handleDailyDetailsUpdate = (details: DailyDutyDetails) => {
    const key = selectedDailyDate.toISOString().split('T')[0];
    setDailyDutyLogs(prev => ({ ...prev, [key]: details }));
  };

  const currentDailyDetails = dailyDutyLogs[selectedDailyDate.toISOString().split('T')[0]] || null;
  const isMasterLocked = masterApproval?.isApproved && viewMode !== 'DAILY';

  const totalDaysInPeriod = useMemo(() => {
    if (!rosterData.length) return 0;
    return rosterData[0].days.length;
  }, [rosterData]);

  // NEW: Update Staff Handler
  const handleStaffUpdate = (newStaffList: Staff[]) => {
    setStaffList(newStaffList);
    setIsManageStaffModalOpen(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-gray-100">
      
      {viewMode !== 'DAILY' && (
      <div className="bg-white p-6 shadow-md mb-6 border-t-8 border-blue-900 relative">
        {masterApproval && masterApproval.isApproved ? (
           <div className="absolute top-0 right-0 bg-green-100 text-green-800 px-4 py-1 rounded-bl-lg border-l border-b border-green-300 flex items-center gap-2 text-xs font-bold no-print">
              <ShieldCheck className="w-4 h-4" /> APPROVED BY {masterApproval.approverName} ON {masterApproval.date}
           </div>
        ) : (
           <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 px-4 py-1 rounded-bl-lg border-l border-b border-gray-300 text-xs font-bold no-print">
              DRAFT MODE
           </div>
        )}

        {/* ... Header section (Logo etc) ... */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 mt-4">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-28 h-32 flex items-center justify-center">
              <img src="https://file-service.aistudio.google.com/file/332f3ce9-756d-49d7-832d-327c5ce82d5f" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 tracking-wide">POLIS BANTUAN</h1>
              <h2 className="text-lg text-green-700 font-serif italic font-bold">EcoWorld</h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Auxiliary Police • EcoNorth</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-black text-white px-8 py-2 text-xl font-bold uppercase tracking-widest mb-1">MEMO</div>
            <div className="text-sm font-semibold border-b border-black pb-1 mb-1">MASTER ROSTER</div>
            <div className={`text-xs font-bold uppercase ${viewMode === 'ACTUAL' ? 'text-red-600' : 'text-gray-600'}`}>
              {getPeriodString()} ({viewMode})
            </div>
            <div className="text-[10px] text-gray-500 mt-1">Total: {totalDaysInPeriod} Days</div>
          </div>
          <div className="text-right text-xs text-gray-500 hidden md:block">
             <p>LAMPIRAN</p>
             <p>EW/EN/PB ROS/BUL {currentMonth + 1}/{currentYear}</p>
             <p>MS 1/1</p>
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-300 shadow-sm">
            <button onClick={prevMonth} className="px-2 py-1 hover:bg-gray-100 rounded text-gray-600 font-bold">&larr;</button>
            <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className="p-1 text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:bg-gray-50 rounded">
