import cv2

from src.pipeline import FramePipeline
from src.capture.capture import CameraFrameCapture


def main():

    pipeline = FramePipeline()

    with CameraFrameCapture() as cap:
        for frame in cap:
            try:
                result = pipeline.process(frame)
                result = cv2.cvtColor(result, cv2.COLOR_RGB2BGR)

                cv2.imshow("Video stream", result)
                cv2.waitKey(1)

            except KeyboardInterrupt:
                break


if __name__ == "__main__":
    main()
