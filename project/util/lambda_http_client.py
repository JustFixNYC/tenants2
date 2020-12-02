from typing import Optional, Any, List
import subprocess
import logging
import atexit
import re
from dataclasses import dataclass, field
from threading import RLock, Thread
from pathlib import Path
import requests

from .lambda_service import get_latest_mtime_for_bundle, LambdaService


logger = logging.getLogger(__name__)


@dataclass
class LambdaHttpClient(LambdaService):
    """
    This class runs a subprocess that is expected to immediately start
    an HTTP server that listens on localhost.  The server should adhere
    to the following protocol:

    1. Once it is ready to listen for requests, it prints a line to stdout
       in the form of "LISTENING ON PORT XYZ", where "XYZ" is the port
       number. This should be its very first line of output to stdio.

    2. Its HTTP server should accept any POST requests to the root of
       the server with a Content-Type of application/json, and return
       a 200 OK response of the same Content-Type. The POST body is
       sometimes called the "event".

    This class is also responsible for shutting down the server when
    the host process terminates.
    """

    # A descriptive name for the server, used in logging messages.
    name: str

    # A path to the server's script.
    script_path: Path

    # The current working directory to run the server in.
    cwd: Path

    # The path to the interpreter for the server's script.
    interpreter_path: Path = Path("node")

    # The number of seconds we'll give a server to start up, and to
    # handle its event and return a response before we consider it a
    # runaway and terminate it.
    timeout_secs: float = 5.0

    # Whether to restart the server whenever we detect that its script has
    # changed. This is useful for development.
    restart_on_script_change: bool = False

    # Extra arguments to pass to the server's script.
    script_args: List[str] = field(default_factory=list)

    # Extra arguments to pass to the interpreter.
    interpreter_args: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.__process: Optional[subprocess.Popen] = None
        self.__process_output = b""
        self.__port: Optional[int] = None
        self.__lock = RLock()
        self.__script_path_mtime = 0.0

    def shutdown(self):
        """
        Shutdown the server, if it's running.
        """

        with self.__lock:
            if self.__port:
                self.__port = None
            if self.__process:
                child = self.__process
                self.__process = None
                child.kill()
                logger.debug(f"Destroyed {self.name} lambda process with pid {child.pid}.")
            atexit.unregister(self.shutdown)

    def __kill_process_if_script_changed(self):
        with self.__lock:
            mtime = get_latest_mtime_for_bundle(self.script_path)
            if mtime != self.__script_path_mtime:
                self.__script_path_mtime = mtime
                if self.__process:
                    logger.info(
                        f"Change detected in {self.script_path.name}, "
                        f"restarting {self.name} lambda process."
                    )
                    self.shutdown()

    def __create_process(self) -> subprocess.Popen:
        """
        Create a lambda process and return it if needed.
        """

        child = subprocess.Popen(
            [
                str(self.interpreter_path),
                *self.interpreter_args,
                str(self.script_path),
                *self.script_args,
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            cwd=self.cwd,
        )
        logger.debug(f"Created {self.name} lambda process with pid {child.pid}.")
        return child

    def __read_process_output(self) -> None:
        assert self.__process is not None
        assert self.__process.stdout is not None
        self.__process_output = self.__process.stdout.readline()

    def __wait_for_process_output(self):
        assert self.__process is not None

        stdout_thread = Thread(target=self.__read_process_output)
        stdout_thread.daemon = True
        stdout_thread.start()
        stdout_thread.join(timeout=self.timeout_secs)

        if stdout_thread.is_alive():
            self.__process.kill()
            self.__process = None
            stdout_thread.join()
            raise Exception(f"Subprocess produced no output within {self.timeout_secs}s")

        if not self.__process_output:
            self.__process.wait(timeout=self.timeout_secs)
            raise Exception(f"Subprocess failed with exit code {self.__process.returncode}")

    def __spawn_process_and_get_port(self) -> int:
        self.__process = self.__create_process()
        self.__process_output = b""
        atexit.register(self.shutdown)
        self.__wait_for_process_output()

        match = re.match(r"LISTENING ON PORT ([0-9]+)", self.__process_output.decode("utf-8"))
        if not match:
            raise Exception(f"Could not parse port from line: {repr(self.__process_output)}")

        return int(match.group(1))

    def __get_port(self) -> int:
        with self.__lock:
            if self.restart_on_script_change:
                self.__kill_process_if_script_changed()
            if self.__port is None:
                self.__port = self.__spawn_process_and_get_port()
            return self.__port

    @property
    def is_running(self) -> bool:
        """
        Return whether the server is running.
        """

        with self.__lock:
            return self.__port is not None and self.__process is not None

    def get_url(self) -> str:
        """
        Returns the URL to the server's root, starting up the server if it's
        not already running.
        """

        return f"http://127.0.0.1:{self.__get_port()}/"

    def run_handler(self, event: Any, timeout: Optional[float] = None) -> Any:
        """
        Make a request to the server, passing it the given JSON-serializable
        event as input, and returning the server's response as deserialized JSON.

        If the server misbehaves in any way, it is shut down.
        """

        try:
            res = requests.post(self.get_url(), json=event, timeout=timeout or self.timeout_secs)
            res.raise_for_status()
            return res.json()
        except Exception:
            logger.warning("Lambda process is misbehaving, shutting it down.")
            self.shutdown()
            raise
