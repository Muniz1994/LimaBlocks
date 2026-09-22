// Turns an RTK Query error into something worth putting in front of a user.
//
// Shared by the Reports console modal and the CheckPanel verification details,
// because "the backend could not be reached" and "the backend answered 500 with
// a Django debug page" are the same two cases wherever they happen.
export const describeRequestError = (error) => {

    if (!error) return 'The request to the backend failed.';

    if (error.status === 'FETCH_ERROR') return `The backend could not be reached: ${error.error}`;

    const body = typeof error.data === 'string' ? error.data : JSON.stringify(error.data);

    // A Django debug page comes back as a whole HTML document; the opening of it
    // is enough to recognise what happened.
    const detail = body && body.length > 2000 ? `${body.slice(0, 2000)}\n[...]` : body;

    return `The backend answered ${error.status}.${detail ? `\n\n${detail}` : ''}`;
};
