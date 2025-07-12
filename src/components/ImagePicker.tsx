import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { uploadImage } from '../services/cloudflareUpload';

interface ImagePickerProps {
  onImageUploaded?: (url: string) => void;
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageUploaded,
  folder = 'events',
  maxWidth = 300,
  maxHeight = 300,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      maxWidth,
      maxHeight,
      quality: 0.8,
      includeBase64: false,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Erro', 'Erro ao selecionar imagem');
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setSelectedImage(imageUri);
          uploadImageToCloudflare(imageUri);
        }
      }
    });
  };

  const uploadImageToCloudflare = async (imageUri: string) => {
    setUploading(true);
    
    try {
      const result = await uploadImage(imageUri, folder);
      
      if (result.success && result.url) {
        onImageUploaded?.(result.url);
        Alert.alert('Sucesso', 'Imagem enviada com sucesso!');
      } else {
        Alert.alert('Erro', result.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro inesperado ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    onImageUploaded?.('');
  };

  return (
    <View style={styles.container}>
      {selectedImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.uploadingText}>Enviando...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
            <Text style={styles.removeButtonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.selectButton} onPress={selectImage}>
          <Text style={styles.selectButtonText}>Selecionar Imagem</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 