export const queues = ['Ready', 'Waiting', 'Blocked', 'History'];
export const tasks = [
{ id:1, title:'Prepare board resolutions', matter:'Acme acquisition', queue:'Ready', due:'Today 14:00', reason:'Declared prerequisites are satisfied. This action is on the critical chain.', outcome:'Draft resolutions prepared for legal review.' },
{ id:2, title:'Review closing checklist', matter:'Atlas restructuring', queue:'Ready', due:'Tomorrow', reason:'Assigned to you and ready to begin.', outcome:'Closing checklist reviewed and outstanding items identified.' },
{ id:3, title:'Prepare filing cover letter', matter:'Northstar licensing', queue:'Ready', due:'30 Oct 2026', reason:'The required preparation steps are satisfied.', outcome:'Cover letter prepared for review, not filed automatically.' },
{ id:4, title:'Await signed board resolutions', matter:'Acme acquisition', queue:'Waiting', due:'30 Oct 2026', reason:'Waiting for the company secretary to return signed resolutions.', outcome:'Signed resolutions received and recorded.' },
{ id:5, title:'Await authority receipt', matter:'Northstar licensing', queue:'Waiting', due:'No due date', reason:'Waiting for the authority to acknowledge receipt. Receipt is not approval.', outcome:'Record the actual receipt when available.' },
{ id:6, title:'Confirm closing readiness', matter:'Atlas restructuring', queue:'Blocked', due:'30 Oct 2026', reason:'Signature proof for the current agreement version is unverified.', outcome:'Prerequisite proof independently assessed before proceeding.' }
];
export const bounded = (i, step, count) => Math.max(0, Math.min(Math.max(0,count-1), i+step));
