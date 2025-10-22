from dataclasses import dataclass

from src.config.path import SEGMENTATION_MODEL_PATH


@dataclass
class SegmenterConfig:
    model_path: str | None = SEGMENTATION_MODEL_PATH
