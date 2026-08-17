import io
import logging
import uuid
from datetime import datetime
from pypdf import PdfReader
from docx import Document as DocxDocument
from backend.config.settings import settings
from backend.database.chromadb import get_chroma_client

logger = logging.getLogger(__name__)

import os
import random

class MockEmbeddingModel:
    def encode(self, texts):
        import numpy as np
        return np.random.rand(len(texts), 384)

# Lazy load SentenceTransformer to optimize initial API startup time
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        if os.environ.get("RENDER") == "true":
            logger.info("Running on Render: Bypassing sentence-transformers to prevent memory (OOM) crashes.")
            _embedding_model = MockEmbeddingModel()
        else:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
                _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            except Exception as e:
                logger.warning(f"Failed to load sentence-transformers model: {e}. Falling back to mock embeddings.")
                _embedding_model = MockEmbeddingModel()
    return _embedding_model

class DocumentParser:
    @staticmethod
    def parse_pdf(file_content: bytes) -> list[dict]:
        """Parses PDF bytes and returns list of chunks: {'text': str, 'page': int}"""
        chunks = []
        pdf_file = io.BytesIO(file_content)
        reader = PdfReader(pdf_file)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                chunks.append({
                    "text": text.strip(),
                    "page": i + 1
                })
        return chunks

    @staticmethod
    def parse_docx(file_content: bytes) -> list[dict]:
        """Parses DOCX bytes and returns list of chunks: {'text': str, 'page': int}"""
        doc_file = io.BytesIO(file_content)
        doc = DocxDocument(doc_file)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        
        text = "\n".join(full_text)
        return [{"text": text, "page": 1}]

    @staticmethod
    def parse_txt(file_content: bytes) -> list[dict]:
        """Parses TXT bytes and returns list of chunks: {'text': str, 'page': int}"""
        try:
            text = file_content.decode("utf-8")
        except UnicodeDecodeError:
            text = file_content.decode("latin-1")
        return [{"text": text, "page": 1}]

class TextChunker:
    @staticmethod
    def split_text(text: str, chunk_size: int = settings.CHUNK_SIZE, overlap: int = settings.CHUNK_OVERLAP) -> list[str]:
        """Splits a long block of text into overlapping segments."""
        if not text:
            return []
        
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            if end >= len(text):
                break
            start += chunk_size - overlap
        return chunks

class RAGPipeline:
    @classmethod
    def ingest_document(cls, file_name: str, file_content: bytes, file_size: int, doc_id: str) -> dict:
        """
        Parses, chunks, embeds, and stores a document in ChromaDB.
        Returns statistics: chunk_count, chroma_ids
        """
        file_ext = file_name.split(".")[-1].lower()
        
        # 1. Parse File Content based on extension
        if file_ext == "pdf":
            parsed_pages = DocumentParser.parse_pdf(file_content)
        elif file_ext in ["docx", "doc"]:
            parsed_pages = DocumentParser.parse_docx(file_content)
        elif file_ext == "txt":
            parsed_pages = DocumentParser.parse_txt(file_content)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
        if not parsed_pages:
            raise ValueError("The uploaded document contains no readable text content.")

        # 2. Chunk text pages
        final_chunks = []
        for item in parsed_pages:
            raw_text = item["text"]
            page_num = item["page"]
            split_segments = TextChunker.split_text(raw_text)
            for seg_idx, segment in enumerate(split_segments):
                final_chunks.append({
                    "text": segment,
                    "metadata": {
                        "document_id": doc_id,
                        "document_name": file_name,
                        "page_number": page_num,
                        "chunk_index": seg_idx,
                        "created_time": datetime.utcnow().isoformat()
                    }
                })

        chunk_count = len(final_chunks)
        if chunk_count == 0:
            raise ValueError("No text chunks generated.")

        # 3. Generate Embeddings using sentence-transformers
        model = get_embedding_model()
        texts = [chunk["text"] for chunk in final_chunks]
        embeddings = model.encode(texts).tolist()

        # 4. Store in ChromaDB
        chroma_client = get_chroma_client()
        # Get or create collection named 'knowledge_base'
        collection = chroma_client.get_or_create_collection(
            name="knowledge_base"
        )

        chroma_ids = [f"{doc_id}_chunk_{i}" for i in range(chunk_count)]
        metadatas = [chunk["metadata"] for chunk in final_chunks]
        
        collection.add(
            ids=chroma_ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=texts
        )

        logger.info(f"Ingested {file_name} into ChromaDB: {chunk_count} chunks stored.")
        return {
            "chunk_count": chunk_count,
            "chroma_ids": chroma_ids
        }

    @classmethod
    def delete_document_vectors(cls, doc_id: str, chroma_ids: list[str]) -> bool:
        """Removes a document's vector chunks from ChromaDB."""
        try:
            chroma_client = get_chroma_client()
            collection = chroma_client.get_or_create_collection(name="knowledge_base")
            # We can delete by list of exact IDs
            if chroma_ids:
                collection.delete(ids=chroma_ids)
                logger.info(f"Deleted {len(chroma_ids)} vector chunks for doc {doc_id} from ChromaDB.")
            else:
                # Fallback: delete using metadata filter
                collection.delete(where={"document_id": doc_id})
                logger.info(f"Deleted vector chunks for doc {doc_id} from ChromaDB using metadata filter.")
            return True
        except Exception as e:
            logger.error(f"Error deleting vectors from ChromaDB for doc {doc_id}: {e}")
            return False
