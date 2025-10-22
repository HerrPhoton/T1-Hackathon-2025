from abc import ABC, abstractmethod

import numpy as np


class Segmentor(ABC):

    @abstractmethod
    def predict(self, frame: np.ndarray) -> np.ndarray:
        """Предсказывает маску человека на входном кадре

        :param np.ndarray frame: Входной кадр (H, W, 3)
        :return np.ndarray: Маска человека (H, W, 1)
        """
        pass
