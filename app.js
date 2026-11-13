(() => {
'use strict';

const { activities, chooseActivity, labelPosition, nextRotation, wheelGradient } = globalThis.EveRoulette;

const wheel = document.querySelector('#wheel');
const labels = document.querySelector('#labels');
const list = document.querySelector('#activities');
const spin = document.querySelector('#spin');
const result = document.querySelector('#result');
const kicker = document.querySelector('#resultKicker');
const title = document.querySelector('#resultTitle');
const text = document.querySelector('#resultText');
const duration = document.querySelector('#resultDuration');
const idleButtonText = spin.textContent;

wheel.style.background = wheelGradient(activities.length);
document.querySelector('#outcomeCount').textContent = `(${activities.length})`;

const cards = activities.map((activity, index) => {
  const label = document.createElement('span');
  label.textContent = index + 1;
  const position = labelPosition(index, activities.length);
  label.style.left = `${position.left}%`;
  label.style.top = `${position.top}%`;
  labels.append(label);

  const card = document.createElement('li');
  card.className = 'activity';
  const number = document.createElement('span');
  number.className = 'activity-number';
  number.textContent = `${index + 1}.`;
  const name = document.createElement('strong');
  name.textContent = activity.title;
  const time = document.createElement('small');
  time.textContent = activity.duration;
  const marker = document.createElement('span');
  marker.className = 'selection-marker';
  marker.textContent = 'Selected';
  marker.hidden = true;
  card.append(number, name, time, marker);
  list.append(card);
  return { card, marker };
});

let rotation = 0;
let pendingChoice = null;
let completionTimer;

function completeSpin() {
  if (pendingChoice === null) return;
  clearTimeout(completionTimer);
  const choice = pendingChoice;
  pendingChoice = null;
  const activity = activities[choice];
  kicker.textContent = `Your assignment · #${choice + 1}`;
  title.textContent = activity.title;
  text.textContent = activity.description;
  duration.textContent = activity.duration;
  cards.forEach(({ card, marker }, index) => {
    card.classList.toggle('is-selected', index === choice);
    marker.hidden = index !== choice;
  });
  result.setAttribute('aria-busy', 'false');
  spin.textContent = idleButtonText;
  spin.setAttribute('aria-disabled', 'false');
}

wheel.addEventListener('transitionend', (event) => {
  if (event.target === wheel && event.propertyName === 'transform') completeSpin();
});

spin.addEventListener('click', () => {
  // Guard synthetic clicks as well as ordinary repeated button presses.
  if (pendingChoice !== null) return;
  pendingChoice = chooseActivity(activities.length);
  // Native disabled buttons lose keyboard focus in Firefox. Keep focus and
  // expose the busy state with aria-disabled while the re-entry guard blocks input.
  spin.setAttribute('aria-disabled', 'true');
  spin.textContent = 'Spinning…';
  result.setAttribute('aria-busy', 'true');
  rotation = nextRotation(rotation, pendingChoice, activities.length);
  wheel.style.transform = `rotate(${rotation}deg)`;

  // Transition events can be skipped (including when reduced motion is enabled).
  // Derive the fallback from CSS so the button cannot get stuck after a style change.
  const style = getComputedStyle(wheel);
  const seconds = parseFloat(style.transitionDuration) + parseFloat(style.transitionDelay);
  completionTimer = setTimeout(completeSpin, seconds > 0 ? seconds * 1000 + 150 : 0);
});

spin.setAttribute('aria-disabled', 'false');
spin.disabled = false;
})();
