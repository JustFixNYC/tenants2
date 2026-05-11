"""
Smoke-test: drive https://portal.hcr.ny.gov/app/ask in a real browser via
Playwright, do NOT fill any fields, click Submit, and report what comes back.

The HCR portal validates required fields server-side, so an empty submission
gets rejected with an "Errors" banner -- no record is created. This is the
safest possible end-to-end check that we can reach and interact with the page.

Prereqs:
    pipenv install playwright
    playwright install chromium

Usage:
    pipenv run python manage.py test_dhcr_portal_empty
    DHCR_PORTAL_HEADLESS=0 pipenv run python manage.py test_dhcr_portal_empty
"""
import os

from django.core.management.base import BaseCommand

URL = "https://portal.hcr.ny.gov/app/ask"


class Command(BaseCommand):
    help = (
        "Open the HCR public inquiry portal in a headless browser, click "
        "Submit on an empty form, and print the validation response. "
        "Does NOT submit any data."
    )

    def handle(self, *args, **options):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            self.stderr.write(
                "playwright not installed. add it to Pipfile and run "
                "`playwright install chromium`."
            )
            return

        headless = os.environ.get("DHCR_PORTAL_HEADLESS", "1") != "0"

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=headless)
            ctx = browser.new_context()
            page = ctx.new_page()
            page.set_default_timeout(30_000)

            self.stdout.write(f"navigating to {URL}")
            page.goto(URL, wait_until="domcontentloaded")
            self.stdout.write(f"page title: {page.title()[:120]!r}")

            try:
                submit = page.get_by_role("button", name="Submit").first
                self.stdout.write("clicking SUBMIT on EMPTY form...")
                submit.click(timeout=5000)
            except Exception as e:
                self.stderr.write(f"could not click Submit: {type(e).__name__}: {e}")
                ctx.close()
                browser.close()
                return

            page.wait_for_timeout(1500)
            self.stdout.write(f"page url after submit-click: {page.url}")

            body = page.locator("body").inner_text()
            for line in body.splitlines():
                if "required" in line.lower() or "errors" in line.lower():
                    self.stdout.write(f"  {line.strip()[:200]}")

            ctx.close()
            browser.close()

        self.stdout.write(self.style.SUCCESS("done. empty submission rejected as expected."))
