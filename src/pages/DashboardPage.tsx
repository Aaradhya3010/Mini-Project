import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Building2,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useHallsAndEquipment } from '../hooks/useHallsAndEquipment';
import { EventCard } from '../components/EventCard';
import { EventDetailModal } from '../components/EventDetailModal';
import { LoadingSpinner, ErrorBanner } from '../components/Feedback';
import { Event } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    refreshEvents,
    registerForEvent,
    unregisterFromEvent,
    approveEvent,
    rejectEvent,
    cancelEvent,
  } = useEvents();

  const { halls, equipmentList } = useHallsAndEquipment();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const isAdmin = role === 'ADMIN';
  const isFaculty = role === 'FACULTY';
  const isStudent = role === 'STUDENT';

  // Derived filtered events
  const pendingEvents = events.filter((e) => e.status === 'PENDING');
  const approvedEvents = events.filter((e) => e.status === 'APPROVED');
  const myRegisteredEvents = events.filter((e) => e.is_registered_by_me);
  const myOrganizedEvents = events.filter((e) => user && e.organizer === user.id);

  const totalEquipmentUnits = equipmentList.reduce(
    (acc, curr) => acc + curr.total_quantity,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isAdmin ? 'System Administrator Portal' : isFaculty ? 'Faculty Workspace' : 'Student Hub'}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome back, {user?.first_name || user?.username}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time schedule coordinator and venue booking management
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(isFaculty || isAdmin) && (
            <Link
              to="/events/new"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Venue</span>
            </Link>
          )}
          <Link
            to="/calendar"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Campus Calendar</span>
          </Link>
        </div>
      </div>

      {eventsError && <ErrorBanner message={eventsError} onRetry={refreshEvents} />}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {pendingEvents.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting administrative decision</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Active Halls</span>
                <Building2 className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {halls.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Bookable campus venues</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Equipment Units</span>
                <Layers className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {totalEquipmentUnits}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Across {equipmentList.length} categories</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Approved Events</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {approvedEvents.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Scheduled on campus</div>
            </div>
          </>
        )}

        {isFaculty && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>My Events</span>
                <Calendar className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {myOrganizedEvents.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Created under your account</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {myOrganizedEvents.filter((e) => e.status === 'PENDING').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting admin sign-off</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Approved Sessions</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {myOrganizedEvents.filter((e) => e.status === 'APPROVED').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Confirmed hall reservations</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Campus Venues</span>
                <Building2 className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {halls.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Available for booking</div>
            </div>
          </>
        )}

        {isStudent && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>My Registrations</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {myRegisteredEvents.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Confirmed event passes</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Upcoming Events</span>
                <Calendar className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {approvedEvents.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Open campus events</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Campus Halls</span>
                <Building2 className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {halls.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Active venues</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Student Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-semibold text-slate-900 mt-1">
                Active Member
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Ready for registrations</div>
            </div>
          </>
        )}
      </div>

      {/* Admin Action Section: Pending Queue */}
      {isAdmin && pendingEvents.length > 0 && (
        <section className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-bold text-slate-900">
                Action Required: Pending Event Approvals ({pendingEvents.length})
              </h2>
            </div>
            <Link
              to="/admin/approvals"
              className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingEvents.slice(0, 3).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={setSelectedEvent}
              />
            ))}
          </div>
        </section>
      )}

      {/* Student: My Registered Events */}
      {isStudent && myRegisteredEvents.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              My Registered Events ({myRegisteredEvents.length})
            </h2>
            <Link
              to="/events"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRegisteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={setSelectedEvent}
              />
            ))}
          </div>
        </section>
      )}

      {/* Faculty: My Submissions */}
      {isFaculty && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              My Event Bookings ({myOrganizedEvents.length})
            </h2>
            <Link
              to="/events/new"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Submit New Booking</span>
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myOrganizedEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <p className="text-sm">You haven't scheduled any campus events yet.</p>
              <Link
                to="/events/new"
                className="mt-3 inline-block px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Create Your First Booking
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myOrganizedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={setSelectedEvent}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* General Section: Upcoming Campus Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Upcoming Campus Events
          </h2>
          <Link
            to="/events"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <span>All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {eventsLoading ? (
          <LoadingSpinner message="Fetching campus events..." />
        ) : approvedEvents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            <p className="text-sm">No approved campus events found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvents.slice(0, 6).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={setSelectedEvent}
                onRegister={isStudent ? registerForEvent : undefined}
              />
            ))}
          </div>
        )}
      </section>

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
