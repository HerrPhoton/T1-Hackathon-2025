from collections.abc import Sequence

import cv2
import numpy as np
from ultralytics import YOLO

from src.config.segmenter import SegmenterConfig

from .base import Segmentor


class YOLOSegmenter(Segmentor):

    def __init__(self, config: SegmenterConfig | None) -> None:
        self.config = config or SegmenterConfig()
        self.model = YOLO(self.config.model_path)

    def predict(self, frame: np.ndarray) -> np.ndarray:

        results = self.model.predict(frame, classes=[0])

        polygons = []
        for result in results:
            if result.masks and result.masks.xy is not None:
                for polygon in result.masks.xy:
                    polygons.append(np.asarray(polygon, dtype=np.int32))

        mask = self._build_mask(frame.shape[:2], polygons)
        return mask

    def _build_mask(self, frame_size: tuple[int, int], polygons: Sequence[np.ndarray]) -> np.ndarray:
        """Формирует маску размера исходного кадра по точкам маски человека

        :param tuple[int, int] frame_size: Размер входного кадра (H, W)
        :param Sequence[np.ndarray] points: Точки маски человека
        :return np.ndarray: Маска размера исходного кадра
        """
        mask = np.zeros(frame_size, dtype=np.uint8)
        cv2.fillPoly(mask, polygons, 255)
        mask = mask[..., np.newaxis]

        return mask
