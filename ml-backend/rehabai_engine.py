from inference import predict_form
from analyze_pose import analyze_pose
from llm_feedback import generate_feedback


class RehabAIEngine:

    def process_frame(self, landmarks, exercise, session_state=None, session_id="default"):

        # LSTM prediction - passed session_id for sequence management
        form, confidence = predict_form(landmarks, exercise, session_id)

        # rule based analysis for reps and form suggestions
        rule = analyze_pose(landmarks, exercise, session_state)

        # Get the list of specific form suggestions
        raw_feedback = rule["feedback"]

        # Use LLM to refine the primary coaching message, but keep specific suggestions visible
        coaching = generate_feedback(raw_feedback)

        # We now use the more granular accuracy from analyze_pose
        # but blend it with model confidence for a balanced score
        rule_accuracy = rule.get("accuracy", 0)
        final_accuracy = int((rule_accuracy * 0.7) + (confidence * 100 * 0.3))

        is_correct = form == "correct"
        if len(raw_feedback) > 0 and "Great" not in raw_feedback[0] and "Keep going" not in raw_feedback[0]:
             is_correct = False

        return {
            "exercise": exercise,
            "accuracy": final_accuracy,
            "feedback": raw_feedback,
            "primary_coaching": coaching,
            "angles": rule["angles"],
            "repCount": rule["repCount"],
            "isCorrectForm": is_correct,
            "confidence": confidence,
            "session_state": rule["session_state"]
        }