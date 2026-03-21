"""Tests for translation helpers."""

import unittest
from unittest.mock import AsyncMock, patch

from backend.services.translator import (
    detect_language,
    translate_from_english,
    translate_text_list,
    translate_to_english,
)


class TranslatorTests(unittest.IsolatedAsyncioTestCase):
    async def test_detect_language_falls_back_to_local_script_detection(self) -> None:
        with patch("backend.services.translator._google_detect_language", new=AsyncMock(return_value=None)):
            result = await detect_language("મને તાવ છે")

        self.assertEqual(result, "gu")

    async def test_translate_to_english_uses_google_when_available(self) -> None:
        with patch(
            "backend.services.translator._google_translate_texts",
            new=AsyncMock(return_value=["I have fever for three days"]),
        ):
            result = await translate_to_english("मुझे तीन दिन से बुखार है", "hi")

        self.assertEqual(result, "I have fever for three days")

    async def test_translate_from_english_falls_back_to_static_map(self) -> None:
        with patch("backend.services.translator._google_translate_texts", new=AsyncMock(return_value=None)):
            result = await translate_from_english(
                "Call 108 or go to the nearest emergency department now.",
                "hi",
            )

        self.assertIn("108", result)
        self.assertNotEqual(result, "Call 108 or go to the nearest emergency department now.")

    async def test_translate_text_list_uses_batched_google_translation(self) -> None:
        mock_translate = AsyncMock(return_value=["आराम करें", "डॉक्टर के पास जाएं"])
        with patch("backend.services.translator._google_translate_texts", new=mock_translate):
            result = await translate_text_list(
                ["Rest at home.", "Visit a doctor."],
                "hi",
            )

        self.assertEqual(result, ["आराम करें", "डॉक्टर के पास जाएं"])
