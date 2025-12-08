
export enum Rank {
  SJN = 'SJN',
  KPL = 'KPL',
  KONST = 'KONST'
}

export enum ShiftCode {
  S = 'S',   // Siang (Day)
  M = 'M',   // Malam (Night)
  O = 'O',   // Off
  T = 'T',   // Training (Kursus) - Changed from K
  AL = 'AL', // Annual Leave
  CL = 'CL', // Cuti Kecemasan
  EL = 'EL', // Cuti Sakit
  HL = 'HL', // Hospital Leave
  PH = 'PH', // Public Holiday
  RDOT = 'RDOT', // Rest Day Overtime
  CFPH = 'CFPH', // Carry Forward Public Holiday
  ML = 'ML', // Maternity Leave
  PL = 'PL', // Paternity Leave
  MIA = 'MIA' // Missing In Action
}

export interface Staff {
  id: string;
  bodyNumber: string;
  rank: Rank;
  name: string;
  walkieTalkie?: string; // New field for W/T No (e.g., N3)
  vehicle?: string; // Added vehicle property
}

export interface DayStatus {
  date: number; // 1-31
  month: number; // 0-11
  year: number;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  code: ShiftCode;
  originalCode?: ShiftCode; // Tracks the shift that was replaced (e.g. by CFPH)
  otHours: number | null; // 4 or null
  mealAllowance: number; // RM value
  isRestDayOT?: boolean; // True if working on a rest day
}

export interface StaffRoster {
  staff: Staff;
  days: DayStatus[];
  summary: {
    workdays: number;
    restdays: number;
    rdot: number; // Rest Day Overtime count
    overtimeHours: number;
    publicHolidays: number;
    cfph: number; // Carry Forward Public Holidays count
    meals: number; // Total Meal Allowance in RM
  };
  conflicts: string[]; // List of warnings (e.g. "Long Streak", "Double Shift")
}

export interface DailyStrength {
  day: number;
  month: number;
  shiftSiang: number; // Target 3
  shiftMalam: number; // Target 3
  off: number; // Target 2
  leave: number; // Max 1-2
  seniorOnDuty: boolean;
}

export interface RosterOverride {
  staffId: string;
  year: number;
  month: number;
  day: number;
  type: 'NO_OT' | 'LEAVE';
  leaveType?: ShiftCode; // Only for LEAVE type
  category?: 'PLANNED' | 'UNPLANNED'; // To distinguish between Plan and Actual views
}

// NEW: Interface for editable daily details
export interface DailyDutyDetails {
  daySupervisor?: string; // Override auto-detected supervisor
  nightSupervisor?: string; // Override auto-detected supervisor
  
  // Name overrides for teams
  dayTeam?: string[]; // List of names for Team 1
  nightTeam?: string[]; // List of names for Team 2
  officeAdmin?: string; // Name for Office Admin

  dayVehicles: {
    mpv1: string;
    mpv2: string;
    mpv3?: string;
    adminMpv?: string; // Added for Office Admin
    adminWt?: string; // Added for Office Admin Walkie Talkie
    wt1: string;
    wt2: string;
    wt3?: string;
  };
  nightVehicles: {
    mpv1: string;
    mpv2: string;
    mpv3?: string;
    wt1: string;
    wt2: string;
    wt3?: string;
  };
  notes: string[]; // Editable lines for 'Tugasan Khas'
  
  // NEW: Overrides for Footer sections
  offDayStaffNames?: string[]; // List of names for Anggota Rest Day
  leaveStaffNames?: string[]; // List of names for Cuti
  
  // Approval Levels
  preparation?: ApprovalRecord; // Level 1: Prepared By
  approval?: ApprovalRecord;    // Level 2: Approved/Verified By
}

export interface ApprovalRecord {
  approverName: string;
  approverRank: string;
  date: string;
  isApproved: boolean;
}
