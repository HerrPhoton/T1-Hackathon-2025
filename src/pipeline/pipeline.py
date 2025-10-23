import numpy as np

from src.config import PipelineConfig
from src.modules import Segmenter, BackgroundProcessor


class FramePipeline:

    def __init__(self, config: PipelineConfig):
        self.segmenter = Segmenter(**config.segmenter.asdict())
        self.background_processor = BackgroundProcessor(**config.background.asdict())

    def process(self, frame: np.ndarray) -> np.ndarray:

        mask = self.segmenter.segment(frame)

        out = self.background_processor.apply(frame, mask)
        return out
