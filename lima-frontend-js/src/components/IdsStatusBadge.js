import React from 'react';
import { MDBBadge, MDBIcon } from 'mdb-react-ui-kit';

// Keyed by the status strings verification/ids_check.py persists. One map, so
// the table cell, the expanded breakdown and the details modal cannot drift
// apart from each other.
//
// The icon names are the Font Awesome 5 spellings, because MDBIcon renders CSS
// classes and the stylesheet App.scss pulls in is FA 5.15 (a transitive
// dependency of mdb-react-ui-kit, not a declared one). FA 6 keeps these as
// aliases, so they survive an upgrade - the v6-only spellings, such as
// 'circle-check', render an empty box here.
export const IDS_STATUS_PRESENTATION = {
    passed: {
        color: 'success',
        icon: 'check-circle',
        text: 'All requirements met',
    },
    // MDB's "warning" is yellow, which reads as "nearly fine". The state this
    // carries - every obligatory specification met, an optional one not - is
    // worth the clearer orange the palette already defines.
    optional_failed: {
        color: 'warning',
        icon: 'exclamation-circle',
        text: 'Optional requirements missing',
        className: 'ids-badge--optional',
    },
    failed: {
        color: 'danger',
        icon: 'times-circle',
        text: 'Required information missing',
    },
    error: {
        color: 'dark',
        icon: 'exclamation-triangle',
        text: 'Could not be checked',
    },
    not_checked: {
        color: 'secondary',
        icon: 'minus-circle',
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
