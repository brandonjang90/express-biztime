const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
    try{
      const results = await db.query(`SELECT code, name FROM companies ORDER BY name`);
      return res.json({companies: results.rows});
    } catch (e) {
    return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const companyResult = await db.query('SELECT code, name, description FROM companies WHERE code = $1', [code]);
    const invoiceResult = await db.query('SELECT id FROM invoices WHERE comp_code = $1', [code]);

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
      }

    const company = companyResult.rows[0];
    const invoices = invoiceResult.rows;
    company.invoices = invoiceResult.rows.map(inv => inv.id);

    return res.json({ 'company': company });
    } catch (e) {
    return next(e);
    }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, {lower: true, strict: true});
    const result = await db.query(
      'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;

    const result = await db.query(
      'UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description',
      [name, description, code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`No such company: ${code}`, 404)
    } else {
      return res.json({"company": result.rows[0]});
    } 
  } catch (err) {
    return next(err);
  }
});

router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query('DELETE FROM companies WHERE code = $1 RETURNING code', [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json({ status: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
