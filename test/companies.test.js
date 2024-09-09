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
});

beforeEach(async () => {
  await db.query('DELETE FROM companies');
  await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Inc', 'Maker of iPhones'),
           ('ibm', 'IBM', 'Big Blue');
  `);
});

afterAll(async () => {
  await db.end();
});

describe('GET /companies', () => {
  test('Gets a list of companies', async () => {
    const res = await request(app).get('/companies');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [
        { code: 'apple', name: 'Apple Inc' },
        { code: 'ibm', name: 'IBM' }
      ]
    });
  });
});

describe('GET /companies/:code', () => {
  test('Gets a single company', async () => {
    const res = await request(app).get('/companies/apple');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: 'apple',
        name: 'Apple Inc',
        description: 'Maker of iPhones',
        invoices: []
      }
    });
  });

  test('Responds with 404 for invalid company code', async () => {
    const res = await request(app).get('/companies/unknown');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /companies', () => {
  test('Creates a new company', async () => {
    const res = await request(app).post('/companies').send({
      name: 'Microsoft',
      description: 'Software giant'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: 'microsoft',
        name: 'Microsoft',
        description: 'Software giant'
      }
    });
  });
});

describe('PUT /companies/:code', () => {
  test('Updates a company', async () => {
    const res = await request(app).put('/companies/apple').send({
      name: 'Apple Corporation',
      description: 'Technology giant'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: 'apple',
        name: 'Apple Corporation',
        description: 'Technology giant'
      }
    });
  });

  test('Responds with 404 for invalid company code', async () => {
    const res = await request(app).put('/companies/unknown').send({
      name: 'Unknown',
      description: 'Invalid company'
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /companies/:code', () => {
  test('Deletes a company', async () => {
    const res = await request(app).delete('/companies/apple');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'deleted' });
  });

  test('Responds with 404 for invalid company code', async () => {
    const res = await request(app).delete('/companies/unknown');
    expect(res.statusCode).toBe(404);
  });
});
``
