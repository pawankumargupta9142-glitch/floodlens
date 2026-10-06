import { useMemo, useState } from 'react';
import { EventCard } from '../components/history/EventCard';
import type { HistoricalEvent } from '../types/events';
import styles from './EventsPage.module.css';

interface EventsPageProps {
  events: HistoricalEvent[];
  loading: boolean;
}

export function EventsPage({ events, loading }: EventsPageProps) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'country' | 'id'>('newest');

  const filteredEvents = useMemo(() => {
    const next = events.filter((event) => {
      const haystack = `${event.primaryCountry} ${event.countries} ${event.dfoId} ${event.referenceType}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });

    return [...next].sort((a, b) => {
      switch (sortBy) {
        case 'country':
          return a.primaryCountry.localeCompare(b.primaryCountry) || new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'id':
          return b.dfoId - a.dfoId;
        case 'newest':
        default:
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
    });
  }, [events, query, sortBy]);

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHead}>
        <span className={styles.eyebrow}>Validation record</span>
        <h1 className={styles.heading}>Checked against real historical floods</h1>
        <p className={styles.lede}>
          Predictions are only trustworthy if they line up with what actually happened. Each
          entry below is a real, satellite-derived flood event used to validate spatial output —
          never used to train the model itself.
        </p>
      </div>

      {!loading && events.length > 0 && (
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or event ID"
              aria-label="Search flood events"
            />
          </label>

          <label className={styles.sorter}>
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'newest' | 'country' | 'id')} aria-label="Sort events">
              <option value="newest">Newest</option>
              <option value="country">Location</option>
              <option value="id">Event ID</option>
            </select>
          </label>
        </div>
      )}

      {loading ? (
        <div className={styles.skeleton} />
      ) : filteredEvents.length === 0 ? (
        <div className={styles.empty}>
          <p>No active flood events</p>
          <span>New events will appear here when detected.</span>
        </div>
      ) : (
        <div className={styles.page}>
          {filteredEvents.map((event) => (
            <EventCard key={event.dfoId} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
