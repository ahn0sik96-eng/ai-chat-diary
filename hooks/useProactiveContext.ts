import { useEffect, useState } from 'react';
import { getWeather, weatherToContext } from '../utils/weather';
import { getTodaySteps, stepsToContext } from '../utils/health';
import { getDeviceCalendarEvents, formatEventTime } from '../utils/calendar';
import { buildProactiveContext, ProactiveContext } from '../utils/memory';

/**
 * Aggregates all context data (device calendar, weather, steps, memory)
 * for generating the proactive AI opener message.
 * All external calls fail silently — the opener still works with partial data.
 */
export function useProactiveContext() {
  const [context, setContext] = useState<ProactiveContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = new Date();

      // Gather all context in parallel, failures are silent
      const [weatherResult, stepsResult, calResult] = await Promise.allSettled([
        getWeather(),
        getTodaySteps(),
        getDeviceCalendarEvents(today),
      ]);

      if (cancelled) return;

      const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
      const steps = stepsResult.status === 'fulfilled' ? stepsResult.value : null;
      const calEvents = calResult.status === 'fulfilled' ? calResult.value : [];

      // Map device calendar events to schedule format
      const todaySchedules = calEvents.map((e) => ({
        title: e.title,
        time: e.allDay ? undefined : formatEventTime(e.startDate),
      }));

      const ctx = await buildProactiveContext(todaySchedules, {
        weatherContext: weather ? weatherToContext(weather) ?? undefined : undefined,
        stepsContext: steps ? stepsToContext(steps) ?? undefined : undefined,
      });

      if (!cancelled) {
        setContext(ctx);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { context, loading };
}
