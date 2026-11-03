import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import { Plus, Filter, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useHallsAndEquipment } from '../hooks/useHallsAndEquipment';
import { useAuth } from '../context/AuthContext';
import { EventDetailModal } from '../components/EventDetailModal';
import { LoadingSpinner, ErrorBanner } from '../components/Feedback';
import { Event } from '../types';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const [selectedHallId, setSelectedHallId] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const {
    events,
    isLoading,
    error,
    refreshEvents,
    registerForEvent,
    unregisterFromEvent,
    approveEvent,
    rejectEvent,
    cancelEvent,
  } = useEvents();

  const { halls } = useHallsAndEquipment();

  const filteredEvents =
    selectedHallId === 'all'
      ? events
      : events.filter((e) => e.hall === Number(selectedHallId));

  const calendarEvents = filteredEvents.map((ev) => {
    let bg = '#059669'; // Emerald for APPROVED
    let border = '#047857';

    if (ev.status === 'PENDING') {
      bg = '#d97706'; // Amber
      border = '#b45309';
    } else if (ev.status === 'REJECTED') {
      bg = '#e11d48'; // Rose
      border = '#be123c';
    } else if (ev.status === 'CANCELLED') {
      bg = '#64748b'; // Slate
      border = '#475569';
    }

    return {
      id: String(ev.id),
      title: `${ev.title} (${ev.hall_details?.name || 'Hall'})`,
      start: ev.start,
      end: ev.end,
      backgroundColor: bg,
      borderColor: border,
      textColor: '#ffffff',
      extendedProps: {
        rawEvent: ev,
      },
    };
  });

  const handleDateSelect = (selectInfo: { startStr: string; endStr: string }) => {
    if (isAuthenticated && (role === 'FACULTY' || role === 'ADMIN')) {
      const hallParam = selectedHallId !== 'all' ? `&hall=${selectedHallId}` : '';
      navigate(`/events/new?start=${encodeURIComponent(selectInfo.startStr)}&end=${encodeURIComponent(selectInfo.endStr)}${hallParam}`);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event.extendedProps.rawEvent as Event);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-slate-700" />
            <span>Campus Event & Booking Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual conflict schedule. Click on any open slot to reserve a hall.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hall Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="all">All Campus Halls ({halls.length})</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} (Cap: {h.capacity})
                </option>
              ))}
            </select>
          </div>

          {(role === 'FACULTY' || role === 'ADMIN') && (
            <button
              onClick={() => navigate('/events/new')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Time Slot</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={refreshEvents} />}

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-5">
          <span className="font-semibold text-slate-800">Status Color Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 shrink-0" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 shrink-0" />
            <span>Pending Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-500 shrink-0" />
            <span>Cancelled</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Click any event to inspect venue details or register</span>
        </div>
      </div>

      {/* FullCalendar Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        {isLoading && events.length === 0 ? (
          <LoadingSpinner message="Loading calendar events..." className="min-h-[500px]" />
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={calendarEvents}
            selectable={Boolean(isAuthenticated && (role === 'FACULTY' || role === 'ADMIN'))}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            aspectRatio={1.65}
          />
        )}
      </div>

      {/* Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={registerForEvent}
        onUnregister={unregisterFromEvent}
        onApprove={approveEvent}
        onReject={rejectEvent}
        onCancel={cancelEvent}
      />
    </div>
  );
};
