import React, { useState, useRef } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { 
  UploadCloud, 
  Trash2, 
  Search, 
  FileText, 
  CheckCircle, 
  Hourglass, 
  AlertTriangle,
  FolderOpen,
  Info,
  Calendar
} from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const { documents, isLoading, uploadDocument, deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search Filter
  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      await handleFileProcess(e.target.files[0]);
    }
  };

  const handleFileProcess = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      setUploadError('Unsupported file type. Please upload PDF, DOCX, or TXT documents.');
      return;
    }

    try {
      setUploadProgress(0);
      await uploadDocument({
        file,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      // Delay resetting progress to let the user see the "100%" state
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.detail || 'Failed to parse and upload document.');
      setUploadProgress(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document from the knowledge base? This will also remove all its semantic chunks from ChromaDB.')) {
      try {
        await deleteDocument(docId);
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-white">Knowledge Base</h1>
        <p className="text-slate-400 text-sm mt-1">Upload support documents to construct semantic chunk indices in ChromaDB.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Panel: Ingestion Upload Panel */}
        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-slate-900 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Upload Knowledge Source</h2>
              <p className="text-xs text-slate-500 mt-1">Source contents will be parsed, chunked, and vectorized locally using sentence-transformers.</p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileInput}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                <UploadCloud className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-xs font-semibold text-white">Drag & drop files here, or click to browse</p>
              <p className="text-[10px] text-slate-500 mt-1.5">Supports PDF, DOCX, and TXT up to 10MB</p>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span>Uploading and parsing file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* File Error Alerts */}
            {uploadError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* RAG pipeline summary alert */}
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start space-x-3 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">How RAG Ingestion Works:</p>
                <p className="text-[11px] leading-relaxed">
                  Uploading files parses raw content, segments texts into 500-character overlapping chunks, embeds them via 384d sentence transformers, and stores the indexes inside ChromaDB.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Document List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-base font-semibold text-white">Ingested Document Library</h2>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search file name..."
                className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="glass rounded-xl border border-slate-900 p-12 flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Checking document indices...</p>
              </div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="glass rounded-xl border border-slate-900 p-12 text-center flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-800 mb-4">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">No documents uploaded</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-2">
                {searchTerm ? 'No results matching your query.' : 'Upload PDFs, DOCX, or TXT documents to populate your support RAG knowledge base.'}
              </p>
            </div>
          ) : (
            <div className="glass border border-slate-900/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">File Name</th>
                      <th className="p-4 uppercase tracking-wider">Type / Size</th>
                      <th className="p-4 uppercase tracking-wider">Index Status</th>
                      <th className="p-4 uppercase tracking-wider">Uploaded Date</th>
                      <th className="p-4 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-900/10 text-slate-300 font-medium">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/15 text-indigo-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-white font-semibold truncate max-w-[200px]" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-slate-300 capitalize">{doc.file_type}</span>
                          <span className="text-slate-500 block text-[10px] mt-0.5">{formatSize(doc.file_size)}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {doc.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              {doc.chunk_count} Chunks Indexed
                            </span>
                          )}
                          {doc.status === 'processing' && (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5 animate-pulse">
                              <Hourglass className="w-3 h-3 animate-spin text-indigo-400" />
                              Vectorizing...
                            </span>
                          )}
                          {doc.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5">
                              <Hourglass className="w-3 h-3 text-amber-400" />
                              Queued
                            </span>
                          )}
                          {doc.status === 'failed' && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-bold inline-flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors inline-block"
                            title="Delete file & vectors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
