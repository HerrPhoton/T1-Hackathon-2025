import { BackgroundEffect } from './base';

export class ImageBackground extends BackgroundEffect {
    constructor(image, mode = 'stretch') {
        this.image = image;
        this.mode = mode;
    }

    makeBackground(frame) {
        const h = frame.videoHeight || frame.height;
        const w = frame.videoWidth || frame.width;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        switch (this.mode) {
            case 'stretch':
                ctx.drawImage(this.image, 0, 0, w, h);
                break;

            case 'fill':
                const ih = this.image.naturalHeight || this.image.height;
                const iw = this.image.naturalWidth || this.image.width;

                const scale = Math.max(w / iw, h / ih);
                const nw = iw * scale;
                const nh = ih * scale;

                const x0 = (nw - w) / 2;
                const y0 = (nh - h) / 2;

                ctx.drawImage(
                    this.image,
                    x0, y0, w, h,    
                    0, 0, w, h      
                );
                break;
        }

        return canvas;
    }
}