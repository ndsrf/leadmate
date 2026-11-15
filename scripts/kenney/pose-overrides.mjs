// Bone overrides for render-sprites.mjs: rotate named bones on top of a clip's pose, after the clip time is applied.
// Pure (no three.js), so it runs both in node tests and in the render page, which serves this file as a module.
//
// A job's `clips` maps an output clip name to either
//   - an array of animation times (the GLB clip has the same name; `still` reads `static`), or
//   - { clip, times, overrides }: a posed clip, read from the GLB clip `clip`, with its own bone overrides.
// A job's `overrides` apply to every one of its clips, before the clip's own.
// An override is { bone: '<node name>', rotate: [x, y, z] } in degrees (Euler XYZ, local to the bone),
// multiplied onto the bone's animated rotation.

const NAME = /^[a-z]+$/; // pack-sprites.py reads frame names as <id>_<clip><index>_<facing>

/** Euler XYZ in degrees -> quaternion [x, y, z, w], as THREE.Quaternion.setFromEuler. */
export function eulerDegToQuat([x, y, z]) {
  const r = Math.PI / 360; // half angle in radians
  const c1 = Math.cos(x * r), c2 = Math.cos(y * r), c3 = Math.cos(z * r);
  const s1 = Math.sin(x * r), s2 = Math.sin(y * r), s3 = Math.sin(z * r);
  return [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3,
  ];
}

function resolve(overrides = [], where) {
  return overrides.map((o) => {
    if (typeof o?.bone !== 'string' || !o.bone) throw new Error(`${where}: override needs a bone name`);
    if (!Array.isArray(o.rotate) || o.rotate.length !== 3 || !o.rotate.every(Number.isFinite))
      throw new Error(`${where}: override of ${o.bone} needs rotate: [x, y, z] in degrees`);
    return { bone: o.bone, quaternion: eulerDegToQuat(o.rotate) };
  });
}

/** The clips a job renders, in order: [{ name, source, times, overrides: [{ bone, quaternion }] }]. */
export function clipPlan(job) {
  const base = resolve(job.overrides, job.id);
  return Object.entries(job.clips).map(([name, spec]) => {
    if (!NAME.test(name)) throw new Error(`${job.id}: clip name ${name} must be lowercase letters only`);
    if (Array.isArray(spec)) return { name, source: name === 'still' ? 'static' : name, times: spec, overrides: base };
    return { name, source: spec.clip, times: spec.times, overrides: [...base, ...resolve(spec.overrides, `${job.id} ${name}`)] };
  });
}
