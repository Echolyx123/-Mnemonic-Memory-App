from flask import Flask, jsonify, request
from flask_cors import CORS
from data import dataset
import spacy
from random import choice

# Load German language model from spaCy
nlp = spacy.load("de_core_news_sm")

app = Flask(__name__)
CORS(app)

def annotate_grammar(entry):
    text = entry.get("word", "")
    doc = nlp(text)
    entry["tokens"] = [
        {"text": token.text, "pos": token.pos_} for token in doc
    ]
    return entry

@app.route('/get_word', methods=['GET'])
def get_word():
    level = request.args.get('level', type=int, default=1)
    filtered = [entry for entry in dataset if entry.get("level") == level]
    if not filtered:
        return jsonify({"error": "No entries found for this level."}), 404
    selected = choice(filtered)
    return jsonify(annotate_grammar(selected.copy()))

@app.route('/get_all_words', methods=['GET'])
def get_all_words():
    level = request.args.get('level', type=int, default=1)
    filtered = [annotate_grammar(entry.copy()) for entry in dataset if entry.get("level") == level]
    return jsonify(filtered)

if __name__ == '__main__':
    print("✅ Running on http://127.0.0.1:5000/")
    app.run(debug=True)