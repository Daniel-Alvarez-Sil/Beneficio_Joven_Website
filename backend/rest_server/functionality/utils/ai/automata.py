# ai_services.py
from typing import Optional, TypedDict
from openai import OpenAI
import json
from functionality.models import Categoria
from pydantic import BaseModel

client = OpenAI()  # reads OPENAI_API_KEY from env

class NegocioAIResult(BaseModel):
    categoria: list[int]
    riesgo: str          # e.g., "BAJO" | "MEDIO" | "ALTO"
    motivo_revision: str  # short reason string


def infer_promocion_fields(
    nombre: str,
    descripcion: Optional[str],
) -> NegocioAIResult:
    """
    Calls OpenAI with a strict JSON schema to get a category, risk, and reason.
    On any failure, returns conservative defaults.
    """
    categoriasObjects = Categoria.objects.all()
    categoriasPairs = [(cat.id, cat.titulo) for cat in categoriasObjects]

    # schema = {
    #     "name": "NegocioAIResult",
    #     "schema": {
    #         "type": "object",
    #         "properties": {
    #             "categoria": [{"type": "integer"}],
    #             "riesgo": {"type": "string", "enum": ["BAJO", "MEDIO", "ALTO"]},
    #             "motivo_revision": {"type": "string"}
    #         },
    #         "required": ["categoria", "riesgo", "motivo_revision"],
    #         "additionalProperties": False
    #     },
    #     "strict": True
    # }

    prompt = (
        "You are a strict classifier. "
        "Given a discount info, return JSON with: "
        "`categoria` (list of integers representing the IDs of all the categories that match, could be more than one), "
        "`riesgo` (BAJO|MEDIO|ALTO) for potential fraud/compliance review, "
        "`motivo_revision` (short reason). "
        "Use only the provided information; do not guess URLs or data.\n\n"
        f"Nombre: {nombre}\n"
        f"Descripcion: {descripcion or ''}\n"
        f"This are the only valid categories: {json.dumps(categoriasPairs)}\n"
    )

    try:
        # Responses API with Structured Outputs (JSON schema)
        # Model name: pick a current GPT-5* text model in your account/region
        print("Sending prompt to OpenAI for promocion classification...")
        resp = client.responses.parse(
            model="gpt-5",
            input=prompt,
            # response_format={
            #     "type": "json_schema",
            #     "json_schema": schema
            # },
            # good practice: set a small max_output_tokens for predictable cost
            text_format=NegocioAIResult,
            # max_output_tokens=300,
            # temperature=0  # deterministic
        )
        print("Prompt sent successfully, waiting for response...")
        # The SDK returns `output` segments; the helper gets the text:
        print(resp.output_parsed)
        ai_text = resp.output_parsed 
        # if isinstance(ai_text, dict):
        #     # validated by the response_format schema
        #     return ai_text  # type: ignore[return-value]
        return ai_text.categoria

    except Exception as e:
        print(f"[OpenAI ERROR] {e}")


    # Fallbacks if AI is unavailable or parsing fails
    return [Categoria.objects.get(titulo='Sin categoría').id]
        
    # return {
    #     "categoria": [Categoria.objects.get(titulo='Sin categoría').id],
    #     "riesgo": "MEDIO",
    #     "motivo_revision": "Clasificación por defecto (no disponible AI)."
    # }
