import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { MDBIcon, MDBSpinner, MDBTypography } from 'mdb-react-ui-kit';

// Shows what the backend printed while running a compliance check: the engine's
// own progress lines, anything the rule code printed, and the traceback when a
// rule fails. `requestError` covers the other way a run goes wrong - the call
// never reaching the backend - where there is no console output to show.
export function BackendConsoleModal({ ShowState, HideFunction, output, status, requestError, isRunning }) {

    const [copied, setCopied] = useState(false);

    const copyText = output || requestError || '';

    // A second run produces new output, so the "copied" confirmation should not
    // linger over it.
    useEffect(() => setCopied(false), [copyText, ShowState]);

    const copyOutput = () => {
        navigator.clipboard?.writeText(copyText)
            .then(() => setCopied(true))
            .catch(() => setCopied(false));
    };

    return (
        <Modal show={ShowState} onHide={HideFunction} size='lg' scrollable>
            <Modal.Header closeButton>
                <Modal.Title as='h6' className='mb-0'>
                    <MDBIcon fas icon='terminal' className='me-2' />
                    Backend console
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className='p-0'>
                {requestError ?
                    <MDBTypography note noteColor='danger' className='m-3'>
                        <small className='d-block' style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>The compliance check could not be run. </strong>
                            {requestError}
                        </small>
                    </MDBTypography> :
                    status === 'error' &&
                    <MDBTypography note noteColor='danger' className='m-3'>
                        <small>
                            <strong>The compliance check did not finish.</strong> The rule that
                            failed and its traceback are at the end of the output below.
                        </small>
                    </MDBTypography>}

                {isRunning ?
                    <div className='d-flex align-items-center p-3'>
                        <MDBSpinner grow size='sm' className='me-2' />
                        <small className='text-secondary'>Running the compliance check...</small>
                    </div> :
                    output ?
                        <pre className='backend-console'>{output}</pre> :
                        !requestError &&
                        <p className='text-secondary p-3 mb-0'>
                            <small>
                                Nothing yet. Execute a compliance check and its console output
                                shows up here.
                            </small>
                        </p>}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant='outline-secondary'
                    size='sm'
                    disabled={!copyText}
                    onClick={copyOutput}>
                    {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant='secondary' size='sm' onClick={HideFunction}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
