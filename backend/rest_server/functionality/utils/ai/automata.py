# =============================================================================
# Autores: Daniel Álvarez Sil y Yael Sinuhe Grajeda Martínez
# Descripción:
#   Servicio de inteligencia artificial (IA) para la clasificación automática
#   de promociones, inferencia de categorías, nivel de riesgo y motivo de revisión.
#
#   Utiliza la API de OpenAI (GPT-5) con salidas estructuradas (Pydantic),
#   devolviendo resultados validados con un esquema estricto.
# =============================================================================

from typing import Optional
from openai import OpenAI
import json
from functionality.models import Categoria
from pydantic import BaseModel

# Inicializa el cliente OpenAI (usa la variable de entorno OPENAI_API_KEY)
client = OpenAI()


# =============================================================================
# Clase: NegocioAIResult
# Descripción:
#   Modelo Pydantic para validar y tipar la respuesta estructurada del modelo.
# =============================================================================
class NegocioAIResult(BaseModel):
    """Representa el resultado estructurado de la inferencia de IA."""
    categoria: list[int]
    riesgo: str          # e.g., "BAJO", "MEDIO", "ALTO"
    motivo_revision: str  # Motivo breve de la clasificación


# =============================================================================
# Función: infer_promocion_fields
# Descripción:
#   Utiliza la API de OpenAI para inferir la categoría y el nivel de riesgo de
#   una promoción en función de su nombre y descripción.
# =============================================================================
def infer_promocion_fields(nombre: str, descripcion: Optional[str]) -> list[int]:
    """
    Realiza una inferencia inteligente para determinar las categorías más
    adecuadas para una promoción, así como su nivel de riesgo y motivo de revisión.

    Parámetros:
        nombre (str): Nombre de la promoción o descuento.
        descripcion (Optional[str]): Descripción detallada de la promoción.

    Retorna:
        list[int]: Lista de IDs de categorías inferidas.
                   Si ocurre un error o no hay coincidencia, se devuelve la
                   categoría "Sin categoría" como fallback.

    Notas:
        - La función usa un esquema estricto de salida validado con Pydantic.
        - Si el modelo no responde o hay error de conexión, se devuelve una
          categoría predeterminada para garantizar continuidad en el flujo.
    """

    # -------------------------------------------------------------------------
    # 1️⃣ Preparar las categorías válidas disponibles en la base de datos
    # -------------------------------------------------------------------------
    categorias_objects = Categoria.objects.all()
    categorias_pairs = [(cat.id, cat.titulo) for cat in categorias_objects]

    # -------------------------------------------------------------------------
    # 2️⃣ Construir el prompt para el modelo GPT
    # -------------------------------------------------------------------------
    prompt = (
        "You are a strict classifier. "
        "Given discount information, return JSON with: "
        "`categoria` (list of integers representing the IDs of all matching categories), "
        "`riesgo` (BAJO | MEDIO | ALTO) for potential fraud or compliance review, "
        "`motivo_revision` (short reason). "
        "Use only the provided information; do not guess URLs or unrelated data.\n\n"
        f"Nombre: {nombre}\n"
        f"Descripción: {descripcion or ''}\n"
        f"Categorías válidas: {json.dumps(categorias_pairs, ensure_ascii=False)}\n"
    )

    # -------------------------------------------------------------------------
    # 3️⃣ Llamada a la API de OpenAI
    # -------------------------------------------------------------------------
    try:
        print("Enviando prompt a OpenAI para clasificación de promoción...")
        resp = client.responses.parse(
            model="gpt-5",  # Modelo actual (ajustable según tu suscripción)
            input=prompt,
            text_format=NegocioAIResult,  # Estructura de salida Pydantic
        )

        print("Respuesta recibida exitosamente.")
        ai_text = resp.output_parsed

        # Se devuelve únicamente la lista de IDs de categoría inferidos
        return ai_text.categoria

    except Exception as e:
        # Manejo seguro de errores (por ejemplo, desconexión, formato inválido, timeout)
        print(f"[OpenAI ERROR] {e}")

    # -------------------------------------------------------------------------
    # 4️⃣ Fallback (cuando la IA no responde o el parseo falla)
    # -------------------------------------------------------------------------
    try:
        fallback_categoria = Categoria.objects.get(titulo="Sin categoría").id
        print("Usando fallback: categoría 'Sin categoría'.")
        return [fallback_categoria]
    except Categoria.DoesNotExist:
        print("Advertencia: No existe la categoría 'Sin categoría'. Creando fallback temporal.")
        return []

