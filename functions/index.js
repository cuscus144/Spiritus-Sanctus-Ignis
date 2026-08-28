const { onCreate } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = '7488842566';

exports.sendPrayerRequestToTelegram = onCreate(
  {
    document: 'prayerRequests/{requestId}',
    secrets: [TELEGRAM_BOT_TOKEN],
    region: 'us-central1'
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const name = String(data.name || 'Not provided').trim();
    const business = String(data.business || 'Not provided').trim();
    const request = String(data.request || 'Not provided').trim();

    const text = [
      '🙏 NEW PRAYER REQUEST',
      '',
      `👤 Name: ${name}`,
      `🏢 Business: ${business}`,
      '',
      '🕊️ Prayer Request:',
      request
    ].join('\n');

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.description || `Telegram HTTP ${response.status}`);
      }

      await event.data.ref.set({
        telegramStatus: 'sent',
        telegramSentAt: new Date()
      }, { merge: true });

      logger.info('Prayer request sent to Telegram', { requestId: event.params.requestId });
    } catch (error) {
      logger.error('Failed to send prayer request to Telegram', {
        requestId: event.params.requestId,
        error: error?.message || String(error)
      });

      await event.data.ref.set({
        telegramStatus: 'failed',
        telegramError: error?.message || String(error)
      }, { merge: true });
    }
  }
);
