import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Users,
  Package,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { eventsApi } from '../services/api';
import { useHallsAndEquipment } from '../hooks/useHallsAndEquipment';
import { useAuth } from '../context/AuthContext';
import { Equipment } from '../types';

interface EquipmentRow {
  equipmentId: number;
  quantity: number;
}

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role } = useAuth();
  const { halls, equipmentList, isLoading: resourcesLoading, checkEquipmentAvailability } =
    useHallsAndEquipment();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hallId, setHallId] = useState<number | ''>('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState<number | ''>(50);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentRow[]>([]);

  // Equipment with live availability
  const [equipmentAvailability, setEquipmentAvailability] = useState<Record<number, number>>({});

  // Validation & Server errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from searchParams if navigated from Calendar
  useEffect(() => {
    const paramStart = searchParams.get('start');
    const paramEnd = searchParams.get('end');
    const paramHall = searchParams.get('hall');

    if (paramStart) {
      const d = new Date(paramStart);
      if (!isNaN(d.getTime())) {
        setStart(d.toISOString().slice(0, 16));
      }
    } else {
      // Default to tomorrow 10:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setStart(tomorrow.toISOString().slice(0, 16));
    }

    if (paramEnd) {
      const d = new Date(paramEnd);
      if (!isNaN(d.getTime())) {
        setEnd(d.toISOString().slice(0, 16));
      }
    } else {
      // Default to tomorrow 12:00
      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(12, 0, 0, 0);
      setEnd(tomorrowEnd.toISOString().slice(0, 16));
    }

    if (paramHall) {
      setHallId(Number(paramHall));
    } else if (halls.length > 0 && !hallId) {
      setHallId(halls[0].id);
    }
  }, [searchParams, halls]);

  // Set default hall if not selected
  useEffect(() => {
    if (halls.length > 0 && !hallId) {
      setHallId(halls[0].id);
    }
  }, [halls, hallId]);

  // Check equipment availability whenever start or end changes
  useEffect(() => {
    if (start && end && new Date(end) > new Date(start)) {
      checkEquipmentAvailability(new Date(start).toISOString(), new Date(end).toISOString()).then(
        (updatedList) => {
          const map: Record<number, number> = {};
          updatedList.forEach((eq) => {
            map[eq.id] = eq.available_quantity ?? eq.total_quantity;
          });
          setEquipmentAvailability(map);
        }
      );
    }
  }, [start, end, checkEquipmentAvailability]);

  const selectedHall = halls.find((h) => h.id === Number(hallId));

  const addEquipmentRow = () => {
    // pick first equipment not yet selected
    const unselected = equipmentList.find(
      (eq) => !selectedEquipment.some((row) => row.equipmentId === eq.id)
    );
    if (unselected) {
      setSelectedEquipment((prev) => [
        ...prev,
        { equipmentId: unselected.id, quantity: 1 },
      ]);
    } else if (equipmentList.length > 0) {
      setSelectedEquipment((prev) => [
        ...prev,
        { equipmentId: equipmentList[0].id, quantity: 1 },
      ]);
    }
  };

  const removeEquipmentRow = (index: number) => {
    setSelectedEquipment((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEquipmentRow = (index: number, key: keyof EquipmentRow, value: number) => {
    setSelectedEquipment((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Event title is required.';
    }

    if (!hallId) {
      errors.hall = 'Please select a campus hall.';
    }

    if (!start) {
      errors.start = 'Start time is required.';
    }

    if (!end) {
      errors.end = 'End time is required.';
    }

    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      if (e <= s) {
        errors.end = 'End time must be after start time.';
      }
    }

    if (selectedHall && expectedAttendees) {
      if (Number(expectedAttendees) > selectedHall.capacity) {
        errors.expected_attendees = `Expected attendees (${expectedAttendees}) exceeds hall seating capacity (${selectedHall.capacity}).`;
      }
    }

    // Check equipment allocation against live availability
    for (const row of selectedEquipment) {
      const avail = equipmentAvailability[row.equipmentId] ?? 0;
      const eq = equipmentList.find((e) => e.id === row.equipmentId);
      if (row.quantity > avail) {
        errors.equipment = `Requested ${row.quantity} '${eq?.name}', but only ${avail} available for this time.`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (!validateClientSide()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      hall: Number(hallId),
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      expected_attendees: Number(expectedAttendees),
      requested_equipment: selectedEquipment.map((row) => ({
        equipment: row.equipmentId,
        quantity: Number(row.quantity),
      })),
    };

    try {
      await eventsApi.create(payload);
      navigate('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const errors: Record<string, string> = {};
        let genError: string | null = null;

        Object.entries(data).forEach(([key, val]) => {
          const message = Array.isArray(val) ? val.join(' ') : String(val);
          if (key === 'non_field_errors' || key === 'detail') {
            genError = message;
          } else {
            errors[key] = message;
          }
        });

        setFieldErrors(errors);
        setGeneralError(genError || 'Validation error occurred. Please review the highlighted fields.');
      } else {
        setGeneralError('Failed to create event. An unexpected server error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-slate-800" />
          <span>Book Hall & Schedule Event</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Reserve a campus venue with automated conflict detection and equipment provisioning
        </p>
      </div>

      {/* General / Hall Conflict Alert Banner */}
      {(generalError || fieldErrors.hall) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold">Booking Conflict Detected</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              {fieldErrors.hall || generalError}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Machine Learning Colloquium"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {fieldErrors.title && (
            <p className="text-xs text-rose-600 mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* Venue Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Campus Hall Venue *
            </label>
            <select
              value={hallId}
              onChange={(e) => setHallId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} (Capacity: {h.capacity})
                </option>
              ))}
            </select>
            {selectedHall && (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedHall.location} · Max {selectedHall.capacity} attendees</span>
              </div>
            )}
            {fieldErrors.hall && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.hall}</p>
            )}
          </div>

          {/* Expected Attendees */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expected Attendees *
            </label>
            <input
              type="number"
              min={1}
              required
              value={expectedAttendees}
              onChange={(e) => setExpectedAttendees(Number(e.target.value))}
              placeholder="e.g. 100"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {fieldErrors.expected_attendees && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fieldErrors.expected_attendees}</span>
              </p>
            )}
          </div>
        </div>

        {/* Datetime Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {fieldErrors.start && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.start}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {fieldErrors.end && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fieldErrors.end}</span>
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Event Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, prerequisites, keynote speakers, or presentation notes..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Equipment Allocation Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-600" />
                <span>Equipment Requirements</span>
              </h3>
              <p className="text-xs text-slate-500">
                Allocate campus AV, projectors, and audio systems for this booking
              </p>
            </div>
            <button
              type="button"
              onClick={addEquipmentRow}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>

          {selectedEquipment.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No equipment currently added. Click "Add Equipment" to request microphones or projectors.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedEquipment.map((row, index) => {
                const avail = equipmentAvailability[row.equipmentId] ?? 0;
                const eq = equipmentList.find((e) => e.id === row.equipmentId);
                const hasExceeded = row.quantity > avail;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                      hasExceeded ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex-1">
                      <select
                        value={row.equipmentId}
                        onChange={(e) =>
                          updateEquipmentRow(index, 'equipmentId', Number(e.target.value))
                        }
                        className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        {equipmentList.map((eqItem) => (
                          <option key={eqItem.id} value={eqItem.id}>
                            {eqItem.name} (Total: {eqItem.total_quantity})
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Available in this slot:{' '}
                        <span className={`font-semibold tabular-nums ${avail > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {avail}
                        </span>{' '}
                        units
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) =>
                            updateEquipmentRow(index, 'quantity', Math.max(1, Number(e.target.value)))
                          }
                          className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-lg text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEquipmentRow(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {hasExceeded && (
                      <div className="w-full text-xs text-rose-700 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Requested exceeds available quantity ({avail})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {fieldErrors.equipment && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{fieldErrors.equipment}</span>
            </p>
          )}
          {fieldErrors.requested_equipment && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{fieldErrors.requested_equipment}</span>
            </p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Conflicts & Submitting...</span>
              </>
            ) : (
              <span>Confirm & Submit Booking</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
