import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IdsReportModal } from './IdsReportModal';

const summary = {
    title: 'LiMABlocks specifications',
    version: 'v0.1.0',
    ifc_schema: 'IFC4',
    total_specifications: 8,
    total_passed: 6,
};

const detail = {
    console: '',
    specifications: [{
        name: 'Storey requirements',
        cardinality: 'required',
        status: false,
        total_applicable: 13,
        total_failed: 1,
        applicability: ['All IFCBUILDINGSTOREY data'],
        requirements: [{
            facet_type: 'Property',
            description: 'AboveGround data shall be provided in the dataset Pset_BuildingStoreyCommon',
            status: false,
            total_pass: 12,
            total_fail: 1,
            total_omitted: 0,
            failed_entities: [{
                id: 106,
                global_id: '1m2CrGd$H468ZVbLixODGw',
                class: 'IfcBuildingStorey',
                name: 'Cave 1',
                reason: 'The required property set does not exist',
            }],
        }],
    }],
};

test('shows each specification and the elements that failed it', () => {
    render(
        <IdsReportModal
            ShowState
            HideFunction={() => { }}
            status='failed'
            summary={summary}
            detail={detail}
            isLoading={false} />
    );
    expect(screen.getByText(/Storey requirements/)).toBeInTheDocument();
    expect(screen.getByText(/AboveGround data shall be provided/)).toBeInTheDocument();
    expect(screen.getByText(/The required property set does not exist/)).toBeInTheDocument();
    expect(screen.getByText(/1m2CrGd\$H468ZVbLixODGw/)).toBeInTheDocument();
    expect(screen.getByText(/6\/8 specifications/)).toBeInTheDocument();
});

test('flags a check that could not run and still shows the traceback', () => {
    render(
        <IdsReportModal
            ShowState
            HideFunction={() => { }}
            status='error'
            summary={{}}
            detail={{ specifications: [], console: 'Traceback (most recent call last):\nRuntimeError: boom' }}
            isLoading={false} />
    );
    expect(screen.getByText(/could not be checked/)).toBeInTheDocument();
    expect(screen.getByText(/RuntimeError: boom/)).toBeInTheDocument();
});

test('explains a call that never reached the backend', () => {
    render(
        <IdsReportModal
            ShowState
            HideFunction={() => { }}
            requestError={'The backend could not be reached: TypeError: Failed to fetch'}
            isLoading={false} />
    );
    expect(screen.getByText(/could not be loaded/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
});

test('says so while the report is still loading', () => {
    render(
        <IdsReportModal ShowState HideFunction={() => { }} isLoading />
    );
    expect(screen.getByText(/Loading the verification/)).toBeInTheDocument();
});

test('explains the empty state', () => {
    render(
        <IdsReportModal
            ShowState
            HideFunction={() => { }}
            status='not_checked'
            summary={{}}
            detail={{ specifications: [] }}
            isLoading={false} />
    );
    expect(screen.getByText(/Nothing to show yet/)).toBeInTheDocument();
});
