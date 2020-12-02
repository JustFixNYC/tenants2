from typing import Any
from pathlib import Path
import glob


class LambdaService:
    """
    An abstract base class that represents a service similar to
    a "function as a service" (FaaS).

    It consists of an "event handler" that takes a JSON-serializable
    event as input and returns a deserialized JSON response.
    """

    def run_handler(self, event: Any) -> Any:
        """
        Run the event handler and return its response.

        Concrete subclasses must implement this method.
        """

        raise NotImplementedError()


def get_latest_mtime_for_bundle(path: Path) -> float:
    """
    Get the most recent modified time for the given source
    bundle and any of its loadable sub-bundles. It is assumed
    the sub-bundles all end with the name of the original source
    bundle, e.g. if the source bundle is called "foo.js",
    a source bundle would be "bar.foo.js".
    """

    filenames = [str(path)] + glob.glob(str(path.with_name(f"*.{path.name}")))
    latest_mtime = max(Path(filename).stat().st_mtime for filename in filenames)
    return latest_mtime
