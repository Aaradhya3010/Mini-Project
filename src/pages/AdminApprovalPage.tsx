import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Package,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { LoadingSpinner, ErrorBanner } from '../components/Feedback';
import { Event } from '../types';

export const AdminApprovalPage: React.FC = () => {
  const { events, isLoading, error, refreshEvents, approveEvent, rejectEvent } = useEvents();

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const pendingEvents = events.filter((e) => e.status === 'PENDING');

  const handleApprove = async (eventId: number) => {
    setProcessingId(eventId);
    setFeedbackMessage(null);
    try {
      await approveEvent(eventId);
      setFeedbackMessage({ type: 'success', text: 'Event has been successfully approved.' });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Approval failed due to a hall conflict.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (eventId: number) => {
    setProcessingId(eventId);
    setFeedbackMessage(null);
    try {
      await rejectEvent(eventId);
      setFeedbackMessage({ type: 'success', text: 'Event has been rejected.' });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to reject event.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setProcessingId(null);
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <span>Event Approval Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and adjudicate faculty venue reservations and equipment requisitions
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg tabular-nums">
          {pendingEvents.length} pending review
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={refreshEvents} />}

      {isLoading && pendingEvents.length === 0 ? (
        <LoadingSpinner message="Checking approval queue..." className="min-h-[400px]" />
      ) : pendingEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">All Queues Clear</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no pending event reservations awaiting administrative approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingEvents.map((event) => {
            const isProcessing = processingId === event.id;

            return (
              <div
                key={event.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-amber-700">AWAITING APPROVAL</span>
                      <span>·</span>
                      <span>Submitted by {event.organizer_name}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {event.title}
                    </h3>
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">{formatDate(event.start)}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {formatTime(event.start)} – {formatTime(event.end)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">{event.hall_details?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {event.expected_attendees} attendees (Max {event.hall_details?.capacity})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {event.equipment_allocations?.length || 0} Equipment Items
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {event.equipment_allocations?.map((a) => `${a.quantity}x ${a.equipment_name}`).join(', ') || 'No equipment'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center md:flex-col gap-2 shrink-0 md:w-36">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(event.id)}
                    className="flex-1 md:w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Approve</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleReject(event.id)}
                    className="flex-1 md:w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
