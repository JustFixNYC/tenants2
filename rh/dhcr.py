import re
from dataclasses import dataclass
from typing import Optional

from django.conf import settings


DHCR_RENT_HISTORY_REASON = "Apartment Rent History"

REFERENCE_NUMBER_PATTERNS = [
    re.compile(r"(?:reference|confirmation|incident)\s*(?:number|#)?\s*[:#]?\s*([A-Z0-9-]+)", re.I),
    re.compile(r"\b([0-9]{6,})\b"),
]


class DhcrSubmissionError(Exception):
    pass


@dataclass
class DhcrRentHistoryRequest:
    email: str
    first_name: str
    last_name: str
    phone: str
    street: str
    apt: str
    city: str
    zip: str

    @property
    def description(self) -> str:
        return (
            "Requesting an Apartment Rent History for the subject apartment.\n\n"
            "Subject Building Address\n"
            f"Street: {self.street}\n"
            f"Apartment/Unit: {self.apt}\n"
            f"City: {self.city}\n"
            f"Postal Code: {self.zip}"
        )


def extract_reference_number(text: str) -> Optional[str]:
    for pattern in REFERENCE_NUMBER_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1).strip()
    return None


def submit_rent_history_request(data: DhcrRentHistoryRequest) -> str:
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise DhcrSubmissionError("Playwright is not installed.") from e

    timeout = settings.DHCR_RENT_HISTORY_FORM_TIMEOUT_MS

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                page = browser.new_page()
                page.set_default_timeout(timeout)
                page.goto(settings.DHCR_RENT_HISTORY_FORM_URL, wait_until="networkidle")

                page.get_by_role("button", name=re.compile("select a reason", re.I)).click()
                page.get_by_text(DHCR_RENT_HISTORY_REASON, exact=True).click()

                page.get_by_label("First Name").fill(data.first_name)
                page.get_by_label("Last Name").fill(data.last_name)
                page.get_by_label("Email Address").fill(data.email)
                page.get_by_label("Phone").fill(data.phone)

                page.locator('input[name="street"]').fill(data.street)
                page.locator('input[name="unit"]').fill(data.apt)
                page.locator('input[name="city"]').fill(data.city)
                page.locator('input[name="zip"]').fill(data.zip)

                description = page.locator('textarea[name="Incident.Threads"]')
                if description.is_visible():
                    description.fill(data.description)

                submit = page.get_by_role("button", name=re.compile("^submit$", re.I))
                submit.wait_for(state="visible")
                submit.click()
                page.wait_for_load_state("networkidle")

                body_text = page.locator("body").inner_text()
            finally:
                browser.close()
    except PlaywrightTimeoutError as e:
        raise DhcrSubmissionError("Timed out while submitting the DHCR form.") from e
    except Exception as e:
        raise DhcrSubmissionError("Could not submit the DHCR form.") from e

    reference_number = extract_reference_number(body_text)
    if not reference_number:
        raise DhcrSubmissionError("DHCR did not return a reference number.")
    return reference_number
