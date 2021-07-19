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


def flip_dict(d: Dict[str, str]) -> Dict[str, str]:
    """
    Return the given dictionary with its keys and values swapped, e.g.:

        >>> flip_dict({'foo': 'bar'})
        {'bar': 'foo'}
    """

    return {value: key for key, value in d.items()}
