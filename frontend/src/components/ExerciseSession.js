import React from "react";
import usePoseAnalyzer from "./usePoseAnalyzer";

export default function ExerciseSession() {
  const { videoRef } = usePoseAnalyzer("squat"); // change to "pushup" or "lunge"

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Squat Analysis</h2>
      <video ref={videoRef} autoPlay playsInline className="rounded-xl shadow-lg" />
    </div>
  );
}
