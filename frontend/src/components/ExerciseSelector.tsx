import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Play, 
  Clock, 
  Target, 
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Star
} from 'lucide-react';
import { Exercise } from '../types';
import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface ExerciseSelectorProps {
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExerciseId?: string;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onExerciseSelect,
  selectedExerciseId
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getExercises();
      if (response.success && response.data) {
        setExercises(response.data);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, []);

  const filterExercises = useCallback(() => {
    let filtered = exercises;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.targetMuscles.some(muscle => 
          muscle.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(exercise => exercise.difficulty === selectedDifficulty);
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory);
    }

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, selectedDifficulty, selectedCategory]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, selectedDifficulty, selectedCategory, filterExercises]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return <Target className="h-4 w-4" />;
      case 'cardio': return <Zap className="h-4 w-4" />;
      case 'flexibility': return <Star className="h-4 w-4" />;
      case 'balance': return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('');
    setSelectedCategory('');
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Select Exercise</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Categories</option>
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="balance">Balance</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exercises found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedExerciseId === exercise.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onExerciseSelect(exercise)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-900 mr-2">
                        {exercise.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {exercise.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        {getCategoryIcon(exercise.category)}
                        <span className="ml-1 capitalize">{exercise.category}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{exercise.duration} min</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        <span>{exercise.targetMuscles.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md transition-colors ${
                        selectedExerciseId === exercise.id
                          ? 'border-primary-500 text-primary-700 bg-primary-100'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {selectedExerciseId === exercise.id ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dataset Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filteredExercises.length} of {exercises.length} exercises</span>
            <span>Powered by CaskAI Exercise Dataset</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelector;
