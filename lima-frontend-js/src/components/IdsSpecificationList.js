import React from 'react';
import { MDBIcon } from 'mdb-react-ui-kit';

// The compact per-specification breakdown behind the status badge in the
// CheckPanel table. Purely prop driven, so it renders in a test without a store.

// Matches the square-icon idiom the report tree in Reports.js already uses.
const statusColour = status => (status === true ? 'success' : 'danger');

function SpecificationRow({ specification }) {

    const {
        name, status, total_applicable: applicable, total_failed: failed,
        total_requirements: requirements, total_requirements_failed: requirementsFailed,
    } = specification;

    // A specification the model has to satisfy but nothing in the model matches
    // fails with no counts at all - ifctester marks every one of its
    // requirements failed. Without saying so, that reads as an inexplicable red
    // next to a row of zeroes.
    const nothingApplicable = status !== true && applicable === 0;

    return (
        <tr>
            <td className='ps-0'>
                <MDBIcon fas size='sm' icon='square' color={statusColour(status)} className='me-2' />
                {name}
            </td>
            <td className='text-secondary'>
                {nothingApplicable ?
                    <small>Nothing in the model matches this specification</small> :
                    <small>
                        {applicable - failed}/{applicable} elements pass
                        {requirements > 0 &&
                            <> · {requirements - requirementsFailed}/{requirements} requirements met</>}
                    </small>}
            </td>
        </tr>
    );
}

function SpecificationGroup({ title, specifications }) {

    if (!specifications.length) {
        return null;
    }

    return (
        <>
            <tr>
                <td colSpan={2} className='ps-0 pt-3 pb-1 border-0'>
                    <small className='text-secondary text-uppercase fw-bold'>{title}</small>
                </td>
            </tr>
            {specifications.map(specification =>
                <SpecificationRow key={specification.name} specification={specification} />)}
        </>
    );
}

export function IdsSpecificationList({ specifications = [] }) {

    if (!specifications.length) {
        return (
            <small className='text-secondary'>
                No specification results to show. Open the verification details for
                what went wrong.
            </small>
        );
    }

    // Splitting the two is the whole point of the orange state, so the
    // breakdown has to make the distinction visible rather than implying every
    // line carries the same weight.
    const obligatory = specifications.filter(s => s.cardinality !== 'optional');
    const optional = specifications.filter(s => s.cardinality === 'optional');

    return (
        <table className='table table-sm table-borderless mb-0'>
            <tbody>
                <SpecificationGroup title='Obligatory' specifications={obligatory} />
                <SpecificationGroup title='Optional' specifications={optional} />
            </tbody>
        </table>
    );
}
