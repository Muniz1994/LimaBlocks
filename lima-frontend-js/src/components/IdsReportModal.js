import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {
    MDBAccordion, MDBAccordionItem, MDBBadge, MDBIcon, MDBListGroup,
    MDBListGroupItem, MDBSpinner, MDBTypography,
} from 'mdb-react-ui-kit';

import { IdsStatusBadge } from './IdsStatusBadge';

// The full result of checking an uploaded model against the information
// requirements: what each specification asked for, and which elements did not
// carry it. The table row behind this only has room for the verdict.
//
// Like BackendConsoleModal, this takes everything as props and runs no query of
// its own - which is what lets it render in a test without a store.

const statusColour = status => (status === true ? 'success' : 'danger');

function FailedEntities({ requirement }) {

    if (!requirement.failed_entities?.length) {
        return null;
    }

    return (
        <MDBListGroup className='mt-2'>
            {requirement.failed_entities.map(entity =>
                <MDBListGroupItem key={entity.id} noBorders className='px-0 py-1'>
                    <small>
                        <span className='fw-bold'>{entity.class}</span>
                        {entity.name && <> — {entity.name}</>}
                        {entity.global_id &&
                            <span className='text-secondary'> ({entity.global_id})</span>}
                        {entity.reason &&
                            <span className='d-block text-secondary'>{entity.reason}</span>}
                    </small>
                </MDBListGroupItem>)}

            {requirement.total_omitted > 0 &&
                <MDBListGroupItem noBorders className='px-0 py-1'>
                    <small className='text-secondary'>
                        … and {requirement.total_omitted} more
                    </small>
                </MDBListGroupItem>}
        </MDBListGroup>
    );
}

function Requirement({ requirement }) {

    return (
        <div className='mb-3'>
            <div>
                <MDBIcon
                    fas size='sm' icon='square'
                    color={statusColour(requirement.status)}
                    className='me-2' />
                <small>{requirement.description}</small>
            </div>
            <small className='text-secondary ms-4'>
                {requirement.total_pass} passed · {requirement.total_fail} failed
            </small>
            <FailedEntities requirement={requirement} />
        </div>
    );
}

function Specification({ specification }) {

    const isObligatory = specification.cardinality !== 'optional';

    return (
        <MDBAccordionItem
            collapseId={specification.name}
            headerTitle={
                <>
                    <MDBIcon
                        fas size='sm' icon='square'
                        color={statusColour(specification.status)}
                        className='me-2' />
                    {specification.name}
                    <MDBBadge
                        color={isObligatory ? 'dark' : 'light'}
                        className='ms-2'
                        pill>
                        {isObligatory ? 'Obligatory' : 'Optional'}
                    </MDBBadge>
                </>
            }>

            {specification.description &&
                <p className='mb-2'><small>{specification.description}</small></p>}

            {specification.instructions &&
                <p className='mb-2'><small className='text-secondary'>{specification.instructions}</small></p>}

            {/* An IFC2X3 export checked against IFC4 specifications comes out
                all red for a reason that is nowhere else on the screen. */}
            {specification.is_ifc_version === false &&
                <MDBTypography note noteColor='warning' className='my-2'>
                    <small>This specification targets a different IFC schema than the uploaded model.</small>
                </MDBTypography>}

            {specification.applicability?.length > 0 &&
                <p className='mb-2'>
                    <small className='text-secondary'>
                        Applies to: {specification.applicability.join('; ')}
                    </small>
                </p>}

            <p className='mb-3'>
                <small className='text-secondary'>
                    {specification.total_applicable} matching element(s),
                    {' '}{specification.total_failed} failing
                </small>
            </p>

            {specification.requirements?.length > 0 ?
                specification.requirements.map((requirement, index) =>
                    <Requirement key={index} requirement={requirement} />) :
                <small className='text-secondary'>
                    This specification only checks that matching elements exist.
                </small>}
        </MDBAccordionItem>
    );
}

export function IdsReportModal({
    ShowState, HideFunction, status, summary, detail, isLoading, requestError,
}) {

    const specifications = detail?.specifications || [];

    return (
        <Modal show={ShowState} onHide={HideFunction} size='lg' scrollable>
            <Modal.Header closeButton>
                <Modal.Title as='h6' className='mb-0'>
                    <MDBIcon fas icon='clipboard-check' className='me-2' />
                    {summary?.title || 'Information requirements'}
                    {summary?.version && <small className='text-secondary ms-2'>{summary.version}</small>}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {requestError ?
                    <MDBTypography note noteColor='danger'>
                        <small className='d-block' style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>The verification could not be loaded. </strong>
                            {requestError}
                        </small>
                    </MDBTypography> :

                    isLoading ?
                        <div className='d-flex align-items-center'>
                            <MDBSpinner grow size='sm' className='me-2' />
                            <small className='text-secondary'>Loading the verification…</small>
                        </div> :

                        <>
                            <div className='mb-3'>
                                <IdsStatusBadge status={status} />
                                {summary?.total_specifications > 0 &&
                                    <small className='text-secondary ms-2'>
                                        {summary.total_passed}/{summary.total_specifications} specifications
                                        passed · IFC schema {summary.ifc_schema}
                                    </small>}
                            </div>

                            {status === 'error' &&
                                <MDBTypography note noteColor='danger'>
                                    <small>
                                        <strong>The model could not be checked.</strong> It may not be a
                                        readable IFC file. The traceback is below.
                                    </small>
                                </MDBTypography>}

                            {specifications.length > 0 ?
                                <MDBAccordion flush>
                                    {specifications.map(specification =>
                                        <Specification
                                            key={specification.name}
                                            specification={specification} />)}
                                </MDBAccordion> :
                                status !== 'error' &&
                                <p className='text-secondary mb-0'>
                                    <small>
                                        Nothing to show yet. Add an IFC model to this verification and
                                        it is checked against the information requirements.
                                    </small>
                                </p>}

                            {/* Reuses the console styling from the compliance-check modal,
                                so a traceback looks the same wherever it surfaces. */}
                            {status === 'error' && detail?.console &&
                                <pre className='backend-console mt-3'>{detail.console}</pre>}
                        </>}
            </Modal.Body>

            <Modal.Footer>
                <Button variant='secondary' size='sm' onClick={HideFunction}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
