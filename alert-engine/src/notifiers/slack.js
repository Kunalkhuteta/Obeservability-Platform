const axios = require('axios');

function isConfiguredWebhook(url) {
  return Boolean(url && !url.includes('YOUR/WEBHOOK/HERE') && url.startsWith('https://hooks.slack.com/'));
}

async function sendSlackAlert(rule, value) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!isConfiguredWebhook(webhookUrl)) {
    console.log(`[slack] skipped (no real webhook configured) for rule: ${rule.name}`);
    return false;
  }

  const emoji = rule.severity === 'critical' ? ':red_circle:' : ':warning:';
  const payload = {
    text: `${emoji} *${rule.name}*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *Alert: ${rule.name}*\n*Metric:* \`${rule.metric}\`\n*Value:* ${Number(value).toFixed(2)}\n*Threshold:* ${rule.condition} ${rule.threshold}\n*Severity:* ${rule.severity}`,
        },
      },
    ],
  };

  try {
    await axios.post(webhookUrl, payload, { timeout: 5000 });
    console.log(`[slack] alert sent for rule: ${rule.name}`);
    return true;
  } catch (err) {
    console.error(`[slack] failed to send alert for "${rule.name}":`, err.message);
    return false;
  }
}

module.exports = { sendSlackAlert };
