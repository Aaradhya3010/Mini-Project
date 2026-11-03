import { useState, useEffect, useCallback } from 'react';
import { Event, EventQueryParams } from '../types';
import { eventsApi } from '../services/api';

export const useEvents = (initialParams?: EventQueryParams) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<EventQueryParams | undefined>(initialParams);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.list(params);
      setEvents(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const registerForEvent = async (eventId: number) => {
    const res = await eventsApi.register(eventId);
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? res.event : ev))
    );
    return res;
  };

  const unregisterFromEvent = async (eventId: number) => {
    const res = await eventsApi.unregister(eventId);
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? res.event : ev))
    );
    return res;
  };

  const approveEvent = async (eventId: number) => {
    const updated = await eventsApi.approve(eventId);
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? updated : ev))
    );
    return updated;
  };

  const rejectEvent = async (eventId: number) => {
    const updated = await eventsApi.reject(eventId);
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? updated : ev))
    );
    return updated;
  };

  const cancelEvent = async (eventId: number) => {
    const updated = await eventsApi.cancel(eventId);
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? updated : ev))
    );
    return updated;
  };

  return {
    events,
    isLoading,
    error,
    params,
    setParams,
    refreshEvents: fetchEvents,
    registerForEvent,
    unregisterFromEvent,
    approveEvent,
    rejectEvent,
    cancelEvent,
  };
};
