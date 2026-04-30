import React from 'react';
import { CheckCircle, AlertTriangle, Info, Target } from 'lucide-react';

interface PostureGuidanceProps {
  accuracy?: number | null | undefined;
  currentPosture: string;
  feedback?: string[];
  isRecording?: boolean;
  exerciseName?: string;
}

const PostureGuidance: React.FC<PostureGuidanceProps> = ({
  accuracy,
  currentPosture,
  feedback = [],
  isRecording = true,
  exerciseName = ''
}) => {
  const getAccuracyLevel = (acc: number) => {
    if (acc >= 85) return { level: 'excellent', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (acc >= 70) return { level: 'good', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (acc >= 50) return { level: 'fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { level: 'needs-improvement', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const getPostureTips = (posture: string) => {
    const tips: { [key: string]: string[] } = {
      'Standing Straight': [
        'Keep your shoulders back and relaxed',
        'Engage your core muscles',
        'Distribute weight evenly on both feet'
      ],
      'Squatting': [
        'Keep your knees aligned with your toes',
        'Lower your body until thighs are parallel to ground',
        'Keep your chest up and back straight'
      ],
      'Leaning Left': [
        'Shift weight slightly to the right',
        'Engage your right side core muscles'
      ],
      'Leaning Right': [
        'Shift weight slightly to the left',
        'Engage your left side core muscles'
      ],
      'Pushing Up': [
        'Keep your head and neck neutral',
        'Don\'t let your hips sag',
        'Exhale as you push away from the ground'
      ],
      'Planking': [
        'Maintain a straight line from head to heels',
        'Squeeze your glutes and core',
        'Keep your gaze towards the floor'
      ],
      'Lunging': [
        'Step forward far enough to keep knee over ankle',
        'Keep your torso upright',
        'Lower your back knee towards the ground'
      ]
    };
    return tips[posture] || ['Focus on maintaining good form and posture'];
  };

  if (!isRecording && !currentPosture) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Posture Guidance</h3>
          <div className="text-center py-6">
            <Target className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Start your session to receive personalized posture guidance
            </p>
          </div>
        </div>
      </div>
    );
  }

  const accuracyInfo = accuracy !== null && accuracy !== undefined ? getAccuracyLevel(accuracy) : null;
  const postureTips = getPostureTips(currentPosture);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {exerciseName ? `${exerciseName} Guidance` : 'Posture Guidance'}
        </h3>
        
        {/* Accuracy Status */}
        {accuracyInfo && accuracy !== null && accuracy !== undefined && (
          <div className={`p-4 rounded-lg border ${accuracyInfo.bgColor} ${accuracyInfo.borderColor} mb-4`}>
            <div className="flex items-center">
              {accuracy >= 70 ? (
                <CheckCircle className={`h-5 w-5 ${accuracyInfo.color} mr-2`} />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${accuracyInfo.color} mr-2`} />
              )}
              <span className={`text-sm font-medium ${accuracyInfo.color}`}>
                {accuracyInfo.level.charAt(0).toUpperCase() + accuracyInfo.level.slice(1).replace('-', ' ')} Form
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Current accuracy: {Math.round(accuracy)}%
            </div>
          </div>
        )}

        {/* Current Posture Tips */}
        {currentPosture && currentPosture !== 'Unknown' && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Detected: <span className="text-primary-600">{currentPosture}</span>
            </h4>
            <ul className="space-y-1">
              {postureTips.map((tip, index) => (
                <li key={index} className="flex items-start text-xs text-gray-600">
                  <Info className="h-3 w-3 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default PostureGuidance;
