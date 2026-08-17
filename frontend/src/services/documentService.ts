import api from './api';
import { Document } from '../types/document';

export const documentService = {
  async uploadDocument(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Document>('/api/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  async getDocuments(): Promise<Document[]> {
    const response = await api.get<Document[]>('/api/knowledge/');
    return response.data;
  },

  async deleteDocument(docId: string): Promise<void> {
    await api.delete(`/api/knowledge/${docId}`);
  },
};
