from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

# Create your tests here.
from django.test import SimpleTestCase, override_settings

from apps.insights.services import generate_insight_content


class GenerateInsightContentTests(SimpleTestCase):
    @override_settings(OPENAI_API_KEY="test-key")
    @patch("apps.insights.services.OpenAI")
    def test_returns_fallback_when_response_has_no_choices(self, mock_openai):
        mock_client = mock_openai.return_value
        mock_client.chat.completions.create.return_value = SimpleNamespace(choices=[])

        result = generate_insight_content({}, "weekly", date(2026, 2, 1), date(2026, 2, 8), [])

        self.assertEqual(result["summary"], "Unable to generate insights at this time.")
        self.assertEqual(result["trends"], [])

    @override_settings(OPENAI_API_KEY="test-key")
    @patch("apps.insights.services.OpenAI")
    def test_returns_fallback_when_message_content_is_not_json(self, mock_openai):
        mock_client = mock_openai.return_value
        mock_client.chat.completions.create.return_value = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="not-json"))]
        )

        result = generate_insight_content({}, "weekly", date(2026, 2, 1), date(2026, 2, 8), [])

        self.assertEqual(result["summary"], "Unable to generate insights due to a formatting issue.")