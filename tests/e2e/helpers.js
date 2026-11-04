/** Waits until React is attached to every control, because sections hydrate separately and an earlier action would not reach them. */
export async function gotoReady(page, url) {
  const response = await page.goto(url);
  await page.waitForFunction(() => {
    const controls = [...document.querySelectorAll("main, button, input, select")];
    return controls.length > 0 && controls.every((control) => Object.keys(control).some((key) => key.startsWith("__reactProps")));
  });
  return response;
}
