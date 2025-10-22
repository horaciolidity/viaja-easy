const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

export const safeExtFromName = (name) => {
  if (!name || typeof name !== 'string') return null;
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === name.length - 1) return null;
  const raw = name.slice(lastDot + 1).trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9]/g, '');
  return cleaned || null;
};

export const safeExtFromType = (type) => {
  if (!type || typeof type !== 'string' || !type.trim()) return null;
  const t = type.toLowerCase();
  if (MIME_TO_EXT[t]) return MIME_TO_EXT[t];
  const i = t.indexOf('/');
  if (i !== -1 && i < t.length - 1) {
    const guess = t.slice(i + 1).replace(/[^a-z0-9]/gi, '');
    return guess ? guess.substring(0, 10) : null;
  }
  return null;
};

export const resolveFileMeta = (file) => {
  const hasName = file && typeof file === 'object' && Object.prototype.hasOwnProperty.call(file, 'name');
  const ext = safeExtFromName(hasName ? file.name : null)
          || safeExtFromType(file && file.type)
          || 'bin';
  const contentType = (file && typeof file.type === 'string' && file.type.trim())
    ? file.type
    : 'application/octet-stream';
  return { ext, contentType };
};

/** Data URL -> Blob (sin fetch) */
export const dataUrlToBlob = (dataUrl) => {
  const m = /^data:([^;]+)?(;base64)?,(.*)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1] || 'application/octet-stream';
  const isB64 = !!m[2];
  const payload = m[3] || '';
  let bytes;
  if (isB64 && typeof atob === 'function') {
    const bin = atob(payload);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    bytes = arr;
  } else {
    const dec = decodeURIComponent(payload);
    const arr = new Uint8Array(dec.length);
    for (let i = 0; i < dec.length; i++) arr[i] = dec.charCodeAt(i);
    bytes = arr;
  }
  return new Blob([bytes], { type: mime });
};