import assert from 'node:assert/strict';
import test from 'node:test';
import '../roulette.js';

const { activities, chooseActivity, labelPosition, nextRotation, normalizeDegrees, wheelGradient, wheelColors } = globalThis.EveRoulette;

const originalTitles = [
  'Run a few anomalies', 'Join a public fleet', 'Explore wormholes', 'Try abyssal deadspace',
  'Move an unnecessarily large ship', 'Faction warfare roam', 'Build something from scratch',
  'Hunt for a relic site', 'Fit the worst possible ship', 'Haul exotic goods',
  'Organize your hangars', 'Scout a route for no reason', 'Attempt a solo PvP roam',
  'Read patch notes aloud', 'Buy a ship you cannot afford', 'Make a corporation doctrine',
];

test('preserves the original 16 activities and adds exactly 10 distinct options', () => {
  assert.equal(activities.length, 26);
  assert.deepEqual(activities.slice(0, 16).map(({ title }) => title), originalTitles);
  assert.equal(new Set(activities.map(({ title }) => title)).size, 26);
  for (const activity of activities) {
    for (const field of ['title', 'duration', 'description']) {
      assert.equal(typeof activity[field], 'string');
      assert.ok(activity[field].trim().length > 0);
    }
    assert.match(activity.duration, /^[1-3]–[1-3] hours$/u);
  }
});

test('every activity has an equal-sized random interval, including first and last', () => {
  const count = activities.length;
  assert.equal(chooseActivity(count, () => 0), 0);
  assert.equal(chooseActivity(count, () => 1 - Number.EPSILON), count - 1);
  for (let index = 0; index < count; index++) {
    for (const fraction of [.01, .5, .99]) {
      assert.equal(chooseActivity(count, () => (index + fraction) / count), index);
    }
  }
});

test('gradient and labels use the catalogue count, not hard-coded 16-slice angles', () => {
  for (const count of [1, 2, 16, 26, 37]) {
    const gradient = wheelGradient(count);
    assert.equal((gradient.match(/#[0-9a-f]{6}/gu) ?? []).length, count);
    assert.ok(gradient.startsWith(`conic-gradient(from ${-180 / count}deg,`));
    for (let index = 0; index < count; index++) {
      assert.ok(gradient.includes(`${wheelColors[index % wheelColors.length]} ${index * (360 / count)}deg ${(index + 1) * (360 / count)}deg`));
      const position = labelPosition(index, count);
      assert.ok(Math.abs(Math.hypot(position.left - 50, position.top - 50) - 41) < 1e-9);
    }
    assert.deepEqual(labelPosition(0, count), { left: 50, top: 9 });
  }
});

test('all previous/next choice pairs land the chosen segment centre under the pointer', () => {
  for (const count of [1, 2, 16, 26, 37]) {
    for (let previous = 0; previous < count; previous++) {
      const current = nextRotation(360 * 100, previous, count);
      for (let choice = 0; choice < count; choice++) {
        const target = nextRotation(current, choice, count);
        assert.ok(target - current >= 1800 - 1e-8);
        assert.ok(target - current < 2160 + 1e-8);
        const angle = normalizeDegrees(target + choice * 360 / count);
        assert.ok(Math.min(angle, 360 - angle) < 1e-7);
      }
    }
  }
});

test('a long chain of mixed and repeated choices stays aligned', () => {
  let current = 0;
  for (let spin = 0; spin < 1000; spin++) {
    const choice = Math.floor(spin / 3) % activities.length;
    const target = nextRotation(current, choice, activities.length);
    const angle = normalizeDegrees(target + choice * 360 / activities.length);
    assert.ok(Math.min(angle, 360 - angle) < 1e-7);
    current = target;
  }
});

test('invalid counts, random sources, rotations, and choices fail explicitly', () => {
  for (const count of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => chooseActivity(count), RangeError);
    assert.throws(() => wheelGradient(count), RangeError);
    assert.throws(() => labelPosition(0, count), RangeError);
    assert.throws(() => nextRotation(0, 0, count), RangeError);
  }
  for (const value of [-.1, 1, NaN, Infinity]) {
    assert.throws(() => chooseActivity(26, () => value), RangeError);
  }
  for (const index of [-1, 26, 1.5]) {
    assert.throws(() => nextRotation(0, index, 26), RangeError);
  }
  assert.throws(() => nextRotation(NaN, 0, 26), RangeError);
});
