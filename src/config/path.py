from pathlib import Path

ROOT_PATH = Path(__file__).resolve().parents[2]
WEIGHTS_PATH = ROOT_PATH / "src" / "nn" / "weights"
SEGMENTATION_WEIGHTS_PATH = WEIGHTS_PATH / "segmentation"
