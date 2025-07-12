"use client"
import React, { useState, useRef } from 'react';
import { Button, Card, CardBody, Image as NextUIImage } from '@nextui-org/react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImagesChanged?: (files: File[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

// Aspectos permitidos: 1:1, 9:16, 4:5
const ALLOWED_ASPECTS = [
  { name: '1:1 (Quadrado)', ratio: 1 },
  { name: '9:16 (Vertical)', ratio: 9/16 },
  { name: '4:5 (Instagram)', ratio: 4/5 }
];

const ASPECT_TOLERANCE = 0.1; // Tolerância de 10% para o aspecto

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChanged,
  folder = 'events',
  maxImages = 5,
  className = '',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para validar o aspecto da imagem
  const validateImageAspect = (file: File): Promise<{ valid: boolean; aspect?: string; error?: string }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        
        // Verificar se o aspecto está dentro da tolerância de algum formato permitido
        for (const allowedAspect of ALLOWED_ASPECTS) {
          const minRatio = allowedAspect.ratio - ASPECT_TOLERANCE;
          const maxRatio = allowedAspect.ratio + ASPECT_TOLERANCE;
          
          if (aspect >= minRatio && aspect <= maxRatio) {
            resolve({ valid: true, aspect: allowedAspect.name });
            return;
          }
        }
        
        resolve({ 
          valid: false, 
          error: `Aspecto não permitido. Use apenas: ${ALLOWED_ASPECTS.map(a => a.name).join(', ')}` 
        });
      };
      
      img.onerror = () => {
        resolve({ valid: false, error: 'Erro ao carregar imagem' });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Função para comprimir imagem
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        const maxWidth = 960; // Aumentado para 960px
        const maxHeight = 720; // Aumentado para 720px
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.75 // Qualidade melhorada para 75%
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    const remainingSlots = maxImages - selectedFiles.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      try {
        console.log('Processando arquivo:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);
        
        // Validar aspecto da imagem
        const aspectValidation = await validateImageAspect(file);
        console.log('Validação de aspecto:', aspectValidation);
        
        if (!aspectValidation.valid) {
          setError(aspectValidation.error || 'Aspecto de imagem não permitido');
          continue;
        }

        // Comprimir imagem
        console.log('Comprimindo imagem...');
        const compressedFile = await compressImage(file);
        console.log('Imagem comprimida:', compressedFile.size, 'bytes');

        // Criar URL de preview
        const previewUrl = URL.createObjectURL(compressedFile);
        
        newFiles.push(compressedFile);
        newPreviewUrls.push(previewUrl);
        
        console.log('Arquivo processado com sucesso');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        setError(`Erro ao processar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        break;
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...newFiles];
      const updatedPreviewUrls = [...previewUrls, ...newPreviewUrls];
      
      setSelectedFiles(updatedFiles);
      setPreviewUrls(updatedPreviewUrls);
      onImagesChanged?.(updatedFiles);
    }
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revogar URL de preview para liberar memória
    URL.revokeObjectURL(previewUrls[index]);
    
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    setSelectedFiles(updatedFiles);
    setPreviewUrls(updatedPreviewUrls);
    onImagesChanged?.(updatedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Informações sobre formatos permitidos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Formatos de imagem permitidos:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {ALLOWED_ASPECTS.map((aspect, index) => (
                <li key={index}>• {aspect.name}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              As imagens serão comprimidas e enviadas apenas quando você criar o evento.
            </p>
          </div>
        </div>
      </div>

      {/* Botão de upload */}
      {selectedFiles.length < maxImages && (
        <Button
          variant="bordered"
          onPress={openFileDialog}
          className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          startContent={<Upload className="w-6 h-6" />}
        >
          <div className="text-center">
            <p className="text-sm text-gray-600">Clique para selecionar imagens</p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedFiles.length}/{maxImages} imagens
            </p>
          </div>
        </Button>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Preview das imagens */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedFiles.map((file, index) => (
            <Card key={index} className="relative group">
              <CardBody className="p-0">
                <NextUIImage
                  src={previewUrls[index]}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-32 object-cover"
                  radius="sm"
                />
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="solid"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onPress={() => removeImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Contador de imagens */}
      {selectedFiles.length > 0 && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          {selectedFiles.length} imagem{selectedFiles.length !== 1 ? 'ns' : ''} selecionada{selectedFiles.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}; 