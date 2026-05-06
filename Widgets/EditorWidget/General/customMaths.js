
function generateUniqueNumber(num) {
  const prime1 = 73856093;

  // Force 32-bit integer behavior and use imul for C#-like overflow
  let uniqueNumber = Math.imul(Math.abs(num | 0), prime1);

  // Include the sign of the original number
  if (num < 0) {
    uniqueNumber = ~uniqueNumber;
  }

  // Modulo behaves the same (keeps sign of dividend)
  return uniqueNumber % 2178937;
}
function randInt(minValue, maxValue, seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = 0x100000000; // 2^32

    // Force seed to unsigned 32-bit
    seed = seed >>> 0;

    // Perform 32-bit integer multiplication
    let randVal = (Math.imul(a, seed) + c) >>> 0;

    // Match C# positive modulo behavior
    if (randVal === 0) {
        randVal += m;
    }

    const range = maxValue - minValue;

    return minValue + (randVal % range);
}
function getSeedFromVector3(pos) {
  let seed = generateUniqueNumberFrom3Inputs(pos.x, pos.y, pos.z);
  return ((seed % 2178937) + 2178937) % 2178937;
}
function generateUniqueNumberFrom3Inputs(num1, num2, num3) {
  const prime1 = 73856093;
  const prime2 = 19349663;
  const prime3 = 83492791;

  let uniqueNumber =
    (Math.abs(num1 | 0) * prime1) ^
    (Math.abs(num2 | 0) * prime2) ^
    (Math.abs(num3 | 0) * prime3);

  if (num1 < 0) uniqueNumber = ~uniqueNumber;
  if (num2 < 0) uniqueNumber = ~uniqueNumber;
  if (num3 < 0) uniqueNumber = ~uniqueNumber;

  return ((uniqueNumber % 2178937) + 2178937) % 2178937;
}
function vecEqual(a,b, thresh=0)
{
  if (thresh)
  {
    return (Math.abs(a.x-b.x) < thresh && Math.abs(a.y-b.y) < thresh && Math.abs(a.z-b.z) < thresh);
  }
  return (a.x===b.x && a.y===b.y && a.z===b.z)
}
function nextSeed(seed) {
    // Ensure 32-bit signed integer like C#
    seed = seed | 0;

    // Call your GenerateRandom equivalent (must return a number)
    seed = (seed + (generateUniqueNumber((seed)) | 0)) | 0;

    seed = seed % 2178937;

    if (seed <= 0) {
        seed += 2178937;
    }

    return seed | 0;
}
function generateRandom(seed) {
  const s0 = splitMix64(seed);
  const s1 = splitMix64(seed + 1);

  const resultLo = (s0.lo + s1.lo) >>> 0;
  const resultHi = (s0.hi + s1.hi + (resultLo < s0.lo ? 1 : 0)) >>> 0;

  let lo = resultLo;

  if (lo === 0) {
    lo += 2178937;
  }

  return lo >>> 0;
}
function seedNext(seed) {
  return (seed + 0x9E3779B97F4A7C15n) & 0xFFFFFFFFFFFFFFFFn;
}

function u32(x) {
  return x >>> 0;
}

function add32(a, b) {
  return (a + b) >>> 0;
}

function mul32(a, b) {
  return Math.imul(a, b) >>> 0;
}
function makeU64(high, low) {
  return { hi: high >>> 0, lo: low >>> 0 };
}
function rotl64(hi, lo, k) {
  k &= 63;

  if (k === 0) return { hi, lo };

  if (k < 32) {
    return {
      hi: ((hi << k) | (lo >>> (32 - k))) >>> 0,
      lo: ((lo << k) | (hi >>> (32 - k))) >>> 0,
    };
  }

  k -= 32;

  return {
    hi: ((lo << k) | (hi >>> (32 - k))) >>> 0,
    lo: ((hi << k) | (lo >>> (32 - k))) >>> 0,
  };
}
function splitMix64(seed) {
  let hi = (seed / 0x100000000) >>> 0;
  let lo = seed >>> 0;

  // seed += constant
  let cHi = 0x9E3779B9;
  let cLo = 0x7F4A7C15;

  lo = (lo + cLo) >>> 0;
  hi = (hi + cHi + (lo < cLo ? 1 : 0)) >>> 0;

  // xorshift/mul steps (approximated exactly in 32-bit form)
  let xh = hi, xl = lo;

  // (x ^ (x >> 30)) * constant
  ({ hi: xh, lo: xl } = mulShift64(xh, xl, 30, 0xBF58476D1CE4E5B9));

  // second mix
  ({ hi: xh, lo: xl } = mulShift64(xh, xl, 27, 0x94D049BB133111EB));

  // final xor shift 31
  let shifted = shr64(xh, xl, 31);

  return xor64(xh, xl, shifted.hi, shifted.lo);
}
function shr64(hi, lo, n) {
  if (n === 0) return { hi, lo };
  if (n < 32) {
    return {
      hi: hi >>> n,
      lo: (lo >>> n) | (hi << (32 - n)),
    };
  }
  return {
    hi: 0,
    lo: hi >>> (n - 32),
  };
}

function xor64(aHi, aLo, bHi, bLo) {
  return {
    hi: (aHi ^ bHi) >>> 0,
    lo: (aLo ^ bLo) >>> 0,
  };
}

// multiply then shift helper (core of SplitMix64 math)
function mulShift64(hi, lo, shift, mul) {
  // approximate 64-bit multiply using 32-bit parts
  const a = lo;
  const b = mul >>> 0;

  const low = Math.imul(a, b) >>> 0;
  const high = Math.imul(hi, b) + ((a * b) / 0x100000000) >>> 0;

  const shifted = (high << (32 - shift)) | (low >>> shift);

  return {
    hi: (high >>> shift) >>> 0,
    lo: shifted >>> 0,
  };
}



function rotateVector2(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x = v.x * cos - v.y * sin;
    const y = v.x * sin + v.y * cos;

    return { x, y };
}
function applyRotation(rot, pos) {
    // rot = { x, y, z, w }
    // pos = { x, y, z }

    const qx = rot.x, qy = rot.y, qz = rot.z, qw = rot.w;
    const vx = pos.x, vy = pos.y, vz = pos.z;

    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (qy * vz - qz * vy);
    const ty = 2 * (qz * vx - qx * vz);
    const tz = 2 * (qx * vy - qy * vx);

    // result = v + qw * t + cross(q.xyz, t)
    const rx = vx + qw * tx + (qy * tz - qz * ty);
    const ry = vy + qw * ty + (qz * tx - qx * tz);
    const rz = vz + qw * tz + (qx * ty - qy * tx);

    return { x: rx, y: ry, z: rz };
}

function inBounds(p) {
  return (
    p.x >= 0 && p.x < 100 &&
    p.y >= 0 && p.y < 100 &&
    p.z >= 0 && p.z < 100
  );
}

function makeEulerRotation(xDeg, yDeg, zDeg) {
    // Convert degrees → radians
    const deg2rad = Math.PI / 180;
    const x = xDeg * deg2rad * 0.5;
    const y = yDeg * deg2rad * 0.5;
    const z = zDeg * deg2rad * 0.5;

    const sx = Math.sin(x), cx = Math.cos(x);
    const sy = Math.sin(y), cy = Math.cos(y);
    const sz = Math.sin(z), cz = Math.cos(z);

    // Unity uses ZXY order
    return normalizeQuat({
        x: sx * cy * cz + cx * sy * sz,
        y: cx * sy * cz - sx * cy * sz,
        z: cx * cy * sz - sx * sy * cz,
        w: cx * cy * cz + sx * sy * sz
    });
  }
function normalizeQuat(q) {
    const mag = Math.hypot(q.x, q.y, q.z, q.w);
    return {
        x: q.x / mag,
        y: q.y / mag,
        z: q.z / mag,
        w: q.w / mag
    };
}
function degToRad(d) {
  return (d * Math.PI) / 180;
}


function vecFloor(v) {
  return {
    x: Math.floor(v.x),
    y: Math.floor(v.y),
    z: Math.floor(v.z)
  };
}

function vecFloorDiv(v, d) {
  return {
    x: Math.floor(v.x / d),
    y: Math.floor(v.y / d),
    z: Math.floor(v.z / d)
  };
}

function vecToString(v) {
  return `${v.x}|${v.y}|${v.z}`;
}

function stringToVecInt(str) {
  const [x, y, z] = str.split("|").map(Number);
  return { x, y, z };
}

function stringToVec(str) {
  const [x, y, z] = str.split("|").map(Number);
  return { x, y, z };
}
function distance3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function reorientCoordinates(direction, coordinates) {
    const x = coordinates[0];
    const y = coordinates[1];
    const z = coordinates[2];

    switch (direction) {
        case 0:  //up
            return [x, y, z];

        case 1:  //down
            return [-x, -y, z];

        case 2:  //left
            return [-y, -x, z];

        case 3: //right
            return [y, x, z];

        case 4: //forward
            return [x, z, y];

        case 5: //backward
            return [x, -z, -y];

        default:
            return [x, y, z];
    }
}
function unorientCoordinates(direction, coordinates) {
    const x = coordinates[0];
    const y = coordinates[1];
    const z = coordinates[2];

    switch (direction) {

        case 0: // up (identity)
            return [x, y, z];

        case 1: // down: [-x, -y, z]
            return [-x, -y, z];

        case 2: // left: [-y, -x, z]
            return [-y, -x, z];

        case 3: // right: [y, x, z]
            return [y, x, z];

        case 4: // forward: [x, z, y]
            return [x, z, y];

        case 5: // backward: [x, -z, -y]
            return [x, -z, -y];

        default:
            return [x, y, z];
    }
}
function roundToIntUnity(value) {
    const floor = Math.floor(value);
    const diff = value - floor;

    if (diff > 0.5) return floor + 1;
    if (diff < 0.5) return floor;

    // exactly .5 → round to even
    return (floor % 2 === 0) ? floor : floor + 1;
}
function f32(x) {
    return Math.fround(x);
}
export {f32, roundToIntUnity, generateRandom, unorientCoordinates, reorientCoordinates, vecFloor, vecFloorDiv, vecToString, stringToVecInt,stringToVec,distance3D, rotateVector2,makeEulerRotation,applyRotation,inBounds, generateUniqueNumber, randInt, getSeedFromVector3, generateUniqueNumberFrom3Inputs, vecEqual, nextSeed};