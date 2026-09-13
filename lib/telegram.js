export async function sendTelegramNotification(report) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const penyebab = Array.isArray(report.penyebab) && report.penyebab.length > 0
    ? report.penyebab.map((p, i) => `  ${i + 1}. ${p}`).join('\n')
    : '  -';

  const tindakan = Array.isArray(report.tindakan) && report.tindakan.length > 0
    ? report.tindakan.map((t) => `  ${t.done ? '✅' : '⬜'} ${typeof t === 'string' ? t : t.text}`).join('\n')
    : '  -';

  const tanggal = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
  });

  const text = `🚨 *Laporan RCA Baru*\n\n📋 *Judul:* ${report.judul || '-'}\n🔍 *Root Cause:* ${report.root_cause || '-'}\n⚠️ *Penyebab:*\n${penyebab}\n🛠️ *Tindakan:*\n${tindakan}\n📅 *Waktu:* ${tanggal} WIB`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    console.error('Telegram notification error:', err);
  }
}
