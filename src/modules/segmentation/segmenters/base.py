from abc import ABC, abstractmethod

import numpy as np


class Segmentor(ABC):

    @abstractmethod
    def segment(self, frame: np.ndarray) -> np.ndarray:
        """Предсказывает многоклассовую маску по входному кадру

        :param np.ndarray frame: Входной кадр (H, W, 3)
        :return np.ndarray: Маска по размеру входного изображения (H, W); 0 — фон, >0 — передний план
        """
        pass
