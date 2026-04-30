import { useEffect, useRef } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import apiService from "../services/api";

export default function usePoseAnalyzer(sessionId: string) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(async (results) => {
      if (results.poseLandmarks) {
        try {
          // Convert poseLandmarks to the format expected by analyzePose
          const landmarks = results.poseLandmarks.map(landmark => [
            landmark.x,
            landmark.y,
            landmark.z,
            landmark.visibility || 0
          ]);
          const res = await apiService.analyzePose(sessionId, landmarks);
          
        } catch (err) {
          
        }
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }, []);

  return { videoRef };
}
