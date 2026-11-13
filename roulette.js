(() => {
'use strict';

// The catalogue is the single source of truth for the wheel and outcome list.
const activities = [
  { title: 'Run a few anomalies', duration: '1–2 hours', description: 'Just enough ISK to justify fitting something stupid.' },
  { title: 'Join a public fleet', duration: '1–3 hours', description: 'Follow broadcasts. Pretend you know what is happening.' },
  { title: 'Explore wormholes', duration: '1–3 hours', description: 'Scan until the chain becomes a personal grudge.' },
  { title: 'Try abyssal deadspace', duration: '1–2 hours', description: 'A relaxing room-temperature IQ test with explosions.' },
  { title: 'Move an unnecessarily large ship', duration: '2–3 hours', description: 'The scenic route, featuring logistics and regret.' },
  { title: 'Faction warfare roam', duration: '1–3 hours', description: 'Capture buttons. Lose frigates. Become lore.' },
  { title: 'Build something from scratch', duration: '2–3 hours', description: 'Manufacturing spreadsheet cosplay.' },
  { title: 'Hunt for a relic site', duration: '1–2 hours', description: 'Archaeology, but the museum shoots back.' },
  { title: 'Fit the worst possible ship', duration: '1–2 hours', description: 'Make the killmail funny enough to be worth it.' },
  { title: 'Haul exotic goods', duration: '1–3 hours', description: 'Space trucker simulator with actual consequences.' },
  { title: 'Organize your hangars', duration: '1–2 hours', description: 'The loot has been in that station since YC 112.' },
  { title: 'Scout a route for no reason', duration: '1–2 hours', description: 'Become the eyes. Discover everyone is asleep.' },
  { title: 'Attempt a solo PvP roam', duration: '1–3 hours', description: 'You are the content now.' },
  { title: 'Read patch notes aloud', duration: '1–2 hours', description: 'A ritual to summon balance changes.' },
  { title: 'Buy a ship you cannot afford', duration: '1–3 hours', description: 'The wheel cannot stop you. Nobody can.' },
  { title: 'Make a corporation doctrine', duration: '2–3 hours', description: 'Design a fleet that will never undock.' },
  { title: 'Run security missions', duration: '1–3 hours', description: 'Your agent has another urgent problem in exactly the same pocket.' },
  { title: 'Harvest wormhole gas', duration: '1–2 hours', description: 'Bring a gas harvester, bookmark your exit, and keep an eye on d-scan.' },
  { title: 'Mine an ice belt', duration: '1–3 hours', description: 'Turn frozen space into fuel. Stay awake for the part where someone lands.' },
  { title: 'Tend your planets', duration: '1–2 hours', description: 'Restart extractors, fix a bottleneck, and discover where the launchpad went.' },
  { title: 'Work the regional market', duration: '1–2 hours', description: 'Find a margin that survives taxes, fees, and your own optimism.' },
  { title: 'Salvage a battlefield', duration: '1–2 hours', description: 'Arrange access to some wrecks. One pilot’s loss is your rig component.' },
  { title: 'Hunt combat signatures', duration: '1–3 hours', description: 'Probe down a combat site and check its restrictions before bringing the expensive ship.' },
  { title: 'Join an incursion fleet', duration: '1–3 hours', description: 'Find a community, read its fitting requirements, and shoot Sansha with supervision.' },
  { title: 'Practice combat probing', duration: '1–2 hours', description: 'Bring combat probes and a willing fleetmate. Learn to land somewhere useful.' },
  { title: 'Try Project Discovery', duration: '1–2 hours', description: 'Do a little citizen science between undocks. Somehow space still has homework.' },
];

const wheelColors = ['#ef6a5b', '#f5bd4d', '#5bb3ef', '#9b7bea'];

function assertCount(count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('The wheel needs at least one activity.');
  }
}

function normalizeDegrees(angle) {
  return ((angle % 360) + 360) % 360;
}

function chooseActivity(count, random = Math.random) {
  assertCount(count);
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random values must be in [0, 1).');
  }
  return Math.floor(value * count);
}

function wheelGradient(count) {
  assertCount(count);
  const slice = 360 / count;
  const stops = Array.from({ length: count }, (_, index) =>
    `${wheelColors[index % wheelColors.length]} ${index * slice}deg ${(index + 1) * slice}deg`);
  // Segment zero is centred under the twelve-o'clock pointer.
  return `conic-gradient(from ${-slice / 2}deg, ${stops.join(', ')})`;
}

function labelPosition(index, count) {
  assertCount(count);
  const angle = index * 2 * Math.PI / count;
  return { left: 50 + Math.sin(angle) * 41, top: 50 - Math.cos(angle) * 41 };
}

function nextRotation(current, index, count) {
  assertCount(count);
  if (!Number.isFinite(current) || !Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError('Rotation and activity index must be valid.');
  }
  const target = normalizeDegrees(-index * 360 / count);
  // Aim from the current orientation, not from zero on every spin.
  return current + 5 * 360 + normalizeDegrees(target - normalizeDegrees(current));
}

// Classic scripts also work when index.html is opened directly via file://.
// A single namespace keeps the pure helpers available to Node's test runner.
globalThis.EveRoulette = Object.freeze({
  activities, wheelColors, normalizeDegrees, chooseActivity, wheelGradient, labelPosition, nextRotation,
});
})();
