import React from 'react';
// Imported here rather than through src/setupTests.js, which this project does
// not have.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IdsStatusBadge, IDS_STATUS_PRESENTATION } from './IdsStatusBadge';

test('names each status the backend can report', () => {
    const { rerender } = render(<IdsStatusBadge status='passed' />);
    expect(screen.getByText(/All requirements met/)).toBeInTheDocument();

    rerender(<IdsStatusBadge status='optional_failed' />);
    expect(screen.getByText(/Optional requirements missing/)).toBeInTheDocument();

    rerender(<IdsStatusBadge status='failed' />);
    expect(screen.getByText(/Required information missing/)).toBeInTheDocument();

    rerender(<IdsStatusBadge status='error' />);
    expect(screen.getByText(/Could not be checked/)).toBeInTheDocument();
});

test('the orange state carries its own class, since MDB warning is yellow', () => {
    const { container } = render(<IdsStatusBadge status='optional_failed' />);
    expect(container.querySelector('.ids-badge--optional')).toBeInTheDocument();
});

test('an unknown status falls back rather than rendering an empty badge', () => {
    // A verification saved before this feature existed has no status at all.
    render(<IdsStatusBadge status={undefined} />);
    expect(screen.getByText(/Not checked yet/)).toBeInTheDocument();
});

// MDBIcon renders a CSS class rather than an SVG, so an icon name the loaded
// stylesheet does not define fails silently as an empty box - which is exactly
// how the Font Awesome 6 spellings slipped through here. The stylesheet
// App.scss imports is FA 5, so check the names against the real thing.
test('every status icon exists in the Font Awesome stylesheet that is loaded', () => {
    const fs = require('fs');
    const css = fs.readFileSync(
        require.resolve('@fortawesome/fontawesome-free/css/all.min.css'), 'utf8');

    const missing = Object.entries(IDS_STATUS_PRESENTATION)
        .filter(([, look]) => !css.includes(`fa-${look.icon}:before`))
        .map(([status, look]) => `${status}: fa-${look.icon}`);

    expect(missing).toEqual([]);
});
