import re
from pathlib import Path

from .extensions import ImageExtensions


class YOLODatasetRenamer:

    def __init__(
        self,
        dataset_dir: str | Path,
        prefix: str | None = None,
        dry_run: bool = False,
    ):
        self.dataset_dir = Path(dataset_dir).resolve()
        self.prefix = prefix or self._get_prefix()
        self.dry_run = dry_run

        self._validate_structure()

    def find_yolo_pairs(self) -> list[tuple[Path, Path]]:
        """Рекурсивно находит пары изображений и меток.

        :return list[tuple[Path, Path]]: Список пар изображений и меток
        """
        pairs = []
        splits = self._find_dataset_splits()

        for split_dir in splits:
            images_dir = split_dir / "images"
            labels_dir = split_dir / "labels"

            for img_path in images_dir.rglob("*"):
                if not img_path.is_file() or img_path.suffix.lower() not in ImageExtensions.get_extensions():
                    continue

                rel_path = img_path.relative_to(images_dir)
                lbl_path = labels_dir / rel_path.with_suffix(".txt")

                if lbl_path.exists():
                    pairs.append((img_path, lbl_path))
                else:
                    print(f"No label found for image: {img_path}")

        return pairs

    def rename_pairs(self, pairs: list[tuple[Path, Path]]) -> None:
        """Переименовывает все пары с заданным префиксом.

        :param list[tuple[Path, Path]] pairs: Список пар изображений и меток
        """
        for idx, (img, lbl) in enumerate(pairs, start=1):
            new_name = f"{self.prefix}_{idx:05d}"
            new_img = img.with_name(new_name + img.suffix)
            new_lbl = lbl.with_name(new_name + lbl.suffix)

            if self.dry_run:
                print(f"[DRY-RUN] Would rename: {img.name} -> {new_img.name}")
                print(f"[DRY-RUN] Would rename: {lbl.name} -> {new_lbl.name}")
                continue

            img.rename(new_img)
            lbl.rename(new_lbl)

    def run(self) -> None:
        """Запускает переименование."""
        pairs = self.find_yolo_pairs()
        self.rename_pairs(pairs)

    def _validate_structure(self) -> None:
        """Проверяет, что директория датасета имеет 'images' и 'labels' директории.

        :raise FileNotFoundError: Если директория датасета не найдена или не имеет 'images' и 'labels' директорий
        """
        if not self.dataset_dir.exists():
            raise FileNotFoundError(f"Dataset directory not found: {self.dataset_dir}")

        splits = self._find_dataset_splits()
        if not splits:
            raise FileNotFoundError(f"No valid dataset splits found in {self.dataset_dir}. Expected directories with 'images' and 'labels' subdirectories.")

    def _find_dataset_splits(self) -> list[Path]:
        """Находит все подпапки с парами images/ и labels/.

        :return list[Path]: Список путей к подпапкам с парами images/ и labels/
        """
        splits = []

        if self._has_images_and_labels(self.dataset_dir):
            splits.append(self.dataset_dir)

        for subdir in self.dataset_dir.iterdir():
            if subdir.is_dir() and self._has_images_and_labels(subdir):
                splits.append(subdir)

        return splits

    def _has_images_and_labels(self, directory: Path) -> bool:
        """Проверяет, есть ли в директории папки images/ и labels/.

        :param Path directory: Путь к директории для проверки
        :return bool: True если обе папки существуют
        """
        images_dir = directory / "images"
        labels_dir = directory / "labels"

        return images_dir.exists() and labels_dir.exists()

    def _get_prefix(self) -> str:
        """Формирует префикс из названия директории датасета.

        :return str: Префикс, полученный из нормализованного названия директории датасета
        """
        prefix = self.dataset_dir.name
        prefix = prefix.lower()
        prefix = re.sub(r'[^a-z0-9]+', '_', prefix)
        prefix = re.sub(r'_+', '_', prefix)
        prefix = prefix.strip('_')

        if not prefix:
            prefix = 'dataset'

        if len(prefix) > 20:
            prefix = prefix[:20].rstrip('_')

        return prefix
