// src/models/Session.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: string;
  exercise: string;
  accuracy: number;
  feedback: string;
  angles: Record<string, number>;
}

const SessionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    exercise: { type: String, required: true },
    accuracy: { type: Number, required: true },
    feedback: { type: String, required: true },
    angles: { type: Map, of: Number },
  },
  { timestamps: true }
);

export default mongoose.model<ISession>("Session", SessionSchema);
