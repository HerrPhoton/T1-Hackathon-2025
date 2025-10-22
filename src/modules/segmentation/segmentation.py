from typing import Literal

import numpy as np

from src.config.segmenter import SegmenterConfig

from .segmenters.registry import SEGMENTERS


class Segmenter:

    def __init__(self, segmenter: Literal['yolo'] = 'yolo', config: SegmenterConfig | None = None) -> None:
        self.segmenter = SEGMENTERS[segmenter](config)

    def process(self, frame: np.ndarray) -> np.ndarray:
        return self.segmenter.predict(frame)
