"""Recording of whatever a compliance check writes to the console.

Rule code is authored by users and run through `exec`, so its `print` output
and the traceback of a rule that misbehaves are the only feedback available
when a check does not do what its author expected. Both used to reach the
server's terminal and nowhere else. This module records them as well, so the
API can hand them to the Reports view.
"""

import contextlib
import io
import sys
import threading


class _TeeStream:
    """File-like object that records one thread's output and passes on the rest.

    `redirect_stdout` swaps `sys.stdout` for the whole process, so with the
    threaded dev server a second check running at the same time would otherwise
    have its output land in the first one's report. Each tee therefore only
    records what its own thread writes, and forwards everything to the stream it
    replaced - which may be another capture's tee. Writes from any thread still
    reach the real console at the end of that chain.

    One case is not covered: if an outer capture finishes first, the inner tee is
    no longer reachable from `sys.stdout` and stops recording. That loses the
    tail of the longer run's output rather than attributing it to the wrong one.
    """

    def __init__(self, buffer, passthrough=None):
        self._buffer = buffer
        self._passthrough = passthrough
        self._owner = threading.get_ident()

    def write(self, text):
        if threading.get_ident() == self._owner:
            self._buffer.write(text)
        if self._passthrough is not None:
            self._passthrough.write(text)
        return len(text)

    def flush(self):
        if self._passthrough is not None:
            self._passthrough.flush()

    def isatty(self):
        return False


@contextlib.contextmanager
def capture_console():
    """Record stdout and stderr written inside the block by the calling thread.

    Yields the buffer holding them. It is filled as the code runs, not on the
    way out, so the text is complete even when the block raises - which is
    exactly the case worth reading.
    """

    buffer = io.StringIO()

    with contextlib.redirect_stdout(_TeeStream(buffer, sys.stdout)), \
            contextlib.redirect_stderr(_TeeStream(buffer, sys.stderr)):
        yield buffer
