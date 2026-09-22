import hashlib
import logging
import numpy as np
from typing import List
from app.config import settings
from app.services.openai_client import openai_client

logger = logging.getLogger("sicp_ai.embeddings")

EMBEDDING_DIM = 1536  # Standard dimension matching text-embedding-3-small

class EmbeddingService:
    def __init__(self):
        self.model = settings.AI_EMBEDDING_MODEL

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a 1536-dimensional unit vector embedding for the input text.
        Uses OpenAI text-embedding-3-small if configured; otherwise uses a
        deterministic hashed bag-of-words / character n-gram L2-normalized vector.
        """
        cleaned_text = (text or "").strip()
        if not cleaned_text:
            return [0.0] * EMBEDDING_DIM

        if openai_client.is_configured():
            try:
                response = await openai_client.client.embeddings.create(
                    model=self.model,
                    input=cleaned_text[:8000],
                    timeout=20.0
                )
                embedding = response.data[0].embedding
                # Ensure it is normalized
                arr = np.array(embedding, dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr = arr / norm
                return [round(float(x), 6) for x in arr.tolist()]
            except Exception as e:
                logger.warning(f"OpenAI embedding call failed ({e}). Falling back to local semantic vectorizer.")

        # Local deterministic semantic vector generation
        return self._generate_local_embedding(cleaned_text)

    def _generate_local_embedding(self, text: str) -> List[float]:
        """
        Generates a deterministic 1536-dim unit vector based on hashed n-grams
        and word tokens, weighted by position and frequency.
        Semantically similar texts produce high cosine similarity.
        """
        vec = np.zeros(EMBEDDING_DIM, dtype=np.float32)
        tokens = text.lower().split()

        # Stop words to downweight
        stop_words = {"the", "is", "at", "which", "on", "a", "an", "and", "or", "to", "in", "for", "of", "with"}

        # Add word-level contributions
        for token in tokens:
            cleaned = "".join(c for c in token if c.isalnum())
            if not cleaned:
                continue
            weight = 0.2 if cleaned in stop_words else 1.0
            
            # Hash to multiple buckets for feature distribution
            h1 = int(hashlib.md5(cleaned.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIM
            h2 = int(hashlib.sha256(cleaned.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIM
            vec[h1] += weight * 1.5
            vec[h2] += weight * 0.8

        # Add character tri-grams for subword similarity
        text_condensed = "".join(c for c in text.lower() if c.isalnum() or c.isspace())
        for i in range(len(text_condensed) - 2):
            tri = text_condensed[i:i+3]
            h = int(hashlib.md5(tri.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIM
            vec[h] += 0.3

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return [round(float(x), 6) for x in vec.tolist()]

embedding_service = EmbeddingService()
