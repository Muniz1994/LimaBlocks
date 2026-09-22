"""Checking an uploaded IFC model against the project's information requirements.

The compliance rules in check_engine answer "does this design obey the regulation".
This module answers the question that comes before it: "does the model even carry
the data those rules need". It runs the buildingSMART IDS in
verification/information_requirements/ against the uploaded file.

Everything ifctester-specific is confined here, and every failure mode - a
malformed IFC, an unreadable IDS, a package that did not install - comes back as
the 'error' status with a traceback in the console text, never as an exception
reaching the request. Refusing an upload because the *checker* broke would be the
wrong trade: the file itself is still worth keeping.
"""

import traceback

from django.conf import settings

from check_engine.console import capture_console

# These strings are persisted and shipped to the frontend as they are, so they
# are part of the API contract - see IDS_STATUS_PRESENTATION in
# lima-frontend-js/src/components/IdsStatusBadge.js.
NOT_CHECKED = 'not_checked'          # no model attached yet
PASSED = 'passed'                    # green  - every specification passed
OPTIONAL_FAILED = 'optional_failed'  # orange - the obligatory ones passed, an optional one did not
FAILED = 'failed'                    # red    - an obligatory specification failed
ERROR = 'error'                      # the check could not be run at all

# A model with a systematic data gap produces one failure per element. Past a
# couple of dozen the list stops informing and starts being a payload problem.
# The full count is kept either way, so nothing is hidden - only shortened.
MAX_REPORTED_ENTITIES = 20


def aggregate_status(rows):
    """Reduce the per-specification rows to one traffic light for the model.

    Optional specifications are graded apart from obligatory ones: a model that
    carries everything the permit needs but no stair properties is a different
    situation from one missing the building's use class, and the orange state is
    the only way the table can say so.

    Whether a specification is obligatory is IDS's own notion of cardinality -
    `minOccurs="0"` makes it optional - which ifctester exposes as get_usage().
    'prohibited' is a hard constraint like 'required', so it is graded with the
    obligatory ones.

    `is not True` rather than `is False` on purpose: ifctester leaves the status
    None for a specification it never reached, and an ungraded requirement is not
    a met one.
    """

    if not rows:
        # An IDS with no specifications cannot produce a verdict, and calling
        # that "passed" would be the worst available answer.
        return ERROR

    obligatory = [row for row in rows if row['cardinality'] != 'optional']
    optional = [row for row in rows if row['cardinality'] == 'optional']

    if any(row['status'] is not True for row in obligatory):
        return FAILED

    if any(row['status'] is not True for row in optional):
        return OPTIONAL_FAILED

    return PASSED


def _describe_entity(element, reason=''):
    """The little of an IFC element that is useful in a report and cheap to ship.

    GlobalId is kept because it is the key the xeokit viewer highlights by, which
    is what would let a later change jump from a failing requirement to the
    element in the model.
    """

    return {
        'id': element.id(),
        'global_id': getattr(element, 'GlobalId', None),
        'class': element.is_a(),
        'name': getattr(element, 'Name', None),
        'reason': reason,
    }


def _summarise_specification(spec):
    """Counts only, no element lists - small enough to ship with every verification."""

    return {
        'name': spec.name,
        'cardinality': spec.get_usage(),  # 'required' | 'optional' | 'prohibited'
        'status': spec.status,
        'total_applicable': len(spec.applicable_entities),
        'total_failed': len(spec.failed_entities),
        'total_requirements': len(spec.requirements),
        'total_requirements_failed': len(
            [facet for facet in spec.requirements if facet.status is not True]),
    }


def _detail_requirement(spec, facet):
    # ifctester models a failure as a TypedDict, so these are keys rather than
    # attributes.
    failures = facet.failures

    return {
        'facet_type': type(facet).__name__,
        # ifctester renders the facet as a sentence ("AboveGround data shall be
        # provided in the dataset Pset_BuildingStoreyCommon"), which beats
        # anything we would assemble from the raw parameters.
        'description': facet.to_string('requirement', spec, facet),
        'status': facet.status,
        'total_pass': len(facet.passed_entities),
        'total_fail': len(failures),
        'failed_entities': [
            _describe_entity(failure['element'], failure['reason'])
            for failure in failures[:MAX_REPORTED_ENTITIES]
        ],
        'total_omitted': max(0, len(failures) - MAX_REPORTED_ENTITIES),
    }


def _detail_specification(spec):
    row = _summarise_specification(spec)

    row.update({
        'description': spec.description or '',
        'instructions': spec.instructions or '',
        # False when the model's schema is not one this specification targets.
        # The check still ran; this is context for reading an odd-looking result.
        'is_ifc_version': spec.is_ifc_version,
        'applicability': [facet.to_string('applicability') for facet in spec.applicability],
        'requirements': [_detail_requirement(spec, facet) for facet in spec.requirements],
    })

    return row


def check_ifc_against_ids(ifc_path, ids_path=None):
    """Run the information requirements against one IFC file.

    Returns {'status': ..., 'summary': {...}, 'detail': {...}} and never raises.
    """

    ids_path = ids_path or settings.IDS_SPECIFICATIONS_PATH

    summary, detail, status = {}, {}, ERROR

    with capture_console() as console:

        try:
            import ifcopenshell
            from ifctester import ids

            # Parsed fresh on every run rather than cached: validate() mutates
            # the Specification objects it walks, and the dev server is threaded,
            # so a shared Ids instance would let two uploads overwrite each
            # other's results. The expensive part - compiling the IDS XSD - is
            # already cached inside ifctester for the life of the process.
            specs = ids.open(ids_path)

            model = ifcopenshell.open(ifc_path)

            # should_filter_version is deliberately left off: a model in an
            # unexpected schema should still be told what it is missing, with the
            # mismatch reported per specification rather than silently skipping
            # every one of them.
            specs.validate(model)

            summary = {
                'title': specs.info.get('title', 'Information requirements'),
                'version': specs.info.get('version', ''),
                'ifc_schema': model.schema_identifier,
                'specifications': [_summarise_specification(s) for s in specs.specifications],
            }
            summary['total_specifications'] = len(summary['specifications'])
            summary['total_passed'] = len(
                [row for row in summary['specifications'] if row['status'] is True])

            detail = {'specifications': [_detail_specification(s) for s in specs.specifications]}

            status = aggregate_status(summary['specifications'])

        except Exception:
            # Same bargain as Verification.run_verification: a broken input is
            # feedback for whoever uploaded it, so the traceback is printed into
            # the captured console and handed back rather than raised at the
            # client.
            traceback.print_exc()

            summary, detail, status = {}, {}, ERROR

        detail['console'] = console.getvalue()

    return {'status': status, 'summary': summary, 'detail': detail}
