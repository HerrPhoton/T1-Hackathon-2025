from pathlib import Path

ROOT_PATH = Path(__file__).resolve().parents[2]

WEIGHTS_PATH = ROOT_PATH / "weights"
SEGMENTATION_WEIGHTS_PATH = WEIGHTS_PATH / "segmentation"
SEGMENTATION_YOLO_PATH = SEGMENTATION_WEIGHTS_PATH / "yolo11n-seg.pt"
SEGMENTATION_MP_PATH = SEGMENTATION_WEIGHTS_PATH / "selfie_multiclass_256x256.tflite"
