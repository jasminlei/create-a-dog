import { expect, test } from '@playwright/test'

const MOCK_DOG = {
  name: 'Muffin',
  traits: ['Friendly', 'Smart'],
  horoscope: 'Leo',
  imageUrl:
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22320%22%20height%3D%22240%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e8f5e9%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%232e7d32%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%3EDog%20Image%3C/text%3E%3C/svg%3E',
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/dog', async (route) => {
    const request = route.request()

    if (request.method() !== 'POST') {
      await route.continue()
      return
    }

    const body = request.postDataJSON?.() ?? {}
    const name =
      typeof body.name === 'string' && body.name.trim()
        ? body.name.trim()
        : MOCK_DOG.name

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...MOCK_DOG,
        name,
        traits:
          Array.isArray(body.traits) && body.traits.length > 0
            ? body.traits
            : MOCK_DOG.traits,
        horoscope:
          typeof body.horoscope === 'string'
            ? body.horoscope
            : MOCK_DOG.horoscope,
      }),
    })
  })
})

test('creates a dog and shows result view, then returns with "Luo uusi"', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByLabel('Dog’s name').fill('Muffin')
  await page.getByRole('button', { name: 'Create Dog' }).click()

  await expect(page.getByRole('img', { name: 'Muffin' })).toBeVisible()
  await expect(page.getByText('Name:')).toBeVisible()
  await expect(page.getByText('Muffin')).toBeVisible()
  await expect(page.getByText('Personality traits:')).toBeVisible()
  await expect(page.getByText('Horoscope:')).toBeVisible()

  await page
    .getByRole('button', { name: /^(Create a new dog|Luo uusi)$/ })
    .click()

  await expect(page.getByLabel('Dog’s name')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create Dog' })).toBeVisible()
})

test('limits personality traits selection to max 5', async ({ page }) => {
  await page.goto('/')

  const select = page.locator('#dog-trait')

  // add up to max 5 by selecting the first available option each time.
  for (let i = 0; i < 4; i += 1) {
    const options = select.locator('option')
    const count = await options.count()

    // option[0] is the disabled placeholder, so pick option[1]
    expect(count).toBeGreaterThan(1)
    const value = await options.nth(1).getAttribute('value')
    await select.selectOption(value)
  }

  await expect(select).toBeDisabled()
  await expect(select.locator('option').first()).toHaveText(
    /Max 5 traits selected/,
  )

  const firstChip = page.locator('.chip').first()
  await firstChip.click()
  await expect(select).toBeEnabled()
})

test('shows validation error when name is missing', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Create Dog' }).click()
  await expect(page.getByText('Please give your dog a name.')).toBeVisible()
})
