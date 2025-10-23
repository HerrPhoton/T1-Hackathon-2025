from collections.abc import Sequence

import cv2
import numpy as np
from ultralytics import YOLO

from .base import Segmentor


class YOLOSegmenter(Segmentor):

    def __init__(
        self,
        model_path: str,
        classes: Sequence[int] = (0),
        conf: float = 0.25,
    ) -> None:

        self.classes = classes
        self.conf = conf

        self.model = YOLO(model_path)

    def segment(self, frame: np.ndarray) -> np.ndarray:

        results = self.model.predict(frame, classes=self.classes, conf=self.conf)

        polygons: list[tuple[int, np.ndarray]] = []
        for result in results:
            if result.masks and result.masks.xy is not None:
                for i, polygon in zip(result.boxes.cls, result.masks.xy):
                    polygons.append((int(i), np.asarray(polygon, dtype=np.int32)))

        mask = self._build_mask(frame.shape[:2], polygons)
        return mask

    def _build_mask(self, frame_size: tuple[int, int], polygons: Sequence[tuple[int, np.ndarray]]) -> np.ndarray:
        """Формирует маску размера исходного кадра по координатам точек маски

        :param tuple[int, int] frame_size: Размер входного кадра (H, W)
        :param Sequence[tuple[int, np.ndarray]] polygons: Индекс класса и точки для каждой найденной маски
        :return np.ndarray: Маска размера исходного кадра (H, W), где 0 - это фон
        """
        mask = np.zeros(frame_size, dtype=np.uint8)

        for i, polygon in polygons:
            cv2.fillPoly(mask, [polygon], i + 1)

        return mask
