import React, { useState } from "react";
import usePoseAnalyzer from "../hooks/usePoseAnalyzer";

export default function ExerciseSession({ sessionId }: { sessionId: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Hook: analyze in real-time
  const { videoRef } = usePoseAnalyzer(sessionId);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Exercise Session</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-xl shadow-lg border border-gray-300"
      />

      {accuracy !== null && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow">
          <p>✅ Accuracy: {accuracy}%</p>
          <p>💡 Feedback: {feedback}</p>
        </div>
      )}
    </div>
  );
}
