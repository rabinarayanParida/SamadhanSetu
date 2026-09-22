import json
import logging
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger("sicp_ai.openai_client")

class OpenAIClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.AI_MODEL
        self.client: Optional[AsyncOpenAI] = None
        
        if self.api_key and self.api_key.strip() != "":
            try:
                self.client = AsyncOpenAI(api_key=self.api_key)
                logger.info(f"OpenAI Client initialized with model: {self.model}")
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI client: {e}")
                self.client = None
        else:
            logger.info("No OPENAI_API_KEY detected. AI service will operate in deterministic local engine mode.")

    def is_configured(self) -> bool:
        return self.client is not None and bool(self.api_key)

    async def call_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Calls OpenAI Chat Completions with strict JSON response formatting.
        Raises RuntimeError or returns parsed dictionary.
        """
        if not self.is_configured():
            raise RuntimeError("OpenAI API key is not configured.")

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=temperature,
                timeout=25.0
            )

            raw_content = response.choices[0].message.content
            if not raw_content:
                raise ValueError("Received empty response from OpenAI.")

            return json.loads(raw_content)

        except Exception as err:
            logger.error(f"OpenAI API call failed: {err}")
            raise err

openai_client = OpenAIClient()
