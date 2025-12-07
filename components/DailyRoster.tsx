import React, { useState, useEffect, useMemo } from 'react';
import { StaffRoster, ShiftCode, Rank, DailyDutyDetails, Staff } from '../types';
import { Edit, Save, X, Sparkles, Loader2, RefreshCw, UserPlus, List, CheckCircle, Unlock, FileSignature, Shuffle, AlignJustify } from 'lucide-react';
// IMPORT PENTING UNTUK AI
import { GoogleGenAI } from "@google/genai";
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

export const DailyRoster: React.FC<DailyRosterProps> = ({ date, rosterData, details, onDetailsUpdate, staffList }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DailyDutyDetails>(details || DEFAULT_DETAILS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [customInputModes, setCustomInputModes] = useState<Record<string, boolean>>({});
  
  const [isRotationEnabled, setIsRotationEnabled] = useState(true);

  const isStaffInList = (nameString: string) => {
    if (!nameString || nameString === '-' || nameString === '') return true; 
    return staffList.some(s => `${s.rank}/${s.bodyNumber} ${s.name}` === nameString);
  };

  useEffect(() => {
    const currentData = details || DEFAULT_DETAILS;
    setEditForm(currentData);

    const newModes: Record<string, boolean> = {};
    if (currentData.dayTeam) {
        currentData.dayTeam.forEach((name, idx) => {
            if (!isStaffInList(name)) newModes[`day_${idx}`] = true;
        });
    }
    if (currentData.nightTeam) {
        currentData.nightTeam.forEach((name, idx) => {
            if (!isStaffInList(name)) newModes[`night_${idx}`] = true;
        });
    }
    if (currentData.officeAdmin && !isStaffInList(currentData.officeAdmin)) {
        newModes['admin'] = true;
    }
    setCustomInputModes(newModes);
  }, [details, date, staffList]);

  const targetDay = date.getDate();
  const targetMonth = date.getMonth();
  const targetYear = date.getFullYear();

  const formatDate = (d: Date) => {
    const days = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'];
    return `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getSerialNumber = (d: Date) => {
    const year = d.getFullYear();
    const start = new Date(Date.UTC(year, 0, 0));
    const current = new Date(Date.UTC(year, d.getMonth(), d.getDate()));
    const diff = current.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const dayStr = dayOfYear.toString().padStart(3, '0');
    const yearSuffix = year.toString().slice(-2);
    return `POL 69A/${dayStr}/${yearSuffix}`;
  };

  const { dayShiftStaff, nightShiftStaff, offDayStaff, leaveStaff } = useMemo(() => {
    const dayS: any[] = [];
    const nightS: any[] = [];
    const offS: any[] = [];
    const leaveS: any[] = [];

    rosterData.forEach(r => {
      const dayData = r.days.find(d => d.date === targetDay && d.month === targetMonth && d.year === targetYear);
      if (!dayData) return;

      let effectiveCode = dayData.code;
      if (dayData.code === ShiftCode.CFPH && dayData.originalCode) {
        effectiveCode = dayData.originalCode;
      }

      const entry = { staff: r.staff, code: dayData.code, effectiveCode };

      if (effectiveCode === ShiftCode.S || (dayData.code === ShiftCode.CFPH && effectiveCode !== ShiftCode.O)) {
        if (effectiveCode === ShiftCode.M) {
           nightS.push(entry);
        } else {
           dayS.push(entry);
        }
      } else if (effectiveCode === ShiftCode.M) {
        nightS.push(entry);
      } else if (effectiveCode === ShiftCode.O) {
        offS.push(entry);
      } else {
        leaveS.push(entry);
      }
    });
    return { dayShiftStaff: dayS, nightShiftStaff: nightS, offDayStaff: offS, leaveStaff: leaveS };
  }, [rosterData, targetDay, targetMonth, targetYear]);

  const assignRoles = (staffListArg: any[], overrideSupervisorName?: string, useRotation: boolean = true) => {
    let sorted = [...staffListArg].sort((a, b) => {
      const rankScore = (r: Rank) => r === Rank.SJN ? 3 : r === Rank.KPL ? 2 : 1;
      return rankScore(b.staff.rank) - rankScore(a.staff.rank);
    });

    if (sorted.length === 0) return { supervisor: null, members: [], admin: null };

    const highestRank = sorted[0].staff.rank;
    const candidates = sorted.filter(s => s.staff.rank === highestRank);
    let supervisor = sorted[0];

    if (useRotation && candidates.length > 1) {
       const rotationIndex = targetDay % candidates.length;
       supervisor = candidates[rotationIndex];
       const chosenIndex = sorted.indexOf(supervisor);
       if (chosenIndex > 0) {
         sorted.splice(chosenIndex, 1);
         sorted.unshift(supervisor);
       }
    }
    
    if (overrideSupervisorName) {
      const foundIndex = sorted.findIndex(s => s.staff.name === overrideSupervisorName);
      if (foundIndex !== -1) {
        supervisor = sorted[foundIndex];
        sorted.splice(foundIndex, 1);
        sorted.unshift(supervisor);
      }
    }

    const members = sorted.slice(1);
    const adminIndex = members.findIndex((m: any) => m.staff.name.includes('NOORAZREENA'));
    let admin = null;
    if (adminIndex !== -1) {
      admin = members[adminIndex];
      members.splice(adminIndex, 1);
    }

    if (members.length > 1) {
        const highestMemberRank = members[0].staff.rank;
        const leadCandidates = members.filter((m: any) => m.staff.rank === highestMemberRank);
        if (useRotation && leadCandidates.length > 1) {
            const leadRotationIndex = targetDay % leadCandidates.length;
            const shiftLead = leadCandidates[leadRotationIndex];
            const leadIndex = members.indexOf(shiftLead);
            if (leadIndex > 0) {
                members.splice(leadIndex, 1);
                members.unshift(shiftLead);
            }
        }
    }

    return { supervisor, members, admin };
  };

  const dayTeam = assignRoles(dayShiftStaff, (isEditing ? editForm.daySupervisor : details?.daySupervisor), isRotationEnabled);
  const nightTeam = assignRoles(nightShiftStaff, (isEditing ? editForm.nightSupervisor : details?.nightSupervisor), isRotationEnabled);

  const getStaffWT = (staffString: string): string => {
    if (!staffString || staffString === '-') return '';
    const staff = staffList.find(s => staffString.toUpperCase().includes(s.name.toUpperCase()));
    return staff?.walkieTalkie || '';
  };

  const getStaffVehicle = (staffString: string): string => {
    if (!staffString || staffString === '-') return '';
    const staff = staffList.find
