from dataclasses import dataclass

from .segmenter import SegmenterConfig
from .background import BackgroundConfig


@dataclass
class PipelineConfig:
    segmenter: SegmenterConfig
    background: BackgroundConfig
