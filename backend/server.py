import asyncio
import json
import re
import subprocess
import time
import cv2
import websockets
from normal_mode.motion_detector import MotionDetector

CLIENTS = set()

async def broadcast(message: dict):
    if CLIENTS:
        data = json.dumps(message)
        await asyncio.gather(*[client.send(data) for client in CLIENTS], return_exceptions=True)

async def handler(websocket):
    CLIENTS.add(websocket)
    print(f"Client connected ({len(CLIENTS)} total)")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                await broadcast(data)
            except json.JSONDecodeError:
                pass
    finally:
        CLIENTS.discard(websocket)
        print(f"Client disconnected ({len(CLIENTS)} total)")

def find_camo_index():
    try:
        result = subprocess.run(
            ['ffmpeg', '-f', 'avfoundation', '-list_devices', 'true', '-i', ''],
            capture_output=True, text=True
        )
        lines = result.stderr.split('\n')
        in_video_section = False
        for line in lines:
            if 'AVFoundation video devices' in line:
                in_video_section = True
            if 'AVFoundation audio devices' in line:
                in_video_section = False
            if in_video_section and ('camo' in line.lower() or 'reincubate' in line.lower()):
                match = re.search(r'\[(\d+)\]', line)
                if match:
                    print(f"Found Camo at ffmpeg index {match.group(1)}: {line.strip()}")
                    return int(match.group(1))
    except Exception:
        pass
    return None

def find_camera():
    camo_index = find_camo_index()
    if camo_index is not None:
        cap = cv2.VideoCapture(camo_index, cv2.CAP_AVFOUNDATION)
        if cap.isOpened():
            print(f"Using Camo camera (index {camo_index})")
            return cap
        cap.release()

    # Fallback: try indices 0-4 with AVFoundation backend explicitly
    for index in range(0, 5):
        cap = cv2.VideoCapture(index, cv2.CAP_AVFOUNDATION)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                print(f"Camo not found via ffmpeg — using camera at index {index}")
                return cap
            cap.release()

    print("No external camera found, falling back to default")
    return cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)

async def motion_loop():
    cap = find_camera()
    detector = MotionDetector()

    print("Warming up camera...")
    await asyncio.sleep(2.0)
    print("Motion detection running.")

    while True:
        # Sleep first so consecutive cap.read() calls are ~100ms apart.
        # Without this, asyncio runs cap.read() faster than the camera
        # produces new frames, returning the same cached frame every time.
        await asyncio.sleep(0.1)

        loop = asyncio.get_event_loop()
        ret, frame = await loop.run_in_executor(None, cap.read)

        if ret:
            result = detector.check_frame(frame)
            if result["triggered"]:
                print("fast movement detected")
                await broadcast({
                    "type": "motion",
                    "time": time.strftime("%I:%M:%S %p"),
                    "timestamp": result["timestamp"],
                })

async def main():
    print("Starting WebSocket server on ws://localhost:8765")
    async with websockets.serve(handler, "localhost", 8765, origins=None):
        await motion_loop()

if __name__ == "__main__":
    asyncio.run(main())
