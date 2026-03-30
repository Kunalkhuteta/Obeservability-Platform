const express = require('express');
const Joi = require('joi');
const redis = require('../redis');

const router = express.Router();

const logSchema = Joi.object({
  level:     Joi.string().valid('debug', 'info', 'warn', 'error').required(),
  message:   Joi.string().required(),
  service:   Joi.string().required(),
  traceId:   Joi.string().optional(),
  meta:      Joi.object().default({}),
  timestamp: Joi.number().default(() => Date.now()),
});

// POST /v1/logs  —  accepts single log or array
router.post('/', async (req, res) => {
  try {
    const raw = Array.isArray(req.body) ? req.body : [req.body];
    const entries = raw.map((item) => {
      const { error, value } = logSchema.validate(item);
      if (error) throw new Error(`Invalid log: ${error.message}`);
      return value;
    });

    const pipeline = redis.pipeline();
    for (const entry of entries) {
      pipeline.xadd('stream:logs', '*', 'data', JSON.stringify(entry));
    }
    await pipeline.exec();

    res.status(202).json({ accepted: entries.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
