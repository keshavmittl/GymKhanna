import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getWeightHistory, getSessions } from "../api";

export default function Progress() {
  const [weightData, setWeightData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weightRes, sessionsRes] = await Promise.all([
          getWeightHistory(),
          getSessions(),
        ]);

        const weightEntries = weightRes.data.data.entries;
        const formattedWeight = weightEntries.map((entry) => ({
          date: new Date(entry.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          weight: entry.weight,
        }));
        setWeightData(formattedWeight);

        const sessions = sessionsRes.data.data.sessions;
        const sortedSessions = [...sessions].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        const formattedVolume = sortedSessions.map((session) => ({
          date: new Date(session.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
          volume: session.totalVolume,
        }));
        setVolumeData(formattedVolume);
      } catch (error) {
        console.error("Failed to load progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#666] flex items-center justify-center font-sans">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-[#e0322f] text-xs font-bold tracking-[0.2em] uppercase mb-1">
          Progress
        </p>
        <h1 className="text-3xl font-bold mb-8">Your Trends</h1>

        <h2 className="text-sm font-bold text-[#888] mb-3">Weight Trend</h2>
        {weightData.length < 2 ? (
          <p className="text-[#555] text-sm mb-8">
            Log at least 2 weight entries to see a trend.
          </p>
        ) : (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 h-72 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1c1c",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f5f5f5" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#e0322f"
                  strokeWidth={2}
                  dot={{ fill: "#e0322f", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <h2 className="text-sm font-bold text-[#888] mb-3">Session Volume</h2>
        {volumeData.length === 0 ? (
          <p className="text-[#555] text-sm">
            Log a session to see your volume trend.
          </p>
        ) : (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1c1c",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f5f5f5" }}
                />
                <Bar dataKey="volume" fill="#e0322f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
