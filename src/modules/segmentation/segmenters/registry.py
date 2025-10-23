from .yolo import YOLOSegmenter
from .mediapipe import MediaPipeSegmenter

SEGMENTERS = {
    "yolo": YOLOSegmenter,
    "mediapipe": MediaPipeSegmenter,
}
