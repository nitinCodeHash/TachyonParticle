import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings

CHROMA_DIR = "uploaded_docs/chroma_db"

class ChromaVectorDB:
    def __init__(self, persist_directory=CHROMA_DIR):
        self.client = chromadb.Client(Settings(persist_directory=persist_directory))
        self.collection = self.client.get_or_create_collection("docs")
        self.embedder = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    def chunk_text(self, text):
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        return splitter.split_text(text)

    def embed_chunks(self, chunks):
        return self.embedder.embed_documents(chunks)

    def save_index(self, doc_name, embeddings, chunks):
        ids = [f"{doc_name}_{i}" for i in range(len(chunks))]
        self.collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=[{"doc_name": doc_name} for _ in chunks])

        # Note: ChromaDB persistence is automatic if persist_directory is set. No explicit persist() call needed in some versions.

    def search(self, doc_name, query, top_k=3):
        query_emb = self.embedder.embed_query(query)
        results = self.collection.query(
            query_embeddings=[query_emb],
            n_results=top_k,
            where={"doc_name": doc_name}
        )
        return results["documents"][0] if results["documents"] else []

vectordb = ChromaVectorDB()