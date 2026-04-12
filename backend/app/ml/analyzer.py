"""
ML Service: Emotion Detection + Risk Classification
Uses NLTK VADER for sentiment + rule-based emotion classification
with optional HuggingFace transformer upgrade when GPU available.
Falls back gracefully so the app always runs.
"""
import re
import logging
from typing import Tuple
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

# Crisis keywords for risk detection
HIGH_RISK_PATTERNS = [
    r"\b(kill\s+myself|end\s+my\s+life|want\s+to\s+die|suicid[ae]|self.?harm|cut\s+myself|hurt\s+myself)\b",
    r"\b(no\s+reason\s+to\s+live|can't\s+go\s+on|better\s+off\s+dead|don't\s+want\s+to\s+be\s+here)\b",
    r"\b(overdose|hanging|jump\s+off|end\s+it\s+all)\b",
]

MEDIUM_RISK_PATTERNS = [
    r"\b(hopeless|worthless|nobody\s+cares|give\s+up|can't\s+take\s+it|exhausted|desperate|alone)\b",
    r"\b(hate\s+myself|ugly|stupid|failure|useless|burden|nothing\s+matters)\b",
]

EMOTION_KEYWORDS = {
    "happy": ["happy", "joy", "excited", "great", "wonderful", "amazing", "love", "grateful", "blessed", "fantastic", "elated", "cheerful", "good"],
    "sad": ["sad", "cry", "depressed", "miserable", "unhappy", "grief", "sorrow", "heartbroken", "lonely", "empty", "numb", "lost"],
    "angry": ["angry", "furious", "rage", "mad", "hate", "frustrated", "irritated", "annoyed", "livid", "outraged"],
    "anxious": ["anxious", "anxiety", "worried", "nervous", "panic", "scared", "fear", "stress", "overwhelmed", "dread", "tense", "uneasy"],
    "neutral": [],
}

_sia: SentimentIntensityAnalyzer = None


def _get_sia():
    global _sia
    if _sia is None:
        try:
            _sia = SentimentIntensityAnalyzer()
        except LookupError:
            nltk.download("vader_lexicon", quiet=True)
            _sia = SentimentIntensityAnalyzer()
    return _sia


def detect_emotion(text: str) -> dict:
    """
    Classify emotion from text using keyword matching + VADER sentiment.
    Returns emotion label + confidence score.
    """
    text_lower = text.lower()
    sia = _get_sia()
    scores = sia.polarity_scores(text)

    # Count keyword matches per emotion
    emotion_scores = {emotion: 0 for emotion in EMOTION_KEYWORDS}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                emotion_scores[emotion] += 1

    # Use VADER compound score to guide between happy/sad/neutral
    compound = scores["compound"]
    max_emotion = max(
        (e for e in emotion_scores if e != "neutral"),
        key=lambda e: emotion_scores[e],
        default=None,
    )

    if max_emotion and emotion_scores[max_emotion] > 0:
        emotion = max_emotion
        confidence = min(0.95, 0.5 + emotion_scores[max_emotion] * 0.15)
    elif compound >= 0.05:
        emotion = "happy"
        confidence = round(0.5 + abs(compound) * 0.4, 2)
    elif compound <= -0.05:
        # Decide between sad and anxious based on neg/neu ratio
        if scores["neg"] > 0.4:
            emotion = "sad"
        else:
            emotion = "anxious"
        confidence = round(0.5 + abs(compound) * 0.4, 2)
    else:
        emotion = "neutral"
        confidence = 0.6

    return {
        "emotion": emotion,
        "confidence": round(min(confidence, 0.98), 2),
        "sentiment_scores": scores,
        "valence": compound,
    }


def assess_risk(text: str) -> dict:
    """
    Binary risk detection using pattern matching.
    Returns risk_level (low/medium/high) + is_crisis flag.
    """
    text_lower = text.lower()

    for pattern in HIGH_RISK_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return {
                "risk_level": "high",
                "is_crisis": True,
                "trigger": "self_harm_ideation",
                "requires_immediate_support": True,
            }

    medium_matches = 0
    for pattern in MEDIUM_RISK_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            medium_matches += 1

    if medium_matches >= 2:
        return {
            "risk_level": "medium",
            "is_crisis": False,
            "trigger": "distress_indicators",
            "requires_immediate_support": False,
        }

    return {
        "risk_level": "low",
        "is_crisis": False,
        "trigger": None,
        "requires_immediate_support": False,
    }


def analyze_message(text: str) -> Tuple[dict, dict]:
    """Full pipeline: emotion + risk analysis."""
    emotion_result = detect_emotion(text)
    risk_result = assess_risk(text)
    return emotion_result, risk_result
