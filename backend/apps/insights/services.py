# insights/services.py
import json
import logging
from openai import OpenAI
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_insight_content(tracking_data, report_type, period_start, period_end, trackers):
    """Call OpenAI and return structured insight content
    
    Args:
        tracking_data: dict of {date_str: {tracker_name: value}}
        report_type: 'daily', 'weekly', or 'monthly'
        period_start: date object
        period_end: date object
        trackers: QuerySet of active Tracker objects (provides context like units and scales)
    """
    
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY is not configured; returning fallback insights.")
        return _fallback_response('AI insights are unavailable because the API key is missing.')

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = build_prompt(tracking_data, report_type, period_start, period_end, trackers)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
    except Exception as exc:
        logger.exception("Failed to generate insights from OpenAI: %s", exc)
        return _fallback_response('Unable to generate insights at this time.')
    
    content = response.choices[0].message.content
    
    if content is None:
        return _fallback_response('Unable to generate insights.')
    
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.exception("OpenAI returned invalid JSON for insights.")
        return _fallback_response('Unable to generate insights due to a formatting issue.')

def _fallback_response(summary):
    """Return a safe fallback when AI generation fails."""
    return {
        'summary': summary,
        'trends': [],
        'correlations': [],
        'advice': []
    }

def get_system_prompt():
    return """You are a personal wellness analyst. You analyze daily tracking data and provide actionable insights.

Always respond with valid JSON in this exact format:
{
    "summary": "2-3 sentence overview of the period",
    "trends": [
        {"metric": "Sleep", "direction": "up", "change": "+12%", "note": "Improving steadily"}
    ],
    "correlations": [
        {"pair": "Sleep → Mood", "strength": "strong", "description": "Better sleep correlates with higher mood"}
    ],
    "advice": [
        "Specific actionable recommendation based on the data"
    ]
}

Rules:
- "direction" must be "up", "down", or "stable"
- "strength" must be "strong", "moderate", or "weak"
- Provide 2-4 trends, 1-3 correlations, and 2-4 advice items
- Be specific and reference actual numbers from the data
- Use the tracker metadata (units, scales) to interpret values correctly
- For rating trackers, interpret values relative to their scale (e.g. 4/5 is good, 4/10 is below average)
- If there are only 1-2 days of data, focus on summary and advice rather than trends"""

def build_prompt(tracking_data, report_type, period_start, period_end, trackers):
    """Build a prompt that includes tracker context so the AI understands the data."""
    
    # Build tracker context so AI knows what each metric means
    tracker_descriptions = []
    for t in trackers:
        desc = f"- {t.name}: type={t.tracker_type}"
        if t.unit:
            desc += f", unit={t.unit}"
        if t.tracker_type == 'rating' and t.min_value is not None and t.max_value is not None:
            desc += f", scale={t.min_value}-{t.max_value}"
        tracker_descriptions.append(desc)
    
    tracker_context = "\n".join(tracker_descriptions)

    days_with_data = len(tracking_data)
    
    return f"""Analyze this {report_type} tracking data from {period_start} to {period_end}.
Days with entries: {days_with_data}

Tracked metrics:
{tracker_context}

Daily entries:
{json.dumps(tracking_data, indent=2)}

Provide insights in the required JSON format."""