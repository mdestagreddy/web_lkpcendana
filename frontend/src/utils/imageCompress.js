export async function compressImage(file, options = {}) {
    const maxWidth = options.maxWidth || 1920;
    const maxHeight = options.maxHeight || 1920;
    const maxSizeBytes = options.maxSizeBytes || 4.5 * 1024 * 1024;
    const mimeType = options.mimeType || file.type || 'image/jpeg';

    if (!file.type.startsWith('image/')) {
        return file;
    }

    const loadImage = () =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Gagal memuat gambar untuk kompresi'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
            reader.readAsDataURL(file);
        });

    const toBlob = (img, width, height, quality) =>
        new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Gagal kompres gambar'));
                        return;
                    }
                    resolve(blob);
                },
                mimeType,
                quality
            );
        });

    const img = await loadImage();
    const originalWidth = img.width;
    const originalHeight = img.height;

    let quality = 1.0;
    let width = originalWidth;
    let height = originalHeight;
    let blob = await toBlob(img, width, height, quality);

    while (blob.size > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        blob = await toBlob(img, width, height, quality);
    }

    if (blob.size > maxSizeBytes) {
        const scaleW = maxWidth / width;
        const scaleH = maxHeight / height;
        const maxScale = Math.min(scaleW, scaleH, 1);

        if (maxScale < 1) {
            width = Math.max(1, Math.round(width * maxScale));
            height = Math.max(1, Math.round(height * maxScale));
            blob = await toBlob(img, width, height, 0.7);
        }

        while (blob.size > maxSizeBytes && quality > 0.1) {
            quality -= 0.1;
            blob = await toBlob(img, width, height, quality);
        }
    }

    if (blob.size > maxSizeBytes) {
        const ratios = [0.8, 0.6, 0.4, 0.25];
        for (const ratio of ratios) {
            width = Math.max(1, Math.round(originalWidth * ratio));
            height = Math.max(1, Math.round(originalHeight * ratio));
            quality = 0.7;
            blob = await toBlob(img, width, height, quality);

            while (blob.size > maxSizeBytes && quality > 0.1) {
                quality -= 0.1;
                blob = await toBlob(img, width, height, quality);
            }

            if (blob.size <= maxSizeBytes) {
                break;
            }
        }
    }

    return new File([blob], file.name, {
        type: mimeType,
        lastModified: Date.now(),
    });
}
