import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MDBIcon, MDBSpinner, MDBTypography } from 'mdb-react-ui-kit';

// Confirms removing a verification. Deleting one throws away its uploaded model
// and the information-requirements result with it, and nothing in the interface
// can bring either back - so the file being removed is named rather than left
// for the user to remember which row they clicked.
export function DeleteVerificationModal({
    ShowState, HideFunction, onConfirm, fileName, isDeleting, requestError,
}) {

    return (
        <Modal show={ShowState} onHide={HideFunction}>
            <Modal.Header closeButton>
                <Modal.Title as='h6' className='mb-0'>
                    <MDBIcon fas icon='trash' className='me-2' />
                    Delete verification
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {requestError &&
                    <MDBTypography note noteColor='danger'>
                        <small className='d-block' style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>The verification could not be deleted. </strong>
                            {requestError}
                        </small>
                    </MDBTypography>}

                <p className='mb-0'>
                    {fileName ?
                        <>This removes the verification and its model <strong>{fileName}</strong>.</> :
                        <>This removes the verification.</>}
                    {' '}It cannot be undone.
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
