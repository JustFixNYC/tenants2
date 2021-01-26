from typing import Dict, List, Set, Union
import PyPDF2
from PyPDF2.generic import BooleanObject, NameObject, TextStringObject


PdfFields = Dict[str, Union[str, bool, None]]


# https://stackoverflow.com/a/58898710/2422398
def set_need_appearances_writer(reader: PyPDF2.PdfFileReader, writer: PyPDF2.PdfFileWriter):
    trailer = reader.trailer["/Root"]["/AcroForm"]
    writer._root_object.update({NameObject("/AcroForm"): trailer})

    need_appearances = NameObject("/NeedAppearances")
    writer._root_object["/AcroForm"][need_appearances] = BooleanObject(True)
    return writer


# This is a fork of the original `PdfFileWriter.updatePageFormFieldValues()`,
# modified to raise an assertion if a field is not found, and support
# checkbox fields.
def update_page_form_fields(page, fields: PdfFields, checkbox_true_value="/Yes"):
    """
    Update the form field values for a given page from a fields dictionary.
    Copy field texts and values from fields to page.
    """

    fields_found: Set[str] = set()

    # Iterate through pages, update field values
    for j in range(0, len(page["/Annots"])):
        writer_annot = page["/Annots"][j].getObject()
        fields_found.update(fill_fields(writer_annot, fields, checkbox_true_value))

    fields_not_found = set(fields.keys()).difference(fields_found)
    if fields_not_found:
        raise ValueError(f"fields not found: {fields_not_found}")


def fill_fields(writer_annot, fields: PdfFields, checkbox_true_value: str) -> List[str]:
    fields_found: List[str] = []

    for field in fields:
        if writer_annot.get("/T") == field:
            value = fields[field]
            fields_found.append(field)
            if isinstance(value, str):
                write_text_value(writer_annot, value)
            elif isinstance(value, bool):
                write_checkbox_value(writer_annot, value, checkbox_true_value)

    return fields_found


def write_text_value(writer_annot, value: str):
    writer_annot.update({NameObject("/V"): TextStringObject(value)})


def write_checkbox_value(writer_annot, value: bool, checkbox_true_value: str):
    if value is True:
        # https://stackoverflow.com/a/48412434/2422398
        writer_annot.update(
            {
                NameObject("/V"): NameObject(checkbox_true_value),
                NameObject("/AS"): NameObject(checkbox_true_value),
            }
        )
