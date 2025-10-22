import numpy as np

from .base import BackgroundEffect


class SolidColorBackground(BackgroundEffect):

    def __init__(self, color: tuple[int, int, int] = (0, 0, 0)):
        self.color = color

    def make_background(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]

        background = np.empty((h, w, 3), dtype=np.uint8)
        background[:] = self.color

        return background
