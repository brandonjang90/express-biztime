const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeAll(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS companies (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
      amt NUMERIC NOT NULL,
      paid BOOLEAN DEFAULT FALSE,
      add_date DATE DEFAULT CURRENT_DATE,
      paid_date DATE
    );
  `);
});

beforeEach(async () => {
  await db.query('DELETE FROM invoices');
  await db.query('DELETE FROM companies');
  await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Inc', 'Maker of iPhones');
  `);
  await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ('apple', 500), ('apple', 300);
  `);
});

afterAll(async () => {
  await db.end();
});

describe('GET /invoices', () => {
  test('Gets a list of invoices', async () => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        { id: expect.any(Number), comp_code: 'apple' },
        { id: expect.any(Number), comp_code: 'apple' }
      ]
    });
  });
});

describe('GET /invoices/:id', () => {
  test('Gets a single invoice', async () => {
    const invoice = await db.query('SELECT id FROM invoices LIMIT 1');
    const id = invoice.rows[0].id;

    const res = await request(app).get(`/invoices/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.invoice).toHaveProperty('id');
    expect(res.body.invoice).toHaveProperty('company');
  });

  test('Responds with 404 for invalid invoice id', async () => {
    const res = await request(app).get('/invoices/9999');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /invoices', () => {
  test('Creates a new invoice', async () => {
    const res = await request(app).post('/invoices').send({
      comp_code: 'apple',
      amt: 1000
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.invoice).toHaveProperty('id');
  });
});

describe('PUT /invoices/:id', () => {
  test('Updates an invoice and marks it as paid', async () => {
    const invoice = await db.query('SELECT id FROM invoices LIMIT 1');
    const id = invoice.rows[0].id;

    const res = await request(app).put(`/invoices/${id}`).send({
      amt: 1200,
      paid: true
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.invoice.paid).toBe(true);
    expect(res.body.invoice.paid_date).not.toBe(null);
  });

  test('Responds with 404 for invalid invoice id', async () => {
    const res = await request(app).put('/invoices/9999').send({
      amt: 1200,
      paid: true
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /invoices/:id', () => {
  test('Deletes an invoice', async () => {
    const invoice = await db.query('SELECT id FROM invoices LIMIT 1');
    const id = invoice.rows[0].id;

    const res = await request(app).delete(`/invoices/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'deleted' });
  });

  test('Responds with 404 for invalid invoice id', async () => {
    const res = await request(app).delete('/invoices/9999');
    expect(res.statusCode).toBe(404);
  });
});
