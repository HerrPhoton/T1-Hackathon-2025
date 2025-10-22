import numpy as np

from src.modules import Segmenter, BackgroundProcessor
from src.modules.background import SolidColorBackground


class FramePipeline:

    def __init__(self):
        self.segmenter = Segmenter()
        self.background_processor = BackgroundProcessor(SolidColorBackground(color=(0, 0, 0)))

    def process(self, frame: np.ndarray) -> np.ndarray:

        mask = self.segmenter.process(frame)

        out = self.background_processor.apply(frame, mask)
        return out
