import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const month = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const dateLabel = new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' });

export default function SessionList({ sessions }) {
  return (
    <ul className="session-list">
      {sessions.map((session) => {
        const date = new Date(session.date);
        const exerciseCount = session.exercises.length;
        const setCount = session.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);
        return (
          <li key={session._id}>
            <Link to={`/session/${session._id}`} className="session-row">
              <time className="date-block" dateTime={date.toISOString()} aria-label={dateLabel.format(date)}>
                <strong>{date.getDate()}</strong><span>{month.format(date)}</span>
              </time>
              <span className="session-name">
                <strong>{session.name}</strong>
                <small>{exerciseCount} exercise{exerciseCount === 1 ? '' : 's'} · {setCount} set{setCount === 1 ? '' : 's'}</small>
              </span>
              <span className="session-volume">
                <strong>{number.format(session.totalVolume)} kg</strong>
                {session.prs.length > 0 && <small>{session.prs.length} PR{session.prs.length === 1 ? '' : 's'}</small>}
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
