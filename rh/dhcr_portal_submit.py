"""
Submit a rent-history request via the NY HCR public inquiry portal:
https://portal.hcr.ny.gov/app/ask

This is an exploratory alternative to the email-based DHCR integration
in `email_dhcr.py`. It is OPT-IN and DRY-RUN BY DEFAULT.

Before any real production use:
  - Confirm with HCR's Office of Rent Administration that programmatic
    submission via the public inquiry portal is permitted for JustFix.
  - Add an `email_sent_at` / `submitted_at` column to RentalHistoryRequest
    so we never double-submit.
  - Route through a Celery task; do not block the request thread.

Environment switches:
  DHCR_PORTAL_DRY_RUN=1   fill the form but do NOT click Submit (default)
  DHCR_PORTAL_DRY_RUN=0   actually submit
  DHCR_PORTAL_HEADLESS=0  show the browser window (debugging)

Usage from Python:
    from rh.dhcr_portal_submit import submit_via_portal
    submit_via_portal(rhr)        # rhr: RentalHistoryRequest
"""
import logging
import os
import re
from dataclasses import dataclass
from typing import Optional

from .models import RentalHistoryRequest

# Reference number HCR shows on the success page: "#240513-000046"
# (YYMMDD + 6-digit serial). Captured verbatim without the leading '#'.
REFERENCE_NUMBER_RE = re.compile(r"#(\d{6}-\d{6})")

logger = logging.getLogger(__name__)

PORTAL_URL = "https://portal.hcr.ny.gov/app/ask"
DEFAULT_TIMEOUT_MS = 30_000


@dataclass
class SubmissionResult:
    success: bool
    dry_run: bool
    reference_number: Optional[str] = None
    confirmation_text: Optional[str] = None
    error: Optional[str] = None


def submit_via_portal(rhr: RentalHistoryRequest) -> SubmissionResult:
    """
    Submit a RentalHistoryRequest through the HCR public inquiry portal.

    Returns SubmissionResult. Never raises on portal failures — captures
    them so the caller can record the outcome on the row.
    """
    try:
        from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
    except ImportError:
        return SubmissionResult(
            success=False,
            dry_run=True,
            error=(
                "playwright not installed. add 'playwright' to Pipfile and "
                "run `playwright install chromium` in the container."
            ),
        )

    dry_run = os.environ.get("DHCR_PORTAL_DRY_RUN", "1") != "0"
    headless = os.environ.get("DHCR_PORTAL_HEADLESS", "1") != "0"

    description = (
        f"Apartment rent history request submitted on behalf of "
        f"{rhr.first_name} {rhr.last_name} at {rhr.address}"
        f"{', apt ' + rhr.apartment_number if rhr.apartment_number else ''}, "
        f"{rhr.borough}, NY {rhr.zipcode or ''}. "
        f"Submitted via JustFix tenant platform "
        f"(internal reference id: {rhr.pk})."
    )

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(DEFAULT_TIMEOUT_MS)

        try:
            page.goto(PORTAL_URL)

            # Reason: select "Apartment Rent History" from the dropdown.
            # Field locators are best-guesses against a Microsoft Power Pages
            # portal; verify these against the live DOM before production use.
            page.get_by_label("Reason", exact=False).select_option(
                label="Apartment Rent History"
            )

            page.get_by_label("First Name", exact=False).fill(rhr.first_name)
            page.get_by_label("Last Name", exact=False).fill(rhr.last_name)
            page.get_by_label("Email Address", exact=False).fill(
                _tenant_email(rhr)
            )
            page.get_by_label("Phone", exact=False).fill(rhr.phone_number or "")

            # Requestor type: Tenant
            try:
                page.get_by_label("Tenant", exact=True).check()
            except Exception:
                logger.warning("could not locate 'Tenant' requestor radio")

            page.get_by_label("Street", exact=False).fill(rhr.address)
            if rhr.apartment_number:
                page.get_by_label("Apartment", exact=False).fill(rhr.apartment_number)
            page.get_by_label("City", exact=False).fill(_borough_to_city(rhr.borough))
            if rhr.zipcode:
                page.get_by_label("Postal Code", exact=False).fill(rhr.zipcode)

            page.get_by_label("Description", exact=False).fill(description)

            if dry_run:
                logger.info("DHCR portal: DRY RUN — form filled, not submitting")
                return SubmissionResult(
                    success=False,
                    dry_run=True,
                    confirmation_text="dry-run: form filled but submit not clicked",
                )

            # Live submission path. Intentionally gated behind DHCR_PORTAL_DRY_RUN=0.
            submit_button = page.get_by_role("button", name="Submit")
            submit_button.click()
            page.wait_for_load_state("networkidle")

            page.wait_for_selector("text=Your question has been submitted", timeout=DEFAULT_TIMEOUT_MS)
            confirmation = _read_confirmation(page)
            reference = _extract_reference_number(confirmation)
            if not reference:
                logger.warning("DHCR portal: success page reached but no reference number matched")
            return SubmissionResult(
                success=True,
                dry_run=False,
                reference_number=reference,
                confirmation_text=confirmation,
            )

        except PWTimeout as e:
            return SubmissionResult(
                success=False, dry_run=dry_run, error=f"timeout: {e}"
            )
        except Exception as e:
            return SubmissionResult(
                success=False, dry_run=dry_run, error=f"{type(e).__name__}: {e}"
            )
        finally:
            context.close()
            browser.close()


def _tenant_email(rhr: RentalHistoryRequest) -> str:
    """
    HCR's form requires an email. Use the linked user's email if available,
    otherwise fall back to a JustFix-controlled inbox so responses can be
    forwarded to the tenant.
    """
    if rhr.user_id and getattr(rhr.user, "email", None):
        return rhr.user.email
    return "rhrequest@justfix.org"


def _borough_to_city(borough: str) -> str:
    # HCR's form uses NYC borough names as the "City" value in practice.
    return {
        "MANHATTAN": "New York",
        "BRONX": "Bronx",
        "BROOKLYN": "Brooklyn",
        "QUEENS": "Queens",
        "STATEN_ISLAND": "Staten Island",
    }.get((borough or "").upper(), borough or "")


def _read_confirmation(page) -> str:
    """
    Best-effort extraction of the post-submit confirmation message.
    Power Pages typically renders a success banner; selector verified
    against the live DOM in a follow-up.
    """
    try:
        return page.locator("body").inner_text()[:500]
    except Exception:
        return ""


def _extract_reference_number(confirmation_text: str) -> Optional[str]:
    """
    Pull the HCR reference number out of the success-page text.

    Success page shows: "Use this reference number for follow up: #240513-000046."
    Returns "240513-000046" (without the leading '#'), or None if not found.
    """
    if not confirmation_text:
        return None
    m = REFERENCE_NUMBER_RE.search(confirmation_text)
    return m.group(1) if m else None
