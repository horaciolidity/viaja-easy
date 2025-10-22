import * as faceapi from 'face-api.js';
import { supabase } from '@/lib/supabaseClient';

const MODELS_URL = `${import.meta.env.BASE_URL || '/'}models`;

let modelsLoaded = false;
let faceDetectorOptions = null;

export async function loadModels() {
  if (modelsLoaded) return;
  try {
    console.log(`Cargando modelos desde: ${MODELS_URL}`);
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]);
    faceDetectorOptions = new faceapi.TinyFaceDetectorOptions();
    modelsLoaded = true;
    console.log("Modelos de FaceAPI cargados correctamente.");
  } catch (error) {
    console.error('Error al cargar los modelos de FaceAPI:', error);
    throw new Error('No se pudieron cargar los modelos de reconocimiento facial.');
  }
}

export async function toEmbedding(videoElement) {
  if (!modelsLoaded) await loadModels();
  const detections = await faceapi.detectSingleFace(videoElement, faceDetectorOptions).withFaceLandmarks().withFaceDescriptor();
  if (!detections) {
    throw new Error('No se detectó ningún rostro.');
  }
  return detections.descriptor;
}

export function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2) return 2;
  return faceapi.euclideanDistance(desc1, desc2);
}

export function verify(embeddingA, embeddingB, threshold = 0.50) {
  const distance = euclideanDistance(embeddingA, embeddingB);
  return distance < threshold;
}

export async function livenessCheck(videoElement) {
  if (!modelsLoaded) await loadModels();
  const firstDetection = await faceapi.detectSingleFace(videoElement, faceDetectorOptions).withFaceLandmarks();
  if (!firstDetection) return false;

  await new Promise(resolve => setTimeout(resolve, 750));

  const secondDetection = await faceapi.detectSingleFace(videoElement, faceDetectorOptions).withFaceLandmarks();
  if (!secondDetection) return false;

  const positionDifference = firstDetection.detection.box.topLeft.sub(secondDetection.detection.box.topLeft);
  const distance = Math.sqrt(positionDifference.x ** 2 + positionDifference.y ** 2);
  
  return distance < 50;
}

export async function enrollFace(driverId, videoElement) {
  if (!driverId || !videoElement) {
    throw new Error("Driver ID and video element are required for enrollment.");
  }
  
  const livenessPassed = await livenessCheck(videoElement);
  if (!livenessPassed) {
    throw new Error("Prueba de vida fallida. Por favor, mantené la cara quieta durante la captura.");
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

  const embedding = await faceapi.computeFaceDescriptor(videoElement);
  if (!embedding) {
    throw new Error("No se pudo generar la huella facial. Intenta de nuevo con mejor iluminación.");
  }

  const filePath = `avatars/${driverId}/avatar_${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, imageBlob, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw new Error("No se pudo subir tu foto de perfil.");
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(uploadData.path);

  const avatarUrl = urlData.publicUrl;

  const { data: rpcData, error: rpcError } = await supabase.rpc('set_face_template_and_avatar', {
    p_user_id: driverId,
    p_embedding: Array.from(embedding),
    p_avatar_url: avatarUrl
  });

  if (rpcError) {
    console.error("Error saving face template:", rpcError);
    throw new Error("No se pudo guardar la referencia facial. Contacta a soporte.");
  }

  if (!rpcData.success) {
    throw new Error(rpcData.message || "Ocurrió un error al guardar la referencia.");
  }

  return { success: true, embedding, avatarUrl };
}