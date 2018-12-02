import os
from typing import Tuple
import struct
import subprocess
import selectors
import time


UINT32BE = '>I'

HEADER_SIZE = 4

CHUNK_SIZE = 1024 * 1024

READ_STATE_WAIT_FOR_HEADER = 1
READ_STATE_WAIT_FOR_PAYLOAD = 2


def write_data(child: subprocess.Popen, data: bytes, timeout: int):
    sel = selectors.DefaultSelector()
    stdin_fd = child.stdin.fileno()
    stderr_fd = child.stderr.fileno()
    sel.register(stdin_fd, selectors.EVENT_WRITE)
    sel.register(stderr_fd, selectors.EVENT_READ)
    data = struct.pack(UINT32BE, len(data)) + data
    count = 0
    start_time = time.time()

    while count < len(data):
        events = sel.select(timeout)
        if time.time() - start_time > timeout:
            raise subprocess.TimeoutExpired(child.args, timeout)
        for key, mask in events:
            if key.fd == stdin_fd:
                count += os.write(stdin_fd, data[count:count + CHUNK_SIZE])
            # TODO: Do something with the stderr.

    sel.unregister(stdin_fd)
    sel.unregister(stderr_fd)


def read_data(child: subprocess.Popen, timeout: int) -> Tuple[bytes, bytes]:
    sel = selectors.DefaultSelector()
    stdout_fd = child.stdout.fileno()
    stderr_fd = child.stderr.fileno()
    sel.register(stdout_fd, selectors.EVENT_READ)
    sel.register(stderr_fd, selectors.EVENT_READ)
    stdout_bytes = bytearray()
    stderr_bytes = bytearray()
    state = READ_STATE_WAIT_FOR_HEADER
    bytes_left = HEADER_SIZE
    start_time = time.time()

    while True:
        events = sel.select(timeout)
        if time.time() - start_time > timeout:
            sel.unregister(stdout_fd)
            sel.unregister(stderr_fd)
            raise subprocess.TimeoutExpired(
                child.args, timeout, output=bytes(stdout_bytes), stderr=bytes(stderr_bytes))
        for key, mask in events:
            chunk = os.read(key.fd, CHUNK_SIZE)
            if key.fd == stdout_fd:
                while len(chunk) > 0:
                    if bytes_left <= len(chunk):
                        stdout_bytes.extend(chunk[0:bytes_left])
                        final_bytes = bytes(stdout_bytes)
                        stdout_bytes = bytearray()
                        chunk = chunk[bytes_left:]
                        if state == READ_STATE_WAIT_FOR_HEADER:
                            (bytes_left,) = struct.unpack(UINT32BE, final_bytes)
                            assert bytes_left > 0
                            state = READ_STATE_WAIT_FOR_PAYLOAD
                        elif state == READ_STATE_WAIT_FOR_PAYLOAD:
                            sel.unregister(stdout_fd)
                            sel.unregister(stderr_fd)
                            assert len(chunk) == 0
                            return (final_bytes, bytes(stderr_bytes))
                    else:
                        stdout_bytes.extend(chunk)
                        bytes_left -= len(chunk)
                        break
            elif key.fd == stderr_fd:
                stderr_bytes.extend(chunk)


def communicate(
    child: subprocess.Popen,
    data: bytes,
    timeout: int
) -> Tuple[bytes, bytes]:
    write_data(child, data, timeout)
    return read_data(child, timeout)
