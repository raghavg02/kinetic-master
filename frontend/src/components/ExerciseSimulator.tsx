import React, { useEffect, useRef, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface SkeletonFrame {
  points: { [key: string]: Point };
}

interface ExerciseSimulatorProps {
  exerciseName: string;
  isRecording: boolean;
  speed?: number;
  activeMistake?: string | null;
}

const ExerciseSimulator: React.FC<ExerciseSimulatorProps> = ({ 
  exerciseName, 
  isRecording,
  speed = 1,
  activeMistake = null
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  // Procedural keyframes for different exercises
  const getFrames = useCallback((name: string, isMistake: boolean = false): SkeletonFrame[] => {
    const n = name.toLowerCase();
    const mistake = activeMistake?.toLowerCase() || '';
    
    // Squat simulation
    if (n.includes('squat')) {
      return Array.from({ length: 60 }, (_, i) => {
        const t = Math.sin((i / 60) * Math.PI); 
        let squatDepth = t * 0.3;
        
        // Simulate "Go Lower" mistake
        if (isMistake && (mistake.includes('lower') || mistake.includes('depth'))) {
            squatDepth = t * 0.12; // Shallow squat
        }

        return {
          points: {
            head: { x: 0.5, y: 0.1 + squatDepth },
            shoulder: { x: 0.5, y: 0.2 + squatDepth },
            hip: { x: 0.5, y: 0.5 + squatDepth },
            knee_l: { x: 0.4, y: 0.7 + squatDepth * 0.5 },
            knee_r: { x: 0.6, y: 0.7 + squatDepth * 0.5 },
            ankle_l: { x: 0.4, y: 0.9 },
            ankle_r: { x: 0.6, y: 0.9 }
          }
        };
      });
    }
    
    // Pushup simulation
    if (n.includes('pushup')) {
      return Array.from({ length: 60 }, (_, i) => {
        const t = Math.sin((i / 60) * Math.PI);
        let pushDepth = t * 0.15;

        // Simulate "Hips too high" mistake
        let hipY = 0.6;
        if (isMistake && (mistake.includes('hip') || mistake.includes('high'))) {
            hipY = 0.45; 
        }

        return {
          points: {
            head: { x: 0.2, y: 0.55 + pushDepth },
            shoulder: { x: 0.3, y: 0.6 + pushDepth },
            elbow: { x: 0.35, y: 0.75 + pushDepth * 0.3 },
            hip: { x: 0.6, y: hipY },
            ankle: { x: 0.9, y: 0.6 }
          }
        };
      });
    }

    // Default standing/idle
    return [{
      points: {
        head: { x: 0.5, y: 0.1 },
        shoulder: { x: 0.5, y: 0.2 },
        hip: { x: 0.5, y: 0.5 },
        knee_l: { x: 0.4, y: 0.7 },
        knee_r: { x: 0.6, y: 0.7 },
        ankle_l: { x: 0.4, y: 0.9 },
        ankle_r: { x: 0.6, y: 0.9 }
      }
    }];
  }, [activeMistake]);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, frame: SkeletonFrame, color: string, alpha: number = 1) => {
    const { width, height } = ctx.canvas;
    const pts = frame.points;
    const scale = (p: Point) => ({ x: p.x * width, y: p.y * height });

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawLine = (p1: Point, p2: Point) => {
      const s1 = scale(p1);
      const s2 = scale(p2);
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
    };

    if (pts.head) {
        const head = scale(pts.head);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    if (pts.head && pts.shoulder) drawLine(pts.head, pts.shoulder);
    if (pts.shoulder && pts.hip) drawLine(pts.shoulder, pts.hip);
    if (pts.hip && pts.knee_l) drawLine(pts.hip, pts.knee_l);
    if (pts.knee_l && pts.ankle_l) drawLine(pts.knee_l, pts.ankle_l);
    if (pts.hip && pts.knee_r) drawLine(pts.hip, pts.knee_r);
    if (pts.knee_r && pts.ankle_r) drawLine(pts.knee_r, pts.ankle_r);
    if (pts.knee && !pts.knee_l) drawLine(pts.hip, pts.knee);
    if (pts.knee && pts.ankle) drawLine(pts.knee, pts.ankle);
    if (pts.shoulder && pts.elbow_l) drawLine(pts.shoulder, pts.elbow_l);
    if (pts.elbow_l && pts.wrist_l) drawLine(pts.elbow_l, pts.wrist_l);
    if (pts.shoulder && pts.elbow_r) drawLine(pts.shoulder, pts.elbow_r);
    if (pts.elbow_r && pts.wrist_r) drawLine(pts.elbow_r, pts.wrist_r);
    
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const correctFrames = getFrames(exerciseName, false);
    const mistakeFrames = getFrames(exerciseName, true);
    
    let frameId: number;
    const animate = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      frameRef.current = (frameRef.current + speed) % correctFrames.length;
      const idx = Math.floor(frameRef.current);

      if (activeMistake) {
        // Draw mistake form in RED
        drawSkeleton(ctx, mistakeFrames[idx], '#ef4444', 1.0);
        // Draw correct form as a GHOST overlay in GREEN
        drawSkeleton(ctx, correctFrames[idx], '#22c55e', 0.3);
      } else {
        // Just draw correct form normally in INDIGO
        drawSkeleton(ctx, correctFrames[idx], '#4f46e5', 1.0);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [exerciseName, speed, activeMistake, getFrames]);

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded w-fit ${activeMistake ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {activeMistake ? 'Mistake Detected' : 'Guide'}
        </span>
        {activeMistake && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider rounded w-fit">
                Follow Green Ghost
            </span>
        )}
      </div>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={200} 
        className="w-full h-40 object-contain"
      />
      <div className={`p-2 border-t ${activeMistake ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
        <p className={`text-[10px] text-center font-bold uppercase ${activeMistake ? 'text-red-600' : 'text-indigo-600'}`}>
          {activeMistake ? activeMistake : 'WATCH & FOLLOW THIS MOTION'}
        </p>
      </div>
    </div>
  );
};

export default ExerciseSimulator;
