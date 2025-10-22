// Convierte cualquier imagen web-compat a JPEG corregida de orientación y limitada por tamaño.
    // Devuelve un Blob JPEG. Lanza error si el formato no es soportado.
    export async function toJpegBlobFixed(file, quality = 0.9, maxWidth = 2000, maxHeight = 2000) {
      // 0) Validación de tipo (evitamos HEIC/HEIF)
      const type = (file?.type || '').toLowerCase();
      const isImage = type.startsWith('image/');
      const webCompat = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!isImage || !webCompat.includes(type)) {
        throw new Error('Formato no soportado. Usa JPEG o PNG.');
      }

      // Helper: escala y exporta canvas -> JPEG Blob
      const canvasToJpegBlob = (srcCanvas) =>
        new Promise((resolve, reject) => {
          const { width, height } = srcCanvas;
          const scale = Math.min(1, maxWidth / width, maxHeight / height);

          const out = document.createElement('canvas');
          out.width = Math.round(width * scale);
          out.height = Math.round(height * scale);

          const ctx = out.getContext('2d');
          ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);

          out.toBlob((blob) => {
            if (!blob) return reject(new Error('Fallo al convertir a JPEG'));
            resolve(blob);
          }, 'image/jpeg', quality);
        });

      // 1) Intento preferido: createImageBitmap con orientación desde EXIF
      if ('createImageBitmap' in window) {
        try {
          const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
          const c = document.createElement('canvas');
          c.width = bmp.width;
          c.height = bmp.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(bmp, 0, 0);
          return await canvasToJpegBlob(c);
        } catch {
          // seguimos al fallback
        }
      }

      // 2) Fallback: FileReader + <img>
      const dataURL = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('No se pudo leer el archivo'));
        r.readAsDataURL(file);
      });

      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
        i.src = dataURL;
      });

      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      c.getContext('2d').drawImage(img, 0, 0);

      return await canvasToJpegBlob(c);
    }