from typing import Optional, Union
from enum import Enum
import xml.etree.ElementTree as ET


def get_answers_xml_tf(root: ET.Element, name: str) -> Optional[bool]:
    nodes = root.findall(f".//Answer[@name='{name}']/TFValue")
    if nodes:
        return nodes[0].text == 'true'
    return None


class HPAType(Enum):
    REPAIRS = 1
    HARASSMENT = 2
    BOTH = 3

    @staticmethod
    def get_from_answers_xml(xml_value: Union[str, bytes]) -> 'HPAType':
        # Interestingly, ET is in charge of decoding this if it's bytes:
        # https://stackoverflow.com/a/21698118
        root = ET.fromstring(xml_value)

        harassment = get_answers_xml_tf(root, 'Sue for harassment TF')
        repairs = get_answers_xml_tf(root, 'Sue for repairs TF')

        if harassment and repairs:
            return HPAType.BOTH
        elif harassment:
            return HPAType.HARASSMENT
        elif repairs:
            return HPAType.REPAIRS

        raise ValueError('XML is suing for neither harassment nor repairs!')
