import React from 'react';
// Imported here rather than through src/setupTests.js, which this project does
// not have.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteRegulationModal } from './DeleteRegulationModal';

test('names the regulation and how many rules go with it', () => {
    render(
        <DeleteRegulationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            kind='regulation'
            name='Porto Alegre'
            ruleCount={3}
            isDeleting={false} />
    );
    expect(screen.getByText('Delete regulation')).toBeInTheDocument();
    expect(screen.getByText('Porto Alegre')).toBeInTheDocument();
    expect(screen.getByText(/3 rules/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
});

test('names the rule without mentioning other rules', () => {
    render(
        <DeleteRegulationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            kind='clause'
            name='Minimum room area'
            isDeleting={false} />
    );
    expect(screen.getByText('Delete rule')).toBeInTheDocument();
    expect(screen.getByText('Minimum room area')).toBeInTheDocument();
    expect(screen.queryByText(/and its/)).not.toBeInTheDocument();
});

test('confirming calls back, cancelling does not', async () => {
    const onConfirm = jest.fn();
    const HideFunction = jest.fn();

    render(
        <DeleteRegulationModal
            ShowState
            HideFunction={HideFunction}
            onConfirm={onConfirm}
            kind='clause'
            name='Rule'
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
        <DeleteRegulationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            kind='regulation'
            name='Code'
            isDeleting />
    );
    expect(screen.getByText(/Deleting/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
});

test('explains a delete the backend refused', () => {
    render(
        <DeleteRegulationModal
            ShowState
            HideFunction={() => { }}
            onConfirm={() => { }}
            kind='regulation'
            name='Code'
            isDeleting={false}
            requestError={'The backend answered 500.'} />
    );
    expect(screen.getByText(/could not be deleted/)).toBeInTheDocument();
    expect(screen.getByText(/answered 500/)).toBeInTheDocument();
});
