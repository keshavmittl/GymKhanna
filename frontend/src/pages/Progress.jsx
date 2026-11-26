import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getWeightHistory, getSessions } from '../api';
import PRList from '../components/PRList';

const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const tooltip = {
  contentStyle: { backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px' },
  itemStyle: { color: 'var(--ink)' },
};
const axis = { tickLine: false, axisLine: false, tick: { fill: 'var(--muted)', fontSize: 12 } };

export default function Progress() {
  const [weight, setWeight] = useState(null);
  const [volume, setVolume] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getWeightHistory().then((response) => {
      if (!active) return;
      setWeight(response.data.data.entries.map((entry) => ({
        date: dateLabel.format(new Date(entry.date)), weight: entry.weight,
      })));
    }).catch(() => { if (active) setWeight(false); });
    getSessions().then((response) => {
      if (!active) return;
      const sessions = [...response.data.data.sessions].reverse();
      setVolume(sessions.map((session) => ({
        date: dateLabel.format(new Date(session.date)), volume: session.totalVolume,
      })));
    }).catch(() => { if (active) setVolume(false); });
    return () => { active = false; };
  }, [attempt]);

  function retry() {
    if (weight === false) setWeight(null);
    if (volume === false) setVolume(null);
    setAttempt((value) => value + 1);
  }

  return (
    <div className="page">
      <header className="page-head"><div><h1>Progress</h1><p className="muted">See how your lifts and body weight change over time.</p></div></header>
      {(weight === false || volume === false) && (
        <div className="notice error with-action" role="status">
          <span>Some progress data could not load.</span><button className="text-button" onClick={retry}>Retry</button>
        </div>
      )}
      <div className="charts-grid">
        <section className="panel widget stack">
          <h2>Workout volume</h2>
          {volume?.length ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume} title="Workout volume in kilograms" margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="date" {...axis} minTickGap={20} />
                  <YAxis {...axis} width={56} />
                  <Tooltip {...tooltip} formatter={(value) => [`${value} kg`, 'Volume']} />
                  <Bar dataKey="volume" fill="var(--accent)" radius={[5, 5, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="muted empty" role="status">{volume === false ? 'Workout volume is unavailable.' : !volume ? 'Loading workout volume…' : 'Log a workout to see its volume here.'}</p>}
        </section>
        <section className="panel widget stack">
          <h2>Body weight trend</h2>
          {weight?.length >= 2 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weight} title="Body weight in kilograms" margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="date" {...axis} minTickGap={20} />
                  <YAxis {...axis} domain={['dataMin - 2', 'dataMax + 2']} width={46} />
                  <Tooltip {...tooltip} formatter={(value) => [`${value} kg`, 'Weight']} />
                  <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="muted empty" role="status">{weight === false ? 'Body weight is unavailable.' : !weight ? 'Loading body weight…' : 'Log at least two weigh-ins to see a trend.'}</p>}
        </section>
      </div>
      <div className="progress-records"><PRList /></div>
    </div>
  );
}
