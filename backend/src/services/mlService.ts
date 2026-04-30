import axios from "axios";

const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:8001";

/**
 * Maps database exercise names to ML engine expected enum values
 */
const mapExerciseType = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase();
  
  if (name.includes("squat")) return "squat";
  if (name.includes("pushup") || name.includes("push-up")) return "pushup";
  if (name.includes("lunge")) return "lunge";
  if (name.includes("plank")) return "plank";
  if (name.includes("knee extension")) return "knee_extension";
  if (name.includes("shoulder abduction")) return "shoulder_abduction";
  
  return "squat"; // Default fallback
};

/**
 * Transforms landmarks from array of arrays [x, y, z, v] to objects {x, y, z, visibility}
 */
const transformLandmarks = (landmarks: any[]) => {
  return landmarks.map(lm => {
    if (Array.isArray(lm)) {
      return {
        x: lm[0] || 0,
        y: lm[1] || 0,
        z: lm[2] || 0,
        visibility: lm[3] || 1.0
      };
    }
    return lm; // Already an object
  });
};

export const analyzePose = async (landmarks: any[], exerciseName: string = "squat", sessionId: string = "default") => {
  try {
    const exercise = mapExerciseType(exerciseName);
    const formattedLandmarks = transformLandmarks(landmarks);

    // Connect to Python ML backend with PoseData structure including sessionId
    const res = await axios.post(`${ML_BACKEND_URL}/predict`, { 
      landmarks: formattedLandmarks,
      exercise: exercise,
      sessionId: sessionId
    });
    
    return res.data;
  } catch (err) {
    
    
    // Mock analysis for development/testing
    return mockPoseAnalysis(landmarks, exerciseName, sessionId);
  }
};

/**
 * Sends a video URL to the ML backend for full asynchronous processing
 */
export const processSessionVideo = async (sessionId: string, videoUrl: string, exerciseName: string) => {
  try {
    const exercise = mapExerciseType(exerciseName);
    
    const res = await axios.post(`${ML_BACKEND_URL}/process-video`, {
      video_url: videoUrl,
      exercise: exercise,
      sessionId: sessionId
    });
    
    return res.data;
  } catch (err) {
    
    return { success: false, error: "ML Backend unavailable" };
  }
};

const sessionStates: Record<string, { repCount: number, stage: string }> = {};

const calculateAngle = (a: any, b: any, c: any) => {
  const getPoint = (p: any) => {
    if (Array.isArray(p)) return { x: p[0], y: p[1] };
    return p;
  };
  const p1 = getPoint(a);
  const p2 = getPoint(b);
  const p3 = getPoint(c);
  
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

// Mock pose analysis function for development
const mockPoseAnalysis = (landmarks: any, exerciseName: string, sessionId: string) => {
  const name = exerciseName.toLowerCase();
  
  if (!sessionStates[sessionId]) {
    sessionStates[sessionId] = { repCount: 0, stage: 'up' };
  }
  const state = sessionStates[sessionId];

  let accuracy = 85;
  let feedback = ["Good posture!"];
  let angles: any = {};

  // Basic rep counting logic for common exercises
  try {
    if (name.includes('squat')) {
      const hip = landmarks[23];
      const knee = landmarks[25];
      const ankle = landmarks[27];
      if (hip && knee && ankle) {
        const angle = calculateAngle(hip, knee, ankle);
        angles.knee = Math.round(angle);
        if (angle < 120) state.stage = 'down';
        else if (angle > 160 && state.stage === 'down') {
          state.repCount++;
          state.stage = 'up';
        }
        if (state.stage === 'down' && angle > 130) feedback.push("Go lower!");
      }
    } else if (name.includes('push') || name.includes('push-up')) {
      const shoulder = landmarks[11];
      const elbow = landmarks[13];
      const wrist = landmarks[15];
      if (shoulder && elbow && wrist) {
        const angle = calculateAngle(shoulder, elbow, wrist);
        angles.elbow = Math.round(angle);
        if (angle < 100) state.stage = 'down';
        else if (angle > 150 && state.stage === 'down') {
          state.repCount++;
          state.stage = 'up';
        }
      }
    }
  } catch (e) {
    // Ignore calculation errors
  }

  // Visual checks
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const sDiff = Array.isArray(leftShoulder) ? Math.abs(leftShoulder[1] - rightShoulder[1]) : Math.abs(leftShoulder.y - rightShoulder.y);
    if (sDiff > 0.1) {
      accuracy -= 15;
      feedback.push("Keep your shoulders level");
    }
  }

  const isCorrectForm = accuracy > 75;

  return {
    exercise: name,
    accuracy: Math.max(60, Math.min(95, accuracy)),
    feedback: feedback,
    angles: angles,
    repCount: state.repCount,
    isCorrectForm: isCorrectForm,
    confidence: accuracy / 100
  };
};
