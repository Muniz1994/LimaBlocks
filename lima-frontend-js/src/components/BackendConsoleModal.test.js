import React from 'react';
// Imported here rather than through src/setupTests.js, which this project does
// not have.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BackendConsoleModal } from './BackendConsoleModal';

test('shows the captured output', () => {
    render(
        <BackendConsoleModal
            ShowState
            HideFunction={() => { }}
            output={'[engine] executing 6 rule(s)\n[rule 1/6] Building depth'}
            status='ok'
            isRunning={false} />
    );
    expect(screen.getByText(/\[rule 1\/6\] Building depth/)).toBeInTheDocument();
    expect(screen.queryByText(/did not finish/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).not.toBeDisabled();
});

test('flags a failed run and still shows the traceback', () => {
    render(
        <BackendConsoleModal
            ShowState
            HideFunction={() => { }}
            output={'rule output\nTraceback (most recent call last):\nValueError: boom'}
            status='error'
            isRunning={false} />
    );
    expect(screen.getByText(/did not finish/)).toBeInTheDocument();
    expect(screen.getByText(/ValueError: boom/)).toBeInTheDocument();
});

test('explains a call that never reached the backend', () => {
    render(
        <BackendConsoleModal
            ShowState
            HideFunction={() => { }}
            output={undefined}
            status={undefined}
            requestError={'The backend could not be reached: TypeError: Failed to fetch'}
            isRunning={false} />
    );
    expect(screen.getByText(/could not be run/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    // There is no console output, but the message itself is worth copying.
    expect(screen.queryByText(/Nothing yet/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).not.toBeDisabled();
});

test('explains the empty state and disables copying', () => {
    render(
        <BackendConsoleModal
            ShowState
            HideFunction={() => { }}
            output={undefined}
            status={undefined}
            isRunning={false} />
    );
    expect(screen.getByText(/Nothing yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
});

test('says so while the check is still running', () => {
    render(
        <BackendConsoleModal
            ShowState
            HideFunction={() => { }}
            output={undefined}
            status={undefined}
            isRunning />
    );
    expect(screen.getByText(/Running the compliance check/)).toBeInTheDocument();
});
