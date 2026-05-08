import type { DetailedReportData } from '@/types';

const PRIMARY = '#2563EB';
const PRIMARY_LIGHT = '#DBEAFE';
const TEXT = '#1E293B';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const CARD_BG = '#F8FAFC';
const DANGER_BG = '#FEE2E2';
const DANGER = '#B91C1C';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function swatchSvg(hex: string, size = 48): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="10" ry="10"
      fill="${hex}" stroke="${BORDER}" stroke-width="1"/>
  </svg>`;
}

function sparkSvg(spark: DetailedReportData['spark']): string {
  if (spark.length < 2) {
    return `<div style="color:${MUTED};font-size:12px;">More scans this week will populate this chart.</div>`;
  }
  const W = 360;
  const H = 64;
  const PAD = 6;
  const xs = spark.length;
  const dx = (W - PAD * 2) / Math.max(1, xs - 1);
  const points = spark.map((p, i) => {
    const x = PAD + i * dx;
    const y = PAD + (1 - p.score / 100) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const dotsHtml = spark
    .map((p, i) => {
      const x = PAD + i * dx;
      const y = PAD + (1 - p.score / 100) * (H - PAD * 2);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${PRIMARY}"/>`;
    })
    .join('');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <polyline fill="none" stroke="${PRIMARY}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      points="${points.join(' ')}"/>
    ${dotsHtml}
  </svg>`;
}

function sectionHtml(title: string, body: string): string {
  return `<section class="section">
    <h2>${escape(title)}</h2>
    ${body}
  </section>`;
}

export function renderReportHtml(data: DetailedReportData): string {
  const recoveryRows = data.recoveryPlan
    .map(
      (r) =>
        `<tr>
          <td class="when">${escape(r.whenLabel)}</td>
          <td class="what">${escape(r.text)}</td>
        </tr>`,
    )
    .join('');

  const bodyTiles = data.bodyImpact
    .map(
      (b) => `<div class="tile">
        <div class="tile-title">${escape(b.system)}</div>
        <div class="tile-body">${escape(b.impact)}</div>
      </div>`,
    )
    .join('');

  const stepList = data.actionSteps
    .map((s, i) => `<li><span class="step-num">${i + 1}</span>${escape(s)}</li>`)
    .join('');

  const nudgeList = data.lifestyleNudges
    .map((n) => `<li>${escape(n)}</li>`)
    .join('');

  const checklistHtml = data.doctorChecklist
    ? `<section class="section warn">
        <h2>For your healthcare professional</h2>
        <ul class="bullets">
          ${data.doctorChecklist.map((c) => `<li>${escape(c)}</li>`).join('')}
        </ul>
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Hydration Coaching Report</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: ${TEXT};
    background: #FFFFFF;
    font-size: 12px;
    line-height: 1.5;
  }
  .page { padding: 32px 36px; }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 2px solid ${PRIMARY};
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .brand h1 {
    margin: 0 0 4px 0;
    font-size: 18px;
    color: ${PRIMARY};
    letter-spacing: 0.3px;
  }
  .brand p { margin: 0; color: ${MUTED}; font-size: 11px; }
  .meta {
    text-align: right;
    font-size: 11px;
    color: ${MUTED};
    line-height: 1.4;
  }
  .meta b { color: ${TEXT}; }
  .verdict-band {
    background: ${data.levelColor}1A;
    border-left: 4px solid ${data.levelColor};
    padding: 14px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }
  .verdict-band .swatch { flex: 0 0 auto; }
  .verdict-text h2 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: ${data.levelColor};
  }
  .verdict-text .level-chip {
    display: inline-block;
    background: ${PRIMARY_LIGHT};
    color: ${PRIMARY};
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    margin-right: 8px;
  }
  .verdict-text p { margin: 6px 0 0 0; color: ${TEXT}; }
  .section {
    margin-top: 16px;
    padding: 14px 16px;
    background: ${CARD_BG};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    page-break-inside: avoid;
  }
  .section h2 {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: ${TEXT};
  }
  .section.warn { background: ${DANGER_BG}; border-color: ${DANGER}; }
  .section.warn h2 { color: ${DANGER}; }
  ol.steps { margin: 0; padding: 0; list-style: none; }
  ol.steps li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
  }
  .step-num {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: ${PRIMARY_LIGHT};
    color: ${PRIMARY};
    font-weight: 700;
    text-align: center;
    line-height: 18px;
    font-size: 10px;
    margin-right: 4px;
  }
  ul.bullets { margin: 0; padding-left: 16px; }
  ul.bullets li { margin-bottom: 4px; }
  .score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .score-row .score-pill {
    font-size: 11px;
    color: ${MUTED};
  }
  .score-pill b {
    color: ${TEXT};
    font-size: 14px;
  }
  table.recovery {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
  }
  table.recovery td {
    border-bottom: 1px solid ${BORDER};
    padding: 8px 4px;
    vertical-align: top;
  }
  table.recovery tr:last-child td { border-bottom: none; }
  table.recovery .when {
    width: 90px;
    color: ${PRIMARY};
    font-weight: 600;
  }
  .tiles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tile {
    flex: 1 1 calc(50% - 4px);
    background: #FFFFFF;
    border: 1px solid ${BORDER};
    border-radius: 8px;
    padding: 8px 10px;
    min-width: 220px;
  }
  .tile-title {
    font-size: 11px;
    font-weight: 700;
    color: ${PRIMARY};
    margin-bottom: 2px;
  }
  .tile-body { font-size: 11px; color: ${TEXT}; }
  footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid ${BORDER};
    color: ${MUTED};
    font-size: 10px;
    line-height: 1.5;
  }
  footer b { color: ${TEXT}; }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="brand">
      <h1>UriScan AI</h1>
      <p>Personalized hydration coaching report</p>
    </div>
    <div class="meta">
      <div><b>Report</b> ${escape(data.reportId.slice(0, 8))}</div>
      <div>${escape(data.generatedAt)}</div>
      <div>App version ${escape(data.appVersion)}</div>
    </div>
  </header>

  <div class="verdict-band">
    <div class="swatch">${swatchSvg(data.colorHex, 56)}</div>
    <div class="verdict-text">
      <h2>${escape(data.title)}</h2>
      <span class="level-chip">Level ${data.levelIndex} of ${data.levelTotal}</span>
      <span class="score-pill"><b>Score ${data.score}</b> / 100</span>
      <p>${escape(data.message)}</p>
    </div>
  </div>

  ${sectionHtml(
    'Hydration verdict',
    `<ol class="steps">${stepList}</ol>`,
  )}

  ${sectionHtml(
    'Today vs. your 7-day average',
    `<div class="score-row">
      <div class="score-pill">Today: <b>${data.score}</b> / 100</div>
      <div class="score-pill">7-day average: <b>${data.sevenDayAverage}</b> / 100</div>
    </div>
    ${sparkSvg(data.spark)}
    <p style="margin-top:8px;color:${TEXT};">${escape(data.sevenDayPattern)}</p>`,
  )}

  ${sectionHtml(
    '24-hour recovery plan',
    `<table class="recovery">${recoveryRows}</table>`,
  )}

  ${sectionHtml(
    'What this level affects',
    `<div class="tiles">${bodyTiles}</div>`,
  )}

  ${sectionHtml(
    'Electrolyte & food cues',
    `<p style="margin:0;color:${TEXT};">${escape(data.electrolyteCue)}</p>`,
  )}

  ${sectionHtml(
    'Lifestyle nudges',
    `<ul class="bullets">${nudgeList}</ul>`,
  )}

  ${checklistHtml}

  <footer>
    <p><b>Disclaimer.</b> UriScan AI is not a medical device and does not provide diagnosis or treatment. This report is a personalized hydration coaching summary based on the color you selected and your scan history. If you experience pain, persistent symptoms, or color in the warning range, please consult a qualified healthcare professional.</p>
    <p>Report ID: ${escape(data.reportId)} · Scan ID: ${data.scanId} · Generated by UriScan AI v${escape(data.appVersion)}.</p>
  </footer>
</div>
</body>
</html>`;
}
