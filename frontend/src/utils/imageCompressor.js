/**
 * Client-Side Image Compressor Utility
 * 
 * Compresses images before they are converted to Base64 strings.
 * This prevents the HTTP 413 "Request Entity Too Large" error 
 * when syncing client-side images (many megapixels) to the server.
 * 
 * Fits perfectly within standard browser canvas APIs and is 100% free with 0 setup cost.
 */

/**
 * Compresses an image file (e.g. PNG, JPEG) to compressed JPEG Base64.
 * Returns the compressed standard Base64 string, or the raw Base64 if file is not an image (like a PDF).
 * 
 * @param {File|Blob} file - The uploaded file object
 * @param {number} quality - Compression quality between 0.0 and 1.0 (default 0.7)
 * @param {number} maxWidth - Max width bound of the resized image (default 1200)
 * @param {number} maxHeight - Max height bound of the resized image (default 1200)
 * @returns {Promise<string>} Compressed Base64 string (Data URI)
 */
export function compressImageToBase64(file, quality = 0.35, maxWidth = 500, maxHeight = 500) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }

    // Fallback immediately for non-image files (e.g., PDFs)
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new size maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target.result); // Fallback
            return;
          }

          // Fill space with white background (useful for transparent PNG-to-JPEG conversion)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);

          // Downscale & compress to target quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          console.log(`[Compression] Cleaned image ${file.name} successfully. Size diff:`, {
            originalSizeApprox: Math.round(event.target.result.length / 1024) + ' KB',
            compressedSize: Math.round(compressedDataUrl.length / 1024) + ' KB'
          });
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('[Compression] Soft compression exception - defaulting to base source:', err);
          resolve(event.target.result);
        }
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Base64 dataURL (e.g., from Canvas) back to a standard JS File object
 * so it can be transmitted via FormData multipart-upload.
 * 
 * @param {string} dataurl - Base64 Data URI
 * @param {string} filename - Desired name of the file
 * @returns {File} JS binary File object ready for FormData
 */
export function dataURLtoFile(dataurl, filename) {
  if (!dataurl) return null;
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
