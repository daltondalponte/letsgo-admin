interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Configurações de upload
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxWidth: 960, // Aumentado para 960px
  maxHeight: 720, // Aumentado para 720px
  quality: 0.75, // Qualidade melhorada para 75%
};

export class CloudflareUploadService {
  // Função para comprimir imagem antes do upload
  static async compressImage(file: File, quality: number = UPLOAD_CONFIG.quality): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        const maxWidth = UPLOAD_CONFIG.maxWidth;
        const maxHeight = UPLOAD_CONFIG.maxHeight;
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
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  static async uploadImage(file: File, folder: string = 'events'): Promise<UploadResponse> {
    try {
      console.log('Iniciando upload via backend principal:', { fileName: file.name, fileSize: file.size, fileType: file.type, folder });

      // Validar arquivo
      if (!file) {
        console.error('Arquivo não fornecido');
        return {
          success: false,
          error: 'Nenhum arquivo selecionado',
        };
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        console.error('Tipo de arquivo inválido:', file.type);
        return {
          success: false,
          error: 'Apenas arquivos de imagem são permitidos',
        };
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('Arquivo muito grande:', file.size);
        return {
          success: false,
          error: 'Arquivo muito grande. Máximo 10MB',
        };
      }

      // Comprimir imagem antes do upload
      console.log('Comprimindo imagem...');
      const compressedFile = await this.compressImage(file);
      console.log('Imagem comprimida:', compressedFile.size, 'bytes');

      // Criar FormData para enviar ao backend
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', folder);

      // Fazer upload via endpoint do backend principal
      const uploadUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL || '/api/upload';
      console.log('Enviando para endpoint do backend principal:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Resposta do backend principal:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload bem-sucedido via backend principal:', result);
        return {
          success: true,
          url: result.url,
        };
      } else {
        const errorData = await response.json();
        console.error('Erro no backend principal:', errorData);
        return {
          success: false,
          error: errorData.error || `Erro no upload: ${response.status}`,
        };
      }
    } catch (error) {
      console.error('Erro durante upload via backend principal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

// Função helper para upload simples
export const uploadImage = async (file: File, folder?: string): Promise<UploadResponse> => {
  return await CloudflareUploadService.uploadImage(file, folder);
}; 