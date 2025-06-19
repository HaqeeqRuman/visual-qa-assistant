
from PIL import Image
from transformers import BlipProcessor, BlipForQuestionAnswering

from gtts import gTTS
import os


processor = BlipProcessor.from_pretrained("Salesforce/blip-vqa-base")
model = BlipForQuestionAnswering.from_pretrained("Salesforce/blip-vqa-base")

def get_answer(image: Image.Image, question: str) -> tuple[str, str]:
    inputs = processor(image, question, return_tensors="pt")
    output = model.generate(**inputs)
    answer = processor.decode(output[0], skip_special_tokens=True).strip()


    tts = gTTS(answer)
    audio_path = f"static/audio/answer.mp3"
    os.makedirs(os.path.dirname(audio_path), exist_ok=True)
    tts.save(audio_path)

    return answer, f"/static/audio/answer.mp3"
