import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MDBIcon, MDBSpinner, MDBTypography } from 'mdb-react-ui-kit';

// Confirms removing a regulation or one of its rules. Both are gone for good,
// and a regulation takes its rules and their block code with it, so the modal
// names what is being removed and how much goes along.
export function DeleteRegulationModal({
    ShowState, HideFunction, onConfirm, kind, name, ruleCount = 0, isDeleting, requestError,
}) {

    const isRegulation = kind === 'regulation';
    const noun = isRegulation ? 'regulation' : 'rule';

    return (
        <Modal show={ShowState} onHide={HideFunction}>
            <Modal.Header closeButton>
                <Modal.Title as='h6' className='mb-0'>
                    <MDBIcon fas icon='trash' className='me-2' />
                    Delete {noun}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {requestError &&
                    <MDBTypography note noteColor='danger'>
                        <small className='d-block' style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>The {noun} could not be deleted. </strong>
                            {requestError}
                        </small>
                    </MDBTypography>}

                <p className='mb-0'>
                    This removes the {noun} <strong>{name}</strong>
                    {isRegulation && ruleCount > 0 &&
                        <> and its {ruleCount === 1 ? 'rule' : `${ruleCount} rules`}</>}
                    .{' '}It cannot be undone.
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant='outline-secondary'
                    size='sm'
                    disabled={isDeleting}
                    onClick={HideFunction}>
                    Cancel
                </Button>
                <Button
                    variant='danger'
                    size='sm'
                    disabled={isDeleting}
                    onClick={onConfirm}>
                    {isDeleting ?
                        <>
                            <MDBSpinner grow size='sm' className='me-2' />
                            Deleting…
                        </> :
                        'Delete'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
