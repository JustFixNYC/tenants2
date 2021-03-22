import base64
from django.urls import reverse

from .factories import UploadTokenFactory, HPActionDocumentsFactory
from ..models import HPActionDocuments
from ..views import decode_lhi_b64_data, LHI_B64_ALTCHARS


def encode_lhi_b64_data(data: bytes) -> str:
    return base64.b64encode(data, altchars=LHI_B64_ALTCHARS).decode("ascii")


def test_encode_lhi_b64_data_works():
    assert decode_lhi_b64_data(encode_lhi_b64_data(b"boop")) == b"boop"


def test_decode_lhi_b64_data_works_with_alt_chars():
    # Originally, this was '+NLCHzQDpta/0A==' in the standard Base64 alphabet.
    ENCODED_STR = " NLCHzQDpta/0A=="

    EXPECTED_BYTES = b"\xf8\xd2\xc2\x1f4\x03\xa6\xd6\xbf\xd0"

    assert decode_lhi_b64_data(ENCODED_STR) == EXPECTED_BYTES


class TestUpload:
    def test_it_returns_404_when_token_is_invalid(self, db, client):
        url = reverse("hpaction:upload", kwargs={"token_str": "blarg"})
        res = client.post(url)
        assert res.status_code == 404

    def test_it_returns_400_when_post_data_is_invalid(self, db, client):
        token = UploadTokenFactory()
        url = reverse("hpaction:upload", kwargs={"token_str": token.id})
        res = client.post(url, data={"blarg": 1})
        assert res.content == b"Invalid POST data"

    def test_it_works(self, db, client, django_file_storage):
        token = UploadTokenFactory()
        token_id = token.id

        url = reverse("hpaction:upload", kwargs={"token_str": token.id})
        res = client.post(
            url,
            data={
                "binary_file": encode_lhi_b64_data(b"i am uploaded pdf data"),
                "answer_file": encode_lhi_b64_data(b"i am uploaded xml data"),
            },
        )
        assert res.content == b"HP Action documents created."

        docs = HPActionDocuments.objects.get(id=token_id)
        assert django_file_storage.read(docs.xml_file) == b"i am uploaded xml data"
        assert django_file_storage.read(docs.pdf_file) == b"i am uploaded pdf data"


class TestLatestPDF:
    def setup(self):
        self.url = reverse("hpaction:latest_pdf", kwargs={"kind": "NORMAL"})

    def test_it_returns_404_for_invalid_kinds(self, admin_client):
        res = admin_client.get(reverse("hpaction:latest_pdf", kwargs={"kind": "BOOP"}))
        assert res.status_code == 404

    def test_it_returns_404_when_no_pdfs_exist(self, admin_client):
        res = admin_client.get(self.url)
        assert res.status_code == 404

    def test_it_returns_pdf(self, client, db, django_file_storage):
        docs = HPActionDocumentsFactory()
        client.force_login(docs.user)
        res = client.get(self.url)
        assert res.status_code == 200
        assert res["Content-Type"] == "application/pdf"

        # Make sure the legacy URL works too.
        res = client.get(reverse("hpaction:legacy_latest_pdf"))
        assert res.status_code == 200
        assert res["Content-Type"] == "application/pdf"
