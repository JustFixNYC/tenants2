import atexit
import logging
import subprocess
import json
from dataclasses import dataclass
from typing import List, Dict, Any
from threading import RLock
from pathlib import Path


logger = logging.getLogger(__name__)


@dataclass
class LambdaPool:
    '''
    This class maintains a pool of "warmed up" lambda processes that are
    ready to receive events, and handles communication with them.

    Specifically, by "lambda process" we mean a process that:

        * Is a language interpreter (by default, Node.js) running a script.
        * Waits until it receives a UTF-8 JSON-encoded blob as input
          (known as the "event") via stdin, returns a UTF-8 JSON-encoded
          blob (known as the "response") via stdout, and then terminates.
          This core functionality is called the "handler".

    By "warmed up" we mean that the lambda process has already been
    started and is ready to receive input, so that when the caller
    needs to send it an event, it doesn't need to worry about delays
    caused by the lambda process' startup time.

    This class is also responsible for shutting down the processes when
    the caller's process terminates.
    '''

    # A descriptive name for the lambda process, used in logging messages.
    name: str

    # A path to the lambda process' script.
    script_path: Path

    # The current working directory to run the lambda process in.
    cwd: Path

    # How many "warmed up" lambda processes to have running.
    size: int = 5

    # The number of seconds we'll give a lambda process to handle its
    # event and return a response before we consider it a runaway and
    # terminate it.
    timeout_secs: int = 5

    # The path to the interpreter for the lambda process' script.
    interpreter_path: Path = Path('node')

    # Whether to restart the pool of warmed-up processes whenever
    # we detect that the lambda process' script has changed. This is
    # useful for development.
    restart_on_script_change: bool = False

    def __post_init__(self) -> None:
        self.__processes: List[subprocess.Popen] = []
        self.__lock = RLock()
        self.__script_path_mtime = 0.0
        atexit.register(self.empty)

    def __create_process(self) -> subprocess.Popen:
        '''
        Create a lambda process and return it if needed.
        '''

        child = subprocess.Popen(
            [str(self.interpreter_path), str(self.script_path)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            cwd=self.cwd
        )
        logger.info(f"Created {self.name} lambda process with pid {child.pid}.")
        return child

    def __get_process(self) -> subprocess.Popen:
        '''
        Get a lambda process, spawning one if necessary.
        '''

        with self.__lock:
            if self.restart_on_script_change:
                mtime = self.script_path.stat().st_mtime
                if mtime != self.__script_path_mtime:
                    self.__script_path_mtime = mtime
                    logger.info(
                        f"Change detected in {self.script_path.name}, "
                        f"restarting {self.name} lambda processs."
                    )
                    self.empty()

            # Refill our pool if needed.
            while len(self.__processes) < self.size:
                self.__processes.append(self.__create_process())

            # It's important that we pop from the *beginning* of our
            # list, as the earlier processes in our list are the
            # older ones that are most likely to be warmed up.
            return self.__processes.pop(0)

    def empty(self):
        '''
        Terminate any existing warmed-up lambda processes.
        '''

        with self.__lock:
            while self.__processes:
                child = self.__processes.pop()
                child.kill()
                logger.info(f"Destroyed {self.name} lambda process with pid {child.pid}.")

    def run_handler(self, event: Dict[str, Any]) -> Dict[str, Any]:
        '''
        Send an event to a lambda process and return its response.

        A subprocess.TimeoutExpired exception will be raised if the process
        takes too long to execute (it will automatically be terminated as well).

        A LambdaCrashedError will be raised if the process exits with a
        nonzero exit code.
        '''

        child = self.__get_process()
        try:
            (stdout, _) = child.communicate(
                json.dumps(event).encode('utf-8'),
                self.timeout_secs
            )
        except subprocess.TimeoutExpired as e:
            child.kill()
            logger.warn(f"Killed runaway {self.name} lambda process with pid {child.pid}.")
            raise e

        if child.returncode != 0:
            raise LambdaCrashedError(f'{self.name} lambda process crashed')

        return json.loads(stdout.decode('utf-8'))


class LambdaCrashedError(Exception):
    '''
    An error thrown if a lambda process crashes (i.e., exits with a
    nonzero exit code).
    '''

    pass
