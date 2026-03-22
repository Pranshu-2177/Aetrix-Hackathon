"""Basic route-level tests for the backend MVP."""

import unittest

from pydantic import ValidationError

from backend.models.request import AnalyzeRequest
from backend.routes.analyze import analyze_symptoms


class AnalyzeRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_analyze_returns_clinic_for_persistent_fever(self) -> None:
        result = await analyze_symptoms(
            AnalyzeRequest(text="I have had fever and headache for three days.", language="en")
        )

        self.assertEqual(result.triage, "clinic")
        self.assertIn(result.triage_engine, {"groq", "fallback"})
        self.assertFalse(result.is_emergency)
        self.assertTrue(result.session_id.startswith("session-"))
        self.assertEqual(result.language, "en")

    async def test_analyze_returns_emergency_for_hindi_red_flags_and_facilities(self) -> None:
        result = await analyze_symptoms(
            AnalyzeRequest(
                text="मुझे सीने में दर्द है और सांस लेने में तकलीफ है",
                language="hi",
                location={"lat": 23.0, "lng": 72.38},
            )
        )

        self.assertEqual(result.triage, "emergency")
        self.assertTrue(result.is_emergency)
        self.assertEqual(result.language, "hi")
        self.assertGreater(len(result.facilities), 0)
        self.assertLessEqual(len(result.facilities), 3)
        self.assertGreaterEqual(result.facilities[0].rating, 0.0)
        self.assertTrue(result.facilities[0].match_reason)

    def test_analyze_rejects_blank_text(self) -> None:
        with self.assertRaises(ValidationError):
            AnalyzeRequest(text="  ")

    async def test_analyze_accepts_voice_transcript_only(self) -> None:
        result = await analyze_symptoms(
            AnalyzeRequest(voice_text="ताव आणि खोकला तीन दिवसांपासून आहे", language="mr")
        )

        self.assertEqual(result.triage, "clinic")
        self.assertEqual(result.language, "mr")

    async def test_analyze_requests_more_info_for_greeting(self) -> None:
        result = await analyze_symptoms(
            AnalyzeRequest(text="hi", language="en")
        )

        self.assertTrue(result.needs_more_info)
        self.assertEqual(result.triage_engine, "fallback")
        self.assertEqual(result.recommended_actions, [])
        self.assertGreater(len(result.follow_up_questions), 0)
