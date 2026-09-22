import React, { useState } from 'react';

// React-Boostrap imports
import {Stack } from 'react-bootstrap';

import {
    MDBContainer,
    MDBCol,
    MDBRow,
} from 'mdb-react-ui-kit';

import { MDBSpinner, MDBBtn, MDBIcon, MDBTable, MDBTableHead, MDBTableBody } from 'mdb-react-ui-kit';


// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCog, faPlus } from '@fortawesome/free-solid-svg-icons';

import { useVerificationsQuery, useGetIdsReportQuery, useDeleteVerificationMutation } from '../context/SliceAPI'
import { describeRequestError } from '../context/requestError';
import { NewVerificationModal } from '../components/NewVerificationModal';
import { AddFileModal } from '../components/AddFileModal';
import { IdsStatusBadge } from '../components/IdsStatusBadge';
import { IdsSpecificationList } from '../components/IdsSpecificationList';
import { IdsReportModal } from '../components/IdsReportModal';
import { DeleteVerificationModal } from '../components/DeleteVerificationModal';

library.add(faCog, faPlus);

const TABLE_COLUMNS = 4;

// Extract the filename using URL API
const getFileName = (url) => {
const urlObj = new URL(url);
const pathParts = urlObj.pathname.split('/');
return pathParts[pathParts.length - 1];
};


const CheckPanel = () => {

    const [showNewVerficationModal, setShowNewVerificationModal] = useState(false);
    const [addIfcModal, setAddIfcModal] = useState(false);
    const [activeVerificationID, setActiveVerificationID] = useState(null);

    // One open breakdown at a time, matching the accordion idiom used in
    // Reports.js and keeping the table from growing without bound.
    const [expandedId, setExpandedId] = useState(null);
    const [reportId, setReportId] = useState(null);
    // The verification awaiting confirmation, kept whole so the modal can name
    // the model it is about to remove.
    const [deleteTarget, setDeleteTarget] = useState(null);

    const hideIfcModal = () => setAddIfcModal(false);

    const toggleNewVerificationModal = () => setShowNewVerificationModal(!showNewVerficationModal);

    const {
        data: Verifications,
        isLoading,
        isFetching,
    } = useVerificationsQuery();

    // Skipped until a row is chosen, so opening the panel costs nothing extra.
    const {
        data: idsReport,
        isFetching: isLoadingReport,
        isError: reportFailed,
        error: reportErrorDetail,
    } = useGetIdsReportQuery(reportId, { skip: !reportId });

    const [deleteVerification, {
        isLoading: isDeleting,
        error: deleteErrorDetail,
        reset: resetDelete,
    }] = useDeleteVerificationMutation();

    const closeDelete = () => {
        setDeleteTarget(null);
        // Otherwise a failure stays on screen the next time the modal opens.
        resetDelete();
    };

    const confirmDelete = async () => {

        try {

            await deleteVerification(deleteTarget.id).unwrap();

            // The row is gone, so anything still pointed at it has to let go.
            if (expandedId === deleteTarget.id) setExpandedId(null);
            if (reportId === deleteTarget.id) setReportId(null);

            closeDelete();

        } catch {

            // Left open on purpose: the modal shows what went wrong and the
            // verification is still there to try again.
        }
    };

    const verifications = Verifications || [];

    return (
        <>
            <NewVerificationModal
                toggleShow={toggleNewVerificationModal}
                basicModal={showNewVerficationModal}
                setBasicModal={setShowNewVerificationModal} />
            <AddFileModal
                ShowState={addIfcModal}
                HideFunction={hideIfcModal}
                verificationId={activeVerificationID} />
            <IdsReportModal
                ShowState={Boolean(reportId)}
                HideFunction={() => setReportId(null)}
                status={idsReport?.ids_status}
                summary={idsReport?.ids_summary}
                detail={idsReport?.ids_detail}
                isLoading={isLoadingReport}
                requestError={reportFailed ? describeRequestError(reportErrorDetail) : null} />
            <DeleteVerificationModal
                ShowState={Boolean(deleteTarget)}
                HideFunction={closeDelete}
                onConfirm={confirmDelete}
                fileName={deleteTarget?.ifc_file ? getFileName(deleteTarget.ifc_file) : null}
                isDeleting={isDeleting}
                requestError={deleteErrorDetail ? describeRequestError(deleteErrorDetail) : null} />

            <MDBContainer fluid className='h-100 max-h-100 overflow-hidden px-5 px-xl-3'>
                <MDBRow className='h-100'>
                    {/* Regulation left panel start */}
                    <MDBCol>
                        {/* Regulation choose start */}
                        <MDBRow className=''>
                            <MDBCol className='p-2'>
                                <MDBBtn
                                    size='sm'
                                    className='m-2'
                                    color='dark'
                                    onClick={toggleNewVerificationModal}
                                    outline>
                                    <Stack gap={2} direction="horizontal">
                                        <span>New verification</span>
                                        <FontAwesomeIcon icon="fa-plus" />
                                    </Stack>
                                </MDBBtn>
                            </MDBCol>
                        </MDBRow>
                    </MDBCol>
                    {/* Regulation left panel end */}
                    <MDBCol xs={12} xl={10} xxl={10} className="d-flex justify-content-center ">
                        <div className='d-flex align-items-start flex-fill mt-4' style={{ overflow: 'auto', maxHeight: '80vh' }}>
                            <MDBTable align='middle' className='verifications-table'>
                                <MDBTableHead className='bg-light p-2 border-top border-bottom'>
                                    <tr>
                                        <th scope='col'>Creation date</th>
                                        <th scope='col'>IFC file</th>
                                        <th scope='col'>Information requirements</th>
                                        <th scope='col'></th>
                                    </tr>
                                </MDBTableHead>
                                <MDBTableBody>
                                    {isLoading ?
                                        <tr>
                                            <td colSpan={TABLE_COLUMNS}>
                                                <MDBSpinner text="Loading..." />
                                            </td>
                                        </tr>
                                        : verifications.map(verification => {

                                            const isExpanded = expandedId === verification.id;

                                            const specifications =
                                                verification.ids_summary?.specifications || [];

                                            // Right after an upload the list is refetching and the
                                            // row still carries its pre-check value; saying "not
                                            // checked yet" there would be wrong for the second it
                                            // lasts.
                                            const isChecking = isFetching
                                                && verification.ifc_file
                                                && verification.ids_status === 'not_checked';

                                            return (
                                                <React.Fragment key={verification.id}>
                                                    <tr>
                                                        <td>{verification.time_created || verification.time_executed}</td>
                                                        {verification.ifc_file ?
                                                            <td>{getFileName(verification.ifc_file)}</td> :
                                                            <td>
                                                                <MDBBtn
                                                                    color='dark'
                                                                    onClick={() => {
                                                                        setAddIfcModal(true);
                                                                        setActiveVerificationID(verification.id);
                                                                    }}>Add file
                                                                </MDBBtn>
                                                            </td>}

                                                        <td>
                                                            {!verification.ifc_file ?
                                                                <span className='text-secondary'>—</span> :
                                                                isChecking ?
                                                                    <Stack direction='horizontal' gap={2}>
                                                                        <MDBSpinner grow size='sm' />
                                                                        <small className='text-secondary'>Checking…</small>
                                                                    </Stack> :
                                                                    <Stack direction='horizontal' gap={2}>
                                                                        <button
                                                                            type='button'
                                                                            className='ids-expander'
                                                                            aria-expanded={isExpanded}
                                                                            aria-controls={`ids-detail-${verification.id}`}
                                                                            aria-label={isExpanded ?
                                                                                'Hide the specification breakdown' :
                                                                                'Show the specification breakdown'}
                                                                            disabled={!specifications.length}
                                                                            onClick={() => setExpandedId(isExpanded ? null : verification.id)}>
                                                                            <MDBIcon fas icon={isExpanded ? 'angle-down' : 'angle-right'} />
                                                                        </button>
                                                                        <IdsStatusBadge status={verification.ids_status} />
                                                                        {specifications.length > 0 &&
                                                                            <small className='text-secondary'>
                                                                                {verification.ids_summary.total_passed}/{verification.ids_summary.total_specifications} specifications passed
                                                                            </small>}
                                                                    </Stack>}
                                                        </td>

                                                        <td>
                                                            <Stack direction='horizontal' gap={2}>
                                                                <MDBBtn
                                                                    outline
                                                                    color='dark'
                                                                    size='sm'
                                                                    disabled={!verification.ifc_file}
                                                                    title='Verification details'
                                                                    aria-label='Verification details'
                                                                    onClick={() => setReportId(verification.id)}>
                                                                    <MDBIcon fas icon='info-circle' />
                                                                </MDBBtn>
                                                                <MDBBtn
                                                                    outline
                                                                    color='danger'
                                                                    size='sm'
                                                                    title='Delete verification'
                                                                    aria-label='Delete verification'
                                                                    onClick={() => setDeleteTarget(verification)}>
                                                                    <MDBIcon fas icon='trash' />
                                                                </MDBBtn>
                                                            </Stack>
                                                        </td>
                                                    </tr>

                                                    {isExpanded &&
                                                        <tr
                                                            className='ids-detail-row'
                                                            id={`ids-detail-${verification.id}`}>
                                                            <td colSpan={TABLE_COLUMNS}>
                                                                <IdsSpecificationList
                                                                    specifications={specifications} />
                                                            </td>
                                                        </tr>}
                                                </React.Fragment>
                                            );
                                        })
                                    }
                                </MDBTableBody>
                            </MDBTable>
                        </div>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </>
    );
};

export default CheckPanel;
