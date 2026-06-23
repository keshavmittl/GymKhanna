import { useState, useEffect } from "react";
import { getSessionById, deleteSession } from "../api";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await getSessionById(id);
        setSession(response.data.data.session);
      } catch (err) {
        setError("Session not found");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this session? This can't be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteSession(id);
      navigate("/");
    } catch (err) {
      alert("Failed to delete session.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#666] flex items-center justify-center font-sans">
        Loading session…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans gap-4">
        <p className="text-[#666]">{error || "Something went wrong"}</p>
        <Link to="/" className="text-[#e0322f] text-sm hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-[#666] text-sm hover:text-[#e0322f] transition-colors"
          >
            ← Back
          </Link>
          <button
            onClick={handleDelete}
            className="text-[#666] hover:text-[#e0322f] text-xs font-semibold uppercase tracking-wide transition-colors"
          >
            Delete Session
          </button>
        </div>

        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold mb-1">{session.name}</h1>
          <p className="text-[#666] text-sm">
            {new Date(session.date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl px-5 py-4 mb-8 flex justify-between">
          <div>
            <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">
              Total Volume
            </p>
            <p className="text-2xl font-bold">
              {session.totalVolume.toLocaleString()} kg
            </p>
          </div>
          <div>
            <p className="text-[#666] text-xs uppercase tracking-wide font-semibold mb-1">
              Exercises
            </p>
            <p className="text-2xl font-bold">{session.exercises.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {session.exercises.map((ex) => {
            const exerciseVolume = ex.sets.reduce(
              (sum, set) => sum + set.reps * set.weight,
              0,
            );
            return (
              <div
                key={ex._id}
                className="bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-[#666] text-xs">
                    {exerciseVolume.toLocaleString()} kg volume
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-[#666] font-semibold uppercase tracking-wide px-1 mb-1.5">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight</span>
                </div>
                {ex.sets.map((set, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-3 gap-2 py-1.5 text-sm border-t border-[#1f1f1f]"
                  >
                    <span className="text-[#888]">{idx + 1}</span>
                    <span>{set.reps}</span>
                    <span>{set.weight} kg</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
