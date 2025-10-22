from pathlib import Path

ROOT_PATH = Path(__file__).resolve().parents[2]

WEIGHTS_PATH = ROOT_PATH / "weights"
SEGMENTATION_WEIGHTS_PATH = WEIGHTS_PATH / "segmentation"
SEGMENTATION_MODEL_PATH = SEGMENTATION_WEIGHTS_PATH / "yolo11n-seg.pt"
