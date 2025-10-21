import cv2
import numpy as np
from ultralytics import YOLO

from src.capture.frame_capture import CameraFrameCapture


def main():
    model = YOLO("./src/nn/weights/segmentation/yolo11n-seg.pt")

    with CameraFrameCapture() as cap:
        for frame in cap:
            try:
                background = np.random.randint(0, 255, (480, 640, 3))

                results = model.predict(frame, classes=[0])

                for result in results:
                    if result.masks:
                        for mask in result.masks.xy:
                            points = np.array([mask], dtype=np.int32)

                            image_mask = np.zeros(frame.shape[:2], dtype=np.uint8)
                            cv2.fillPoly(image_mask, points, 255)

                            frame = np.where(image_mask[..., np.newaxis] == 255, frame, background).astype(np.uint8)

                cv2.imshow("Video stream", frame)
                cv2.waitKey(1)

            except KeyboardInterrupt:
                break


if __name__ == "__main__":
    main()
