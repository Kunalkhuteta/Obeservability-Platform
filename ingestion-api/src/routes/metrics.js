const express = require('express');
const Joi = require('joi');
const redis = require('../redis');

const router = express.Router();

const metricSchema = Joi.object({
  name:      Joi.string().required(),
  value:     Joi.number().required(),
  tags:      Joi.object().default({}),
  timestamp: Joi.number().default(() => Date.now()),
});

// POST /v1/metrics  —  accepts single metric or array
router.post('/', async (req, res) => {
  try {
    const raw = Array.isArray(req.body) ? req.body : [req.body];
    const points = raw.map((item) => {
      const { error, value } = metricSchema.validate(item);
      if (error) throw new Error(`Invalid metric: ${error.message}`);
      return value;
    });

    const pipeline = redis.pipeline();
    for (const point of points) {
      pipeline.xadd('stream:metrics', '*', 'data', JSON.stringify(point));
    }
    await pipeline.exec();

    res.status(202).json({ accepted: points.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
