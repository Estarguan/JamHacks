import cv2
import time
import numpy as np
from collections import deque
from dataclasses import dataclass, asdict


@dataclass
class MotionResult:
    triggered: bool
    motion_score: float
    baseline_motion: float
    spike_ratio: float
    timestamp: float
    reason: str


class MotionDetector:
    """
    Detects sudden motion by comparing consecutive camera frames.

    motion_score = mean absolute pixel diff between frames (0-255 scale).
    Triggers when score spikes above the rolling baseline by spike_multiplier.
    """

    def __init__(
        self,
        history_size: int = 20,
        spike_multiplier: float = 2.0,
        min_motion_score: float = 2.0,
        cooldown_seconds: float = 3.0,
    ):
        self.history_size = history_size
        self.spike_multiplier = spike_multiplier
        self.min_motion_score = min_motion_score
        self.cooldown_seconds = cooldown_seconds

        self._prev_frame = None
        self._history = deque(maxlen=history_size)
        self._last_trigger = 0.0

    def _preprocess(self, frame):
        resized = cv2.resize(frame, (320, 240))
        return cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

    def check_frame(self, frame, timestamp: float = None) -> dict:
        if timestamp is None:
            timestamp = time.time()

        curr = self._preprocess(frame)

        if self._prev_frame is None:
            self._prev_frame = curr.copy()
            return asdict(MotionResult(False, 0.0, 0.0, 0.0, timestamp, "warming up"))

        score = float(np.mean(cv2.absdiff(self._prev_frame, curr)))
        self._prev_frame = curr.copy()

        baseline = sum(self._history) / len(self._history) if self._history else 0.0
        self._history.append(score)

        spike_ratio = (score / baseline) if baseline > 0 else 0.0
        cooldown_ok = (time.time() - self._last_trigger) >= self.cooldown_seconds

        is_spike = score >= self.min_motion_score and score >= baseline * self.spike_multiplier

        if is_spike and cooldown_ok:
            self._last_trigger = time.time()
            reason = f"score={score:.2f} is {spike_ratio:.1f}x baseline={baseline:.2f}"
            return asdict(MotionResult(True, round(score, 4), round(baseline, 4), round(spike_ratio, 2), timestamp, reason))

        return asdict(MotionResult(False, round(score, 4), round(baseline, 4), round(spike_ratio, 2), timestamp, "no spike"))

    def reset(self):
        self._prev_frame = None
        self._history.clear()
        self._last_trigger = 0.0


def run_live(camera_index: int = 0, fps: int = 10):
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open camera {camera_index}")

    detector = MotionDetector()
    interval = 1.0 / fps

    print("Warming up camera...")
    time.sleep(2.0)
    print(f"Running at {fps}fps. Press Ctrl+C to stop.\n")

    count = 0
    try:
        while True:
            t0 = time.time()

            ret, frame = cap.read()
            if not ret:
                time.sleep(interval)
                continue

            result = detector.check_frame(frame)

            if result["triggered"]:
                count += 1
                print(f"fast movement detected #{count}")

            elapsed = time.time() - t0
            time.sleep(max(0, interval - elapsed))

    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        cap.release()


if __name__ == "__main__":
    run_live()
