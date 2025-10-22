import cv2
import numpy as np
from ultralytics import YOLO

from src.config.path import SEGMENTATION_MODEL_PATH
from src.capture.capture import CameraFrameCapture
from src.modules.background.effects import SolidColorBackground
from src.modules.background.processor import BackgroundProcessor


def main():
    model = YOLO(SEGMENTATION_MODEL_PATH)

    processor = BackgroundProcessor(
        effect=SolidColorBackground(color=(0, 0, 0)),
    )

    with CameraFrameCapture() as cap:
        for frame in cap:
            try:
                results = model.predict(frame, classes=[0])

                person_polygons = []
                for result in results:
                    if result.masks and result.masks.xy is not None:
                        for polygon in result.masks.xy:
                            person_polygons.append(np.asarray(polygon, dtype=np.int32))

                composed = processor.apply(frame, person_polygons)

                bgr = cv2.cvtColor(composed, cv2.COLOR_RGB2BGR)
                cv2.imshow("Video stream", bgr)
                cv2.waitKey(1)

            except KeyboardInterrupt:
                break


if __name__ == "__main__":
    main()
