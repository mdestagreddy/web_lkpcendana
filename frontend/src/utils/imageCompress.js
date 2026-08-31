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
    let { width, height } = img;

    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    let quality = 0.85;
    let blob = await toBlob(img, width, height, quality);

    while (blob.size > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        blob = await toBlob(img, width, height, quality);
    }

    if (blob.size > maxSizeBytes) {
        const scaleW = maxWidth / width;
        const scaleH = maxHeight / height;
        const ratio = Math.min(scaleW, scaleH, 0.8);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
        blob = await toBlob(img, width, height, 0.7);
    }

    return new File([blob], file.name, {
        type: mimeType,
        lastModified: Date.now(),
    });
}
