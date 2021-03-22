from typing import List
import abc
from html.parser import HTMLParser


HEADER_UNDERLINE_CHARS = {
    "h1": "*",
    "h2": "=",
    "h3": "-",
    "h4": ".",
}

MAX_HEADER_UNDERLINE_LENGTH = 80


class Counter(abc.ABC):
    def __init__(self):
        self._value = 0
        self.was_rendered = False

    @property
    @abc.abstractmethod
    def symbol(self) -> str:
        pass

    def render(self) -> str:
        self.was_rendered = True
        return self.symbol

    def increment(self):
        self._value += 1
        self.was_rendered = False


class OrderedCounter(Counter):
    pass


class OrderedNumericCounter(OrderedCounter):
    @property
    def symbol(self) -> str:
        return f"{self._value + 1}."


class OrderedAlphaCounter(OrderedCounter):
    def __init__(self, start_char: str):
        super().__init__()
        self.start_char = start_char

    @property
    def symbol(self) -> str:
        return f"{chr(ord(self.start_char) + self._value)}."


class UnorderedCounter(Counter):
    def __init__(self, symbol: str = "*"):
        super().__init__()
        self._symbol = symbol

    @property
    def symbol(self) -> str:
        return self._symbol


class HTMLToTextParser(HTMLParser):
    IGNORE_TAGS = set(["title", "style"])

    HEADER_TAGS = set(["h1", "h2", "h3", "h4"])

    BLOCK_TAGS = set(["p", "tr", "li", "ul", "ol"]).union(HEADER_TAGS)

    def __init__(self):
        super().__init__()
        self.__blocks: List[str] = []
        self.__curr_block: List[str] = []
        self.__href = ""
        self.__show_href_only = False
        self.__capture = True
        self.__counters: List[Counter] = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "br":
            self.__curr_block.append("\n")
        if tag == "img" and attrs.get("alt"):
            self.__curr_block.append(attrs.get("src", ""))
        if tag in self.BLOCK_TAGS and self.__curr_block:
            self.__append_current_block()
        if tag == "ol":
            self.__counters.append(self.__make_ordered_counter(attrs.get("type", "1")))
        elif tag == "ul":
            self.__counters.append(self.__make_unordered_counter())
        elif tag == "a":
            self.__show_href_only = "data-jf-show-href-only-in-plaintext" in attrs
            if self.__show_href_only:
                self.__capture = False
            self.__href = attrs.get("href", "")
        elif tag in self.IGNORE_TAGS:
            self.__capture = False

    def handle_data(self, data):
        if self.__capture:
            self.__curr_block.append(data)

    def __make_unordered_counter(self) -> UnorderedCounter:
        count = len([c for c in self.__counters if isinstance(c, UnorderedCounter)])
        return UnorderedCounter("*" if count < 1 else "-")

    def __make_ordered_counter(self, type: str) -> OrderedCounter:
        if type == "1":
            return OrderedNumericCounter()
        elif type.lower() == "a":
            return OrderedAlphaCounter(type)
        elif type.lower() == "i":
            raise NotImplementedError("Roman numerals in <ol> are unsupported")
        raise ValueError(f'Unknown <ol> type "{type}"')

    def __render_counter(self) -> str:
        if self.__counters:
            counter = self.__counters[-1]
            if not counter.was_rendered:
                return f"{counter.render()} "
        return ""

    def __handle_anchor_endtag(self):
        if self.__show_href_only:
            self.__capture = True
            text = self.__href
        else:
            text = f": {self.__href}"
        if self.__href and self.__href.startswith("http"):
            self.__curr_block.append(text)
            self.__href = ""

    def __handle_list_item_endtag(self) -> None:
        if self.__counters:
            counter = self.__counters[-1]
            counter.increment()

    def __append_current_block(self) -> bool:
        was_appended = False
        content = "".join(self.__curr_block).strip()
        if content:
            self.__blocks.append(self.__render_counter() + content)
            was_appended = True
        self.__curr_block = []
        return was_appended

    def __finish_block_tag(self, tag: str):
        was_appended = self.__append_current_block()
        if was_appended and tag in self.HEADER_TAGS:
            text = self.__blocks[-1]
            count = min(len(text), MAX_HEADER_UNDERLINE_LENGTH)
            underline = HEADER_UNDERLINE_CHARS[tag] * count
            self.__blocks[-1] = "\n".join([text, underline])

    def handle_endtag(self, tag):
        if tag == "a":
            self.__handle_anchor_endtag()
        if tag in self.IGNORE_TAGS:
            self.__capture = True
        if tag in self.BLOCK_TAGS:
            self.__finish_block_tag(tag)
        if tag == "li":
            self.__handle_list_item_endtag()
        if tag in ["ol", "ul"]:
            self.__counters.pop()

    def finish(self):
        self.__append_current_block()

    def get_text(self) -> str:
        return "\n\n".join(self.__blocks)


def html_to_text(html: str) -> str:
    """
    Convert HTML to plaintext. Assumes that the HTML was
    rendered by React, which greatly limits the amount of
    variation we need to deal with.
    """

    parser = HTMLToTextParser()
    parser.feed(html)
    parser.finish()
    return parser.get_text()
