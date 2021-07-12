from typing import Any, Dict


def with_keys_renamed(d: Dict[str, Any], renames: Dict[str, str]) -> Dict[str, Any]:
    """
    Returns a shallow copy of the given dictionary, with the given keys renamed, e.g.:

        >>> with_keys_renamed({'foo': 1, 'bar': 2}, {'foo': 'baz'})
        {'bar': 2, 'baz': 1}
    """

    result: Dict[str, Any] = {key: value for key, value in d.items() if key not in renames}

    for original, renamed in renames.items():
        result[renamed] = d[original]

    return result
