import numpy as np

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)

    if angle > 180:
        angle = 360-angle

    return angle

def analyze_pose(landmarks, exercise, session_state=None):
    if session_state is None:
        session_state = {"rep_count": 0, "stage": "start", "consecutive_good_frames": 0, "total_accuracy": 0, "frame_count": 0}

    rep_count = session_state.get("rep_count", 0)
    stage = session_state.get("stage", "start")
    consecutive_good_frames = session_state.get("consecutive_good_frames", 0)
    total_accuracy = session_state.get("total_accuracy", 0)
    frame_count = session_state.get("frame_count", 0)
    
    feedback = []
    angles = {}
    current_accuracy = 100

    try:
        # Check landmark visibility
        visible_keypoints = [lm for lm in landmarks if lm.get('visibility', 0) > 0.3]
        if len(visible_keypoints) < 8:
            return {
                "repCount": rep_count,
                "angles": {},
                "accuracy": 0,
                "feedback": ["Position your full body in the camera frame"],
                "session_state": session_state
            }

        if exercise == "squat":
            # Check both sides and use the most visible one
            l_shoulder = landmarks[11]
            r_shoulder = landmarks[12]
            l_hip = landmarks[23]
            r_hip = landmarks[24]
            l_knee = landmarks[25]
            r_knee = landmarks[26]
            l_ankle = landmarks[27]
            r_ankle = landmarks[28]
            
            # Use visibility to decide which side to use
            l_vis = (l_shoulder.get('visibility', 0) + l_hip.get('visibility', 0) + l_knee.get('visibility', 0) + l_ankle.get('visibility', 0)) / 4
            r_vis = (r_shoulder.get('visibility', 0) + r_hip.get('visibility', 0) + r_knee.get('visibility', 0) + r_ankle.get('visibility', 0)) / 4
            
            if l_vis >= r_vis:
                shoulder = [l_shoulder['x'], l_shoulder['y']]
                hip = [l_hip['x'], l_hip['y']]
                knee = [l_knee['x'], l_knee['y']]
                ankle = [l_ankle['x'], l_ankle['y']]
                ankle_vis = l_ankle.get('visibility', 0)
            else:
                shoulder = [r_shoulder['x'], r_shoulder['y']]
                hip = [r_hip['x'], r_hip['y']]
                knee = [r_knee['x'], r_knee['y']]
                ankle = [r_ankle['x'], r_ankle['y']]
                ankle_vis = r_ankle.get('visibility', 0)

            if ankle_vis < 0.3:
                feedback.append("Move back so your feet are visible")
                current_accuracy = 0
                # Don't count reps or update stage if ankles are missing
            else:
                # Normal squat analysis
                knee_angle = calculate_angle(hip, knee, ankle)
                back_angle = calculate_angle(shoulder, hip, knee)
                angles["knee"] = knee_angle
                
                if stage == "down":
                    deviation = max(0, knee_angle - 100)
                    current_accuracy = max(0, 100 - (deviation * 0.5))
                
                if back_angle < 140:
                    current_accuracy = max(0, current_accuracy - 20)
                    feedback.append("Keep your chest up and back straight")

                if knee_angle > 160:
                    if stage == "down": rep_count += 1
                    stage = "up"
                elif knee_angle < 120: # Slightly more lenient squat depth
                    stage = "down"
                
                if stage == "down" and knee_angle > 130:
                    feedback.append("Go lower! Aim for thighs parallel to floor")

        elif exercise == "pushup":
            shoulder = [landmarks[11]['x'], landmarks[11]['y']]
            elbow = [landmarks[13]['x'], landmarks[13]['y']]
            wrist = [landmarks[15]['x'], landmarks[15]['y']]
            hip = [landmarks[23]['x'], landmarks[23]['y']]
            ankle = [landmarks[27]['x'], landmarks[27]['y']]
            
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            body_alignment = calculate_angle(shoulder, hip, ankle)
            angles["elbow"] = elbow_angle
            
            if stage == "down":
                deviation = max(0, elbow_angle - 90)
                current_accuracy -= (deviation * 0.4)
            
            if body_alignment < 165:
                current_accuracy -= 25
                feedback.append("Keep your hips in line with your body")

            if elbow_angle > 160:
                if stage == "down": rep_count += 1
                stage = "up"
            elif elbow_angle < 100:
                stage = "down"

        elif exercise == "plank":
            # Check both sides and use the most visible one
            l_shoulder = landmarks[11]
            r_shoulder = landmarks[12]
            l_hip = landmarks[23]
            r_hip = landmarks[24]
            l_ankle = landmarks[27]
            r_ankle = landmarks[28]
            
            # Use visibility to decide which side to use
            l_vis = (l_shoulder.get('visibility', 0) + l_hip.get('visibility', 0) + l_ankle.get('visibility', 0)) / 3
            r_vis = (r_shoulder.get('visibility', 0) + r_hip.get('visibility', 0) + r_ankle.get('visibility', 0)) / 3
            
            if l_vis >= r_vis:
                shoulder = [l_shoulder['x'], l_shoulder['y']]
                hip = [l_hip['x'], l_hip['y']]
                ankle = [l_ankle['x'], l_ankle['y']]
            else:
                shoulder = [r_shoulder['x'], r_shoulder['y']]
                hip = [r_hip['x'], r_hip['y']]
                ankle = [r_ankle['x'], r_ankle['y']]
            
            body_angle = calculate_angle(shoulder, hip, ankle)
            angles["body_alignment"] = body_angle
            
            deviation = abs(180 - body_angle)
            current_accuracy = max(0, 100 - (deviation * 2))
            
            if body_angle < 160:
                feedback.append("Don't drop your hips")
            elif body_angle > 200:
                feedback.append("Hips too high!")
            else:
                consecutive_good_frames += 1
                # Increment "reps" (seconds) every 5 good frames (approx 1 second at 5 FPS)
                if consecutive_good_frames >= 5:
                    rep_count += 1
                    consecutive_good_frames = 0

        elif exercise == "shoulder_abduction" or "abduction" in exercise:
            l_shoulder = [landmarks[11]['x'], landmarks[11]['y']]
            l_elbow = [landmarks[13]['x'], landmarks[13]['y']]
            l_hip = [landmarks[23]['x'], landmarks[23]['y']]
            
            # Angle between shoulder-hip and shoulder-elbow
            arm_angle = calculate_angle(l_hip, l_shoulder, l_elbow)
            angles["arm_elevation"] = arm_angle
            
            if arm_angle > 80:
                if stage == "down": rep_count += 1
                stage = "up"
            elif arm_angle < 30:
                stage = "down"
                
            if arm_angle > 100:
                feedback.append("Don't lift too high! Stop at shoulder level")
                current_accuracy -= 10

        elif exercise == "lunge":
            l_hip = [landmarks[23]['x'], landmarks[23]['y']]
            l_knee = [landmarks[25]['x'], landmarks[25]['y']]
            l_ankle = [landmarks[27]['x'], landmarks[27]['y']]
            
            knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
            angles["knee_flexion"] = knee_angle
            
            if knee_angle < 110:
                stage = "down"
            elif knee_angle > 160:
                if stage == "down": rep_count += 1
                stage = "up"
                
            if stage == "down" and knee_angle > 120:
                feedback.append("Go deeper into the lunge")
        
        else:
            feedback.append(f"Analyzing {exercise}...")

    except (IndexError, KeyError):
        return {
            "repCount": rep_count,
            "angles": {},
            "accuracy": 0,
            "feedback": ["Position yourself correctly"],
            "session_state": session_state
        }

    # Clamp accuracy
    current_accuracy = max(0, min(100, int(current_accuracy)))
    
    # Update rolling average for improvement tracking
    frame_count += 1
    total_accuracy += current_accuracy
    
    new_session_state = {
        "rep_count": rep_count,
        "stage": stage,
        "consecutive_good_frames": consecutive_good_frames,
        "total_accuracy": total_accuracy,
        "frame_count": frame_count,
        "average_accuracy": total_accuracy / frame_count
    }

    if not feedback:
        feedback = ["Keep going, great form!"]
    
    return {
        "repCount": rep_count,
        "angles": angles,
        "accuracy": current_accuracy,
        "feedback": feedback,
        "session_state": new_session_state
    }