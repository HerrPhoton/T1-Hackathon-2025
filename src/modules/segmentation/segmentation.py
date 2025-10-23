from typing import Literal

import numpy as np

from .segmenters import Segmentor
from .segmenters.registry import SEGMENTERS


class Segmenter:

    def __init__(self, model: Literal['yolo', 'mediapipe'], **kwargs) -> None:
        self.segmenter: Segmentor = SEGMENTERS[model](**kwargs)

    def segment(self, frame: np.ndarray) -> np.ndarray:
        return self.segmenter.segment(frame)
