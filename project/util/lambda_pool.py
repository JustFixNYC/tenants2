import atexit
import logging
import subprocess
import json
from typing import List, Dict, Any
from threading import RLock
from pathlib import Path


logger = logging.getLogger(__name__)


class LambdaPool:
    def __init__(self, name: str, script_path: Path, cwd: Path, size: int=5,
                 timeout_secs: int=5, node_path=Path('node'),
                 restart_on_script_change: bool=False) -> None:
        self.name = name
        self.script_path = script_path
        self.cwd = cwd
        self.size = size
        self.timeout_secs = timeout_secs
        self.node_path = node_path
        self.restart_on_script_change = restart_on_script_change
        self.__processes: List[subprocess.Popen] = []
        self.__lock = RLock()
        self.__script_path_mtime = 0.0
        atexit.register(self.empty)

    def __create_process(self) -> subprocess.Popen:
        child = subprocess.Popen(
            [str(self.node_path), str(self.script_path)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            cwd=self.cwd
        )
        logger.info(f"Created {self.name} lambda runner with pid {child.pid}.")
        return child

    def __get_process(self) -> subprocess.Popen:
        with self.__lock:
            if self.restart_on_script_change:
                mtime = self.script_path.stat().st_mtime
                if mtime != self.__script_path_mtime:
                    self.__script_path_mtime = mtime
                    logger.info(
                        f"Change detected in {self.script_path.name}, "
                        f"restarting {self.name} lambda runners."
                    )
                    self.empty()
            while len(self.__processes) < self.size:
                self.__processes.append(self.__create_process())
            return self.__processes.pop(0)

    def empty(self):
        with self.__lock:
            while self.__processes:
                child = self.__processes.pop()
                child.kill()
                logger.info(f"Destroyed {self.name} lambda runner with pid {child.pid}.")

    def run_handler(self, event: Dict[str, Any]) -> Dict[str, Any]:
        child = self.__get_process()
        try:
            (stdout, _) = child.communicate(
                json.dumps(event).encode('utf-8'),
                self.timeout_secs
            )
        except subprocess.TimeoutExpired as e:
            child.kill()
            logger.warn(f"Killed runaway {self.name} lambda runner with pid {child.pid}.")
            raise e

        if child.returncode != 0:
            raise Exception(f'{self.name} lambda runner crashed')

        return json.loads(stdout.decode('utf-8'))
