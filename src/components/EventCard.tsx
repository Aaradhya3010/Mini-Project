import React from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle2, UserCheck } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
  onRegister?: (eventId: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, onRegister }) => {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isApproved = event.status === 'APPROVED';
  const isPending = event.status === 'PENDING';
  const isCancelled = event.status === 'CANCELLED';

  const statusColor = isApproved
    ? 'text-emerald-700'
    : isPending
    ? 'text-amber-700'
    : isCancelled
    ? 'text-slate-400 line-through'
    : 'text-rose-700';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        {/* Unboxed Metadata Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${statusColor}`}>{event.status}</span>
            <span aria-hidden="true">·</span>
            <span>{event.hall_details?.name}</span>
          </div>
          {event.is_registered_by_me && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" />
              Registered
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(event)}
          className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer leading-snug line-clamp-2"
        >
          {event.title}
        </h3>

        {/* Description snippet */}
        {event.description && (
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Details List */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">{formatDate(event.start)}</span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums">
              {formatTime(event.start)} – {formatTime(event.end)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.hall_details?.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="tabular-nums font-mono">
              {event.registrations_count} / {event.expected_attendees} registered
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={() => onSelect(event)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          View Details
        </button>

        {isApproved && onRegister && !event.is_registered_by_me && (
          <button
            onClick={() => onRegister(event.id)}
            disabled={event.registrations_count >= event.expected_attendees}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        )}
      </div>
    </div>
  );
};
