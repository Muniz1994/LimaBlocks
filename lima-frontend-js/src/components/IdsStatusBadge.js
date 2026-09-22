import React from 'react';
import { MDBBadge, MDBIcon } from 'mdb-react-ui-kit';

// Keyed by the status strings verification/ids_check.py persists. One map, so
// the table cell, the expanded breakdown and the details modal cannot drift
// apart from each other.
export const IDS_STATUS_PRESENTATION = {
    passed: {
        color: 'success',
        icon: 'circle-check',
        text: 'All requirements met',
    },
    // MDB's "warning" is yellow, which reads as "nearly fine". The state this
    // carries - every obligatory specification met, an optional one not - is
    // worth the clearer orange the palette already defines.
    optional_failed: {
        color: 'warning',
        icon: 'circle-exclamation',
        text: 'Optional requirements missing',
        className: 'ids-badge--optional',
    },
    failed: {
        color: 'danger',
        icon: 'circle-xmark',
        text: 'Required information missing',
    },
    error: {
        color: 'dark',
        icon: 'triangle-exclamation',
        text: 'Could not be checked',
    },
    not_checked: {
        color: 'secondary',
        icon: 'circle-minus',
        text: 'Not checked yet',
    },
};

// An unknown status falls back to "not checked" rather than rendering an empty
// badge: a verification saved before this feature existed has no status at all.
export const presentIdsStatus = status =>
    IDS_STATUS_PRESENTATION[status] || IDS_STATUS_PRESENTATION.not_checked;

export function IdsStatusBadge({ status, className = '' }) {

    const look = presentIdsStatus(status);

    return (
        <MDBBadge
            color={look.color}
            pill
            className={[look.className, className].filter(Boolean).join(' ')}>
            <MDBIcon fas icon={look.icon} className='me-1' />
            {look.text}
        </MDBBadge>
    );
}
