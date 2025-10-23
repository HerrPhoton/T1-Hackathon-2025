import cv2

from src.config import PipelineConfig, SegmenterConfig, BackgroundConfig
from src.capture import CameraFrameCapture
from src.pipeline import FramePipeline
from src.config.path import SEGMENTATION_MP_PATH  # , SEGMENTATION_YOLO_PATH
from src.modules.background import SolidColorBackground


def main():

    config = PipelineConfig(
        #segmenter=SegmenterConfig(model='yolo', model_path=SEGMENTATION_YOLO_PATH),
        segmenter=SegmenterConfig(model='mediapipe', model_path=SEGMENTATION_MP_PATH),
        background=BackgroundConfig(SolidColorBackground())
    )
    pipeline = FramePipeline(config)

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
