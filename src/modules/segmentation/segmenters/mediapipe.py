import urllib.request
from pathlib import Path

import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import ImageSegmenter, ImageSegmenterOptions

from src.config.path import SEGMENTATION_MP_PATH, SEGMENTATION_WEIGHTS_PATH

from .base import Segmentor


class MediaPipeSegmenter(Segmentor):

    DEFAULT_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite'

    def __init__(self, model_path: str | None = None) -> None:
        model_asset_path = self._ensure_model(model_path)

        options = ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=model_asset_path),
            output_category_mask=True,
        )
        self.segmenter = ImageSegmenter.create_from_options(options)

    def segment(self, frame: np.ndarray) -> np.ndarray:

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        result = self.segmenter.segment(mp_image)

        category_mask = result.category_mask.numpy_view()
        category_mask = category_mask.astype(np.uint8)

        return category_mask

    def _ensure_model(self, model_path: str | None) -> None:

        if model_path:
            if Path(model_path).exists():
                return model_path
            elif Path(model_path) != SEGMENTATION_MP_PATH:
                raise FileNotFoundError(f'Модель не найдена: {model_path}')

        filename = Path(self.DEFAULT_MODEL_URL).name
        dst = str(SEGMENTATION_WEIGHTS_PATH / filename)

        urllib.request.urlretrieve(self.DEFAULT_MODEL_URL, dst)

        return dst
