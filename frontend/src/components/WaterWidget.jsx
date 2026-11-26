import { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import { logWater, getTodayWater } from '../api';

const QUICK_AMOUNTS = [250, 500, 1000];
const litres = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export default function WaterWidget() {
  const [data, setData] = useState(null);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getTodayWater().then((response) => {
      if (active) setData(response.data.data);
    }).catch(() => { if (active) setError('Could not load water intake.'); });
    return () => { active = false; };
  }, [attempt]);

  async function addWater(amount) {
    setLogging(true);
    setError('');
    try {
      await logWater({ amount });
      setData((current) => ({ ...current, totalToday: current.totalToday + amount }));
      setAttempt((value) => value + 1);
    } catch {
      setError('Could not log water. Try again.');
    } finally {
      setLogging(false);
    }
  }

  return (
    <section className="panel widget stack">
      <h2><Droplets size={19} aria-hidden="true" /> Water today</h2>
      {data ? (
        <>
          <div className="widget-stat" aria-live="polite">
            <strong>{litres.format(data.totalToday / 1000)} L</strong><span className="muted"> / {litres.format(data.goal / 1000)} L</span>
          </div>
          <progress aria-label="Daily water goal" value={Math.min(data.totalToday, data.goal)} max={Math.max(1, data.goal)} />
          <div className="quick-actions">
            {QUICK_AMOUNTS.map((amount) => (
              <button className="button" type="button" key={amount} disabled={logging} onClick={() => addWater(amount)}>+{amount} ml</button>
            ))}
          </div>
        </>
      ) : !error && <p className="muted small" role="status">Loading water intake…</p>}
      {error && (
        <div className="with-action small" role="status">
          <span>{error}</span>
          {!data && <button className="text-button" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</button>}
        </div>
      )}
    </section>
  );
}
