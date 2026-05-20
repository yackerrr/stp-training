const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan.json'), 'utf8'));

const subject = process.env.VAPID_SUBJECT || 'mailto:noreply@example.com';
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subRaw = process.env.PUSH_SUBSCRIPTION || '';

const mode = process.argv[2];
if (!['morning', 'evening', 'weekly'].includes(mode)) {
  console.error('Usage: node notify.js morning|evening|weekly');
  process.exit(1);
}

if (!publicKey || !privateKey) {
  console.error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY env vars');
  process.exit(1);
}
let subscription;
try { subscription = JSON.parse(subRaw); }
catch { console.error('PUSH_SUBSCRIPTION is not valid JSON'); process.exit(1); }
if (!subscription.endpoint) {
  console.error('PUSH_SUBSCRIPTION missing endpoint — re-subscribe in app');
  process.exit(1);
}

const DAY_OFFSET = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

// Returns a UTC Date representing midnight in Pacific time on (now + offsetDays).
// Using America/Los_Angeles handles PDT/PST automatically.
function pacificDate(offsetDays = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  let y, m, d;
  for (const p of parts) {
    if (p.type === 'year') y = +p.value;
    if (p.type === 'month') m = +p.value - 1;
    if (p.type === 'day') d = +p.value;
  }
  const dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  return dt;
}

function rideForDate(targetDate) {
  const start = new Date(plan.start + 'T00:00:00Z');
  for (const w of plan.weeks) {
    for (const r of w.rides) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + (w.wk - 1) * 7 + DAY_OFFSET[r.d]);
      if (d.getTime() === targetDate.getTime()) return { week: w, ride: r };
    }
  }
  return null;
}

async function send(title, body, tag) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const payload = JSON.stringify({ title, body, tag, url: plan.siteUrl });
  try {
    const res = await webpush.sendNotification(subscription, payload, { TTL: 12 * 3600 });
    console.log('Sent:', title, '(status', res.statusCode + ')');
  } catch (err) {
    console.error('Push failed:', err.statusCode, err.body || err.message);
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.error('Subscription is gone — open the app and re-subscribe.');
    }
    process.exit(1);
  }
}

(async () => {
  if (mode === 'morning') {
    const today = pacificDate(0);
    const m = rideForDate(today);
    if (!m) { console.log('Off-plan day, no notification'); return; }
    const { week, ride } = m;
    if (ride.mi > 0) {
      await send(
        `Today: ${ride.n} — ${ride.mi} mi`,
        `Week ${week.wk} ${week.phase}. ${ride.desc}`,
        'stp-morning'
      );
    } else {
      await send(
        `Today: ${ride.n}`,
        ride.desc,
        'stp-morning'
      );
    }
  }
  else if (mode === 'evening') {
    const tomorrow = pacificDate(1);
    const m = rideForDate(tomorrow);
    if (!m) { console.log('No ride tomorrow'); return; }
    const { week, ride } = m;
    if (ride.n === 'Rest Day') { console.log('Tomorrow is a rest day, skip'); return; }
    const body = ride.mi > 0
      ? `Prep gear and bottles tonight. ${ride.desc}`
      : ride.desc;
    await send(
      ride.mi > 0
        ? `Tomorrow: ${ride.n} — ${ride.mi} mi`
        : `Tomorrow: ${ride.n}`,
      body,
      'stp-evening'
    );
  }
  else if (mode === 'weekly') {
    const today = pacificDate(0);
    const start = new Date(plan.start + 'T00:00:00Z');
    const daysSince = Math.floor((today - start) / 86400000);
    if (daysSince < 0) { console.log('Training has not started yet'); return; }
    const wkIdx = Math.floor(daysSince / 7);
    const done = plan.weeks[wkIdx];
    const next = plan.weeks[wkIdx + 1];
    if (!done) { console.log('Outside training window'); return; }
    if (!next) {
      await send(
        `STP complete!`,
        `7 weeks of training, 366 miles of prep, and you crushed 206 miles. Legend.`,
        'stp-weekly'
      );
    } else {
      await send(
        `Week ${done.wk} done — ${done.mi} mi planned`,
        `Up next: Week ${next.wk} (${next.dates}). ${next.focus}`,
        'stp-weekly'
      );
    }
  }
})();
