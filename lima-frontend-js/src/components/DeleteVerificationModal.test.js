import React from 'react';
// Imported here rather than through src/setupTests.js, which this project does
// not have.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteVerificationModal } from './DeleteVerificationModal';

test('names the model it is about to remove and warns that it is final', () => {
    render(
        <DeleteVerificationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            fileName='BuildingPaper.V17.ifc'
            isDeleting={false} />
    );
    expect(screen.getByText('BuildingPaper.V17.ifc')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
});

test('still reads correctly when the verification has no model attached', () => {
    render(
        <DeleteVerificationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            fileName={null}
            isDeleting={false} />
    );
    expect(screen.getByText(/This removes the verification\./)).toBeInTheDocument();
});

test('confirming calls back, cancelling does not', async () => {
    const onConfirm = jest.fn();
    const HideFunction = jest.fn();

    render(
        <DeleteVerificationModal
            ShowState
            HideFunction={HideFunction}
            onConfirm={onConfirm}
            fileName='model.ifc'
            isDeleting={false} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(HideFunction).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(HideFunction).toHaveBeenCalledTimes(1);
});

test('locks both buttons while the delete is in flight', () => {
    render(
        <DeleteVerificationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            fileName='model.ifc'
            isDeleting />
    );
    expect(screen.getByText(/Deleting/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
});

test('explains a delete the backend refused', () => {
    render(
        <DeleteVerificationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            fileName='model.ifc'
            isDeleting={false}
            requestError={'The backend answered 500.'} />
    );
    expect(screen.getByText(/could not be deleted/)).toBeInTheDocument();
    expect(screen.getByText(/answered 500/)).toBeInTheDocument();
});
