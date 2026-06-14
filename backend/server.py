import asyncio
import json
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

async def motion_loop():
    cap = cv2.VideoCapture(0)
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
