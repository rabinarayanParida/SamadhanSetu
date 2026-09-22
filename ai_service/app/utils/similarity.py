import numpy as np
from typing import List, Dict, Any

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes the cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
        
    sim = np.dot(a, b) / (norm_a * norm_b)
    # Clamp to [0.0, 1.0] for non-negative similarity interpretation
    return float(max(0.0, min(1.0, sim)))

def rank_candidates(
    source_embedding: List[float],
    candidates: List[Dict[str, Any]],
    high_threshold: float = 0.85,
    medium_threshold: float = 0.65,
    min_threshold: float = 0.50
) -> List[Dict[str, Any]]:
    """
    Ranks candidate challenges based on vector cosine similarity.
    Filters candidates matching above min_threshold and assigns match tiers.
    """
    ranked = []
    
    for candidate in candidates:
        cand_emb = candidate.get("embedding")
        if not cand_emb:
            continue
            
        score = round(cosine_similarity(source_embedding, cand_emb), 4)
        
        if score >= min_threshold:
            tier = "LOW"
            if score >= high_threshold:
                tier = "HIGH"
            elif score >= medium_threshold:
                tier = "MEDIUM"
                
            ranked.append({
                "candidate_id": candidate.get("challenge_id"),
                "candidate_code": candidate.get("challenge_code"),
                "title": candidate.get("title"),
                "similarity_score": score,
                "match_tier": tier
            })
            
    # Sort descending by similarity score
    ranked.sort(key=lambda x: x["similarity_score"], reverse=True)
    return ranked
