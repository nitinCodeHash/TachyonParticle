from qdrant_client import QdrantClient
from langchain_qdrant import Qdrant as LangchainQdrant
from langchain_huggingface import HuggingFaceEmbeddings

QDRANT_PATH = "uploaded_docs/qdrant_db"

class QdrantVectorDB:
    def __init__(self, path=QDRANT_PATH, collection_name="docs"):
        self.client = QdrantClient(path=path, prefer_grpc=False)
        self.collection_name = collection_name
        self.embedder = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        # Create collection if not exists
        if collection_name not in [c.name for c in self.client.get_collections().collections]:
            self.client.create_collection(collection_name=collection_name, vectors_config={"size": 384, "distance": "Cosine"})
        self.lc_qdrant = LangchainQdrant(self.client, collection_name, self.embedder)

    def chunk_text(self, text, chunk_size=500, chunk_overlap=50):
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        return splitter.split_text(text)

    def embed_chunks(self, chunks):
        return self.embedder.embed_documents(chunks)

    def save_index(self, doc_name, embeddings, chunks, chunk_metadata=None):
        # chunk_metadata: list of dicts, one per chunk, or None
        metadatas = []
        if chunk_metadata and len(chunk_metadata) == len(chunks):
            for meta in chunk_metadata:
                m = {"doc_name": doc_name}
                m.update(meta)
                metadatas.append(m)
        else:
            metadatas = [{"doc_name": doc_name} for _ in chunks]
        self.lc_qdrant.add_texts(texts=chunks, metadatas=metadatas)

    def search(self, doc_name, query, top_k=3):
        retriever = self.lc_qdrant.as_retriever(search_kwargs={"k": top_k, "filter": {"doc_name": doc_name}})
        docs = retriever.get_relevant_documents(query)
        return [d.page_content for d in docs] if docs else []

vectordb = QdrantVectorDB()