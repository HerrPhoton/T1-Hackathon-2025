import numpy as np

from .effects import BackgroundEffect


class BackgroundProcessor:

    def __init__(self, effect: BackgroundEffect):
        self.effect = effect

    def apply(self, frame: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """Применяет эффект фона к входному кадру с учетом маски объектов

        :param np.ndarray frame: Входной кадр (H, W, 3)
        :param np.ndarray mask: Маска объектов (H, W); 0 — фон, >0 — передний план
        :return np.ndarray: Кадр с примененным эффектом для фона
        """
        background = self.effect.make_background(frame)
        mask = mask[..., np.newaxis]

        out = np.where(mask != 0, frame, background)
        out = out.astype(np.uint8)

        return out
