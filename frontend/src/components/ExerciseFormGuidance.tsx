import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Target, 
  Database, 
  Eye, 
  ExternalLink,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseFormGuidanceProps {
  exercise: Exercise | null;
  isSessionActive: boolean;
  currentAccuracy?: number;
}

const ExerciseFormGuidance: React.FC<ExerciseFormGuidanceProps> = ({
  exercise,
  isSessionActive,
  currentAccuracy
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'dataset'>('form');

  if (!exercise || !exercise.formGuidance) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exercise Form Guidance</h3>
          <div className="text-center py-6">
            <Target className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Form guidance data not available for this exercise
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { formGuidance } = exercise;
  const { correctForm, visualGuide, datasetInfo } = formGuidance;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (accuracy >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (accuracy >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'important': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'optional': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Exercise Form Guidance</h3>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'form'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Form Guide
            </button>
            <button
              onClick={() => setActiveTab('dataset')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'dataset'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dataset Info
            </button>
          </div>
        </div>

        {activeTab === 'form' && (
          <div className="space-y-4">
            {/* Current Accuracy Indicator */}
            {isSessionActive && currentAccuracy !== undefined && (
              <div className={`p-3 rounded-lg border ${getAccuracyColor(currentAccuracy)}`}>
                <div className="flex items-center">
                  {currentAccuracy >= 70 ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">
                    Current Form: {Math.round(currentAccuracy)}% Accuracy
                  </span>
                </div>
              </div>
            )}

            {/* Correct Form Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Correct Form
              </h4>
              <p className="text-sm text-gray-600 mb-3">{correctForm.description}</p>
            </div>

            {/* Key Points */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points:</h4>
              <ul className="space-y-1">
                {correctForm.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Mistakes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Common Mistakes to Avoid:</h4>
              <ul className="space-y-1">
                {correctForm.commonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pro Tips:</h4>
              <ul className="space-y-1">
                {correctForm.tips.map((tip, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Guide */}
            {visualGuide && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Visual Reference
                </h4>
                <div className="space-y-2">
                  {visualGuide.referenceImage && (
                    <div className="relative">
                      <img
                        src={visualGuide.referenceImage}
                        alt="Correct form reference"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity rounded-lg flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                  {visualGuide.referenceVideo && (
                    <div className="relative">
                      <video
                        src={visualGuide.referenceVideo}
                        className="w-full h-32 object-cover rounded-lg border"
                        controls
                        preload="metadata"
                      />
                    </div>
                  )}
                </div>

                {/* Landmarks */}
                {visualGuide.landmarks && visualGuide.landmarks.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Key Landmarks:</h5>
                    <div className="space-y-1">
                      {visualGuide.landmarks.map((landmark, index) => (
                        <div
                          key={index}
                          className={`px-2 py-1 rounded text-xs border ${getImportanceColor(landmark.importance)}`}
                        >
                          <span className="font-medium">{landmark.name}:</span> {landmark.position}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dataset' && (
          <div className="space-y-4">
            {/* Dataset Overview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Dataset Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Source:</span>
                  <p className="font-medium text-gray-900">{datasetInfo.source}</p>
                </div>
                <div>
                  <span className="text-gray-500">Version:</span>
                  <p className="font-medium text-gray-900">{datasetInfo.version}</p>
                </div>
                <div>
                  <span className="text-gray-500">Samples:</span>
                  <p className="font-medium text-gray-900">{datasetInfo.sampleCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Accuracy:</span>
                  <p className="font-medium text-gray-900">{datasetInfo.accuracy}%</p>
                </div>
              </div>
            </div>

            {/* Dataset Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Training Samples</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {datasetInfo.sampleCount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Model Accuracy</span>
                </div>
                <span className={`text-sm font-medium ${getAccuracyColor(datasetInfo.accuracy).split(' ')[0]}`}>
                  {datasetInfo.accuracy}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Last Updated</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(datasetInfo.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Dataset Source Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Dataset Source</h5>
              <p className="text-xs text-blue-700 mb-2">
                This exercise form analysis is powered by a trained dataset from {datasetInfo.source}.
              </p>
              <p className="text-xs text-blue-700">
                The model has been trained on {datasetInfo.sampleCount.toLocaleString()} samples 
                and achieves {datasetInfo.accuracy}% accuracy in form detection.
              </p>
            </div>

            {/* Add Custom Data Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-green-900 mb-2">Add Your Own Data</h5>
              <p className="text-xs text-green-700 mb-2">
                Want to improve the model with your own exercise data?
              </p>
              <div className="space-y-2">
                <button className="text-xs text-green-600 hover:text-green-800 font-medium block">
                  Learn how to contribute →
                </button>
                <button className="text-xs text-green-600 hover:text-green-800 font-medium block">
                  Upload your dataset →
                </button>
                <button className="text-xs text-green-600 hover:text-green-800 font-medium block">
                  View dataset management →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseFormGuidance;
