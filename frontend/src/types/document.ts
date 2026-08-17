export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  name: string;
  file_type: string;
  status: DocumentStatus;
  chunk_count: number;
  file_size: number;
  created_at: string;
}
