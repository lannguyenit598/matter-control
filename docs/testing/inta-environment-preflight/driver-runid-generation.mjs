import { generateRunId } from '/tmp/mc002-inta-harness/src/driver.ts';
const runId = generateRunId();
if (!/^[A-Za-z0-9]{8,32}$/.test(runId)) throw new Error('Invalid driver-generated runId');
console.log(JSON.stringify({runId, sourceHead:'48cc03e949d66fc47a7d304413621eb79804e6c1', method:'actual approved driver generateRunId helper, no constructor/HTTP/stage execution'}));
