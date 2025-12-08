import { PUBLIC_HOLIDAYS_2026 } from './constants';
import { StaffRoster, ShiftCode, DayStatus, Staff, Rank, DailyStrength, RosterOverride } from './types';

// Helper function for modulo that handles negative numbers correctly
const mod = (n: number, m: number) => ((n % m) + m) % m;

// Helper to check for Public Holiday
const isPublicHoliday = (d: number, m: number) => {
  return !!PUBLIC_HOLIDAYS_2026[`${m}-${d}`];
};

/**
 * Generates the staff roster for a given payroll period.
 */
export const generateRoster = (targetYear: number, targetMonth: number, overrides: RosterOverride[] = [], currentStaffList: Staff[]): StaffRoster[] => {
  // Define Period: 26th of (Month-1) to 25th of (Month)
  const startDate = new Date(targetYear, targetMonth - 1, 26);
  const endDate = new Date(targetYear, targetMonth, 25);
  
  // The core rotation cycle: 6S, 1O, 6M, 1O (14 days)
  const BASE_PATTERN = [
    ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.S, ShiftCode.O,
    ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.M, ShiftCode.O
  ];

  // Helper to determine if staff is restricted to Day Shift (and Fixed Rotation)
  const isFixedDayStaff = (staff: Staff) => 
    staff.rank === Rank.SJN || staff.name.includes('NOORAZREENA'); // Updated based on rule

  // Calculate Quarterly Rotation Shift for Off Day stagger
  const monthsSinceBase = (targetYear - 2025) * 12 + targetMonth;
  const quarterBlock = Math.floor(monthsSinceBase / 3);

  // Generate the array of dates for this roster period
  const rosterDates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    rosterDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // --- 1. Initial Pass: Generate Base Roster ---
  const rosters = currentStaffList.map((staff, staffIndex) => {
    const days: DayStatus[] = [];
    // Stagger offset: Ensures staff are staggered across the 14-day cycle
    const staggerOffset = staffIndex * 2; 
    // Rotation shift: Shifts the OFF day every 3 months for fairness
    const rotationShift = quarterBlock; 

    rosterDates.forEach(dateObj => {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const day = dateObj.getDate();
      const dayOfWeek = dateObj.getDay();
      
      let code = ShiftCode.S;
      let originalCode = ShiftCode.S;

      // SPECIAL FIXED RULES (SJN & NOORAZREENA)
      if (staff.rank === Rank.SJN || staff.name.includes('NOORAZREENA')) {
        // Assuming Fixed Day Staff get fixed weekend off (Sun/Sat)
        if (staff.name.includes('NOORAZREENA') && dayOfWeek === 0) { code = ShiftCode.O; } // Sun Off for Noorazreena
        else if (staff.rank === Rank.SJN && dayOfWeek === 6) { code = ShiftCode.O; } // Sat Off for SJN
        else { code = ShiftCode.S; } // Fixed Day Shift
      } else {
        // ROTATING STAFF (KPL & KONST)
        const globalDayIndex = Math.floor(dateObj.getTime() / 86400000);
        // Combined index with staff stagger and quarterly rotation offset
        const patternIndex = mod(globalDayIndex + staggerOffset - rotationShift, 14);
        
        code = BASE_PATTERN[patternIndex];
      }
      originalCode = code;

      // Check for Overrides (Leave, CFPH)
      const leaveOverride = overrides.find(o => 
        o.staffId === staff.id && 
        o.year === year && 
        o.month === month && 
        o.day === day && 
        o.type === 'LEAVE'
      );

      if (leaveOverride && leaveOverride.leaveType) {
        originalCode = code; // Save original code
        code = leaveOverride.leaveType;
      }

      days.push({
        date: day,
        month: month,
        year: year,
        dayOfWeek,
        code,
        originalCode,
        otHours: 0,
        mealAllowance: 0,
        isRestDayOT: false
      });
    });

    return { staff, days, summary: { workdays: 0, restdays: 0, rdot: 0, overtimeHours: 0, publicHolidays: 0, cfph: 0, meals: 0, leave: 0 }, conflicts: [] as string[] };
  });

  // --- 2. Normalize Off Days (Max 4 Offs) ---
  rosters.forEach(r => {
    const offDaysIndices = r.days.map((d, i) => d.code === ShiftCode.O ? i : -1).filter(i => i !== -1);
    
    if (offDaysIndices.length > 4) {
      const daysToConvert = offDaysIndices.length - 4;
      for (let i = 0; i < daysToConvert; i++) {
        // Convert the last excess Off Day to the opposite shift (S or M)
        const dayIndex = offDaysIndices[offDaysIndices.length - 1 - i];
        
        let newCode = ShiftCode.S;
        // Try to balance S/M. Look at previous day's shift.
        if (dayIndex > 0) {
           const prevCode = r.days[dayIndex - 1].originalCode || r.days[dayIndex - 1].code;
           newCode = (prevCode === ShiftCode.M) ? ShiftCode.S : ShiftCode.M; // Alternate S/M
        }
        // Fixed staff revert to Day Shift (S)
        if (isFixedDayStaff(r.staff)) { newCode = ShiftCode.S; } 

        r.days[dayIndex].originalCode = ShiftCode.O; // Save old code
        r.days[dayIndex].code = newCode; // Set new working shift
      }
    }
  });

  // --- 3. PH Carry Forward & Final Calculation ---
  rosters.forEach(r => {
    let workdays = 0;
    let restdays = 0;
    let rdot = 0;
    let overtimeHours = 0;
    let publicHolidays = 0;
    let cfph = 0;
    let leave = 0;
    let totalMealAllowance = 0;
    let consecutiveWorkDays = 0;

    for (let i = 0; i < r.days.length; i++) {
      const currentDay = r.days[i];
      const hasNoOT = overrides.some(o => o.staffId === r.staff.id && o.year === currentDay.year && o.month === currentDay.month && o.day === currentDay.date && o.type === 'NO_OT');
      const isPH = isPublicHoliday(currentDay.date, currentDay.month);
      
      // Check for PH on OFF day and apply CFPH to next day
      if (isPH && currentDay.code === ShiftCode.O && i < r.days.length - 1) {
        const nextDay = r.days[i + 1];
        // Only apply CFPH if next day is a working day (S/M)
        if (nextDay.code === ShiftCode.S || nextDay.code === ShiftCode.M) {
          nextDay.originalCode = nextDay.code;
          nextDay.code = ShiftCode.CFPH;
        }
      }

      let effectiveCode = currentDay.code;
      if (currentDay.code === ShiftCode.CFPH) { effectiveCode = currentDay.originalCode; cfph++; }
      
      const isWorkingShift = effectiveCode === ShiftCode.S || effectiveCode === ShiftCode.M;

      if (isWorkingShift) {
        workdays++;
        consecutiveWorkDays++;
        
        if (consecutiveWorkDays > 10) { 
           if (!r.conflicts.includes("Long Streak (>10 days)")) { r.conflicts.push("Long Streak (>10 days)"); }
        }
        
        // OT Calculation
        currentDay.otHours = hasNoOT ? 0 : 4;
        overtimeHours += currentDay.otHours;

        // Meal Calculation
        if (hasNoOT) { currentDay.mealAllowance = 0; } 
        else if (currentDay.code === ShiftCode.CFPH || currentDay.code === ShiftCode.M) { currentDay.mealAllowance = 10; }
        else if (currentDay.code === ShiftCode.S) {
           const isWeekend = currentDay.dayOfWeek === 0 || currentDay.dayOfWeek === 6;
           currentDay.mealAllowance = isWeekend ? 20 : 10;
        }
        totalMealAllowance += currentDay.mealAllowance;

      } else if (currentDay.code === ShiftCode.O) {
        consecutiveWorkDays = 0;
        restdays++;
      } else {
        consecutiveWorkDays = 0;
        if (currentDay.code !== ShiftCode.CFPH) leave++;
      }
      
      if (isPH && currentDay.code !== ShiftCode.O && currentDay.code !== ShiftCode.CFPH) publicHolidays++;
    }

    if (restdays < 4) { r.conflicts.push("Low Rest (<4 days)"); }

    r.summary = { workdays, restdays, rdot, overtimeHours, publicHolidays, cfph, meals: totalMealAllowance, leave };
  });

  return rosters;
};

export const calculateDailyStrength = (rosters: StaffRoster[]): DailyStrength[] => {
  // Logic is simplified for clarity, assuming daily strength calculation is correct based on original logic
  if (rosters.length === 0) return [];
  const numDays = rosters[0].days.length;
  const strength: DailyStrength[] = [];

  for (let i = 0; i < numDays; i++) {
    let sCount = 0;
    let mCount = 0;
    let oCount = 0;
    const dateInfo = rosters[0].days[i];

    rosters.forEach(r => {
      const dayData = r.days[i];
      let codeToCheck = dayData.code;
      if (dayData.code === ShiftCode.CFPH && dayData.originalCode) {
        codeToCheck = dayData.originalCode;
      }

      if (codeToCheck === ShiftCode.S) sCount++;
      if (codeToCheck === ShiftCode.M) mCount++;
      if (codeToCheck === ShiftCode.O) oCount++;
    });

    strength.push({
      day: dateInfo.date,
      month: dateInfo.month,
      shiftSiang: sCount,
      shiftMalam: mCount,
      off: oCount
    });
  }
  // Note: DailyStrength interface in types.ts is now using properties (day, month, shiftSiang, shiftMalam, off)
  return strength.map(s => ({
    date: `${dateInfo.year}-${dateInfo.month + 1}-${s.day}`,
    shiftSiang: s.shiftSiang,
    shiftMalam: s.shiftMalam,
    off: s.off
  }));
};
