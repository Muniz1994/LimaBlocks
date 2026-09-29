import React, { useState, useEffect} from 'react';

// Import general tools
import axios from 'axios';
import MyBlocklyEditor from '../components/CodeEditor/BlockEditor';

// React-Boostrap imports
import Stack from 'react-bootstrap/Stack';

import { MDBIcon, MDBContainer, MDBCol, MDBRow, MDBBadge, MDBBtn, MDBDropdown, MDBDropdownItem, MDBDropdownMenu, MDBDropdownToggle, MDBListGroup, MDBListGroupItem } from 'mdb-react-ui-kit';

// Import icons

import { NewRegulationModal } from '../components/NewRegulationModal';
import { NewClauseModal } from '../components/NewClauseModal';
import { InfoRegulationModal } from '../components/InfoRegulationModal';
import { ClauseListModal } from '../components/ClauseListModal';
import { DeleteRegulationModal } from '../components/DeleteRegulationModal';

import { useSelector, useDispatch } from 'react-redux'

import { setRegulationList } from '../context/regulationSlice';
import { setActiveRegulation } from '../context/activeRegulationSlice';
import { setActiveClause } from '../context/activeClauseSlice';
import { describeRequestError } from '../context/requestError';

const NO_REGULATION = { id: '', name: '' };
const NO_CLAUSE = { id: '', name: '', text: '', code: '', has_code: false };

// describeRequestError reads RTK Query errors; this view still talks to the
// backend through axios, so its failures are reshaped to match.
const toRequestError = (err) => err.response ?
    { status: err.response.status, data: err.response.data } :
    { status: 'FETCH_ERROR', error: err.message };


// Choose the existing regulations in a dropdown
function RegulationDropdownItem({ regulation, onRegulationClick }) {
    return (
        <MDBDropdownItem
            link childTag='button'
            onClick={onRegulationClick}>{regulation}
        </MDBDropdownItem>
    );
}

const Regulations = () => {

    const regulations_list = useSelector((state) => state.regulations_list.value);
    const activeRegulation = useSelector((state) => state.activeRegulation.value);
    const activeClause = useSelector((state) => state.activeClause.value);
    const dispatch = useDispatch();


    // Modals States
    const [infoRegulationModalShow, setInfoRegulationModalShow] = useState(false);
    const [newRegulationModalShow, setNewRegulationModalShow] = useState(false);
    const [newClauseModalShow, setNewClauseModalShow] = useState(false);
    const [clauseListModalShow, setClauseListModalShow] = useState(false);
    const [showCode, setShowCode] = useState(false);

    // What is awaiting confirmation: { kind: 'regulation' | 'clause', id, name, ruleCount }
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Controls the state of the block editor
    const [blockXml, setBlockXml] = useState('<xml xmlns="http://www.w3.org/1999/xhtml"><block type="text" x="70" y="30"><field name="TEXT"></field></block></xml>');
    const [blockPython, setBlockPython] = useState('');
    const [editorKey, setEditorKey] = useState(Math.random()); // used to execute a hard update on the editor 
    const [isClauseCodeUpdated, setIsClauseCodeUpdated] = useState(false);

    // set state changes in the DB
    const [updatedRegulations, setUpdatedRegulations] = useState({});
    const [UpdatedClause, setUpdatedClause] = useState({});


    // Verify if the active clause has the same code as the editor
    useEffect(() => {

        if (activeClause.blocks === blockXml) {
            setIsClauseCodeUpdated(true);
        }
        else {
            setIsClauseCodeUpdated(false);

        }
    }, [UpdatedClause, blockXml, activeClause.blocks]);


    // The main loading process of the page
    useEffect(() => {

            // Get regulations
            // TODO: change to RTK
            axios.get(process.env.REACT_APP_API_ROOT + 'regulations/')
                .then(response => {
                    dispatch(setRegulationList((response.data)));
                })
                .catch(
                    console.log
                );
    }, [updatedRegulations, UpdatedClause, dispatch]);


    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // Save clause 
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    function SaveClauseCode(blockXml, blockPython) {

        const xml = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'

        var newCode = {
            blocks: '',
            code: ''
        };

        console.log(newCode);

        if (blockXml !== xml) {
            newCode = {
                blocks: blockXml,
                code: blockPython
            }
        }

        // TODO: change to RTK
        axios.patch(process.env.REACT_APP_API_ROOT + 'rules/' + activeClause.id + '/', newCode)
            .then(response => {
                console.log(response);
                setUpdatedClause(response.data);
                dispatch(setActiveClause(response.data));
            })
            .catch(err => console.log(err));

    };


    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // Delete regulation or clause
    //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const activeRegulationRules = regulations_list.find(reg => reg.id === activeRegulation.id)?.rules || [];

    const closeDelete = () => {
        setDeleteTarget(null);
        // Otherwise a failure stays on screen the next time the modal opens.
        setDeleteError(null);
    };

    function confirmDelete() {

        const isRegulation = deleteTarget.kind === 'regulation';
        const endpoint = isRegulation ? 'regulations/' : 'rules/';

        setIsDeleting(true);
        setDeleteError(null);

        // TODO: change to RTK
        axios.delete(process.env.REACT_APP_API_ROOT + endpoint + deleteTarget.id + '/')
            .then(() => {

                // Anything still pointed at what was removed has to let go, or
                // the editor would keep offering to save into a missing rule.
                const clauseGone = isRegulation ?
                    activeRegulationRules.some(rule => rule.id === activeClause.id) :
                    activeClause.id === deleteTarget.id;

                if (clauseGone) {
                    dispatch(setActiveClause(NO_CLAUSE));
                    setEditorKey(Math.random());
                }

                if (isRegulation) {
                    dispatch(setActiveRegulation(NO_REGULATION));
                    setUpdatedRegulations({ deleted: deleteTarget.id });
                } else {
                    setUpdatedClause({ deleted: deleteTarget.id });
                }

                closeDelete();
            })
            // Left open on purpose: the modal shows what went wrong and the
            // item is still there to try again.
            .catch(err => setDeleteError(describeRequestError(toRequestError(err))))
            .finally(() => setIsDeleting(false));
    };


    return (
        <>
                <>
                    {/* Initiate the modals */}
                    <ClauseListModal
                        ShowState={clauseListModalShow}
                        HideFunction={() => setClauseListModalShow(false)}
                        setClauseListModalShow={setClauseListModalShow}
                        activeRegulation={activeRegulation}
                        regulations_list={regulations_list}
                        setActiveClause={dispatch(setActiveClause)}
                        setEditorKey={setEditorKey}
                        setNewClauseModalShow={setNewClauseModalShow}
                    />
                    <InfoRegulationModal
                        regulation={activeRegulation.name}
                        regulations_list={regulations_list}
                        ShowState={infoRegulationModalShow}
                        setShowState={setInfoRegulationModalShow}
                        toggleOpen={() => setInfoRegulationModalShow(!infoRegulationModalShow)} />
                    <NewRegulationModal
                        setUpdatedRegulations={setUpdatedRegulations}
                        ShowState={newRegulationModalShow}
                        HideFunction={() => setNewRegulationModalShow(false)} />
                    <NewClauseModal
                        RegulationId={activeRegulation.id}
                        setUpdatedClause={setUpdatedClause}
                        ShowState={newClauseModalShow}
                        HideFunction={() => setNewClauseModalShow(false)} />
                    <DeleteRegulationModal
                        ShowState={Boolean(deleteTarget)}
                        HideFunction={closeDelete}
                        onConfirm={confirmDelete}
                        kind={deleteTarget?.kind}
                        name={deleteTarget?.name}
                        ruleCount={deleteTarget?.ruleCount}
                        isDeleting={isDeleting}
                        requestError={deleteError} />


                    {/* Page */}
                    <MDBContainer fluid className='h-100 max-h-100 overflow-hidden px-5 px-xl-3'>
                        <MDBRow className='h-100'>
                            {/* Regulation left panel start */}
                            <MDBCol>
                                {/* Regulation choose start */}
                                <MDBRow>
                                    <MDBCol className='p-2'>

                                        <h6 className='bg-light p-2 border-top border-bottom'>Select regulation:</h6>
                                        <Stack
                                            direction='horizontal'
                                            className='d-flex'>
                                            <MDBDropdown group>
                                                <MDBBtn outline color='dark'>Regulations</MDBBtn>
                                                <MDBDropdownToggle split color='dark'>
                                                </MDBDropdownToggle>
                                                <MDBDropdownMenu>
                                                    {regulations_list.map(regs =>
                                                        <RegulationDropdownItem
                                                            id={regs.name}
                                                            regulation={regs.name}
                                                            onRegulationClick={() => {
                                                                dispatch(setActiveRegulation({ id: regs.id, name: regs.name }))
                                                            }} />)}
                                                </MDBDropdownMenu>
                                            </MDBDropdown>
                                            <MDBBtn
                                                outline
                                                onClick={() => setNewRegulationModalShow(true)}
                                                size='sm'
                                                className='m-2'
                                                color='dark'>
                                                <Stack gap={2} direction="horizontal">
                                                    <span>New regulation</span>
                                                    <MDBIcon fas icon="plus" />
                                                </Stack>
                                            </MDBBtn>
                                            <MDBBtn
                                                onClick={() => setClauseListModalShow(true)}
                                                size='sm'
                                                className='ms-auto d-inline d-xl-none'
                                                color='light'>
                                                <Stack gap={2} direction="horizontal">
                                                    <span>clauses list</span>
                                                    <MDBIcon fas icon="list" />
                                                </Stack>
                                            </MDBBtn>
                                        </Stack>
                                    </MDBCol>
                                </MDBRow>
                                {/* Regulation choose end */}

                                {/* Clause list start */}
                                <MDBRow className=' p-0'>
                                    <MDBCol>
                                        <MDBRow>
                                            <Stack
                                            className='d-flex bg-light p-2 border-top border-bottom'
                                            direction='horizontal' gap={2}>
                                                { /* Show the active regulation name */}
                                            {activeRegulation.name !== '' &&
                                                <>
                                                    <h6 >{activeRegulation.name}</h6>
                                                        
                                                        <MDBBtn
                                                        className='mx-2'
                                                        color='light'
                                                        size='sm'
                                                        onClick={() => setInfoRegulationModalShow(true)}>
                                                        <MDBIcon fas icon="info-circle" />
                                                    </MDBBtn><MDBBtn
                                                        outline
                                                        className='ms-auto'
                                                        color='dark'
                                                        size='sm'
                                                        title='Delete regulation'
                                                        aria-label='Delete regulation'
                                                        onClick={() => setDeleteTarget({
                                                            kind: 'regulation',
                                                            id: activeRegulation.id,
                                                            name: activeRegulation.name,
                                                            ruleCount: activeRegulationRules.length,
                                                        })}>
                                                        <MDBIcon fas icon="trash" />
                                                    </MDBBtn>

                                                </>
                                            }

                                            </Stack>
                                        </MDBRow>
                                        <MDBRow id="clause-list">
                                            <MDBCol className='border-top border-bottom p-0' >
                                                {activeRegulation.name !== '' &&
                                                        <MDBListGroupItem
                                                            action noBorders type='button' className='p-3'
                                                            onClick={() => setNewClauseModalShow(true)}>

                                                            <div className="ms-2 me-auto">
                                                                <Stack direction='horizontal' gap={2}>
                                                                    <div className="fw-bold">New rule</div> <MDBIcon fas icon="plus" />
                                                                </Stack>
                                                            </div>
                                                        </MDBListGroupItem>}
                                                
                                                <MDBListGroup 
                                                    id='clause-list-group'
                                                    style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                                                    
                                                    {regulations_list.map(reg =>
                                                        <>
                                                            {reg.name === activeRegulation.name && reg.rules.map(rule =>

                                                                <MDBListGroupItem
                                                                    tag='button'
                                                                    action noBorders type='button' className={`px-3 shadow-1 ${activeClause.id === rule.id ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        dispatch(setActiveClause({ id: rule.id, name: rule.name, text: rule.text, external_reference: rule.external_reference, blocks: rule.blocks }))

                                                                        setEditorKey(Math.random())
                                                                    }}>
                                                                    <div className="ms-2 me-auto">
                                                                        <Stack direction='horizontal' gap={2}>
                                                                            <MDBIcon fas icon="puzzle-piece" />
                                                                            <div className="fw-bold">{rule.name}</div>
                                                                        </Stack>

                                                                    </div>
                                                                    {rule.has_code === false ?
                                                                        <MDBBadge color="warning" light>
                                                                            No code
                                                                        </MDBBadge>
                                                                        :
                                                                        <MDBBadge color="success" light>
                                                                            Has code
                                                                        </MDBBadge>}
                                                                </MDBListGroupItem>
                                                                
                                                            )
                                                                
                                                                }

                                                        </>
                                                    )}
                                                    
                                                </MDBListGroup>
                                            </MDBCol>
                                        </MDBRow>
                                    </MDBCol>
                                </MDBRow>
                                {/* Clause list end */}
                            </MDBCol>
                            {/* Regulation left panel end */}

                            {/* Code column start */}
                            <MDBCol xs={12} xl={8} xxl={9} className="h-100 border max-h-100">
                                <MDBRow className=' d-flex align-start p-2'>
                                    <MDBCol className='d-flex flex-column'>
                                        {/* Rule text start */}
                                        <MDBRow id="rule-text">
                                            <MDBCol>
                                                {activeClause.name === '' ?
                                                
                                                    <h5 className='text-secondary'>Select a clause to edit</h5>
                                                    :    
                                                    <>
                                                    <h5>{activeClause.name}</h5>
                                                    <h6 className='text-secondary'>External reference: {activeClause.external_reference}</h6>
                                                    <p className=''>{(activeClause.text)}</p>
                                                    </>               
                                                    }
                                                
                                            </MDBCol>
                                        </MDBRow>
                                        {/* Rule text end */}

                                        {/* Code editor toolbar start */}
                                        <MDBRow>
                                            <MDBCol>
                                                <Stack
                                                    className='d-flex'
                                                    direction='horizontal' gap={2}>
                                                    <MDBBtn
                                                        outline
                                                        color='dark'
                                                        size='sm'
                                                        onClick={() => SaveClauseCode(blockXml, blockPython, activeClause.id)}
                                                    >
                                                        <span className='p-2'>Save rule</span>
                                                        <MDBIcon far icon="save" />
                                                    </MDBBtn>
                                                   

                                                    {activeClause.id !== '' &&
                                                        <MDBBtn
                                                            outline
                                                            color='dark'
                                                            size='sm'
                                                            onClick={() => setDeleteTarget({
                                                                kind: 'clause',
                                                                id: activeClause.id,
                                                                name: activeClause.name,
                                                            })}
                                                        >
                                                            {/* <span className='p-2'>Delete rule</span> */}
                                                            <MDBIcon fas icon="trash" />
                                                        </MDBBtn>}

                                                         {activeClause.blocks !== '' ? isClauseCodeUpdated ? <Stack className="text-success" direction='horizontal' gap={1}>
                                                        <span className='small'>Updated</span>
                                                        <MDBIcon fas icon="check" />
                                                    </Stack> :
                                                        <Stack className="text-warning" direction='horizontal' gap={1}>
                                                            <span className='small'>Not updated</span>
                                                            <MDBIcon fas icon="exclamation-triangle" />
                                                        </Stack> : null}

                                                    <MDBBtn
                                                        className='ms-auto'
                                                        color='dark'
                                                        size='sm'
                                                        onClick={() => {
                                                            setShowCode(prevShowCode => !prevShowCode);
                                                            setEditorKey(Math.random())
                                                        }}
                                                    >
                                                        <span className='p-2'>Toggle code</span>
                                                        <MDBIcon fas icon="code" />
                                                    </MDBBtn>
                                                </Stack>
                                            </MDBCol>
                                        </MDBRow>
                                        {/* Code editor toolbar end */}

                                    </MDBCol>
                                </MDBRow>

                                {/* Code editor start */}
                                <MDBRow className='h-100 max-h-100'>
                                
                                    
                                        <MyBlocklyEditor
                                        showCode={showCode}
                                        key={editorKey}
                                        initialXml={activeClause.blocks}
                                        setBlockXml={setBlockXml}
                                        setBlockPython={setBlockPython}
                                        className="" />
                                    
                                
                                </MDBRow>
                                {/* Code editor end */}

                            </MDBCol>
                            {/* Code column end */}
                        </MDBRow>
                    </MDBContainer>

                </>
        </>
    );
};

export default Regulations;