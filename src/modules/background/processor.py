from collections.abc import Sequence

import cv2
import numpy as np

from .effects.base import BackgroundEffect


class BackgroundProcessor:

    def __init__(self, effect: BackgroundEffect):
        self.effect = effect

    def apply(self, frame: np.ndarray, polygons: Sequence[np.ndarray]) -> np.ndarray:
        """Применяет эффект фона к входному кадру с учетом маски человека

        :param np.ndarray frame: Входной кадр
        :param Sequence[np.ndarray] polygons: Точки маски человека
        :return np.ndarray: Кадр с примененным эффектом для фона
        """
        person_mask = self._build_binary_mask(frame.shape[:2], polygons)
        background = self.effect.make_background(frame)

        out = np.where(person_mask == 255, frame, background)
        out = out.astype(np.uint8)

        return out

    def _build_binary_mask(self, frame_size: tuple[int, int], polygons: Sequence[np.ndarray]) -> np.ndarray:
        """Формирует маску размера исходного кадра по точкам маски человека

        :param tuple[int, int] frame_size: Размер входного кадра (H, W)
        :param Sequence[np.ndarray] points: Точки маски человека
        :return np.ndarray: Маска размера исходного кадра
        """
        mask = np.zeros(frame_size, dtype=np.uint8)
        cv2.fillPoly(mask, polygons, 255)
        mask = mask[..., np.newaxis]

        return mask
