const axios = require('axios');

async function sendSlackAlert(rule, value) {
  const emoji = rule.severity === 'critical' ? ':red_circle:' : ':warning:';
  const payload = {
    text: `${emoji} *${rule.name}*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *Alert: ${rule.name}*\n*Metric:* \`${rule.metric}\`\n*Value:* ${value}\n*Threshold:* ${rule.condition} ${rule.threshold}\n*Severity:* ${rule.severity}`,
        },
      },
    ],
  };

  await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
  console.log(`[slack] alert sent for rule: ${rule.name}`);
}

module.exports = { sendSlackAlert };
