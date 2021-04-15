from unittest.mock import MagicMock

from amplitude.context_processors import AmplitudeSnippet


class TestAmplitudeSnippet:
    def test_it_works(self, http_request, settings):
        settings.AMPLITUDE_API_KEY = "my_amplitude_api_key"
        http_request.allow_inline_script = MagicMock()
        http_request.csp_update = MagicMock()
        amp = AmplitudeSnippet()
        html = amp.get_html(http_request)
        assert 'init("my_amplitude_api_key"' in html
        http_request.allow_inline_script.assert_called_once()
        http_request.csp_update.assert_called_once_with(CONNECT_SRC="https://api.amplitude.com")
