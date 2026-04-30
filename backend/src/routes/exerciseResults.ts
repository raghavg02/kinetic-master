import express from "express";
import ExerciseResult from "../models/ExerciseResult";
import axios from "axios";

const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://localhost:8001";

const router = express.Router();

// POST: analyze pose and save result
router.post("/analyze", async (req, res) => {
  try {
    const { patientId, exercise, landmarks } = req.body;

    // Call Python ML backend
    const mlResponse = await axios.post(`${ML_BACKEND_URL}/predict`, {
      exercise,
      landmarks,
    });

    const { accuracy, feedback } = mlResponse.data;

    // Save result in MongoDB
    const newResult = new ExerciseResult({
      patientId,
      exercise,
      accuracy,
      feedback,
    });

    await newResult.save();

    res.json({
      message: "Exercise result saved",
      result: newResult,
    });
  } catch (err) {
    if (err instanceof Error) {
      
    } else {
      
    }
    res.status(500).json({ error: "Server error" });
  }
});

// GET: fetch results for a patient
router.get("/:patientId", async (req, res) => {
  try {
    const results = await ExerciseResult.find({
      patientId: req.params.patientId,
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
