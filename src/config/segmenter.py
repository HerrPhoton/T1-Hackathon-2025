from typing import Literal
from dataclasses import dataclass


@dataclass
class SegmenterConfig:
    model: Literal['yolo', 'mediapipe']
    model_path: str | None = None

    def asdict(self):
        return {
            "model": self.model,
            "model_path": self.model_path,
        }
