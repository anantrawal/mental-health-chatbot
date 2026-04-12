"""
Response Generation Service
Uses Anthropic Claude API for empathetic, context-aware replies.
Falls back to rule-based responses when no API key is set.
"""
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

CRISIS_RESPONSE = """I'm really concerned about you right now, and I want you to know you're not alone.

**Please reach out for immediate support:**
- 🆘 **iCall (India):** 9152987821
- 🆘 **Vandrevala Foundation:** 1860-2662-345 (24/7)
- 🆘 **AASRA:** 9820466627
- 🆘 **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/

Your life has value, and there are people who care about you. Please talk to someone who can provide the professional support you deserve right now.

I'm here to listen if you want to share more."""

EMPATHY_TEMPLATES = {
    "sad": [
        "I hear you, and I'm really sorry you're feeling this way. Sadness can feel so heavy. Would you like to tell me more about what's been going on?",
        "It sounds like you're carrying a lot right now. That takes real courage to express. I'm here — what's weighing on you most?",
    ],
    "anxious": [
        "Anxiety can be so exhausting and overwhelming. You're not alone in feeling this way. Can you tell me what's been worrying you?",
        "I can hear that things feel really uncertain or scary right now. Let's slow down together. What's at the center of this feeling?",
    ],
    "angry": [
        "It's completely valid to feel angry. Your feelings make sense. What happened that's brought up these feelings?",
        "Anger often signals that something important to us has been crossed. I'm here to listen — what's going on?",
    ],
    "happy": [
        "That's wonderful to hear! I'm glad things are feeling good. What's been bringing you joy lately?",
        "It's so nice when we can feel happiness. Tell me more about what's going well for you!",
    ],
    "neutral": [
        "Thanks for sharing that with me. How are you feeling overall today?",
        "I appreciate you opening up. Is there something specific on your mind you'd like to explore?",
    ],
}

COPING_STRATEGIES = {
    "sad": [
        "🌟 Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
        "🌟 Even a short walk outside can shift your mood. Nature and movement are powerful mood regulators.",
        "🌟 Writing down 3 small things you're grateful for, even tiny ones, can gently shift perspective.",
    ],
    "anxious": [
        "🌟 Try box breathing: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times.",
        "🌟 Name the anxiety: write down your worry, then ask 'Is this within my control right now?'",
        "🌟 Progressive muscle relaxation — tense and release each muscle group from toes to head.",
    ],
    "angry": [
        "🌟 Try the STOP technique: Stop, Take a breath, Observe your feelings, Proceed mindfully.",
        "🌟 Physical release helps: a brisk walk, dancing, or even punching a pillow safely.",
        "🌟 Write a letter you'll never send — express everything without filter, then burn or delete it.",
    ],
}


async def generate_response(
    user_message: str,
    emotion: str,
    risk_level: str,
    is_crisis: bool,
    conversation_history: list,
) -> str:
    """Generate an empathetic AI response."""

    if is_crisis or risk_level == "high":
        return CRISIS_RESPONSE

    # Try Anthropic API first
    if settings.ANTHROPIC_API_KEY:
        try:
            return await _anthropic_response(
                user_message, emotion, risk_level, conversation_history
            )
        except Exception as e:
            logger.warning(f"Anthropic API error, falling back: {e}")

    # Rule-based fallback
    return _rule_based_response(user_message, emotion, risk_level)


async def _anthropic_response(
    user_message: str,
    emotion: str,
    risk_level: str,
    conversation_history: list,
) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    system_prompt = f"""You are a compassionate mental health support companion named Aria. 
You provide empathetic, warm, non-judgmental support. You are NOT a therapist or doctor.

Current user emotional state: {emotion}
Risk level: {risk_level}

Guidelines:
- Validate feelings before offering advice
- Ask open-ended questions to understand better
- Suggest professional help when appropriate
- Be warm, genuine, and human
- Keep responses concise (3-4 sentences max unless crisis)
- Never diagnose or prescribe
- If medium risk: gently encourage professional support
- Always remind user this is a support tool, not therapy

Respond naturally and conversationally."""

    messages = []
    for msg in conversation_history[-6:]:  # Last 6 messages for context
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


def _rule_based_response(user_message: str, emotion: str, risk_level: str) -> str:
    """Fallback rule-based empathetic response."""
    import random

    templates = EMPATHY_TEMPLATES.get(emotion, EMPATHY_TEMPLATES["neutral"])
    base_response = random.choice(templates)

    if risk_level == "medium":
        base_response += "\n\nI want to gently mention — if these feelings persist, speaking with a mental health professional can make a real difference. You deserve that support. 💙"

    if emotion in COPING_STRATEGIES and risk_level == "low":
        strategy = random.choice(COPING_STRATEGIES[emotion])
        base_response += f"\n\n{strategy}"

    return base_response
