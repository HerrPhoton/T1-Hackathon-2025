from abc import abstractmethod

import numpy as np


class BackgroundEffect:

    @abstractmethod
    def make_background(self, frame: np.ndarray) -> np.ndarray:
        """Создает фон с выбранным эффектом под размер входного кадра

        :param np.ndarray frame: Входной кадр
        :return np.ndarray: Фон
        """
        pass
