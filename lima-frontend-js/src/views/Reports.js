import React, { useState, useEffect} from 'react';

import axios from 'axios';


// React-Boostrap imports
import Col from 'react-bootstrap/esm/Col';
import Row from 'react-bootstrap/esm/Row';
import Button from 'react-bootstrap/esm/Button';

import Stack from 'react-bootstrap/Stack';

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faInfo, faCircleInfo, faPlus, faSave, faList, faCode, faSection, faCheck, faCircleExclamation, faPlay, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';



import { ViewerXeokit } from '../components/ModelViewer/ViewerXeokit';
import { Container } from 'react-bootstrap';
import { MDBListGroup, MDBTableHead, MDBTableBody, MDBTable, MDBListGroupItem, MDBDropdown, MDBDropdownMenu, MDBDropdownToggle, MDBBadge, MDBTypography,MDBDropdownItem, MDBBtn, MDBSpinner, MDBAccordion, MDBAccordionItem, MDBIcon } from 'mdb-react-ui-kit';

import { useSelector, useDispatch } from 'react-redux';

import { useExecuteVerificationQuery, useVerificationsQuery } from '../context/SliceAPI';
import { BackendConsoleModal } from '../components/BackendConsoleModal';

library.add(faCircleInfo, faPlus, faInfo, faSave, faList, faCode, faSection, faCheck, faCircleExclamation, faPlay, faCircleCheck, faCircleXmark);

// Extract the filename using URL API
const getFileName = (url) => {
const urlObj = new URL(url);
const pathParts = urlObj.pathname.split('/');
return pathParts[pathParts.length - 1];
};


// RTK Query reports a failed call either as an HTTP status with the response
// body attached or as a client side problem; neither reads well on its own.
const describeRequestError = (error) => {

    if (!error) return 'The request to the backend failed.';

    if (error.status === 'FETCH_ERROR') return `The backend could not be reached: ${error.error}`;

    const body = typeof error.data === 'string' ? error.data : JSON.stringify(error.data);

    // A Django debug page comes back as a whole HTML document; the opening of it
    // is enough to recognise what happened.
    const detail = body && body.length > 2000 ? `${body.slice(0, 2000)}\n[...]` : body;

    return `The backend answered ${error.status}.${detail ? `\n\n${detail}` : ''}`;
};


// Choose the existing verifications in a dropdown
function VerificationDropdownItem({ verification, onVerificationClick }) {
    return (
        <MDBDropdownItem
            link
            onClick={onVerificationClick}>{verification}
        </MDBDropdownItem>
    );
}


const Reports = () => {

    const { data: verifications_list, isLoading } = useVerificationsQuery()

    const viewer = useSelector((state) => state.viewer.value);
    const dispatch = useDispatch();

    const [activeVerificationId, setActiveVerificationId] = useState(null)
    const [executeVerificationId, setExecuteVerificationId] = useState(null)

    const [activeVerification, setActiveVerification] = useState(null)

    const [showConsole, setShowConsole] = useState(false)

    // Whether the console has been opened since the last run, so that a failure
    // can stop calling for attention once it has actually been looked at.
    const [consoleSeen, setConsoleSeen] = useState(false)

    const {
        data: execution,
        isLoading: isChecking,
        isError: requestFailed,
        error: requestErrorDetail,
    } = useExecuteVerificationQuery(executeVerificationId, { skip: !executeVerificationId })

    // The endpoint used to answer with the bare report array and now wraps it
    // alongside the console output, so both shapes are accepted.
    const report = Array.isArray(execution) ? execution : execution?.report

    // Two different ways a run goes wrong: the engine reported a failure, or the
    // call never got an answer. Both are worth sending the user to the console.
    const executionFailed = requestFailed || execution?.status === 'error'

    const requestError = requestFailed ? describeRequestError(requestErrorDetail) : null

    // A new run is a new verdict, so it gets the user's attention afresh.
    useEffect(() => setConsoleSeen(false), [execution, requestErrorDetail])

    const consoleHint = executionFailed ?
        'The compliance check did not finish - open the backend console' :
        'Backend console for this run'

    const VerificationButton = ({ verificationId }) => {
        return (
            <>{!isChecking ? <MDBBtn color='dark' className="my-2" onClick={() => setExecuteVerificationId(verificationId)} outline><Stack direction='horizontal'><>Execute</><MDBIcon className='px-2' fas size='lg' icon="play" /></Stack></MDBBtn> :
                <><MDBBtn color='dark' className="" onClick={() => setExecuteVerificationId(verificationId)} outline><Stack direction='horizontal'><>Execute</><MDBIcon className='px-2' fas size='lg' icon="play" /></Stack></MDBBtn><MDBSpinner grow></MDBSpinner></>}</>

        )
    }

    return (
        <>

        <BackendConsoleModal
            ShowState={showConsole}
            HideFunction={() => setShowConsole(false)}
            output={execution?.console}
            status={execution?.status}
            requestError={requestError}
            isRunning={isChecking} />

        {/* Page */}
        <Container fluid className='h-100 max-h-100 overflow-hidden'>
            <Row className='h-100'>
                {/* Regulation left panel start */}
                <Col className='verification-panel'>
                    <Row>
                        <Col className='p-0'>
                            <h6 className='bg-light p-2 border-top border-bottom'>Select the compliance check to be executed:</h6>
                            <Stack
                                direction='horizontal'
                                className='d-flex my-2'>
                                <MDBDropdown group className='p-2 shadow-0'>
                                    <MDBBtn outline color='dark'>Compliance check</MDBBtn>
                                    <MDBDropdownToggle split color='dark'>
                                    </MDBDropdownToggle>
                                    <MDBDropdownMenu>

                                        {isLoading ? <></> : verifications_list.map(ver =>
                                            <VerificationDropdownItem
                                                key={ver.id}
                                                verification={ver.id}
                                                onVerificationClick={() => {
                                                    if (viewer && ver.xkt_file) {
                                                        dispatch({ type: 'CLEAN_MODEL', object: viewer })
                                                        dispatch({ type: 'LOAD_MODEL', object: viewer, value: ver.xkt_file })
                                                        setActiveVerificationId(ver.id)
                                                    }
                                                }} />)}
                                    </MDBDropdownMenu>
                                </MDBDropdown>
                            </Stack>

                            <h6 className='bg-light p-2 border-top border-bottom'>General information:</h6>
                            {isLoading ?
                                <p>loading...</p> :
                                <>
                                    {verifications_list.map(ver =>
                                        ver.id === activeVerificationId ?
                                            <div className="px-2"key={ver.id}>
                                                <p><b>Compliance check ID: </b> {ver.id}</p>
                                                <p><b>Creation date: </b> {ver.time_executed}</p>
                                                <p><b>IFC file: </b> {getFileName(ver.ifc_file)}</p>
                                                <VerificationButton verificationId={ver.id} />
                                            </div>
                                            :
                                            <div key={ver.id}></div>

                                    )}
                                </>
                            }

                        </Col>
                    </Row>
                    {/* Regulation choose end */}

                   { /* Clause list start */}
                    <Row>
                        <Col style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <Row>
                                <h6 className='bg-light p-2 border-top border-bottom m-0 d-flex align-items-center justify-content-between'>
                                    <span>Report:</span>
                                    <button
                                        type='button'
                                        className={[
                                            'backend-console-toggle',
                                            executionFailed ? 'backend-console-toggle--alert' : '',
                                            executionFailed && !consoleSeen ? 'backend-console-toggle--pulsing' : '',
                                        ].filter(Boolean).join(' ')}
                                        title={consoleHint}
                                        aria-label={consoleHint}
                                        onClick={() => {
                                            setShowConsole(true)
                                            setConsoleSeen(true)
                                        }}>
                                        {executionFailed ?
                                            <>
                                                <MDBIcon fas size='sm' icon='circle-exclamation' className='me-1' />
                                                Check console
                                            </> :
                                            <MDBIcon fas size='sm' icon='terminal' />}
                                    </button>
                                </h6>
                                <Col id="report_list" className='px-0'>
                                    <MDBAccordion flush className='px-0'>
                                        {isChecking ? (
                                            <></>
                                        ) : report ? (
                                            report.map((ver) => (
                                                <><MDBAccordionItem
                                                    key={ver.id}
                                                    collapseId={ver.id}
                                                    headerTitle={ <><MDBIcon fas size='sm' icon="list" /> &nbsp; {ver.name}</>}
                                                    className='px-0'
                                                >
                                                    <MDBListGroup className='px-0'>
                                                        {ver.checks.map((check) => (
                                                            <MDBListGroupItem
                                                                key={check.object_id}
                                                                tag='button'
                                                                type='button'
                                                                noBorders
                                                                action
                                                                onClick={() => {
                                                                    setActiveVerification(check)
                                                                    dispatch({
                                                                        type: 'HIGHLIGHT_ELEMENTS',
                                                                        object: viewer,
                                                                        value: [check.object_id, check.result],
                                                                    })
                                                                }}    
                                                            >
                                                                <MDBIcon fas size='sm' color={check.result==true?"success":check.type=="alert"? "warning":"danger"} icon="square" /> Verification nº {check.id}
                                                            </MDBListGroupItem>
                                                        ))}
                                                    </MDBListGroup>
                                                </MDBAccordionItem></>
                                            ))
                                        ) : (
                                            <></>
                                        )}
                                    </MDBAccordion>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                                      
                   { /* Clause list end */}
                </Col>
                {/* Regulation left panel end */}
                <Col xl={8} xxl={9} className="h-100 max-h-100 p-0">
                    <Row className='h-70 p-0'>
                        <ViewerXeokit />
                    </Row>
                    <Row className='h-30 mx-0 shadow-inner square border border-3 align-items-top px-2'>
    {activeVerification ? 
    <>
    <MDBTable striped small className='table table-sm table-borderless mb-0'>
            <MDBTableBody>
                <tr>
                    <th ><b>Type:</b><small> {activeVerification.type}</small></th>  
                </tr>
                <tr>
                    <th ><b>ID:</b><small> {activeVerification.object_id}</small></th>
                </tr>
                <tr>
                    <th ><b>Result:</b><small>{activeVerification.result ? "passed!" : "not passed!"}</small></th>
                    
                </tr>
                <tr>
                    <th ><b>Calculated value:</b><small>{activeVerification.value}</small></th>
                    
                </tr>
                <tr>
                    <th>{activeVerification.type === "alert" && (
                    <MDBTypography note noteColor='warning' color='secondary' className='mb-0 p-1'>
                                <small><strong>Message:</strong> {activeVerification.message}</small>
                            </MDBTypography>
                )}</th>
                    

                </tr>

            </MDBTableBody>
                
        </MDBTable>
        

    </>
        
        : 
        <p className='text-secondary mb-0'>
            <small>{report ? "No verification selected" : "No verification executed yet"}</small>
        </p>
    }
</Row>
                </Col>
            </Row>
        </Container>

        </>
    );
};

export default Reports;