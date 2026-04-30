import Exercise from '../models/Exercise';
import { Types } from 'mongoose';

export class ExerciseSeedService {
  static async seedExercises() {
    try {
      // Clear existing exercises to ensure the 6 requested ones are present and consistent
      
      await Exercise.deleteMany({});

      const sampleExercises = [
        {
          name: 'Squat',
          description: 'A fundamental lower body exercise that targets the quadriceps, hamstrings, and glutes.',
          instructions: [
            'Stand with feet shoulder-width apart',
            'Lower your body by bending at the hips and knees',
            'Keep your chest up and back straight',
            'Lower until thighs are parallel to the ground',
            'Push through heels to return to starting position'
          ],
          difficulty: 'beginner' as const,
          duration: 300,
          targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes'],
          category: 'strength' as const,
          equipment: [],
          caloriesPerMinute: 8,
          poseLandmarks: {
            keyPoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
            angles: [{ name: 'knee_angle', points: ['left_hip', 'left_knee', 'left_ankle'], targetRange: [80, 100] }],
            repDetection: { trigger: 'left_hip', direction: 'down', threshold: 0.1 }
          },
          formGuidance: {
            correctForm: {
              description: 'Maintain proper alignment throughout the movement with knees tracking over toes and chest up.',
              keyPoints: ['Keep knees aligned with toes', 'Maintain neutral spine', 'Engage core throughout movement', 'Distribute weight evenly on both feet', 'Keep chest up and shoulders back'],
              commonMistakes: ['Knees caving inward', 'Leaning too far forward', 'Not going low enough', 'Heels lifting off ground', 'Rounding the back'],
              tips: ['Focus on pushing hips back first', 'Keep weight in heels', 'Breathe in on the way down, out on the way up']
            },
            visualGuide: {
              referenceImage: '/images/squat-correct-form.jpg',
              referenceVideo: '/videos/squat-demo.mp4',
              landmarks: [
                { name: 'Hip Joint', position: 'Center of hip crease', importance: 'critical' },
                { name: 'Knee Joint', position: 'Center of knee cap', importance: 'critical' }
              ]
            },
            datasetInfo: { source: 'CaskAI', sampleCount: 15420, accuracy: 94.2, lastUpdated: new Date(), version: '2.1.0' }
          },
          createdBy: new Types.ObjectId(),
          isActive: true
        },
        {
          name: 'Push-up',
          description: 'A classic upper body exercise that strengthens the chest, shoulders, and triceps.',
          instructions: [
            'Start in plank position with hands slightly wider than shoulders',
            'Lower your body until chest nearly touches the ground',
            'Push back up to starting position'
          ],
          difficulty: 'intermediate' as const,
          duration: 240,
          targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
          category: 'strength' as const,
          equipment: [],
          caloriesPerMinute: 10,
          poseLandmarks: {
            keyPoints: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
            angles: [{ name: 'elbow_angle', points: ['left_shoulder', 'left_elbow', 'left_wrist'], targetRange: [90, 120] }],
            repDetection: { trigger: 'left_shoulder', direction: 'down', threshold: 0.15 }
          },
          formGuidance: {
            correctForm: {
              description: 'Maintain a straight line from head to heels while moving up and down.',
              keyPoints: ['Keep body in straight line', 'Hands positioned slightly wider than shoulders', 'Lower chest to ground level'],
              commonMistakes: ['Sagging hips or raised butt', 'Elbows flaring out too much'],
              tips: ['Focus on core engagement', 'Keep neck neutral']
            },
            visualGuide: {
              referenceImage: '/images/pushup-correct-form.jpg',
              referenceVideo: '/videos/pushup-demo.mp4',
              landmarks: [{ name: 'Elbow', position: 'Center of elbow joint', importance: 'critical' }]
            },
            datasetInfo: { source: 'CaskAI', sampleCount: 12850, accuracy: 91.8, lastUpdated: new Date(), version: '2.1.0' }
          },
          createdBy: new Types.ObjectId(),
          isActive: true
        },
        {
          name: 'Plank',
          description: 'An isometric core exercise that strengthens the entire core and improves stability.',
          instructions: [
            'Hold a push-up position but on your forearms',
            'Keep your body in a straight line from head to toe'
          ],
          difficulty: 'beginner' as const,
          duration: 180,
          targetMuscles: ['Core', 'Shoulders', 'Back'],
          category: 'strength' as const,
          equipment: [],
          caloriesPerMinute: 6,
          poseLandmarks: {
            keyPoints: ['left_shoulder', 'left_hip', 'left_knee'],
            angles: [{ name: 'body_alignment', points: ['left_shoulder', 'left_hip', 'left_knee'], targetRange: [170, 190] }],
            repDetection: { trigger: 'left_shoulder', direction: 'down', threshold: 0.05 }
          },
          formGuidance: {
            correctForm: {
              description: 'Maintain a straight line from head to heels with engaged core.',
              keyPoints: ['Straight line from head to heels', 'Engage core muscles', 'Shoulders over elbows'],
              commonMistakes: ['Sagging hips', 'Raised buttocks'],
              tips: ['Focus on core engagement', 'Breathe steadily']
            },
            visualGuide: {
              referenceImage: '/images/plank-correct-form.jpg',
              landmarks: [{ name: 'Hip', position: 'Center of hip joint', importance: 'critical' }]
            },
            datasetInfo: { source: 'CaskAI', sampleCount: 9850, accuracy: 96.5, lastUpdated: new Date(), version: '2.1.0' }
          },
          createdBy: new Types.ObjectId(),
          isActive: true
        },
        {
          name: 'Lunge',
          description: 'A lower body exercise that improves balance and strengthens legs.',
          instructions: [
            'Step forward with one leg and lower your hips',
            'Both knees should be bent at about a 90-degree angle',
            'Push back to the starting position'
          ],
          difficulty: 'beginner' as const,
          duration: 300,
          targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
          category: 'strength' as const,
          equipment: [],
          caloriesPerMinute: 9,
          poseLandmarks: {
            keyPoints: ['left_hip', 'left_knee', 'left_ankle'],
            angles: [{ name: 'knee_angle', points: ['left_hip', 'left_knee', 'left_ankle'], targetRange: [90, 110] }],
            repDetection: { trigger: 'left_hip', direction: 'down', threshold: 0.1 }
          },
          formGuidance: {
            correctForm: {
              description: 'Keep your torso upright and step far enough forward.',
              keyPoints: ['Torso upright', 'Back knee nearly touches floor'],
              commonMistakes: ['Leaning too far forward', 'Front knee past toes'],
              tips: ['Maintain balance', 'Control the descent']
            },
            visualGuide: { landmarks: [{ name: 'Knee', position: 'Center of front knee', importance: 'critical' }] },
            datasetInfo: { source: 'CaskAI', sampleCount: 8400, accuracy: 92.5, lastUpdated: new Date(), version: '2.1.0' }
          },
          createdBy: new Types.ObjectId(),
          isActive: true
        },
        {
          name: 'Knee Extension',
          description: 'A focused exercise for strengthening the quadriceps.',
          instructions: [
            'While seated, slowly straighten your leg',
            'Hold for a moment at the top',
            'Slowly lower back down'
          ],
          difficulty: 'beginner' as const,
          duration: 200,
          targetMuscles: ['Quadriceps'],
          category: 'strength' as const,
          equipment: ['Chair'],
          caloriesPerMinute: 4,
          poseLandmarks: {
            keyPoints: ['left_hip', 'left_knee', 'left_ankle'],
            angles: [{ name: 'knee_angle', points: ['left_hip', 'left_knee', 'left_ankle'], targetRange: [160, 180] }],
            repDetection: { trigger: 'left_ankle', direction: 'up', threshold: 0.1 }
          },
          formGuidance: {
            correctForm: {
              description: 'Perform the movement slowly and avoid swinging.',
              keyPoints: ['Full extension', 'Controlled movement'],
              commonMistakes: ['Swinging the leg', 'Incomplete range of motion'],
              tips: ['Squeeze the quad at the top']
            },
            visualGuide: { landmarks: [{ name: 'Knee', position: 'Knee joint pivot', importance: 'critical' }] },
            datasetInfo: { source: 'CaskAI', sampleCount: 5200, accuracy: 95.0, lastUpdated: new Date(), version: '2.1.0' }
          },
          createdBy: new Types.ObjectId(),
          isActive: true
        },
        {
          name: 'Shoulder Abduction',
          description: 'An upper body exercise for shoulder rehabilitation and strengthening.',
          instructions: [
            'Raise your arm out to the side until shoulder level',
            'Keep your arm straight but not locked',
            'Slowly lower back down'
          ],
          difficulty: 'beginner' as const,
          duration: 240,
          targetMuscles: ['Shoulders', 'Deltoids'],
          category: 'flexibility' as const,
          equipment: [],
          caloriesPerMinute: 5,
          poseLandmarks: {
            keyPoints: ['left_hip', 'left_shoulder', 'left_elbow'],
            angles: [{ name: 'shoulder_angle', points: ['left_hip', 'left_shoulder', 'left_elbow'], targetRange: [80, 100] }],
            repDetection: { trigger: 'left_elbow', direction: 'up', threshold: 0.1 }
          },
          formGuidance: {
            correctForm: {
              description: 'Avoid shrugging your shoulders during the lift.',
              keyPoints: ['Shoulder level height', 'Straight arm'],
              commonMistakes: ['Shrugging', 'Using momentum'],
              tips: ['Look forward', 'Breathe out on lift']
            },
            visualGuide: { landmarks: [{ name: 'Shoulder', position: 'Shoulder pivot point', importance: 'critical' }] },
            datasetInfo: { source: 'CaskAI', sampleCount: 7100, accuracy: 93.8, lastUpdated: new Date(), version: '2.1.0' }
          },
          createdBy: new Types.ObjectId(),
          isActive: true
        }
      ];

      await Exercise.insertMany(sampleExercises);
      
    } catch (error) {
      
      throw error;
    }
  }
}
