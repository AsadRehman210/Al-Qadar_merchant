import { calcShiftWorkingHours } from "../Attendance/attendancePolicyStorage";

export { calcShiftWorkingHours };

let _shifts = [
  { id: "shift-day", name: "General / Day", start: "09:00", end: "18:00", breakMinutes: 60 },
  { id: "shift-morning", name: "Morning", start: "06:00", end: "14:00", breakMinutes: 30 },
  { id: "shift-evening", name: "Evening", start: "14:00", end: "22:00", breakMinutes: 30 },
  { id: "shift-night", name: "Night", start: "22:00", end: "06:00", breakMinutes: 45 },
].map((s) => ({ ...s, workingHours: calcShiftWorkingHours(s.start, s.end, s.breakMinutes) }));

export const FAKE_SHIFTS = _shifts;

export const getShifts = () => [..._shifts];

export const getShiftById = (id) => _shifts.find((s) => s.id === id) || null;

export const addShift = (data) => {
  const shift = {
    id: `shift-${Date.now()}`,
    name: data.name,
    start: data.start,
    end: data.end,
    breakMinutes: +data.breakMinutes || 0,
    workingHours: calcShiftWorkingHours(data.start, data.end, +data.breakMinutes || 0),
  };
  _shifts = [..._shifts, shift];
  return shift;
};

export const updateShift = (id, data) => {
  _shifts = _shifts.map((s) => {
    if (s.id !== id) return s;
    const next = { ...s, ...data, breakMinutes: +data.breakMinutes || 0 };
    return { ...next, workingHours: calcShiftWorkingHours(next.start, next.end, next.breakMinutes) };
  });
};

export const deleteShift = (id) => {
  _shifts = _shifts.filter((s) => s.id !== id);
};
