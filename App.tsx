import React, { useState, useMemo, useEffect } from 'react';
// ... (imports lain) ...
import { RosterTable } from './components/RosterTable';
import { DailyRoster } from './components/DailyRoster';
// === START FIX: TUKAR PATH IMPORT INI ===
// Tukar './roster-generator' kepada './services/roster-generator'
import { generateRoster, calculateDailyStrength } from './services/roster-generator';
// === END FIX ===
import { MONTH_NAMES, SHIFT_COLORS, STAFF_LIST as DEFAULT_STAFF_LIST } from './constants';
import { ShiftCode, RosterOverride, DailyDutyDetails, ApprovalRecord, Staff } from './types';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { RequestRDOTModal } from './components/RequestRDOTModal';
// ... (imports modal lain) ...
// ... (rest of App.tsx logic is the same) ...
