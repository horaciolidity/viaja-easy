// src/services/documentService.js
import { supabase } from '@/lib/customSupabaseClient';
import { handleAndThrowError, NetworkErrorHandler } from '@/utils/errorHandler';
import { toJpegBlobFixed } from '@/lib/imageUtils';

/* -------------------- VALIDADORES -------------------- */
const isUuid = (id) =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/* Helpers para extensión y tipo seguro */
const extFromName = (name) => {
  if (!name || typeof name !== 'string') return null;
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === name.length - 1) return null;
  return name.slice(lastDot + 1).replace(/[^a-z0-9]/gi, '').toLowerCase();
};

const extFromType = (type) => {
  if (!type || typeof type !== 'string') return null;
  const t = type.toLowerCase();
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'application/pdf': 'pdf',
  };
  if (map[t]) return map[t];

  if (t.includes('/')) {
    return t.split('/')[1].replace(/[^a-z0-9]/gi, '').substring(0, 10) || null;
  }
  return null;
};

const resolveFileMeta = (file) => {
  const nameExt = file?.name ? extFromName(file.name) : null;
  const typeExt = file?.type ? extFromType(file.type) : null;

  return {
    ext: nameExt || typeExt || 'bin',
    contentType: file?.type?.trim() || 'application/octet-stream',
  };
};

/* Normaliza un único archivo */
const normalizeOne = (val) => {
  if (!val) return null;
  if (typeof FileList !== 'undefined' && val instanceof FileList) return val[0] || null;
  if (typeof File !== 'undefined' && val instanceof File) return val;
  if (typeof Blob !== 'undefined' && val instanceof Blob) return val;
  if (Array.isArray(val)) return val.find(Boolean) || null;
  return val;
};

/* -------------------- SUBIDA UNITARIA -------------------- */
export const uploadDocument = async (userId, file, docType) => {
  if (!file) throw new Error('No se ha seleccionado ningún archivo.');

  const one = normalizeOne(file);
  if (!one) throw new Error('No se recibió un archivo válido.');

  // Procesar imágenes -> JPEG
  let processedFile = one;
  if (one.type?.startsWith('image/')) {
    try {
      processedFile = await toJpegBlobFixed(one, 0.85, 2000, 2000);
    } catch (err) {
      console.warn('⚠️ Error en toJpegBlobFixed, usando archivo original:', err);
      processedFile = one;
    }
  }

  const { ext, contentType } = resolveFileMeta(processedFile);
  let bucket = 'user_documents';
  let filePath = `${userId}/${docType}_${Date.now()}.${ext}`;

  // Fotos de vehículo -> bucket especial
  if (docType?.startsWith('vehicle_photo')) {
    bucket = 'vehicle-docs';
    filePath = `${userId}/${docType}.${ext}`;
  }

  const { error } = await supabase.storage.from(bucket).upload(filePath, processedFile, {
    cacheControl: '3600',
    upsert: true,
    contentType,
  });

  if (error) handleAndThrowError(error, 'subida de documento');
  return { filePath, bucket };
};

/* -------------------- GUARDAR REGISTRO -------------------- */
export const saveDocumentRecord = async ({ user_id, doc_type, file_path, bucket, user_type }) => {
  const table = user_type === 'driver' ? 'driver_documents' : 'passenger_documents';

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file_path);
  const updateData = {
    user_id,
    doc_type,
    file_url: `${urlData.publicUrl}?t=${Date.now()}`,
    status: 'pending',
    updated_at: new Date().toISOString(),
  };

  if (doc_type === 'vehicle_photo_front') {
    updateData.vehicle_front_path = file_path;
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(updateData, { onConflict: 'user_id, doc_type' })
    .select()
    .single();

  if (error) handleAndThrowError(error, 'guardado de registro de documento');
  return data;
};

/* -------------------- SUBIDA MÚLTIPLE -------------------- */
export const uploadUserDocuments = async (userId, userType, files) => {
  try {
    const tasks = Object.keys(files || {}).map(async (docType) => {
      const file = normalizeOne(files[docType]);
      if (!file) return;
      const { filePath, bucket } = await uploadDocument(userId, file, docType);
      await saveDocumentRecord({ user_id: userId, doc_type: docType, file_path: filePath, bucket, user_type: userType });
    });

    await Promise.all(tasks);
    return { success: true };
  } catch (err) {
    handleAndThrowError(err, 'subida de documentos del usuario');
  }
};

/* -------------------- CONSULTAS -------------------- */
export const getUserDocuments = async (userId) => {
  try {
    const [driver, passenger] = await Promise.all([
      supabase.from('driver_documents').select('*').eq('user_id', userId),
      supabase.from('passenger_documents').select('*').eq('user_id', userId),
    ]);

    if (driver.error) throw driver.error;
    if (passenger.error) throw passenger.error;

    return { driver: driver.data || [], passenger: passenger.data || [] };
  } catch (err) {
    handleAndThrowError(err, 'obtención de documentos del usuario');
  }
};

export const getDocumentRequirements = async () => {
  try {
    const [driver, passenger] = await Promise.all([
      supabase.rpc('required_driver_docs'),
      supabase.rpc('required_passenger_docs'),
    ]);

    if (driver.error) throw driver.error;
    if (passenger.error) throw passenger.error;

    return { driver: driver.data || [], passenger: passenger.data || [] };
  } catch (err) {
    handleAndThrowError(err, 'obtención de requisitos de documentos');
  }
};

export const reviewDocument = async ({ docId, newStatus, reason, docTable }) => {
  if (!isUuid(docId)) throw new Error(`ID inválido: ${docId}`);

  const { data, error: userError } = await supabase.auth.getUser();
  const adminUser = data?.user;
  if (userError || !adminUser) {
    if (userError) await NetworkErrorHandler.handleSessionError(userError);
    throw new Error('No se pudo obtener el usuario administrador.');
  }

  const { error } = await supabase.rpc('review_document', {
    p_doc_id: docId,
    p_new_status: newStatus,
    p_reason: reason ?? null,
    p_admin_id: adminUser.id,
  });

  if (error) {
    if (await NetworkErrorHandler.handleSessionError(error)) return;
    handleAndThrowError(error, 'revisión de documento');
  }
  return { success: true };
};

export const getDocumentHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('target_type', 'document')
      .eq('details->>reviewed_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    handleAndThrowError(err, 'obtención de historial de documentos');
  }
};

export const getAllUserDocumentsForAdmin = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_user_documents');
    if (error) throw error;
    return data;
  } catch (err) {
    handleAndThrowError(err, 'obtención de todos los documentos');
  }
};