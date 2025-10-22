import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

const FileUpload = ({
  id,
  label,
  onFileChange,
  acceptedFileTypes = 'image/jpeg,image/png',
  capture = 'environment',
  currentFile,
  existingFile,
  required = false,
  helpText,
  disabled = false,
  maxSizeMB = 5,
  normalizeImages = true,
}) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isNewFile, setIsNewFile] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const normalizeImageFile = async (file, { maxSize = 2000, quality = 0.9 }) => {
    const type = (file.type || '').toLowerCase();
    if (!type.startsWith('image/')) return file;

    try {
      const imageBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const { width, height } = imageBitmap;
      const scale = Math.min(1, maxSize / width, maxSize / height);
      const targetWidth = Math.round(width * scale);
      const targetHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo obtener el contexto del canvas.');

      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      return await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('La conversión a Blob falló.'));
            const originalName = file.name?.replace(/\.[^.]+$/, '') || 'imagen';
            resolve(new File([blob], `${originalName}.jpg`, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      });
    } catch (error) {
      console.error('Error normalizando imagen, se usa el archivo original:', error);
      return file;
    }
  };

  useEffect(() => {
    if (currentFile instanceof File) {
      handleFileDisplay(currentFile);
      setIsNewFile(true);
    } else if (existingFile?.file_url) {
      setFileName(getFileNameFromUrl(existingFile.file_url));
      setPreview(null);
      setIsNewFile(false);
    } else {
      setFileName('');
      setPreview(null);
      setIsNewFile(false);
    }
  }, [currentFile, existingFile]);

  const getFileNameFromUrl = (url) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split('/');
      const lastPart = parts[parts.length - 1];
      const namePart = lastPart.split('?')[0];
      const finalName = namePart.split('_').slice(2).join('_');
      return finalName || 'Archivo existente';
    } catch {
      return 'Archivo existente';
    }
  };

  const handleFileDisplay = (fileOrBlob) => {
    const displayName = fileOrBlob.name || 'archivo';
    setFileName(displayName);
    const isImg = (fileOrBlob.type || '').startsWith('image/');
    if (isImg) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(fileOrBlob);
    } else {
      setPreview(null);
    }
  };

  const validateType = (file) => {
    const list = acceptedFileTypes.split(',').map((s) => s.trim());
    const ok = list.some((pattern) => {
      if (pattern.endsWith('/*')) {
        const base = pattern.split('/')[0];
        return (file.type || '').startsWith(base + '/');
      }
      return (file.type || '') === pattern;
    });
    if (!ok) {
      toast({
        title: 'Tipo de archivo no permitido',
        description: `Formatos válidos: ${acceptedFileTypes}`,
        variant: 'destructive',
      });
    }
    return ok;
  };

  const validateSize = (file) => {
    const limit = maxSizeMB * 1024 * 1024;
    if (file.size > limit) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El tamaño máximo es ${maxSizeMB} MB`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const processAndSetFile = async (file) => {
    if (!file) return;
    if (!validateType(file)) return;

    let finalFile = file;
    if (normalizeImages && (file.type || '').startsWith('image/')) {
      finalFile = await normalizeImageFile(file, { maxSize: 2000, quality: 0.9 });
    }
    if (!validateSize(finalFile)) return;

    handleFileDisplay(finalFile);
    onFileChange?.(id, finalFile);
    setIsNewFile(true);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    await processAndSetFile(file);
  };

  const handleRemoveFile = () => {
    setPreview(null);
    setFileName('');
    setIsNewFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onFileChange?.(id, null);
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerCameraInput = () => cameraInputRef.current?.click();

  // --- Prevención de navegación/recarga por arrastrar y soltar ---
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    await processAndSetFile(file);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" className="ml-2">
            <CheckCircle className="w-3 h-3 mr-1" /> Aprobado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="ml-2">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Pendiente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="ml-2">
            <AlertCircle className="w-3 h-3 mr-1" /> Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  const hasExistingApprovedDoc = existingFile?.status === 'approved' && !isNewFile;
  const acceptsPDF = /pdf/i.test(acceptedFileTypes);

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // Bloquea Enter para que no se envíe el form padre
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
    >
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {existingFile && !isNewFile && getStatusBadge(existingFile.status)}
      </div>

      {helpText && <p className="text-xs text-gray-500 -mt-1 mb-1">{helpText}</p>}

      <div
        className={`w-full p-4 border-2 border-dashed rounded-xl transition-colors duration-200 ${disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : hasExistingApprovedDoc
              ? 'border-green-400 bg-green-50'
              : isNewFile
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 bg-gray-50'
          }`}
        // Evita navegación por arrastrar un archivo (PDF/imágenes) a la página
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        {fileName ? (
          <div className="flex flex-col items-center text-center">
            {preview ? (
              <img src={preview} alt="Vista previa" className="max-h-32 w-auto rounded-md mb-3 object-contain" />
            ) : (
              <FileText className="w-12 h-12 text-gray-500 mb-2" />
            )}
            <p className="text-sm font-medium text-gray-700 truncate max-w-full px-4">{fileName}</p>

            {existingFile?.file_url && !isNewFile && (
              <a
                href={existingFile.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1"
                onClick={(e) => {
                  // si está dentro de un <form>, evita submit/navegación
                  e.stopPropagation();
                }}
              >
                Ver archivo subido
              </a>
            )}

            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700 mt-2"
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-1" /> {isNewFile ? 'Quitar' : 'Reemplazar'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
            <UploadCloud className="w-10 h-10 text-gray-400" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={triggerFileInput} disabled={disabled}>
                Subir archivo
              </Button>
              <Button type="button" variant="outline" onClick={triggerCameraInput} disabled={disabled}>
                <Camera className="w-4 h-4 mr-2" /> Tomar foto
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {acceptsPDF ? 'Imágenes o PDF' : 'Imágenes (JPEG/PNG)'} (Máx. {maxSizeMB} MB)
            </p>
          </div>
        )}
      </div>

      {existingFile?.status === 'rejected' && !isNewFile && (
        <div className="p-2 bg-red-100 border-l-4 border-red-500 text-red-800 text-xs rounded-md">
          <p className="font-bold">Motivo de rechazo:</p>
          <p>{existingFile.reason || 'No se especificó un motivo.'}</p>
        </div>
      )}

      <input
        id={id}
        ref={fileInputRef}
        type="file"
        multiple={false}
        onChange={handleFileSelect}
        accept={acceptedFileTypes}
        className="hidden"
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        multiple={false}
        onChange={handleFileSelect}
        accept={acceptedFileTypes}
        capture={capture}
        className="hidden"
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      />
    </motion.div>
  );
};

export default FileUpload;