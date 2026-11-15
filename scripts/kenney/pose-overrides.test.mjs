// node --test scripts/kenney/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { eulerDegToQuat, clipPlan } from './pose-overrides.mjs';

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test('a zero rotation is the identity quaternion', () => {
  assert.ok(close(eulerDegToQuat([0, 0, 0]), [0, 0, 0, 1]));
});

test('a single-axis rotation is a half-angle quaternion on that axis', () => {
  const s = Math.SQRT1_2;
  assert.ok(close(eulerDegToQuat([90, 0, 0]), [s, 0, 0, s]));
  assert.ok(close(eulerDegToQuat([0, 90, 0]), [0, s, 0, s]));
  assert.ok(close(eulerDegToQuat([0, 0, -90]), [0, 0, -s, s]));
});

test('a three-axis rotation follows the XYZ order of THREE.Euler (qx * qy * qz)', () => {
  const mul = ([ax, ay, az, aw], [bx, by, bz, bw]) => [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
  const q = eulerDegToQuat([20, -35, 50]);
  const want = mul(mul(eulerDegToQuat([20, 0, 0]), eulerDegToQuat([0, -35, 0])), eulerDegToQuat([0, 0, 50]));
  assert.ok(close(q, want));
});

test('a job with plain clip times keeps its source clip name, frame names and no overrides', () => {
  const plan = clipPlan({ id: 'dog', clips: { idle: [0], walk: [0, 0.12] } });
  assert.deepEqual(plan, [
    { name: 'idle', source: 'idle', times: [0], overrides: [] },
    { name: 'walk', source: 'walk', times: [0, 0.12], overrides: [] },
  ]);
});

test('the still clip reads the static animation, as before', () => {
  assert.deepEqual(clipPlan({ id: 'car', clips: { still: [0] } })[0], { name: 'still', source: 'static', times: [0], overrides: [] });
});

test('a posed clip names its source clip and adds its overrides after the job overrides', () => {
  const plan = clipPlan({
    id: 'rdog',
    overrides: [{ bone: 'Tail1', rotate: [0, 0, 30] }],
    clips: { walklook: { clip: 'Walk', times: [0, 0.2], overrides: [{ bone: 'Head', rotate: [0, 60, 0] }] } },
  });
  assert.equal(plan.length, 1);
  assert.equal(plan[0].name, 'walklook');
  assert.equal(plan[0].source, 'Walk');
  assert.deepEqual(plan[0].times, [0, 0.2]);
  assert.deepEqual(plan[0].overrides.map((o) => o.bone), ['Tail1', 'Head']);
  assert.ok(close(plan[0].overrides[1].quaternion, eulerDegToQuat([0, 60, 0])));
});

test('job overrides apply to plain clips too', () => {
  const plan = clipPlan({ id: 'rdog', overrides: [{ bone: 'Head', rotate: [10, 0, 0] }], clips: { idle: [0] } });
  assert.deepEqual(plan[0].overrides.map((o) => o.bone), ['Head']);
});

test('frame names stay <id>_<clip><index>_<facing>, so a posed clip name must be lowercase letters', () => {
  assert.throws(() => clipPlan({ id: 'rdog', clips: { look_l: { clip: 'Walk', times: [0] } } }), /clip name/);
});

test('an override needs a bone name and three angles', () => {
  assert.throws(() => clipPlan({ id: 'rdog', overrides: [{ rotate: [0, 0, 0] }], clips: { idle: [0] } }), /bone/);
  assert.throws(() => clipPlan({ id: 'rdog', overrides: [{ bone: 'Head', rotate: [0, 0] }], clips: { idle: [0] } }), /rotate/);
});
