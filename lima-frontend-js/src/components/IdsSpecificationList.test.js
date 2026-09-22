import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IdsSpecificationList } from './IdsSpecificationList';

const specification = (overrides) => ({
    name: 'Building requirements',
    cardinality: 'required',
    status: true,
    total_applicable: 1,
    total_failed: 0,
    total_requirements: 3,
    total_requirements_failed: 0,
    ...overrides,
});

test('separates obligatory from optional specifications', () => {
    render(
        <IdsSpecificationList
            specifications={[
                specification(),
                specification({ name: 'Stair requirements', cardinality: 'optional' }),
            ]} />
    );
    expect(screen.getByText('Obligatory')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.getByText(/Stair requirements/)).toBeInTheDocument();
});

test('shows how much of a failing specification passed', () => {
    render(
        <IdsSpecificationList
            specifications={[specification({
                name: 'Storey requirements',
                status: false,
                total_applicable: 13,
                total_failed: 1,
                total_requirements: 1,
                total_requirements_failed: 1,
            })]} />
    );
    expect(screen.getByText(/12\/13 elements pass/)).toBeInTheDocument();
    expect(screen.getByText(/0\/1 requirements met/)).toBeInTheDocument();
});

test('explains an obligatory specification that nothing in the model matches', () => {
    // ifctester fails these with no counts at all, which otherwise reads as an
    // inexplicable red next to a row of zeroes.
    render(
        <IdsSpecificationList
            specifications={[specification({
                name: 'Room requirements',
                status: false,
                total_applicable: 0,
                total_failed: 0,
                total_requirements: 2,
                total_requirements_failed: 2,
            })]} />
    );
    expect(screen.getByText(/Nothing in the model matches/)).toBeInTheDocument();
});

test('explains the empty state', () => {
    render(<IdsSpecificationList specifications={[]} />);
    expect(screen.getByText(/No specification results to show/)).toBeInTheDocument();
});
