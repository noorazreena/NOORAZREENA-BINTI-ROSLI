import React, { useState, useEffect } from 'react';
import { StaffRoster, DailyDutyDetails, Staff } from '../types';
import { Edit, Save, X, RefreshCw, UserPlus, List, FileSignature, CheckCircle, Unlock, Shuffle } from 'lucide-react';
import { ApprovalModal } from './ApprovalModal';
import { UnlockModal } from './UnlockModal';

interface DailyRosterProps {
  date: Date;
  rosterData: StaffRoster[];
  details: DailyDutyDetails | null;
  onDetailsUpdate: (details: DailyDutyDetails) => void;
  staffList: Staff[];
}

const DEFAULT_DETAILS: DailyDutyDetails = {
  dayVehicles: { mpv1: '', mpv2: '', mpv3: '', adminMpv: '', adminWt: '', wt1: '', wt2: '', wt3: '' },
  nightVehicles: { mpv1: '', mpv2: '', mpv3: '', wt1: '', wt2: '', wt3: '' },
  notes: [
    "1. ANGGOTA TUGASAN GALLERY DIKEHENDAKI MEMBUAT RONDAAN DI SHOWUNIT SATU (1) KALI.",
    "2. TEAM 1 / TEAM 2 DIKEHENDAKI BERADA DI CLUBHOUSE SETIAP KALI SELEPAS TAMAT RONDAAN.",
    "3. TEAM MALAM DIKEHENDAKI MEMBUAT RONDAAN DI GALERI (LUAR & DALAM) DAN SHOWUNIT SATU (1) KALI.",
    "4. SILA GUNAKAN URB MENGIKUT JADUAL YANG DITETAPKAN KECUALI HARI HUJAN LEBAT ATAU RONDAAN KE BL & MD."
  ]
};

// --- INI YANG PENTING: export const ---
export const DailyRoster: React.FC<DailyRosterProps> = ({ date, rosterData, details, onDetailsUpdate, staffList }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DailyDutyDetails>(details || DEFAULT_DETAILS);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  useEffect(() => {
    if (details) setEditForm(details);
  }, [details]);

  const handleSave = () => {
    onDetailsUpdate(editForm);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 border-2 border-black shadow-2xl max-w-[210mm] mx-auto min-h-[297mm]">
      {/* HEADER */}
      <div className="w-full flex justify-between items-center border-b-2 border-black pb-4 mb-4">
        <div className="text-left">
           <h1 className="font-bold text-xl">POLIS BANTUAN ECOWORLD</h1>
           <p className="text-sm">JADUAL TUGASAN HARIAN</p>
        </div>
        <div className="text-right">
           <h2 className="font-bold text-lg">{date.toDateString().toUpperCase()}</h2>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center w-full mb-6">
        <h3 className="font-bold text-blue-800 text-lg mb-2">Mod Paparan Harian</h3>
        <p className="text-gray-600 mb-4">Sila pastikan Master Plan telah dijana dengan lengkap sebelum mencetak jadual ini.</p>
        
        {!isEditing ? (
           <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mx-auto">
             <Edit className="w-4 h-4" /> Edit Butiran Harian
           </button>
        ) : (
           <div className="flex gap-2 justify-center">
             <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"><X className="w-4 h-4" /> Batal</button>
             <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"><Save className="w-4 h-4" /> Simpan</button>
           </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-auto w-full pt-4 border-t-2 border-black">
         <p className="text-center text-xs font-bold">DICETAK OLEH SISTEM ROSTER ECOWORLD</p>
      </div>
    </div>
  );
};
