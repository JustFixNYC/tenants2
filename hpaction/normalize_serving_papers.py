from typing import BinaryIO
from io import BytesIO
import PyPDF2


POINTS_PER_INCH = 72.0

LETTER_WIDTH = 8.5 * POINTS_PER_INCH

LETTER_HEIGHT = 11.0 * POINTS_PER_INCH


def convert_to_letter_pages(pdf: BinaryIO) -> BinaryIO:
    '''
    Return a PDF that embeds all pages of the given PDF in
    letter-sized pages, ensuring that Lob will not reject them.
    '''

    reader = PyPDF2.PdfFileReader(pdf)
    writer = PyPDF2.PdfFileWriter()

    for i in range(reader.getNumPages()):
        blank_page = writer.addBlankPage(width=LETTER_WIDTH, height=LETTER_HEIGHT)
        src_page = reader.getPage(i)
        blank_page.mergePage(src_page)

    new_pdf = BytesIO()
    writer.write(new_pdf)
    new_pdf.seek(0)

    return new_pdf
