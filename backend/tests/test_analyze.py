"""Basic route-level tests for the backend MVP."""

import unittest

from pydantic import ValidationError

from backend.models.request import AnalyzeRequest
from backend.routes.analyze import analyze_symptoms


class AnalyzeRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_analyze_returns_clinic_for_persistent_fever(self) -> None:
        result = await analyze_symptoms(
            AnalyzeRequest(text="I have had fever and headache for three days.")
        )

        self.assertEqual(result.triage, "clinic")
        self.assertFalse(result.is_emergency)
        self.assertTrue(result.session_id.startswith("session-"))

    async def test_analyze_returns_emergency_for_red_flags(self) -> None:
        result = await analyze_symptoms(
            AnalyzeRequest(text="I have chest pain and shortness of breath.")
        )

        self.assertEqual(result.triage, "emergency")
        self.assertTrue(result.is_emergency)

    def test_analyze_rejects_blank_text(self) -> None:
        with self.assertRaises(ValidationError):
            AnalyzeRequest(text="  ")
