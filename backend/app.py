from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from io import BytesIO
from model import get_answer  
from flask import send_from_directory


app = Flask(__name__)
CORS(app)

@app.route('/api/ask', methods=['POST'])
def ask_question():
    try:
        question = request.form.get('question')
        file = request.files['image']
        image = Image.open(BytesIO(file.read())).convert("RGB")

        answer, audio_url = get_answer(image, question)
        return jsonify({'answer': answer, 'audio': audio_url})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)


