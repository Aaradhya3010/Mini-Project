import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Package,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Loader2,
} from 'lucide-react';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
  onRegister?: (eventId: number) => Promise<unknown>;
  onUnregister?: (eventId: number) => Promise<unknown>;
  onApprove?: (eventId: number) => Promise<unknown>;
  onReject?: (eventId: number) => Promise<unknown>;
  onCancel?: (eventId: number) => Promise<unknown>;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onRegister,
  onUnregister,
  onApprove,
  onReject,
  onCancel,
}) => {
  const { user, role, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!event) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOrganizer = user && event.organizer === user.id;
  const isAdmin = role === 'ADMIN';
  const isApproved = event.status === 'APPROVED';
  const isPending = event.status === 'PENDING';
  const isCancelled = event.status === 'CANCELLED';

  const handleAction = async (actionFn: () => Promise<unknown>) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await actionFn();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const percentFull = Math.min(
    100,
    Math.round((event.registrations_count / (event.expected_attendees || 1)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold mb-1">
              <span
                className={
                  isApproved
                    ? 'text-emerald-700'
                    : isPending
                    ? 'text-amber-700'
                    : isCancelled
                    ? 'text-slate-500 line-through'
                    : 'text-rose-700'
                }
              >
                {event.status}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-normal">
                Organized by {event.organizer_name}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Schedule & Location Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Calendar className="w-4 h-4 text-slate-700" />
                <span>Date & Time</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatDate(event.start)}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">
                  {formatTime(event.start)} – {formatTime(event.end)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <MapPin className="w-4 h-4 text-slate-700" />
                <span>Venue</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{event.hall_details?.name}</p>
              <p className="text-xs text-slate-500">{event.hall_details?.location}</p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                About this Event
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Capacity and Registrations */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Attendance & Capacity</span>
              </div>
              <span className="text-slate-600 font-mono tabular-nums">
                {event.registrations_count} / {event.expected_attendees} spots reserved ({percentFull}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percentFull >= 100
                    ? 'bg-rose-500'
                    : percentFull >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${percentFull}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Hall Maximum Seating Capacity: {event.hall_details?.capacity} seats.
            </p>
          </div>

          {/* Equipment Allocated */}
          {event.equipment_allocations && event.equipment_allocations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                <Package className="w-3.5 h-3.5" />
                <span>Reserved Equipment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.equipment_allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800">{alloc.equipment_name}</span>
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      Qty: {alloc.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {/* Student Actions: Register/Unregister */}
            {isAuthenticated && isApproved && !isCancelled && (
              <>
                {event.is_registered_by_me ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => onUnregister && handleAction(() => onUnregister(event.id))}
                    className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                    <span>Unregister</span>
                  </button>
                ) : (
                  <button
                    disabled={isSubmitting || event.registrations_count >= event.expected_attendees}
                    onClick={() => onRegister && handleAction(() => onRegister(event.id))}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {event.registrations_count >= event.expected_attendees
                        ? 'Event Full'
                        : 'Register for Event'}
                    </span>
                  </button>
                )}
              </>
            )}

            {/* Admin Actions: Approve/Reject */}
            {isAdmin && isPending && (
              <>
                <button
                  disabled={isSubmitting}
                  onClick={() => onReject && handleAction(() => onReject(event.id))}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reject</span>
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => onApprove && handleAction(() => onApprove(event.id))}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Event</span>
                </button>
              </>
            )}

            {/* Cancel Action for Organizer or Admin */}
            {(isAdmin || isOrganizer) && !isCancelled && (
              <button
                disabled={isSubmitting}
                onClick={() => onCancel && handleAction(() => onCancel(event.id))}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Cancel Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
