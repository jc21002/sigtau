import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
 await page.addInitScript(() => {
  const token = btoa(JSON.stringify({ alg: 'none' })) + '.' + btoa(JSON.stringify({ role:'ADMIN', exp: 4102444800 })) + '.test';
  localStorage.setItem('token', token);
  localStorage.setItem('role', 'ADMIN');
 });
 await page.route('http://localhost:8080/**', async route => {
  const path = new URL(route.request().url()).pathname;
  let data = [];
  if (path === '/modalities/1' || path === '/reasons/1') data = {id:1,name:'Original',description:'Descripción'};
  if (path === '/roles') data = [{id:1,name:'TUTOR'}];
  if (path === '/users/1') data = {id:1,name:'Tutor',email:'tutor@test.local',phone:'70000000',roleId:1};
  await route.fulfill({json:data});
 });
});
for (const [path,label] of [['modalities','modalidad'],['reasons','motivo']]) {
 test(`editar ${label} carga y guarda`, async ({page}) => {
  await page.goto(`/${path}/edit/1`);
  await expect(page.getByRole('heading',{name:`Editar ${label}`})).toBeVisible();
  await expect(page.getByLabel('Nombre *')).toHaveValue('Original');
  await page.getByLabel('Nombre *').fill('Actualizado');
  const request = page.waitForRequest(r => r.method()==='PUT' && r.url().endsWith(`/${path}/1`));
  await page.getByRole('button',{name:'Guardar',exact:true}).click();
  expect((await request).postDataJSON().name).toBe('Actualizado');
  await expect(page).toHaveURL(new RegExp(`/${path}$`));
 });
}
test('crear motivo vuelve al listado',async ({page}) => {
 await page.goto('/create-reason');
 await page.getByLabel('Nombre *').fill('Conflicto');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await expect(page).toHaveURL(/\/reasons$/);
});
test('editar usuario conserva contraseña al dejarla vacía',async ({page}) => {
 await page.goto('/users/edit/1');
 await expect(page.locator('input[type=email]')).toHaveValue('tutor@test.local');
 const request=page.waitForRequest(r=>r.method()==='PUT' && r.url().endsWith('/users/1'));
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 expect((await request).postDataJSON()).not.toHaveProperty('password');
 await expect(page).toHaveURL(/\/users$/);
});
