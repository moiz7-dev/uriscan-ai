import type { DetailedReportData } from '@/types';

const PRIMARY      = '#2563EB';
const PRIMARY_LIGHT= '#EFF6FF';
const TEXT         = '#0F172A';
const TEXT_BODY    = '#1E293B';
const MUTED        = '#64748B';
const BORDER       = '#E2E8F0';
const CARD_BG      = '#F8FAFC';
const WHITE        = '#FFFFFF';
const DANGER_BG    = '#FEE2E2';
const DANGER       = '#B91C1C';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function scoreFill(score: number, levelColor: string): string {
  const r = 44;
  const cx = 52, cy = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return `<svg width="104" height="104" viewBox="0 0 104 104" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BORDER}" stroke-width="9"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${levelColor}" stroke-width="9"
      stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}"
      stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif"
      font-size="22" font-weight="700" fill="${TEXT}">${score}</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif"
      font-size="9" fill="${MUTED}">/ 100</text>
  </svg>`;
}

function swatchSvg(hex: string, size = 48): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="10" ry="10"
      fill="${hex}" stroke="${BORDER}" stroke-width="1.5"/>
  </svg>`;
}

function sparkSvg(spark: DetailedReportData['spark']): string {
  if (spark.length < 2) {
    return `<p style="color:${MUTED};font-size:11px;margin:0;">Scan more days to populate the 7-day chart.</p>`;
  }
  const W = 340, H = 56, PAD = 8;
  const dx = (W - PAD * 2) / Math.max(1, spark.length - 1);
  const points = spark.map((p, i) => {
    const x = PAD + i * dx;
    const y = PAD + (1 - p.score / 100) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  // area fill path
  const first = points[0];
  const last = points[points.length - 1];
  const firstX = parseFloat(first.split(',')[0]);
  const lastX  = parseFloat(last.split(',')[0]);
  const areaPath = `M${firstX},${H - PAD} L${points.join(' L')} L${lastX},${H - PAD} Z`;

  const dots = spark.map((p, i) => {
    const x = PAD + i * dx;
    const y = PAD + (1 - p.score / 100) * (H - PAD * 2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${PRIMARY}"/>`;
  }).join('');

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#sg)"/>
    <polyline fill="none" stroke="${PRIMARY}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      points="${points.join(' ')}"/>
    ${dots}
  </svg>`;
}

export function renderReportHtml(data: DetailedReportData): string {
  const circ = 2 * Math.PI * 44;
  void circ; // used in scoreFill

  const recoveryRows = data.recoveryPlan.map((r, i) => `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
      <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;">
        <div style="width:28px;height:28px;border-radius:50%;background:${PRIMARY};color:#fff;
          display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${i + 1}</div>
        ${i < data.recoveryPlan.length - 1 ? `<div style="width:2px;flex:1;min-height:16px;background:${BORDER};margin-top:4px;"></div>` : ''}
      </div>
      <div style="padding-top:4px;">
        <div style="font-size:11px;font-weight:700;color:${PRIMARY};margin-bottom:2px;">${escape(r.whenLabel)}</div>
        <div style="font-size:12px;color:${TEXT_BODY};line-height:1.5;">${escape(r.text)}</div>
      </div>
    </div>`).join('');

  const bodyTiles = data.bodyImpact.map(b => `
    <div style="flex:1 1 calc(50% - 6px);min-width:140px;background:${WHITE};border:1px solid ${BORDER};
      border-radius:8px;padding:10px 12px;">
      <div style="font-size:10px;font-weight:700;color:${PRIMARY};text-transform:uppercase;
        letter-spacing:0.5px;margin-bottom:4px;">${escape(b.system)}</div>
      <div style="font-size:11px;color:${TEXT_BODY};line-height:1.5;">${escape(b.impact)}</div>
    </div>`).join('');

  const stepList = data.actionSteps.map((s, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
      <div style="flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:${PRIMARY_LIGHT};
        color:${PRIMARY};font-weight:700;text-align:center;line-height:20px;font-size:10px;">${i + 1}</div>
      <div style="font-size:12px;color:${TEXT_BODY};line-height:1.6;padding-top:1px;">${escape(s)}</div>
    </div>`).join('');

  const causesList = data.causes.map(c => `
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;">
      <div style="flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:${MUTED};margin-top:5px;"></div>
      <div style="font-size:11.5px;color:${TEXT_BODY};line-height:1.6;">${escape(c)}</div>
    </div>`).join('');

  const nudgeList = data.lifestyleNudges.map(n => `
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
      <div style="flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:${PRIMARY};margin-top:6px;"></div>
      <div style="font-size:12px;color:${TEXT_BODY};line-height:1.6;">${escape(n)}</div>
    </div>`).join('');

  const checklistSection = data.doctorChecklist ? `
    <div style="margin-top:18px;padding:16px;background:${DANGER_BG};border:1.5px solid ${DANGER};border-radius:10px;">
      <div style="font-size:13px;font-weight:700;color:${DANGER};margin-bottom:4px;">
        ⚕ When to See a Doctor — Warning Signs for ${escape(data.colorLabel)} Urine
      </div>
      <div style="font-size:11px;color:${DANGER};margin-bottom:10px;opacity:0.85;line-height:1.5;">
        Show this checklist to your healthcare professional. Mention any of these signs that apply to you.
      </div>
      ${data.doctorChecklist.map(c => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;">
          <div style="flex:0 0 auto;color:${DANGER};font-size:13px;margin-top:0px;font-weight:700;">!</div>
          <div style="font-size:12px;color:${DANGER};line-height:1.5;">${escape(c)}</div>
        </div>`).join('')}
    </div>` : '';

  const levelLabel = data.level.charAt(0).toUpperCase() + data.level.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>UriScan AI — Hydration Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: ${TEXT_BODY}; font-size: 12px; line-height: 1.5; }
  .page { padding: 28px 32px 40px; max-width: 720px; margin: 0 auto; }
  .section { margin-top: 16px; padding: 16px; background: ${CARD_BG}; border: 1px solid ${BORDER};
    border-radius: 10px; page-break-inside: avoid; }
  .section-title { font-size: 12px; font-weight: 700; color: ${TEXT}; text-transform: uppercase;
    letter-spacing: 0.6px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid ${BORDER}; }
</style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;
    padding-bottom:16px;border-bottom:2.5px solid ${PRIMARY};margin-bottom:20px;">
    <div>
      <div style="font-size:20px;font-weight:800;color:${PRIMARY};letter-spacing:-0.3px;">UriScan AI</div>
      <div style="font-size:10px;color:${MUTED};margin-top:2px;">AI-Powered Hydration Wellness Report</div>
      <div style="font-size:9px;color:${MUTED};margin-top:1px;">
        Not a medical diagnostic tool · For wellness awareness only
      </div>
    </div>
    <div style="text-align:right;font-size:10px;color:${MUTED};line-height:1.6;">
      <div><span style="color:${TEXT};font-weight:600;">Report</span> #${escape(data.reportId.slice(0, 8))}</div>
      <div>${escape(data.generatedAt)}</div>
      <div>App v${escape(data.appVersion)}</div>
    </div>
  </div>

  <!-- ── VERDICT HERO ── -->
  <div style="display:flex;align-items:center;gap:20px;padding:18px 20px;
    background:${data.levelColor}0F;border:1.5px solid ${data.levelColor}40;
    border-radius:12px;margin-bottom:6px;">

    <!-- Color swatch -->
    <div style="flex:0 0 auto;">${swatchSvg(data.colorHex, 64)}</div>

    <!-- Score ring -->
    <div style="flex:0 0 auto;">${scoreFill(data.score, data.levelColor)}</div>

    <!-- Title & summary -->
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
        <span style="background:${data.levelColor};color:#fff;padding:3px 10px;border-radius:999px;
          font-size:10px;font-weight:700;letter-spacing:0.3px;">${escape(levelLabel)}</span>
        <span style="background:${PRIMARY_LIGHT};color:${PRIMARY};padding:3px 10px;border-radius:999px;
          font-size:10px;font-weight:600;">Level ${data.levelIndex} of ${data.levelTotal}</span>
      </div>
      <div style="font-size:17px;font-weight:800;color:${TEXT};margin-bottom:6px;line-height:1.25;">
        ${escape(data.title)}
      </div>
      <div style="font-size:11px;color:${TEXT_BODY};line-height:1.6;">${escape(data.message)}</div>
    </div>
  </div>

  <!-- ── STAT STRIP ── -->
  <div style="display:flex;gap:1px;margin-top:10px;margin-bottom:4px;">
    <div style="flex:1;background:${CARD_BG};border:1px solid ${BORDER};padding:10px 12px;border-radius:8px 0 0 8px;">
      <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px;">Score</div>
      <div style="font-size:12px;font-weight:700;color:${TEXT};">${data.score}/100</div>
    </div>
    <div style="flex:1;background:${CARD_BG};border:1px solid ${BORDER};border-left:none;padding:10px 12px;">
      <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px;">7-Day Avg</div>
      <div style="font-size:12px;font-weight:700;color:${TEXT};">${data.sevenDayAverage}/100</div>
    </div>
    <div style="flex:1;background:${CARD_BG};border:1px solid ${BORDER};border-left:none;padding:10px 12px;">
      <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px;">Color</div>
      <div style="font-size:12px;font-weight:700;color:${TEXT};">${escape(data.colorLabel)}</div>
    </div>
    <div style="flex:1;background:${CARD_BG};border:1px solid ${BORDER};border-left:none;padding:10px 12px;border-radius:0 8px 8px 0;">
      <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.4px;margin-bottom:3px;">Water Advice</div>
      <div style="font-size:11px;font-weight:700;color:${TEXT};line-height:1.3;">${escape(data.waterAdvice)}</div>
    </div>
  </div>

  <!-- ── ACTION STEPS ── -->
  <div class="section">
    <div class="section-title">Immediate Actions</div>
    ${stepList}
  </div>

  <!-- ── WHAT CAUSES THIS COLOR ── -->
  <div class="section">
    <div class="section-title">What Can Cause This Color</div>
    <div style="font-size:11px;color:${MUTED};margin-bottom:10px;line-height:1.5;">
      These are the most common clinical reasons for ${escape(data.colorLabel.toLowerCase())} urine.
      Identifying the cause helps you and your doctor decide the right next step.
    </div>
    ${causesList}
  </div>

  <!-- ── 24H RECOVERY PLAN ── -->
  <div class="section">
    <div class="section-title">24-Hour Recovery Plan</div>
    ${recoveryRows}
  </div>

  <!-- ── 7-DAY TREND ── -->
  <div class="section">
    <div class="section-title">7-Day Hydration Trend</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div style="font-size:11px;color:${MUTED};">Today:
        <span style="color:${TEXT};font-weight:700;font-size:14px;"> ${data.score}</span>/100
      </div>
      <div style="font-size:11px;color:${MUTED};">7-day average:
        <span style="color:${TEXT};font-weight:700;font-size:14px;"> ${data.sevenDayAverage}</span>/100
      </div>
    </div>
    <div style="overflow:hidden;border-radius:6px;">${sparkSvg(data.spark)}</div>
    <div style="margin-top:10px;font-size:11px;color:${TEXT_BODY};line-height:1.6;
      padding:10px 12px;background:${PRIMARY_LIGHT};border-radius:6px;">
      ${escape(data.sevenDayPattern)}
    </div>
  </div>

  <!-- ── BODY SYSTEMS ── -->
  <div class="section">
    <div class="section-title">How This Level Affects Your Body</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">${bodyTiles}</div>
  </div>

  <!-- ── ELECTROLYTES ── -->
  <div class="section">
    <div class="section-title">Electrolyte &amp; Nutrition Cues</div>
    <div style="font-size:12px;color:${TEXT_BODY};line-height:1.7;
      padding:10px 14px;background:${WHITE};border:1px solid ${BORDER};border-radius:6px;">
      ${escape(data.electrolyteCue)}
    </div>
  </div>

  <!-- ── LIFESTYLE ── -->
  <div class="section">
    <div class="section-title">Lifestyle Nudges</div>
    ${nudgeList}
  </div>

  <!-- ── DOCTOR CHECKLIST ── -->
  ${checklistSection}

  <!-- ── FOOTER ── -->
  <div style="margin-top:24px;padding-top:14px;border-top:1px solid ${BORDER};
    font-size:9.5px;color:${MUTED};line-height:1.6;">
    <div style="font-weight:700;color:${TEXT};margin-bottom:4px;">Disclaimer</div>
    <p>UriScan AI is a wellness app that uses AI to generate hydration reports based on the urine color you selected.
    It is not a medical device, does not provide clinical diagnosis, and does not replace advice from a qualified healthcare professional.
    If you experience persistent discoloration, pain, or other symptoms, please consult a doctor.</p>
    <div style="margin-top:8px;color:${MUTED};">
      Report ${escape(data.reportId)} · Scan ${data.scanId} · Generated by UriScan AI v${escape(data.appVersion)}
    </div>
  </div>

</div>
</body>
</html>`;
}
