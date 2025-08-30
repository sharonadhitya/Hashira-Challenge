function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

class Rational {
  constructor(num, den = 1n) {
    this.num = BigInt(num);
    this.den = BigInt(den);
    this.normalize();
  }

  normalize() {
    if (this.den === 0n) throw new Error('Denominator zero');
    let g = gcd(this.num, this.den);
    this.num /= g;
    this.den /= g;
    if (this.den < 0n) {
      this.num = -this.num;
      this.den = -this.den;
    }
  }

  add(other) {
    return new Rational(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  mul(other) {
    return new Rational(this.num * other.num, this.den * other.den);
  }

  equals(other) {
    return this.num === other.num && this.den === other.den;
  }

  isInteger() {
    return this.den === 1n;
  }

  get value() {
    if (!this.isInteger()) throw new Error('Not an integer');
    return this.num;
  }
}

function toBigIntFromBase(value, baseStr) {
  const base = BigInt(baseStr);
  let result = 0n;
  for (let char of value) {
    let digit;
    if (char >= '0' && char <= '9') {
      digit = BigInt(char.charCodeAt(0) - '0'.charCodeAt(0));
    } else {
      digit = BigInt(10 + char.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0));
    }
    if (digit < 0n || digit >= base) throw new Error('Invalid digit for base');
    result = result * base + digit;
  }
  return result;
}

function lagrangeInterpolate(points, evalPoint) {
  const k = points.length;
  let result = new Rational(0n);
  for (let i = 0; i < k; i++) {
    let term = new Rational(points[i].y);
    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      const num = evalPoint - points[j].x;
      const den = points[i].x - points[j].x;
      term = term.mul(new Rational(num, den));
    }
    result = result.add(term);
  }
  return result;
}

function getCombinations(arr, k) {
  const res = [];
  function comb(start, current) {
    if (current.length === k) {
      res.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      comb(i + 1, current);
      current.pop();
    }
  }
  comb(0, []);
  return res;
}

function findSecretAndWrongPoints(data) {
  const n = data.keys.n;
  const k = data.keys.k;
  const points = [];
  const shareKeys = Object.keys(data).filter(key => key !== 'keys');
  if (shareKeys.length !== n) throw new Error('Number of shares does not match n');
  for (const key of shareKeys) {
    const share = data[key];
    const x = BigInt(key);
    const y = toBigIntFromBase(share.value, share.base);
    points.push({ x, y });
  }

  const indices = Array.from({ length: n }, (_, i) => i);
  const allCombos = getCombinations(indices, k);

  const candidates = new Map();
  for (const combo of allCombos) {
    const selPoints = combo.map(idx => points[idx]);
    let cRat;
    try {
      cRat = lagrangeInterpolate(selPoints, 0n);
    } catch (e) {
      continue;
    }
    if (!cRat.isInteger()) continue;
    const c = cRat.value.toString();
    if (!candidates.has(c)) {
      candidates.set(c, { count: 0, combos: [] });
    }
    const entry = candidates.get(c);
    entry.count++;
    entry.combos.push(combo);
  }

  if (candidates.size === 0) throw new Error('No valid secret found');

  let maxCount = 0;
  let correctC = null;
  let correctCombos = null;
  for (const [c, v] of candidates) {
    if (v.count > maxCount) {
      maxCount = v.count;
      correctC = c;
      correctCombos = v.combos;
    }
  }

  const selPoints = correctCombos[0].map(idx => points[idx]);
  const wrong = [];
  for (let idx = 0; idx < n; idx++) {
    const p = points[idx];
    const computedY = lagrangeInterpolate(selPoints, p.x);
    if (!computedY.equals(new Rational(p.y))) {
      wrong.push(Number(points[idx].x));
    }
  }

  return {
    secret: BigInt(correctC),
    wrongPoints: wrong
  };
}

const testCase1 = {
    "keys": {
        "n": 4,
        "k": 3
    },
    "1": {
        "base": "10",
        "value": "4"
    },
    "2": {
        "base": "2",
        "value": "111"
    },
    "3": {
        "base": "10",
        "value": "12"
    },
    "6": {
        "base": "4",
        "value": "213"
    }
};

const testCase2 = {
"keys": {
    "n": 10,
    "k": 7
  },
  "1": {
    "base": "6",
    "value": "13444211440455345511"
  },
  "2": {
    "base": "15",
    "value": "aed7015a346d635"
  },
  "3": {
    "base": "15",
    "value": "6aeeb69631c227c"
  },
  "4": {
    "base": "16",
    "value": "e1b5e05623d881f"
  },
  "5": {
    "base": "8",
    "value": "316034514573652620673"
  },
  "6": {
    "base": "3",
    "value": "2122212201122002221120200210011020220200"
  },
  "7": {
    "base": "3",
    "value": "20120221122211000100210021102001201112121"
  },
  "8": {
    "base": "6",
    "value": "20220554335330240002224253"
  },
  "9": {
    "base": "12",
    "value": "45153788322a1255483"
  },
  "10": {
    "base": "7",
    "value": "1101613130313526312514143"
  }
};
console.log("Test Case 1:");
const result1 = findSecretAndWrongPoints(testCase1);
console.log("Secret:", result1.secret.toString());
console.log("Wrong points:", result1.wrongPoints);

console.log("\nTest Case 2:");
const result2 = findSecretAndWrongPoints(testCase2);
console.log("Secret:", result2.secret.toString());
console.log("Wrong points:", result2.wrongPoints);

/*
This code implements Shamir’s Secret Sharing using Lagrange interpolation to reconstruct a secret from shares. It converts share values from various bases to decimal, uses Rational arithmetic for precision, and identifies incorrect shares by testing combinations. Handling large numbers with BigInt, it processes two test cases, outputting the secret and wrong points.
*/