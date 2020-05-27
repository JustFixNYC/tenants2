from typing import List
from html.parser import HTMLParser


class HTMLToTextParser(HTMLParser):
    IGNORE_TAGS = set(['title'])

    BLOCK_TAGS = set(['p'])

    def __init__(self):
        super().__init__()
        self.__blocks: List[str] = []
        self.__curr_block: List[str] = []
        self.__capture = True

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self.__curr_block.append("\n")
        elif tag in self.IGNORE_TAGS:
            self.__capture = False

    def handle_data(self, data):
        if self.__capture:
            self.__curr_block.append(data)

    def handle_endtag(self, tag):
        if tag in self.IGNORE_TAGS:
            self.__capture = True
        if tag in self.BLOCK_TAGS:
            self.__blocks.append(''.join(self.__curr_block))
            self.__curr_block = []

    def get_text(self) -> str:
        return '\n\n'.join(self.__blocks)


def html_to_text(html: str) -> str:
    parser = HTMLToTextParser()
    parser.feed(html)
    return parser.get_text()
