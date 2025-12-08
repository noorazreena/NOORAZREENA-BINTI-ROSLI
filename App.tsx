import React, { useState } from 'react';
import { RosterTable } from './components/RosterTable'; 
import { DailyRoster } from './components/DailyRoster'; 
import { ChangeShiftModal } from './components/ChangeShiftModal'; 
import { StaffRoster, DailyDutyDetails, Staff, ShiftCode, Rank } from './types'; 
import { Calendar, Layout, FileText, Activity } from 'lucide-react';

// --- SENARAI 8 STAFF LENGKAP ---
const SAMPLE_STAFF: Staff[] = [
  { id: '1', bodyNumber: '74722', rank: Rank.SJN, name: 'MOHD KHAIRUL AZWANDY', walkieTalkie: 'N01', vehicle: 'WXC 1234' },
  { id: '2', bodyNumber: '94340', rank: Rank.KPL, name: 'KALAIARASU A/L MUNIANDY', walkieTalkie: 'N02', vehicle: 'WXC 2345' },
  { id: '3', bodyNumber: '12345', rank: Rank.KONST, name: 'ALI BIN ABU', walkieTalkie: 'N03', vehicle: 'MPV 1' },
  { id: '4', bodyNumber: '67890', rank: Rank.KONST, name: 'AHMAD ZAKI', walkieTalkie: 'N04', vehicle: 'MPV 2' },
  { id: '5', bodyNumber: '11111', rank: Rank.KONST, name: 'SITI AMINAH', walkieTalkie: 'N05', vehicle: 'MPV 3' },
  { id: '6', bodyNumber: '22222', rank: Rank.KONST, name: 'RAHMAT BIN SAID', walkieTalkie: 'N06', vehicle: 'WXC 8888' },
  { id: '7', bodyNumber: '33333', rank: Rank.KONST, name: 'NOORAZREENA BINTI ROSLI', walkieTalkie: 'N07', vehicle: 'WXC 9999' },
  { id: '8', bodyNumber: '44444', rank: Rank.KONST, name: 'MUHAMMAD HAFIZ', walkieTalkie: 'N08', vehicle: 'MPV 4' },
];

const generateSampleRoster = (): StaffRoster[] => {
  return SAMPLE_STAFF.map(staff => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      let code = ShiftCode.S;
      // Logic simple: 4 hari kerja, 2 hari cuti
      if (i % 6 === 0 || i % 6 === 5) code = ShiftCode.O;
      else if (i % 6 === 3 || i % 6 === 4) code = ShiftCode.M;
      
      days.push({
        date: i,
        month: 11, // Disember (Indeks 11)
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
  const [rosterData, setRosterData] = useState<StaffRoster[]>(generateSampleRoster()); // Guna function terus
  const [dailyDetails, setDailyDetails] = useState<DailyDutyDetails | null>(null);

  // STATE UNTUK MODAL
  const [isChangeShiftModalOpen, setIsChangeShiftModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{staffId: string, date: string} | null>(null);

  // FUNCTION BILA TEKAN KOTAK (JADUAL)
  const handleCellClick = (staffId: string, dayDate: number, currentCode: ShiftCode) => {
    console.log("Cell clicked:", staffId, dayDate); // Debugging
    const dateStr = `2025-12-${dayDate.toString().padStart(2, '0')}`;
    setSelectedCell({ staffId, date: dateStr });
    setIsChangeShiftModalOpen(true);
  };

  // FUNCTION UPDATE SHIFT
  const handleShiftChange = (staffId: string, dateStr: string, newCode: ShiftCode) => {
    const dayNum = parseInt(dateStr.split('-')[2]);

    const updatedRoster = rosterData.map(person => {
        if (person.staff.id !== staffId) return person;

        const newDays = person.days.map(d => {
            if (d.date === dayNum) {
                return { ...d, code: newCode, originalCode: newCode }; // Update code
            }
            return d;
        });

        return { ...person, days: newDays };
    });

    setRosterData(updatedRoster);
    setIsChangeShiftModalOpen(false);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'PLAN':
        return (
          <div className="animate-fade-in p-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded shadow-sm">
              <h2 className="font-bold text-blue-900 flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" /> MASTER ROSTER PLAN (DISEMBER 2025)
              </h2>
              <p className="text-sm text-blue-700">Klik pada kotak shift untuk ubah jadual.</p>
            </div>
            <RosterTable 
              rosterData={rosterData}
              dailyStrength={SAMPLE_STRENGTH}
              viewMode="PLAN"
              onCellClick={handleCellClick} 
            />
          </div>
        );

      case 'ACTUAL':
        return (
          <div className="animate-fade-in p-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded shadow-sm">
              <h2 className="font-bold text-green-900 flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5" /> MASTER ACTUAL (REKOD SEBENAR)
              </h2>
              <p className="text-sm text-green-700">Klik untuk update kehadiran sebenar / OT.</p>
            </div>
            <RosterTable 
              rosterData={rosterData}
              dailyStrength={SAMPLE_STRENGTH}
              viewMode="ACTUAL"
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
              staffList={SAMPLE_STAFF} 
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
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

      {/* MODAL CHANGE SHIFT */}
      {isChangeShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <ChangeShiftModal 
                    isOpen={isChangeShiftModalOpen}
                    onClose={() => setIsChangeShiftModalOpen(false)}
                    onSubmit={handleShiftChange}
                    staffList={SAMPLE_STAFF}
                />
            </div>
        </div>
      )}
    </div>
  );
}
