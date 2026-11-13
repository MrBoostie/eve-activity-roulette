import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import '../../roulette.js';

const { activities } = globalThis.EveRoulette;

test('renders 26 matching labels and cards without script errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#spin')).toBeEnabled();
  await expect(page.locator('#labels span')).toHaveCount(26);
  await expect(page.locator('.activity')).toHaveCount(26);
  await expect(page.locator('#outcomesHeading')).toHaveText('Possible outcomes (26)');
  await expect(page.locator('.activity strong')).toHaveText(activities.map(({ title }) => title));
  expect(await page.locator('#wheel').evaluate((wheel) => wheel.style.background)).toContain('conic-gradient');
  expect(errors).toEqual([]);
});

test('every outcome is reachable and repeated spins match the physical pointer', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#spin');
  await expect(button).toBeEnabled();
  // Start with a nonzero choice, repeat it, then exercise all 26 choices.
  for (const choice of [7, 7, ...activities.map((_, index) => index)]) {
    await page.evaluate((value) => { Math.random = () => value; }, (choice + .5) / activities.length);
    await button.click();
    await expect(button).toHaveAttribute('aria-disabled', 'false');
    await expect(page.locator('#resultTitle')).toHaveText(activities[choice].title);
    await expect(page.locator('#resultText')).toHaveText(activities[choice].description);
    await expect(page.locator('#resultDuration')).toHaveText(activities[choice].duration);
    await expect(page.locator('.activity.is-selected')).toHaveCount(1);
    await expect(page.locator('.activity.is-selected strong')).toHaveText(activities[choice].title);
    await expect(page.locator('.selection-marker:visible')).toHaveCount(1);
    await expect(page.locator('#result')).toHaveAttribute('aria-busy', 'false');

    const geometry = await page.evaluate((index) => {
      const wheel = document.querySelector('#wheel').getBoundingClientRect();
      const label = document.querySelectorAll('#labels span')[index].getBoundingClientRect();
      const pointer = document.querySelector('.pointer').getBoundingClientRect();
      return {
        labelX: label.x + label.width / 2,
        labelY: label.y + label.height / 2,
        wheelX: wheel.x + wheel.width / 2,
        wheelY: wheel.y + wheel.height / 2,
        pointerX: pointer.x + pointer.width / 2,
      };
    }, choice);
    expect(Math.abs(geometry.labelX - geometry.pointerX)).toBeLessThan(1);
    expect(Math.abs(geometry.labelX - geometry.wheelX)).toBeLessThan(1);
    expect(geometry.labelY).toBeLessThan(geometry.wheelY);
  }
});

test('keyboard activation works and reduced motion skips the animation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const button = page.getByRole('button', { name: 'Spin the cursed wheel' });
  await expect(button).toBeFocused();
  await expect(page.locator('#wheel')).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Enter');
  await expect(page.locator('.activity.is-selected')).toHaveCount(1);
  await expect(button).toHaveAttribute('aria-disabled', 'false');
  await expect(button).toBeFocused();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.keyboard.press('Space');
  await expect(button).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#resultTitle')).toHaveText(activities[0].title);
});

test('animated spins reject re-entry and finish on the actual transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.addStyleTag({ content: '.wheel { transition-duration: .3s; }' });
  await page.evaluate(() => {
    Math.random = () => .5;
    window.transformEnded = false;
    document.querySelector('#wheel').addEventListener('transitionend', (event) => {
      if (event.propertyName === 'transform') window.transformEnded = true;
    });
  });
  await page.locator('#spin').click();
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'true');
  const rotation = await page.locator('#wheel').evaluate((wheel) => wheel.style.transform);
  await page.locator('#spin').dispatchEvent('click');
  expect(await page.locator('#wheel').evaluate((wheel) => wheel.style.transform)).toBe(rotation);
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#resultTitle')).toHaveText(activities[13].title);
  expect(await page.evaluate(() => window.transformEnded)).toBe(true);
  await expect(page.locator('#wheel')).not.toHaveCSS('transform', 'none');
});

test('default animation keeps the previous assignment until the wheel settles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('#wheel')).toHaveCSS('transition-duration', '5.8s');
  await page.evaluate(() => { Math.random = () => 25.5 / 26; });
  await page.locator('#spin').click();
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#result')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#resultTitle')).toHaveText('Spin it, coward.');
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'false', { timeout: 8000 });
  await expect(page.locator('#resultTitle')).toHaveText(activities[25].title);
  const aligned = await page.locator('#labels span').nth(25).evaluate((label) => {
    const number = label.getBoundingClientRect();
    const pointer = document.querySelector('.pointer').getBoundingClientRect();
    return Math.abs(number.x + number.width / 2 - pointer.x - pointer.width / 2) < 1;
  });
  expect(aligned).toBe(true);
});

test('missing transitionend events cannot leave the spin button locked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.addStyleTag({ content: '.wheel { transition-duration: .1s; }' });
  await page.locator('#wheel').evaluate((wheel) => {
    wheel.addEventListener('transitionend', (event) => event.stopImmediatePropagation(), true);
  });
  await page.locator('#spin').click();
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('.activity.is-selected')).toHaveCount(1);
});

for (const width of [320, 375, 768, 800, 801, 1024, 1440]) {
  test(`fits a ${width}px viewport without clipped wheel labels or horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.activity')).toHaveCount(26);
    const layout = await page.evaluate(() => {
      const circle = document.querySelector('#labels').getBoundingClientRect();
      const radius = circle.width / 2;
      const cx = circle.x + radius;
      const cy = circle.y + radius;
      const boxes = [...document.querySelectorAll('#labels span')].map((label) => label.getBoundingClientRect());
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        labelsInside: boxes.every((box) => [box.left, box.right].every((x) =>
          [box.top, box.bottom].every((y) => Math.hypot(x - cx, y - cy) <= radius))),
        labelsOverlap: boxes.some((box, index) => boxes.slice(index + 1).some((other) =>
          box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top)),
      };
    });
    expect(layout).toEqual({ overflow: false, labelsInside: true, labelsOverlap: false });
  });
}

test('has no automatically detectable WCAG A/AA accessibility violations before or after a spin', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#spin')).toBeEnabled();
  const audit = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect((await audit()).violations).toEqual([]);
  await page.locator('#spin').click();
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'false');
  expect((await audit()).violations).toEqual([]);
});

test('explains the JavaScript requirement instead of offering a dead button', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('noscript .notice')).toContainText('Enable JavaScript');
  await expect(page.locator('#spin')).toBeDisabled();
  await context.close();
});

test('also works when index.html is opened directly without an HTTP server', async ({ page }) => {
  await page.goto(new URL('../../index.html', import.meta.url).href);
  await expect(page.locator('.activity')).toHaveCount(26);
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#spin').click();
  await expect(page.locator('#spin')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#resultTitle')).toHaveText(activities[0].title);
});
