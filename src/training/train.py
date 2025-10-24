import argparse

from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLOv11 Segmentation with custom parameters")

    parser.add_argument('--data', type=str, required=True, help='Путь к data.yaml')
    parser.add_argument('--model', type=str, default='yolov11-seg.pt', help='Модель')

    parser.add_argument('--imgsz', type=int, default=640, help='Размер входного изображения')
    parser.add_argument('--batch', type=int, default=8, help='Размер батча')
    parser.add_argument('--epochs', type=int, default=50, help='Количество эпох')
    parser.add_argument('--lr0', type=float, default=0.01, help='Learning rate')
    parser.add_argument('--weight_decay', type=float, default=0.0005, help='Weight decay')
    parser.add_argument('--optimizer', type=str, default='auto', help='Оптимизатор: SGD или Adam')


    parser.add_argument('--hsv_h', type=float, default=0.015, help='Hue augmentation')
    parser.add_argument('--hsv_s', type=float, default=0.7, help='Saturation augmentation')
    parser.add_argument('--hsv_v', type=float, default=0.5, help='Value augmentation')
    parser.add_argument('--bgr', type=float, default=0.3, help='Swaps the color channels')

    parser.add_argument('--copy_paste', type=float, default=0.5, help='Шанс копирования маски с др изображения')
    parser.add_argument('--copy_paste_mode', type=str, default='flip', help=' Determines the method used for copy-paste augmentation')

    return parser.parse_args()


def main():
    args = parse_args()

    augment = bool(args.augment)
    project = bool(args.project)

    model = YOLO(args.model)

    model.train(
        data=args.data,

        imgsz=args.imgsz,
        batch=args.batch,
        epochs=args.epochs,
        lr0=args.lr0,
        weight_decay=args.weight_decay,
        optimizer=args.optimizer,

        hsv_h=args.hsv_h,
        hsv_s=args.hsv_s,
        hsv_v=args.hsv_v,
        bgr=args.bgr,
        copy_paste=args.copy_paste,
        copy_paste_mode=args.copy_paste_mode,
    )


if __name__ == '__main__':
    main()
