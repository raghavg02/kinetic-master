import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  Camera, 
  CameraOff, 
  CheckCircle,
  AlertCircle,
  Target,
  Clock,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Exercise, RealTimeFeedback, ExerciseSession } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PostureGuidance from '../components/PostureGuidance';
import ExerciseFormGuidance from '../components/ExerciseFormGuidance';
import ExerciseSelector from '../components/ExerciseSelector';
import { Pose } from '@mediapipe/pose';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import ExerciseSimulator from '../components/ExerciseSimulator';

const LiveExercisePage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [feedback, setFeedback] = useState<RealTimeFeedback | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [currentPosture, setCurrentPosture] = useState<string>('');
  const [poseDetected, setPoseDetected] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [sessionLimit, setSessionLimit] = useState<number | null>(null);
  const [inputMinutes, setInputMinutes] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);

  useEffect(() => {
    const fetchExercise = async () => {
      if (exerciseId && exerciseId !== 'new') {
        try {
          const response = await apiService.getExercise(exerciseId);
          if (response.success && response.data) {
            setExercise(response.data);
          } else {
            setError('Failed to load exercise details: ' + (response.message || 'Unknown error'));
          }
        } catch (error) {
          
          setError('Failed to load exercise details: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else if (exerciseId === 'new' || !exerciseId) {
        // Just show the selector or handle the lack of an ID
        setShowExerciseSelector(true);
      }
      setLoading(false);
    };

    fetchExercise();
  }, [exerciseId]);

  const determineCurrentPosture = useCallback((landmarks: any[]) => {
    // Simple posture detection based on landmark positions
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      setCurrentPosture('Unknown');
      return;
    }

    // Dynamic label based on exercise
    const exName = exercise?.name.toLowerCase() || '';
    
    // Calculate angles and positions for posture detection
    const kneeHeight = (leftKnee?.y || 0) + (rightKnee?.y || 0) / 2;
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    if (exName.includes('squat') && kneeHeight > hipHeight - 0.1) {
      setCurrentPosture('Squatting');
    } else if (exName.includes('pushup') && Math.abs(leftShoulder.y - leftHip.y) < 0.2) {
      setCurrentPosture('Pushing Up');
    } else if (exName.includes('plank')) {
      setCurrentPosture('Planking');
    } else if (exName.includes('lunge')) {
      setCurrentPosture('Lunging');
    } else {
      setCurrentPosture('Standing');
    }
  }, [exercise]);

  const analyzePose = useCallback(async (landmarks: any[]) => {
    if (!session) return;

    try {
      // Transform MediaPipe landmarks to the format expected by the backend
      const transformedLandmarks = landmarks.map(landmark => [
        landmark.x,
        landmark.y,
        landmark.z,
        landmark.visibility || 0
      ]);

      const response = await apiService.analyzePose(session.id, transformedLandmarks);
      
      if (response.success && response.data) {
        setAccuracy(response.data.accuracy);
        
        // Track cumulative accuracy for average at end of session
        (window as any)._sessionAccuracyTotal = ((window as any)._sessionAccuracyTotal || 0) + response.data.accuracy;
        (window as any)._sessionAccuracyCount = ((window as any)._sessionAccuracyCount || 0) + 1;
        
        // Update rep count if provided
        if (response.data.repCount !== undefined) {
          setRepCount(response.data.repCount);
        }

        // Set feedback
        const rawFeedback = response.data.feedback || [];
        const feedbackMessage = response.data.primaryCoaching || rawFeedback.join(' ');    
        setFeedback({
          isCorrect: response.data.isCorrectForm ?? (response.data.accuracy > 70),
          message: feedbackMessage,
          primaryCoaching: response.data.primaryCoaching,
          accuracy: response.data.accuracy, // Added for sync with PostureGuidance
          confidence: (response.data.confidence ?? response.data.accuracy / 100),
          timestamp: Date.now(),
          suggestions: rawFeedback // Store the raw list for components
        } as any);

        // Determine current posture based on landmarks
        determineCurrentPosture(landmarks);
      }
    } catch (error) {
      
    }
  }, [session, determineCurrentPosture]);
  
  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);
  const sessionRef = useRef(session);
  const analyzePoseRef = useRef(analyzePose);

  // Keep refs in sync with state
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { analyzePoseRef.current = analyzePose; }, [analyzePose]);

  const initializeMediaPipe = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      
      return;
    }

    // Clean up any existing MediaPipe resources first
    if (poseRef.current) {
      
      try {
        poseRef.current.close();
      } catch (error) {
        
      }
      poseRef.current = null;
    }
    
    if (cameraRef.current) {
      
      try {
        cameraRef.current.stop();
      } catch (error) {
        
      }
      cameraRef.current = null;
    }

    

    try {
      const pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        if (!canvasCtx) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Only draw pose landmarks and connections, not the video frame
        // The video element will handle displaying the video
        if (results.poseLandmarks) {
          setPoseDetected(true);
          
          // Draw pose landmarks
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2
          });
          
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 3
          });

          // Analyze pose if session is active - throttling to approx 5 FPS (every 200ms)
          if (isRecordingRef.current && sessionRef.current && !isPausedRef.current) {
            const now = Date.now();
            if (!videoRef.current || !(videoRef.current as any)._lastAnalyzeTime || now - (videoRef.current as any)._lastAnalyzeTime > 200) {
              analyzePoseRef.current(results.poseLandmarks);
              if (videoRef.current) (videoRef.current as any)._lastAnalyzeTime = now;
            }
          }
        } else {
          setPoseDetected(false);
        }

        canvasCtx.restore();
      });

      // Wait for video to be ready before starting MediaPipe camera
      const startMediaPipeCamera = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {

          try {
            const camera = new MediaPipeCamera(videoRef.current, {
              onFrame: async () => {
                if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
                  try {
                    await pose.send({ image: videoRef.current });
                  } catch (error) {
                    
                  }
                }
              },
              width: videoRef.current.videoWidth || 1280,
              height: videoRef.current.videoHeight || 720
            });

            poseRef.current = pose;
            cameraRef.current = camera;
            camera.start();
            
          } catch (error) {
            
          }
        } else {
          
          setTimeout(startMediaPipeCamera, 100);
        }
      };

      startMediaPipeCamera();
    } catch (error) {
      
    }
  }, []); // Dependencies removed to keep it stable

  // Initialize MediaPipe Pose
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      // Wait for video to be ready before initializing MediaPipe
      const checkVideoReady = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          
          // Add a small delay to ensure video is fully loaded
          setTimeout(() => {
            initializeMediaPipe();
          }, 500);
        } else {
          
          setTimeout(checkVideoReady, 200);
        }
      };
      
      checkVideoReady();
    }

    return () => {
      
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (error) {
          
        }
        poseRef.current = null;
      }
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (error) {
          
        }
        cameraRef.current = null;
      }
    };
  }, [cameraActive, initializeMediaPipe]);

  const startCamera = async () => {
    try {
      
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        streamRef.current = stream;
        
        const handleLoadedMetadata = () => {
          video.play().then(() => {
            setCameraActive(true);
            setTimeout(() => {
              if (canvasRef.current) {
                const container = canvasRef.current.parentElement;
                if (container) {
                  const rect = container.getBoundingClientRect();
                  canvasRef.current.width = rect.width;
                  canvasRef.current.height = rect.height;
                }
              }
            }, 100);
          }).catch((playError) => {
            
            setError('Failed to start video playback');
          });
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        (video as any)._cameraCleanup = () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    } catch (error) {
      
      setError('Failed to access camera. Please ensure permissions are granted.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      if ((videoRef.current as any)._cameraCleanup) {
        (videoRef.current as any)._cameraCleanup();
      }
      videoRef.current.srcObject = null;
    }
    
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    setCameraActive(false);
    setPoseDetected(false);
    setAccuracy(undefined);
    setCurrentPosture('');
  }, []);

  const endSession = useCallback(async () => {
    try {
      if (session) {
        const avgAccuracy = (window as any)._sessionAccuracyCount > 0 
          ? Math.round((window as any)._sessionAccuracyTotal / (window as any)._sessionAccuracyCount)
          : (accuracy || 0);

        const endData = {
          totalReps: repCount,
          averageScore: avgAccuracy,
          maxScore: avgAccuracy,
          minScore: avgAccuracy,
          overallFeedback: [feedback?.message || 'Session completed'],
          improvementAreas: [],
          strengths: [],
          repAnalysis: [],
          videoUrl: ''
        };

        await apiService.endSession(session.id, endData);
        
        // Reset counters
        (window as any)._sessionAccuracyTotal = 0;
        (window as any)._sessionAccuracyCount = 0;
      }
      setIsRecording(false);
      setIsPaused(false);
      setSession(null);
      stopCamera();
      navigate('/patient/dashboard');
    } catch (error) {
      
      setError('Failed to end session');
    }
  }, [session, stopCamera, navigate, accuracy, repCount, feedback?.message]);

  const pauseSession = () => {
    setIsPaused(!isPaused);
  };

  const startSession = async () => {
    try {
      if (!exercise) {
        setError('No exercise selected');
        return;
      }

      const response = await apiService.startSession(
        exercise.id, 
        sessionLimit ? sessionLimit / 60 : undefined
      );
      if (response.success && response.data) {
        setSession(response.data);
        setIsRecording(true);
        sessionStartTime.current = new Date();
        setSessionTime(0);
        setRepCount(0);
        setFeedback(null);
      } else {
        setError('Failed to start session');
      }
    } catch (error) {
      
      setError('Failed to start exercise session');
    }
  };

  const handleExerciseSelect = (selectedExercise: Exercise) => {
    setExercise(selectedExercise);
    setShowExerciseSelector(false);
    // Update URL without reload - path must match Route in App.tsx
    navigate(`/patient/exercise/${selectedExercise.id}`, { replace: true });
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && cameraActive) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cameraActive]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          if (sessionLimit && newTime >= sessionLimit) {
            endSession();
            return prev;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused, sessionLimit, endSession]);



  /* const resetSession = () => {
    setSessionTime(0);
    setRepCount(0);
    setFeedback(null);
    sessionStartTime.current = new Date();
  }; */

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || (/^\d+$/.test(val) && parseInt(val) > 0)) {
      setInputMinutes(val);
      if (val !== '') {
        setSessionLimit(parseInt(val) * 60);
      } else {
        setSessionLimit(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {exercise ? exercise.name : 'Live Exercise Session'}
              </h1>
              {exercise && <p className="mt-1 text-sm text-gray-500">{exercise.description}</p>}
            </div>
            <div className="text-right flex items-center space-x-6">
              {isRecording && sessionLimit && (
                <div>
                  <div className="text-2xl font-bold text-amber-600">{formatTime(Math.max(0, sessionLimit - sessionTime))}</div>
                  <div className="text-sm text-gray-500">Remaining</div>
                </div>
              )}
              <div>
                <div className="text-2xl font-bold text-primary-600">{formatTime(sessionTime)}</div>
                <div className="text-sm text-gray-500">Session Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Camera Feed - Spans 2 columns on extra large screens */}
        <div className="xl:col-span-2 order-1">
          <div className="bg-white shadow rounded-lg h-full">
            <div className="px-4 py-5 sm:p-6 h-full flex flex-col">
              <div className="flex-grow aspect-video bg-gray-900 rounded-lg overflow-hidden relative mb-4">
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ display: cameraActive ? 'block' : 'none' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                    style={{ zIndex: 10, display: cameraActive ? 'block' : 'none' }}
                  />
                  
                  {poseDetected && cameraActive && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black bg-opacity-50 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">
                        {currentPosture ? `${currentPosture} Detected` : 'Pose Detected'}
                      </span>
                    </div>
                  )}
                </div>
                
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Camera Off</h3>
                      <button onClick={startCamera} className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md">
                        Start Camera
                      </button>
                    </div>
                  </div>
                )}
                
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black bg-opacity-50 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">{isPaused ? 'PAUSED' : 'LIVE'}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                {cameraActive ? (
                  <button onClick={stopCamera} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm">
                    <CameraOff className="h-4 w-4 mr-2" /> Stop Camera
                  </button>
                ) : <div />}
                
                {!isRecording ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="duration" className="text-sm font-medium text-gray-700">Duration (min):</label>
                      <input
                        id="duration"
                        type="text"
                        value={inputMinutes}
                        onChange={handleDurationChange}
                        placeholder="e.g. 10"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <button 
                      onClick={startSession} 
                      disabled={!cameraActive || !exercise || !sessionLimit} 
                      className={`px-8 py-2 rounded-md text-white font-medium ${cameraActive && exercise && sessionLimit ? 'bg-primary-600 hover:bg-primary-700 shadow-md' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                      <Play className="inline h-5 w-5 mr-2" /> Start Session
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button onClick={pauseSession} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm">
                      {isPaused ? <Play className="inline h-4 w-4 mr-2" /> : <Pause className="inline h-4 w-4 mr-2" />} {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={endSession} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                      <Square className="inline h-4 w-4 mr-2" /> End
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Spans 2 columns on extra large screens */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 order-2">
          {/* Exercise Guide Column */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Exercise Guide</h3>
                {!isRecording && (
                  <button onClick={() => setShowExerciseSelector(true)} className="text-primary-600 text-sm font-medium">Change</button>
                )}
              </div>
              
              {exercise && (
                <div className="mb-4">
                  <ExerciseSimulator 
                    exerciseName={exercise.name} 
                    isRecording={isRecording && !isPaused} 
                    activeMistake={(feedback as any)?.suggestions && (feedback as any).suggestions.length > 0 ? (feedback as any).suggestions[0] : null}
                  />
                </div>
              )}

              {!isRecording ? (
                exercise && (
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <Target className="h-6 w-6 text-primary-600 mr-4" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{exercise.name}</div>
                      <div className="text-xs text-gray-500">{exercise.targetMuscles.join(', ')}</div>
                    </div>
                  </div>
                )
              ) : (
                accuracy !== undefined && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center animate-pulse">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                    <p className="text-xs text-green-800 font-medium">
                      {accuracy > 70 ? 'Keep it up!' : 'Focus on form!'}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Analysis & Reps Column */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-5 h-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary-500" /> Analysis
              </h3>
              
              <div className="flex flex-col items-center">
                <div className="relative h-28 w-28 mb-4">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle className="text-gray-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                    <circle
                      className={`${accuracy && accuracy > 80 ? 'text-green-500' : accuracy && accuracy > 60 ? 'text-amber-500' : 'text-red-500'} stroke-current transition-all duration-1000`}
                      strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * (accuracy || 0)) / 100}
                      strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{repCount}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Reps</span>
                  </div>
                </div>

                <div className={`w-full p-3 rounded-lg border mb-4 ${feedback?.isCorrect ? 'bg-green-50 border-green-200' : feedback ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center mb-1">
                    {feedback?.isCorrect ? <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : feedback ? <AlertCircle className="h-4 w-4 text-amber-500 mr-2" /> : <Clock className="h-4 w-4 text-gray-400 mr-2" />}
                    <span className="text-xs font-bold text-gray-900 uppercase">{feedback ? (feedback.isCorrect ? 'Good Form' : 'Adjust Form') : 'Awaiting'}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-tight">{feedback ? feedback.message : 'Position yourself correctly.'}</p>
                </div>

                {accuracy !== undefined && (
                  <div className="w-full">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-1">
                      <span>Accuracy</span>
                      <span>{accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${accuracy > 80 ? 'bg-green-500' : accuracy > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Full-Width Posture Guidance */}
        <div className="xl:col-span-4 order-3">
          {exercise && (
            <PostureGuidance 
              currentPosture={currentPosture} 
              exerciseName={exercise.name} 
              accuracy={accuracy}
              feedback={(feedback as any)?.suggestions || []}
              isRecording={isRecording}
            />
          )}
        </div>
      </div>

      {showExerciseSelector && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowExerciseSelector(false)}></div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-3xl sm:w-full z-50">
              <ExerciseSelector 
                onExerciseSelect={handleExerciseSelect} 
                selectedExerciseId={exercise?.id}
              />
            </div>
          </div>
        </div>
      )}
      
      {exercise && <ExerciseFormGuidance exercise={exercise} isSessionActive={isRecording} currentAccuracy={accuracy} />}
    </div>
  );
};

export default LiveExercisePage;
