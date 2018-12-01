from typing import Tuple
import struct
import subprocess


UINT32BE = '>I'

HEADER_SIZE = 4


def write_data(child: subprocess.Popen, data: bytes):
    child.stdin.write(struct.pack(UINT32BE, len(data)))
    child.stdin.write(data)
    child.stdin.flush()


def read_data(child: subprocess.Popen) -> bytes:
    (length,) = struct.unpack(UINT32BE, child.stdout.read(HEADER_SIZE))
    return child.stdout.read(length)


def communicate(child: subprocess.Popen, data: bytes, timeout: int) -> Tuple[bytes, bytes]:
    stderr = b'TODO get stderr'
    write_data(child, data)
    return read_data(child), stderr
