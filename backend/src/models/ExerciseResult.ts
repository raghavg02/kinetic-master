import mongoose from "mongoose";
import { Request, Response } from 'express';

const ExerciseResultSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // assuming you already have User model
    required: true,
  },
  exercise: { type: String, required: true }, // squat, pushup, lunge
  accuracy: { type: Number, required: true },
  feedback: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const ExerciseResult = mongoose.model("ExerciseResult", ExerciseResultSchema);

export const createExerciseResult = async (req: Request, res: Response) => {
  try {
    const newResult = new ExerciseResult(req.body);
    await newResult.save();
    res.status(201).json(newResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save exercise result' });
  }
};

export const getExerciseResults = async (req: Request, res: Response) => {
  try {
    const results = await ExerciseResult.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

export default ExerciseResult;
