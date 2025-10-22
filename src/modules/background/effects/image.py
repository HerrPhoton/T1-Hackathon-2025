from typing import Literal

import cv2
import numpy as np

from .base import BackgroundEffect


class ImageBackground(BackgroundEffect):

    def __init__(self, image: np.ndarray, mode: Literal["fill", "stretch"] = "stretch"):
        self.image = image
        self.mode = mode

    def make_background(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]

        match self.mode:
            case "stretch":
                return cv2.resize(self.image, (w, h), interpolation=cv2.INTER_LINEAR)

            case "fill":
                ih, iw = self.image.shape[:2]

                scale = max(w / iw, h / ih)
                nw, nh = int(iw * scale), int(ih * scale)

                resized = cv2.resize(self.image, (nw, nh), interpolation=cv2.INTER_LINEAR)

                x0 = (nw - w) // 2
                y0 = (nh - h) // 2

                return resized[y0:y0 + h, x0:x0 + w]
