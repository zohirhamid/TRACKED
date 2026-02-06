# insights/services.py

import json
from openai import OpenAI
from django.conf import settings


def generate_insight_content(tracking_data, report_type, period_start, period_end):
    """Call OpenAI and return structured insight content"""
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = build_prompt(tracking_data, report_type, period_start, period_end)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": get_system_prompt()},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content
    
    if content is None:
        return {
            'summary': 'Unable to generate insights.',
            'trends': [],
            'correlations': [],
            'advice': []
        }
    
    return json.loads(content)


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
- Be specific and reference actual numbers from the data"""


def build_prompt(tracking_data, report_type, period_start, period_end):
    return f"""Analyze this {report_type} tracking data from {period_start} to {period_end}:

{json.dumps(tracking_data, indent=2)}

Provide insights in the required JSON format."""