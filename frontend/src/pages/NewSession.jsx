import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getExercises, createSession } from "../api";

export default function NewSession() {
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await getExercises();
        setExercises(response.data.data.exercises);
      } catch (error) {
        console.error("Failed to load exercises:", error);
      } finally {
        setLoadingExercises(false);
      }
    };
    fetchExercises();
  }, []);

  const groupedExercises = useMemo(() => {
    const groups = {};
    for (const ex of exercises) {
      if (!groups[ex.muscleGroup]) groups[ex.muscleGroup] = [];
      groups[ex.muscleGroup].push(ex);
    }
    return groups;
  }, [exercises]);

  const addExercise = (exercise) => {
    const alreadyAdded = selectedExercises.some(
      (e) => e.exerciseId === exercise._id,
    );
    if (alreadyAdded) return;
    setSelectedExercises([
      ...selectedExercises,
      {
        exerciseId: exercise._id,
        name: exercise.name,
        sets: [{ reps: "", weight: "", completed: true }],
      },
    ]);
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(
      selectedExercises.filter((e) => e.exerciseId !== exerciseId),
    );
  };
  const updateSet = (exerciseId, setIndex, field, value) => {
    setSelectedExercises(
      selectedExercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;

        const updatedSets = ex.sets.map((set, idx) =>
          idx === setIndex ? { ...set, [field]: value } : set,
        );

        return { ...ex, sets: updatedSets };
      }),
    );
  };

  const addSet = (exerciseId) => {
    setSelectedExercises(
      selectedExercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return {
          ...ex,
          sets: [...ex.sets, { reps: "", weight: "", completed: true }],
        };
      }),
    );
  };

  const removeSet = (exerciseId, setIndex) => {
    setSelectedExercises(
      selectedExercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((_, idx) => idx !== setIndex) };
      }),
    );
  };

  const handleSubmit = async () => {
    if (!sessionName.trim()) {
      alert("Please name your session");
      return;
    }
    if (selectedExercises.length === 0) {
      alert("Add at least one exercise");
      return;
    }

    const cleanedExercises = selectedExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets.map((set) => ({
        reps: Number(set.reps) || 0,
        weight: Number(set.weight) || 0,
        completed: set.completed,
      })),
    }));

    setSubmitting(true);
    try {
      const response = await createSession({
        name: sessionName,
        exercises: cleanedExercises,
      });
      const sessionId = response.data.data.session._id;
      navigate(`/session/${sessionId}`);
    } catch (error) {
      console.error("Failed to save session:", error);
      alert("Failed to save session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const isSelected = (id) => selectedExercises.some((e) => e.exerciseId === id);

  if (loadingExercises) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-500 flex items-center justify-center font-sans">
        Loading exercises…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#e0322f] text-xs font-bold tracking-[0.2em] uppercase mb-2">
            New Session
          </p>
          <input
            type="text"
            placeholder="Name this session — Push Day, Leg Day…"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full bg-transparent text-3xl font-bold placeholder-[#3a3a3a] outline-none border-b-2 border-[#1f1f1f] focus:border-[#e0322f] pb-3 transition-colors"
          />
        </div>

        {/* Selected exercises */}
        {selectedExercises.length === 0 ? (
          <div className="border border-dashed border-[#262626] rounded-xl py-10 text-center">
            <p className="text-[#555] text-sm">
              Nothing added yet — pick exercises from the library below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedExercises.map((ex) => (
              <div
                key={ex.exerciseId}
                className="bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{ex.name}</span>
                  <button
                    onClick={() => removeExercise(ex.exerciseId)}
                    className="text-[#555] hover:text-[#e0322f] text-xs font-semibold uppercase tracking-wide transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-xs text-[#666] font-semibold uppercase tracking-wide px-1">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight (kg)</span>
                    <span></span>
                  </div>

                  {ex.sets.map((set, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center"
                    >
                      <span className="text-sm text-[#888] font-medium">
                        {idx + 1}
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(ex.exerciseId, idx, "reps", e.target.value)
                        }
                        className="bg-[#1c1c1c] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#e0322f] w-full"
                      />
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight}
                        onChange={(e) =>
                          updateSet(
                            ex.exerciseId,
                            idx,
                            "weight",
                            e.target.value,
                          )
                        }
                        className="bg-[#1c1c1c] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#e0322f] w-full"
                      />
                      <button
                        onClick={() => removeSet(ex.exerciseId, idx)}
                        disabled={ex.sets.length === 1}
                        className="text-[#555] hover:text-[#e0322f] disabled:opacity-20 disabled:hover:text-[#555] text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addSet(ex.exerciseId)}
                  className="mt-3 text-xs font-semibold text-[#e0322f] hover:text-[#ff4d4a] uppercase tracking-wide transition-colors"
                >
                  + Add Set
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Library */}
        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-[#666] mb-4">
            Exercise Library
          </h2>

          <div className="space-y-7">
            {Object.entries(groupedExercises).map(([muscleGroup, list]) => (
              <div key={muscleGroup}>
                <h3 className="text-sm font-bold text-[#888] mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e0322f]" />
                  {muscleGroup}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {list.map((exercise) => {
                    const selected = isSelected(exercise._id);
                    return (
                      <button
                        key={exercise._id}
                        onClick={() => addExercise(exercise)}
                        disabled={selected}
                        className={`text-left text-sm rounded-lg px-3.5 py-2.5 transition-colors border ${
                          selected
                            ? "bg-[#1a1010] border-[#3a1a1a] text-[#e0322f]/60 cursor-default"
                            : "bg-[#121212] border-[#1f1f1f] hover:border-[#e0322f]/40 hover:bg-[#161111] text-[#ddd]"
                        }`}
                      >
                        {exercise.name}
                        {selected && (
                          <span className="ml-2 text-xs">✓ added</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="fixed bottom-6 right-6 bg-[#e0322f] hover:bg-[#c92825] disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-full shadow-lg shadow-[#e0322f]/20 transition-colors"
        >
          {submitting ? "Saving…" : "Save Session"}
        </button>
      </div>
    </div>
  );
}
