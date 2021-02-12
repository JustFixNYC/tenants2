from typing import Any, Dict, Tuple
from threading import Lock
from PyPDF2.pdf import PageObject, ContentStream
from PyPDF2.generic import DictionaryObject, NameObject, ArrayObject


_lock = Lock()
parsed_content_stream_data: Dict[Tuple[str, int], Any] = {}


def make_content_stream(pdf, content) -> ContentStream:
    arr = ArrayObject()
    arr.append(content)
    return ContentStream(arr, pdf)


def append_to_content_stream(original: ContentStream, added) -> ContentStream:
    result = make_content_stream(original.pdf, added)
    result.operations = original.operations + result.operations
    return result


def merge_page(pdf, page_number, page2, page2transformation=None, ctm=None, expand=False):
    # First we work on merging the resource dictionaries.  This allows us
    # to find out what symbols in the content streams we might need to
    # rename.

    page1 = pdf.getPage(page_number)
    newResources = DictionaryObject()
    rename = {}
    originalResources = page1["/Resources"].getObject()
    page2Resources = page2["/Resources"].getObject()
    newAnnots = ArrayObject()

    for page in (page1, page2):
        if "/Annots" in page:
            annots = page["/Annots"]
            if isinstance(annots, ArrayObject):
                for ref in annots:
                    newAnnots.append(ref)

    for res in (
        "/ExtGState",
        "/Font",
        "/XObject",
        "/ColorSpace",
        "/Pattern",
        "/Shading",
        "/Properties",
    ):
        new, newrename = PageObject._mergeResources(originalResources, page2Resources, res)
        if new:
            newResources[NameObject(res)] = new
            rename.update(newrename)

    # Combine /ProcSet sets.
    newResources[NameObject("/ProcSet")] = ArrayObject(
        frozenset(originalResources.get("/ProcSet", ArrayObject()).getObject()).union(
            frozenset(page2Resources.get("/ProcSet", ArrayObject()).getObject())
        )
    )

    key = (pdf.stream.name, page_number)
    with _lock:
        if key not in parsed_content_stream_data:
            originalContent = page1.getContents()
            assert originalContent is not None
            parsed_content_stream_data[key] = PageObject._pushPopGS(originalContent, page1.pdf)

    content_stream = parsed_content_stream_data[key]

    page2Content = page2.getContents()
    if page2Content is not None:
        if page2transformation is not None:
            page2Content = page2transformation(page2Content)
        page2Content = PageObject._contentStreamRename(page2Content, rename, page1.pdf)
        page2Content = PageObject._pushPopGS(page2Content, page1.pdf)
        content_stream = append_to_content_stream(content_stream, page2Content)

    # if expanding the page to fit a new page, calculate the new media box size
    if expand:
        corners1 = [
            page1.mediaBox.getLowerLeft_x().as_numeric(),
            page1.mediaBox.getLowerLeft_y().as_numeric(),
            page1.mediaBox.getUpperRight_x().as_numeric(),
            page1.mediaBox.getUpperRight_y().as_numeric(),
        ]
        corners2 = [
            page2.mediaBox.getLowerLeft_x().as_numeric(),
            page2.mediaBox.getLowerLeft_y().as_numeric(),
            page2.mediaBox.getUpperLeft_x().as_numeric(),
            page2.mediaBox.getUpperLeft_y().as_numeric(),
            page2.mediaBox.getUpperRight_x().as_numeric(),
            page2.mediaBox.getUpperRight_y().as_numeric(),
            page2.mediaBox.getLowerRight_x().as_numeric(),
            page2.mediaBox.getLowerRight_y().as_numeric(),
        ]
        if ctm is not None:
            ctm = [float(x) for x in ctm]
            new_x = [
                ctm[0] * corners2[i] + ctm[2] * corners2[i + 1] + ctm[4] for i in range(0, 8, 2)
            ]
            new_y = [
                ctm[1] * corners2[i] + ctm[3] * corners2[i + 1] + ctm[5] for i in range(0, 8, 2)
            ]
        else:
            new_x = corners2[0:8:2]
            new_y = corners2[1:8:2]
        lowerleft = [min(new_x), min(new_y)]
        upperright = [max(new_x), max(new_y)]
        lowerleft = [min(corners1[0], lowerleft[0]), min(corners1[1], lowerleft[1])]
        upperright = [max(corners1[2], upperright[0]), max(corners1[3], upperright[1])]

        page1.mediaBox.setLowerLeft(lowerleft)
        page1.mediaBox.setUpperRight(upperright)

    new_page = PageObject.createBlankPage(page1.pdf)

    new_page[NameObject("/Contents")] = content_stream
    new_page[NameObject("/Resources")] = newResources
    new_page[NameObject("/Annots")] = newAnnots

    return new_page
