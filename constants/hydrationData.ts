import type { HydrationColor, HydrationResult } from '@/types';

export interface ColorSwatch {
  id: HydrationColor;
  label: string;
  hex: string;
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { id: 'clear',        label: 'Clear',        hex: '#F0F9FF' },
  { id: 'pale-yellow',  label: 'Pale Yellow',  hex: '#FFFDE7' },
  { id: 'light-yellow', label: 'Light Yellow', hex: '#FEF9C3' },
  { id: 'straw',        label: 'Straw',        hex: '#FEF08A' },
  { id: 'yellow',       label: 'Yellow',       hex: '#FDE047' },
  { id: 'dark-yellow',  label: 'Dark Yellow',  hex: '#CA8A04' },
  { id: 'honey',        label: 'Honey',        hex: '#D97706' },
  { id: 'amber',        label: 'Amber',        hex: '#B45309' },
  { id: 'orange',       label: 'Orange',       hex: '#C2410C' },
  { id: 'orange-red',   label: 'Orange Red',   hex: '#9A3412' },
  { id: 'brown',        label: 'Brown',        hex: '#78350F' },
  { id: 'dark-brown',   label: 'Dark Brown',   hex: '#451A03' },
  { id: 'red',          label: 'Red',          hex: '#991B1B' },
  { id: 'pink',         label: 'Pink',         hex: '#FDA4AF' },
  { id: 'cloudy',       label: 'Cloudy',       hex: '#D4D4B8' },
  { id: 'green',        label: 'Green',        hex: '#15803D' },
];

type HydrationDataEntry = Omit<HydrationResult, 'color'>;

export const HYDRATION_DATA: Record<HydrationColor, HydrationDataEntry> = {
  clear: {
    level: 'overhydrated',
    score: 90,
    title: 'Overhydrated',
    message:
      'Your urine is fully dilute — you are taking in more water than your kidneys can efficiently process. Occasional clear urine is harmless, but when consistent it may signal overhydration or, rarely, a medical condition that prevents your kidneys from concentrating urine (diabetes insipidus, psychogenic polydipsia).',
    action: 'Slow down on water for now',
    waterAdvice: 'Pause intake for 1–2 hours',
    colorHex: '#F0F9FF',
    shouldSeeDoctor: false,
    actionSteps: [
      'Pause water intake for 1–2 hours and let thirst guide your next glass.',
      'Have a small salty snack (a few crackers or a light meal) to help restore sodium and electrolyte balance.',
      'If you feel nauseous, have a headache, or feel confused — these may be signs of hyponatremia (low blood sodium); seek medical care immediately.',
      'If your urine is persistently clear without drinking excess fluids, see a doctor to rule out diabetes insipidus or kidney dysfunction.',
      'Re-scan after your next meal to confirm you are back in the pale-yellow range.',
    ],
    causes: [
      'Drinking more than 3 liters of water per day without elevated thirst or heavy sweating',
      'Diuretics — furosemide (Lasix), hydrochlorothiazide, spironolactone; force the kidneys to excrete excess water',
      'Alcohol — inhibits antidiuretic hormone (ADH), causing the kidneys to produce large volumes of dilute urine',
      'Diabetes insipidus (central or nephrogenic) — kidneys cannot concentrate urine; a person may produce 3–20 liters per day',
      'Psychogenic polydipsia — compulsive water drinking, often linked to psychiatric conditions',
      'Uncontrolled diabetes mellitus — osmotic diuresis from high blood sugar drives excess urination',
      'Lithium therapy — can cause nephrogenic diabetes insipidus as a side effect',
    ],
  },

  'pale-yellow': {
    level: 'optimal',
    score: 96,
    title: 'Well Hydrated',
    message:
      'Pale yellow is the clinical benchmark for excellent hydration. Your kidneys are diluting urine efficiently, urochrome pigment is at an ideal concentration, and your fluid-electrolyte balance is right where it should be. This is the Armstrong Scale level 1–2 — the well-hydrated zone.',
    action: 'Maintain your current pace',
    waterAdvice: 'Maintain your current intake',
    colorHex: '#FFFDE7',
    shouldSeeDoctor: false,
    actionSteps: [
      'Keep drinking at your current pace — no urgent change needed.',
      'Re-scan after exercise, a long flight, or a hot day to stay ahead of any dip.',
      'Log this scan to build your hydration streak.',
      'Aim to keep most of your daily scans in this pale-yellow to light-yellow range.',
    ],
    causes: [
      'Adequate daily fluid intake of approximately 1.5–2.5 liters — the healthy baseline for most adults',
      'Normal metabolic urochrome (urobilin) production balanced against appropriate water intake',
      'B-vitamin supplements (especially riboflavin B2) can slightly brighten the yellow tone even when perfectly hydrated',
      'First-morning voids may be a shade deeper; subsequent voids after drinking lighten to this optimal zone',
    ],
  },

  'light-yellow': {
    level: 'optimal',
    score: 100,
    title: 'Perfect Hydration',
    message:
      'Light yellow is the gold standard on the Armstrong Urine Color Scale — the precise shade that corresponds to optimal plasma osmolality and excellent kidney function. This is the target every clinician and sports scientist points to. Armstrong Scale level 2–3.',
    action: 'Perfect — keep it up',
    waterAdvice: 'Maintain your current intake',
    colorHex: '#FEF9C3',
    shouldSeeDoctor: false,
    actionSteps: [
      'Continue drinking at your usual pace — you have hit the ideal zone.',
      'Re-check after exercise or hot weather to spot any early shift.',
      'Log this scan to maintain your hydration streak.',
      'Front-load water in the first half of the day to stay in this range all afternoon.',
    ],
    causes: [
      'Optimal fluid intake — typically 1.5–2 liters per day for sedentary adults, more for active individuals',
      'Normal kidney filtration producing appropriately concentrated urine with ideal urochrome levels',
      'Slight variation from pale-yellow due to minor dietary timing or B-vitamin intake is perfectly normal',
    ],
  },

  straw: {
    level: 'mild',
    score: 82,
    title: 'Slightly Dehydrated',
    message:
      'Straw yellow is just below the ideal window — your kidneys are concentrating urine slightly more than optimal. The Armstrong Scale clinical benchmark uses "straw" as the target, so you are very close. One or two glasses of water will bring you back on track quickly.',
    action: 'Drink 1 glass now',
    waterAdvice: 'Drink 1–2 glasses of water',
    colorHex: '#FEF08A',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink one 250–300 ml glass of water now.',
      'Skip caffeinated drinks for the next 45–60 minutes — caffeine has a mild diuretic effect.',
      'Re-scan in 30–45 minutes; you should return to light yellow.',
      'Set a reminder to drink water at least every 90 minutes throughout the day.',
    ],
    causes: [
      'Mild reduction in daily water intake — falling short of your usual target by 1–2 glasses',
      'First-morning void after 6–8 hours without fluid intake — very common and normal',
      'Mild exercise without adequate rehydration',
      'Increased perspiration from warm weather, heated environments, or moderate physical activity',
      'Higher caffeine or alcohol intake earlier in the day (mild diuretic effect)',
      'B-vitamin supplements can slightly deepen yellow even at adequate hydration',
    ],
  },

  yellow: {
    level: 'mild',
    score: 75,
    title: 'Mild Dehydration',
    message:
      'A noticeably yellow urine suggests your fluid intake has fallen slightly short. Your kidneys are concentrating urine to conserve water — Armstrong Scale level 2–4. Easy to fix with one or two glasses. Catch it now before it progresses.',
    action: 'Drink 1–2 glasses soon',
    waterAdvice: 'Drink 1–2 glasses soon',
    colorHex: '#FDE047',
    shouldSeeDoctor: false,
    actionSteps: [
      'Sip 250–500 ml of water steadily over the next 30 minutes.',
      'Take a short break from caffeine until your next scan returns to the green zone.',
      'Have a water-rich snack — cucumber, watermelon, or a piece of fruit.',
      'Re-scan in about 60 minutes to confirm you are back on track.',
    ],
    causes: [
      'Insufficient daily water intake — likely 1–2 glasses short of your target',
      'Midday or afternoon slump in drinking — common when busy or distracted',
      'B-complex vitamins or riboflavin (B2) supplements produce bright yellow even at normal hydration levels',
      'Beta-carotene-rich foods (carrots, sweet potato, pumpkin, squash) can deepen yellow tone',
      'Mild diuretic effect of regular coffee or tea consumption',
      'Minor illness, fever, or increased sweating tipping the balance',
    ],
  },

  'dark-yellow': {
    level: 'moderate',
    score: 50,
    title: 'Moderate Dehydration',
    message:
      'Dark yellow is the first clear clinical signal that your body is conserving water. Your kidneys are working harder than they should — Armstrong Scale level 4–5. You likely feel thirsty, and may notice a mild headache or drop in energy. Rehydrate now before this progresses to the amber or orange zone.',
    action: 'Drink 2–3 glasses now',
    waterAdvice: 'Drink 2–3 glasses now',
    colorHex: '#CA8A04',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink 500–750 ml of water over the next 30 minutes — sip steadily, do not gulp it all at once.',
      'Avoid sugary drinks, alcohol, and coffee until your urine lightens.',
      'If you have been in the heat or exercising, move to a cool, shaded area.',
      'Have a light meal or snack with natural electrolytes (banana, yogurt, lightly salted food).',
      'Re-scan in 60–90 minutes; aim for pale yellow to light yellow.',
    ],
    causes: [
      'Insufficient water intake sustained over several hours',
      'Exercise or physical labor without rehydrating adequately',
      'Hot or humid weather accelerating fluid loss through sweat',
      'High caffeine consumption — coffee, energy drinks, or strong tea have a cumulative diuretic effect',
      'Alcohol from the previous day — alcohol suppresses ADH and leads to prolonged dehydration',
      'High-protein diet increasing urea excretion and urinary concentration',
      'Blunted thirst sensation — common in older adults, making it easy to under-drink without realizing it',
      'Mild illness (low-grade fever, reduced appetite) cutting fluid intake',
    ],
  },

  honey: {
    level: 'severe',
    score: 30,
    title: 'Significant Dehydration',
    message:
      'Honey-colored urine means your body is significantly under-hydrated — Armstrong Scale level 5–6. Kidneys are in a strong conservation mode and symptoms (thirst, fatigue, mild headache) are typically present. Rehydrate with water and electrolytes now. If honey color persists despite adequate intake, early liver disease must be considered.',
    action: 'Drink water + electrolytes',
    waterAdvice: 'Drink 750 ml with electrolytes',
    colorHex: '#D97706',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink 500 ml of water immediately, then another 250 ml over the next 30 minutes.',
      'Add electrolytes — an ORS sachet, coconut water, or a banana alongside water.',
      'Avoid strenuous exercise or further heat exposure until you rehydrate.',
      'Rest in a cool, shaded area.',
      'Re-scan in 45–60 minutes to confirm improvement toward pale or light yellow.',
      'If you feel dizzy, confused, or have a rapid heartbeat: contact a clinician.',
      'If honey color persists beyond 24 hours despite adequate drinking: see a doctor — liver involvement is possible.',
    ],
    causes: [
      'Sustained fluid deficit — not drinking enough over many hours or a full day',
      'Post-exercise dehydration — losing significant sweat without adequate replacement',
      'Illness-related fluid loss: fever, vomiting, or diarrhea reducing intake and increasing losses',
      'GLP-1 receptor agonist medications (semaglutide/Ozempic, tirzepatide) — blunt thirst sensation, making dehydration easy to miss',
      'Extreme heat, prolonged sun exposure, or outdoor physical work in hot conditions',
      'Night shift work with disrupted drinking habits and prolonged sleep without fluids',
      'High-sodium diet causing the body to retain less free water in circulation',
      'Early stages of liver disease — bilirubin may begin to concentrate urine to a golden hue independent of hydration status',
    ],
  },

  amber: {
    level: 'severe',
    score: 25,
    title: 'Severe Dehydration',
    message:
      'Amber urine signals significant dehydration — Armstrong Scale level 6–7 — with all kidney concentration mechanisms at full capacity. Headache, dizziness, and dry mouth are likely. If amber urine does not improve after rehydration, or if it is accompanied by jaundice or pale stools, liver or biliary disease must be ruled out urgently.',
    action: 'Drink water immediately',
    waterAdvice: 'Drink 750 ml–1 L immediately',
    colorHex: '#B45309',
    shouldSeeDoctor: false,
    actionSteps: [
      'Drink 750 ml–1 L of water and electrolytes within the next 30–60 minutes.',
      'Use an ORS (oral rehydration solution) sachet or a glucose-electrolyte drink if available.',
      'Rest and avoid all strenuous activity until your urine lightens.',
      'Monitor for worsening symptoms: dizziness on standing, rapid heart rate, or confusion — these need urgent care.',
      'Re-scan in 60–90 minutes; if still amber, see a doctor the same day.',
      'If accompanied by yellow skin/eyes (jaundice) or pale/clay-colored stools: seek medical attention immediately — liver disease may be the cause, not dehydration.',
    ],
    causes: [
      'Moderate to significant fluid deficit — estimated 2–4% of body weight lost to dehydration',
      'Heavy exercise in heat without rehydration',
      'Fever, vomiting, or diarrhea causing acute fluid and electrolyte loss',
      'Liver disease — hepatitis A, B, C, alcoholic hepatitis, early cirrhosis, or primary biliary cholangitis (PBC); bilirubin spilling into urine turns it amber-brown',
      'Bile duct obstruction — gallstones, cholangitis, or bile duct stricture blocking bilirubin excretion into the gut',
      'Rifampin or rifampicin (TB antibiotic) — produces amber-orange discoloration as an expected side effect',
      'Nitrofurantoin antibiotic — rust-yellow to amber tint',
      'High-dose vitamin B complex supplements',
      'Senna or cascara-based laxatives at higher doses',
    ],
  },

  orange: {
    level: 'severe',
    score: 15,
    title: 'Urgent: Rehydrate Now',
    message:
      'Orange urine is a significant clinical departure from normal. While dietary causes (carrots, sweet potato) and medications (rifampin, phenazopyridine) are common benign causes, orange urine frequently signals severe dehydration or hepatobiliary disease — liver, bile duct, or gallbladder. If you notice any yellowing of the skin or eyes alongside this color, seek same-day emergency evaluation.',
    action: 'Urgent: rehydrate and check for liver signs',
    waterAdvice: 'Drink 1–1.5 L steadily; see doctor if unexplained',
    colorHex: '#C2410C',
    shouldSeeDoctor: false,
    actionSteps: [
      'First, check for orange-colored foods (carrots, sweet potato, squash, pumpkin) or medications (rifampin, phenazopyridine/Pyridium, sulfasalazine) — these safely turn urine orange.',
      'If no dietary or medication cause: drink 1 liter of water steadily over 1–2 hours.',
      'Stop any exercise or heat exposure immediately.',
      'Watch for jaundice (yellow skin or eyes), pale or clay-colored stools, or itching — any of these alongside orange urine requires same-day medical evaluation.',
      'If the color does not improve within a few hours of hydration: see a doctor today.',
      'If accompanied by fever and abdominal pain: go to an emergency room immediately — this may be cholangitis (infected bile duct), which is life-threatening.',
    ],
    causes: [
      'Severe dehydration — extreme urochrome concentration at Armstrong Scale 7–8',
      'Rifampin/rifampicin (TB antibiotic) — produces characteristic orange discoloration of urine, tears, and sweat; expected and harmless',
      'Phenazopyridine (Pyridium) — urinary analgesic; bright orange-red is an expected and harmless side effect',
      'Sulfasalazine — used for IBD and rheumatoid arthritis; orange discoloration',
      'Beta-carotene supplements or large quantities of carrots, sweet potato, squash, pumpkin, or cantaloupe',
      'Liver disease — hepatitis A, B, C, alcoholic hepatitis, cirrhosis, or NASH; bilirubin and bile pigments accumulate in blood and are excreted in urine',
      'Bile duct obstruction — gallstones, cholangiocarcinoma, primary biliary cholangitis, or pancreatic head tumor compressing the bile duct',
      'Hemolytic anemia — excess bilirubin from red blood cell breakdown overwhelms liver processing',
      'Primary biliary cholangitis (PBC) — autoimmune destruction of small bile ducts',
      'Deferoxamine (iron chelation therapy) — produces orange urine as an expected side effect',
    ],
  },

  'orange-red': {
    level: 'warning',
    score: 8,
    title: 'Orange-Red: Rule Out Blood',
    message:
      'Orange-red urine sits at the clinical boundary between harmless medication or dietary effects and hematuria (blood in urine). Rifampin and phenazopyridine are the most common safe causes. Without those medications or a clear dietary trigger, this color requires prompt medical evaluation to rule out bleeding, hemoglobinuria, myoglobinuria, or porphyria.',
    action: 'Identify cause; see doctor if unexplained',
    waterAdvice: 'Drink water and seek medical advice if no clear cause',
    colorHex: '#9A3412',
    shouldSeeDoctor: true,
    actionSteps: [
      'Check immediately: are you taking rifampin (TB antibiotic) or phenazopyridine (urinary pain reliever)? These are the most common safe causes of orange-red urine.',
      'Did you eat beets, rhubarb, or blackberries in the last 4–8 hours? Beeturia affects 10–14% of people and is harmless — monitor for 24 hours.',
      'If no medication or dietary explanation: contact a doctor today.',
      'Watch for accompanying symptoms: flank or back pain, fever, burning urination, muscle pain or weakness — these increase urgency significantly.',
      'Drink water steadily while seeking advice; do not over-hydrate.',
      'If you feel very unwell, are passing blood clots, or cannot urinate: go to an emergency room immediately.',
    ],
    causes: [
      'Rifampin/rifampicin (TB antibiotic) — most common benign cause; expected bright orange-red in urine, tears, sweat, and sputum; harmless',
      'Phenazopyridine (Pyridium) — urinary analgesic; bright orange-red is a harmless and expected side effect',
      'Beeturia — red-orange pigment from beets (betalain); affects ~10–14% of the population; resolves within 24 hours; more pronounced in iron-deficient individuals',
      'Gross hematuria — visible blood from a urinary tract source (kidney stones, infection, tumor, trauma); must be medically investigated',
      'Hemoglobinuria — free hemoglobin from intravascular hemolysis (G6PD deficiency crisis, autoimmune hemolytic anemia, transfusion reaction, sickle cell crisis)',
      'Myoglobinuria (early rhabdomyolysis) — myoglobin from damaged muscle appears reddish-orange before progressing to brown as it oxidizes',
      'Acute porphyria (AIP — Acute Intermittent Porphyria) — reddish-orange urine from porphyrin metabolites; darkens on light exposure',
      'Paroxysmal nocturnal hemoglobinuria (PNH) — rare clonal blood disorder causing intermittent intravascular hemolysis',
      'Doxorubicin and other anthracycline chemotherapy drugs — expected orange-red discoloration',
      'Rhubarb, blackberries, or artificial red/orange food dyes in drinks and candy',
    ],
  },

  brown: {
    level: 'warning',
    score: 5,
    title: 'Brown Urine: See a Doctor',
    message:
      'Brown urine is a serious warning sign in most clinical contexts. It can indicate rhabdomyolysis (dangerous muscle breakdown with kidney failure risk), liver disease, a medication effect, severe dehydration, or kidney inflammation. Unless you are taking a medication specifically known to cause brown urine, seek medical evaluation within 24–48 hours.',
    action: 'Consult a doctor today',
    waterAdvice: 'Drink water steadily and seek medical advice',
    colorHex: '#78350F',
    shouldSeeDoctor: true,
    actionSteps: [
      'Check your medications: metronidazole (Flagyl), nitrofurantoin (Macrobid), chloroquine, methyldopa, and levodopa are known to cause brown urine — confirm with your prescriber.',
      'Did you eat large quantities of fava beans, rhubarb, or aloe vera? These can rarely cause darkening in some people.',
      'If no obvious medication or dietary cause: contact a healthcare professional today — do not wait.',
      'If you exercised intensely and now have muscle soreness or weakness alongside dark urine: go to an emergency room immediately — this is the classic rhabdomyolysis triad and can cause acute kidney injury.',
      'Watch for yellow skin or eyes, pale/clay-colored stools, or right-sided abdominal pain — these indicate liver or gallbladder involvement requiring same-day evaluation.',
      'Drink water steadily (not large volumes at once) while you seek medical advice.',
    ],
    causes: [
      'Metronidazole (Flagyl) antibiotic — characteristic brown discoloration of urine; harmless',
      'Nitrofurantoin (Macrobid) antibiotic — rust to dark-brown tint',
      'Chloroquine or primaquine antimalarials — brown-black urine, especially in G6PD-deficient individuals (triggers hemolysis)',
      'Levodopa (Parkinson medication) or methyldopa (antihypertensive) — metabolites darken urine',
      'Severe dehydration — extreme urochrome concentration at the far end of the dehydration spectrum',
      'Liver disease — hepatitis (A, B, C, D, E), alcoholic hepatitis, cirrhosis, or acute liver failure; conjugated bilirubin appears in urine',
      'Bile duct obstruction — gallstones, cholangiocarcinoma, or pancreatic tumor blocking bilirubin clearance',
      'Rhabdomyolysis — myoglobin released from necrotic muscle oxidizes to dark brown in urine; can cause acute kidney injury',
      'Glomerulonephritis — degraded red blood cells in inflamed glomeruli appear brown-cola colored; post-streptococcal GN, IgA nephropathy',
      'Alkaptonuria — rare genetic disorder where homogentisic acid darkens urine upon standing (urine may turn black)',
      'Porphyria — porphyrin pigments darken urine, especially on light and air exposure',
      'Cascara or senna laxatives at higher doses',
    ],
  },

  'dark-brown': {
    level: 'warning',
    score: 2,
    title: 'Tea-Colored: Possible Emergency',
    message:
      'Dark brown "tea-colored" or "cola-colored" urine is one of the most clinically significant urine presentations in medicine. It can indicate rhabdomyolysis (a life-threatening emergency with kidney failure risk), acute liver failure, severe glomerulonephritis, or acute porphyria. Each of these can progress rapidly. Seek urgent medical attention unless this color is clearly caused by a known medication.',
    action: 'Seek urgent medical attention',
    waterAdvice: 'Sip water steadily and go to urgent care or ER',
    colorHex: '#451A03',
    shouldSeeDoctor: true,
    actionSteps: [
      'If you have muscle pain, weakness, or swelling after intense exercise, a crush injury, seizure, or heat stroke: go to an emergency room immediately — this is the rhabdomyolysis triad. Myoglobin can destroy the kidneys rapidly.',
      'If you have yellow skin or eyes (jaundice) + pale/clay stools + dark urine: this is the classic liver emergency triad — go to hospital the same day.',
      'If you have facial or leg swelling + new high blood pressure + tea-colored urine: urgent nephrology evaluation for glomerulonephritis.',
      'If you have severe abdominal pain + neurological symptoms (confusion, tingling, weakness) + dark urine: possible acute porphyria — call emergency services.',
      'If clearly caused by metronidazole, nitrofurantoin, or cascara laxatives and you have no other symptoms: confirm with your prescriber and monitor closely.',
      'Sip water steadily while waiting — do not exercise or exert yourself.',
      'Bring a list of all medications, supplements, and recent physical activities to your appointment.',
    ],
    causes: [
      'Rhabdomyolysis — myoglobin from necrotic muscle (tea/cola color is the hallmark); triggers include crush injuries, extreme exercise (ultramarathons, CrossFit), prolonged seizures, heat stroke, statins, alcohol + immobility, snake bites, or drug intoxication; can cause fatal acute kidney injury and cardiac arrhythmia from hyperkalemia',
      'Acute liver failure or severe hepatitis — conjugated bilirubin accumulates in blood and is excreted in urine; classic triad: dark urine + jaundice + pale/clay stools = liver or bile duct emergency',
      'Acute glomerulonephritis — degraded red blood cells passing through inflamed glomeruli produce cola-colored urine; post-streptococcal GN, IgA nephropathy, lupus nephritis, ANCA vasculitis, or Goodpasture syndrome',
      'Acute porphyria (AIP, variegate porphyria) — port-wine dark urine from porphyrin metabolites; characteristically darkens further on exposure to light and air; associated with severe abdominal pain, neuropsychiatric symptoms, and autonomic dysfunction',
      'Hemolytic conditions causing hemoglobinuria — G6PD deficiency crisis, autoimmune hemolytic anemia, PNH, sickle cell crisis, or blackwater fever (falciparum malaria with massive hemolysis)',
      'Bile duct obstruction — primary sclerosing cholangitis (PSC), cholangiocarcinoma, or gallstone-related acute cholangitis',
      'Medications: metronidazole (Flagyl), nitrofurantoin (Macrobid), chloroquine, cascara/senna laxatives, levodopa, ribavirin',
      'Alkaptonuria — homogentisic acid darkens urine to near-black upon standing (extremely rare genetic disorder)',
    ],
  },

  red: {
    level: 'warning',
    score: 0,
    title: 'Red Urine: Seek Medical Attention',
    message:
      'Red urine is medically significant until proven otherwise. Even 1 mL of blood per liter of urine produces a visible red color (gross hematuria). While beets, berries, or specific medications (rifampin, phenazopyridine) are common benign causes, any unexplained red urine must be evaluated promptly — in adults over 35, urological malignancy must always be excluded, even if the hematuria resolves on its own.',
    action: 'Seek medical attention today',
    waterAdvice: 'Seek medical attention; do not delay for hydration alone',
    colorHex: '#991B1B',
    shouldSeeDoctor: true,
    actionSteps: [
      'Ask yourself: did you eat beets, blackberries, rhubarb, or dragon fruit in the last 2–8 hours? Beeturia affects ~14% of people and is harmless — monitor for 24–48 hours.',
      'Are you taking rifampin, phenazopyridine (Pyridium), or doxorubicin? These safely color urine red-orange.',
      'Did you do intense running or other vigorous exercise? Runner\'s hematuria typically resolves within 72 hours of rest.',
      'If none of the above apply: contact a doctor same-day or go to urgent care.',
      'Any adult over 35 with unexplained gross hematuria should have a full urological workup — urinalysis, urine cytology, imaging (CT urogram), and possible cystoscopy — even if the bleeding resolves spontaneously.',
      'Do not delay — painless hematuria carries a higher cancer risk than painful hematuria.',
      'If you are passing blood clots, cannot urinate, have severe pain with fever, or feel hemodynamically unwell: go to the emergency room immediately.',
    ],
    causes: [
      'Urinary tract infection (UTI) — the most common cause in women; E. coli, Klebsiella, Staphylococcus saprophyticus',
      'Kidney stones (ureterolithiasis) — stones scratch the urinary tract lining as they pass, causing blood loss',
      'Bladder cancer — most commonly presents as painless, intermittent gross hematuria in adults 50+; smoking is the #1 risk factor; other occupational chemical exposure (aromatic amines) also increases risk',
      'Kidney (renal cell) carcinoma — classic triad: hematuria + flank pain + abdominal mass',
      'IgA nephropathy (Berger\'s disease) — the most common glomerulonephritis worldwide; hematuria typically follows upper respiratory infections by 1–3 days',
      'Post-streptococcal glomerulonephritis — 1–3 weeks after strep throat; coca-cola colored urine + facial edema + new hypertension',
      'Beets (beeturia) — harmless betalain pigment; affects ~10–14% of people; resolves in 24–48 hours; more pronounced in iron-deficient individuals',
      'Runner\'s hematuria — bladder contusion from foot-strike, hemolysis, or mild renal trauma; resolves within 72 hours of rest',
      'Anticoagulant medications (warfarin, rivaroxaban, heparin, apixaban) — can unmask pre-existing urological pathology or cause frank hematuria',
      'Cyclophosphamide chemotherapy — causes hemorrhagic cystitis with frank hematuria',
      'Benign prostatic hyperplasia (BPH) — bleeding from engorged prostatic veins',
      'Schistosomiasis — parasitic bladder infection; classic cause in Africa and the Middle East',
      'Sickle cell disease — renal papillary necrosis causes episodic frank hematuria',
      'Endometriosis involving the bladder — cyclic hematuria timed with menstruation',
      'Alport syndrome (hereditary nephritis) — X-linked progressive kidney disease with persistent hematuria',
      'Rifampin, phenazopyridine, or senna-based medications — reddish-orange discoloration (harmless)',
    ],
  },

  pink: {
    level: 'warning',
    score: 3,
    title: 'Pink Urine: Blood Possible',
    message:
      'Pink urine signals the same clinical concerns as red urine, just in smaller amounts — as little as 1 mL of blood per liter of urine is enough to produce a visible pink tinge (microscopic to early gross hematuria). The most common benign cause is beets or berries. But without a clear dietary or medication explanation, medical evaluation is needed — especially in anyone over 40, where bladder cancer is a leading cause.',
    action: 'Monitor 24 hours; see doctor if persistent',
    waterAdvice: 'Monitor closely; see doctor if no dietary cause',
    colorHex: '#FDA4AF',
    shouldSeeDoctor: true,
    actionSteps: [
      'Recall recent food and drink: beets, dragon fruit, blackberries, rhubarb, or red food coloring are common benign causes.',
      'If dietary cause is likely: drink extra water and monitor — the pink color should fully clear within 24–48 hours.',
      'If pregnant and you see pink urine: contact your doctor the same day — UTI and preeclampsia must be ruled out promptly.',
      'If no dietary cause, or if it persists beyond 48 hours: see a doctor within 24 hours.',
      'Any person over 40 with unexplained pink urine should have a urinalysis and imaging to rule out malignancy — bladder cancer is the most common cause of painless hematuria in that age group.',
      'If pain, burning, or urinary urgency accompanies the pink color: see a doctor today — UTI or kidney stone is likely.',
    ],
    causes: [
      'Beets (beeturia) — betalain pigment; affects ~10–14% of people; harmless; resolves within 24–48 hours; more pronounced in iron-deficient individuals or those with low stomach acid',
      'Dragon fruit (pitaya), rhubarb, blackberries, or red food coloring in drinks and candy',
      'Urinary tract infection — minimal blood and white blood cells from urinary tract irritation',
      'Kidney stones — small amount of blood from stones scratching the ureteral wall as they travel',
      'Runner\'s hematuria or exercise-induced hematuria — bladder contusion or renal trauma; resolves within 72 hours of rest',
      'IgA nephropathy — classic pink urine following a sore throat or upper respiratory infection (synpharyngitic hematuria)',
      'Thin basement membrane disease — benign familial hematuria causing minimal, persistent pink urine; usually benign',
      'Bladder cancer — painless pink or red urine is the most common presenting symptom in adults 50+; diagnosis cannot be missed',
      'Endometriosis of the bladder — cyclic pink urine coinciding with menstruation',
      'Hemoglobinuria from mild hemolytic anemia — hemoglobin turns urine pink to red',
      'Porphyria — pink-red urine that characteristically darkens on exposure to light and air',
      'Phenazopyridine (Pyridium), rifampin, or senna-based medications — expected reddish-orange discoloration (harmless)',
      'Menstrual blood contamination of a mid-stream urine sample',
    ],
  },

  cloudy: {
    level: 'warning',
    score: 10,
    title: 'Cloudy Urine: Investigate',
    message:
      'Cloudy or turbid urine indicates suspended particles — white blood cells from a UTI, phosphate or oxalate crystals (often harmless), protein from kidney disease, fat from nephrotic syndrome, or lymphatic fluid (chyluria). The cause determines severity. A UTI needs antibiotics; persistent foam needs a kidney function test; milky-white urine needs urgent evaluation.',
    action: 'Consult a healthcare professional',
    waterAdvice: 'Drink water and see a doctor within 24 hours',
    colorHex: '#D4D4B8',
    shouldSeeDoctor: true,
    actionSteps: [
      'Increase water intake now — if cloudiness is from crystal precipitation or mild dehydration, it may clear within 2–4 hours of drinking extra water.',
      'If cloudiness persists, or is accompanied by burning urination, urgency, or a foul odor: see a doctor today — UTI is very likely and requires antibiotics.',
      'If you have fever or flank pain with cloudy urine: seek urgent care — this may be a kidney infection (pyelonephritis), which requires IV antibiotics if severe.',
      'If your urine appears foamy or frothy and does not clear: schedule a kidney function test for proteinuria — this is a key sign of kidney disease.',
      'If the urine looks milky white: seek evaluation today — this may be chyluria (lymphatic fluid in urine) from parasitic infection or lymphatic damage.',
      'If you are pregnant with cloudy urine: contact your doctor the same day — UTI in pregnancy and preeclampsia-related proteinuria must be ruled out.',
      'If you notice bubbles with a foul odor: this could indicate an enterovesical fistula (bowel connecting to bladder from Crohn\'s or diverticulitis) — urgent evaluation needed.',
    ],
    causes: [
      'Urinary tract infection (UTI) — the most common cause; bacteria, white blood cells (pyuria), and mucus cause turbidity; E. coli accounts for >90% of uncomplicated UTIs',
      'Kidney infection (pyelonephritis) — UTI ascending to the kidneys; adds fever, chills, nausea, and flank pain',
      'Phosphate crystals (phosphaturia) — phosphate in alkaline urine after a dairy-rich or vegetable-heavy meal; usually harmless; clears with mild acidification or hydration',
      'Calcium oxalate or uric acid crystals — from spinach, nuts, chocolate (oxalate) or seafood, organ meats, beer (uric acid/gout); associated with kidney stone risk',
      'Sexually transmitted infections — chlamydia, gonorrhea (purulent discharge contaminating urine), or trichomoniasis',
      'Nephrotic syndrome or proteinuria — protein reduces surface tension, making urine persistently foamy or cloudy; glomerular disease, diabetic nephropathy, or hypertension-related kidney damage',
      'Glomerulonephritis — kidney inflammation allowing protein, white blood cells, and red blood cells to pass into urine',
      'Chyluria — lymphatic fluid leaking into urine via damaged lymphatic-urinary tract connections; milky white appearance; caused by lymphatic filariasis (parasitic infection), lymphoma, or surgical trauma',
      'Preeclampsia in pregnancy — proteinuria causes foamy/cloudy urine; a potentially life-threatening condition requiring immediate obstetric management',
      'Vaginal discharge contamination — yeast infection (Candida) or bacterial vaginosis can cloud a mid-stream urine sample',
      'Enterovesical fistula — connection between bowel and bladder (from Crohn\'s disease or diverticulitis) allowing gas, bacteria, and fecal matter to enter urine (pneumaturia)',
      'Diabetic nephropathy — longstanding, poorly controlled diabetes causing progressive protein loss into urine',
    ],
  },

  green: {
    level: 'warning',
    score: 5,
    title: 'Green Urine: Identify the Cause',
    message:
      'Green urine is uncommon and almost always has a specific, identifiable cause. In most cases it is medication-induced and benign. The most clinically important pathological cause is a Pseudomonas aeruginosa urinary tract infection — an often antibiotic-resistant organism requiring culture-guided treatment. Green urine from chronic obstructive jaundice (biliverdin excretion) indicates serious liver or bile duct disease.',
    action: 'Identify cause; see doctor if unexplained',
    waterAdvice: 'Drink water and contact a clinician if no clear cause',
    colorHex: '#15803D',
    shouldSeeDoctor: true,
    actionSteps: [
      'Review all current medications: propofol (ICU anesthetic), amitriptyline, indomethacin, promethazine, cimetidine, methylene blue, and metoclopramide are all known to cause green urine — usually benign and resolves after stopping.',
      'Check for green food dyes in sports drinks, sodas, or artificially colored candy consumed in the last 12–24 hours.',
      'If you have a urinary catheter or are an ICU patient: seek medical evaluation today — Pseudomonas UTI is a likely cause and requires culture-guided antibiotics (it is often resistant to standard antibiotics).',
      'If no dietary or medication explanation: see a doctor within 1–2 days.',
      'If you also have yellow skin or eyes (jaundice): see a doctor same-day — obstructive jaundice converting bilirubin to biliverdin can turn urine green.',
      'If you have fever, burning urination, urgency, or frequent urination: urgent evaluation for Pseudomonas infection.',
      'Stop any suspected medication (only with prescriber guidance) and monitor whether the green color resolves within 24–48 hours.',
    ],
    causes: [
      'Propofol anesthetic — the most common cause in ICU patients; phenol metabolites excreted as quinol conjugates give a characteristic green tint; resolves 8–24 hours after stopping',
      'Amitriptyline (tricyclic antidepressant) — phenol-containing metabolites are excreted as green urinary conjugates',
      'Indomethacin (NSAID/anti-inflammatory) — produces green urine through metabolite excretion',
      'Promethazine (antihistamine/antiemetic) — phenol group metabolized to green conjugates',
      'Cimetidine (H2 blocker antacid) — causes green discoloration via metabolic pathways',
      'Methylene blue — dye used in surgical procedures, methemoglobinemia treatment, and some compound medications (ProSed DS); produces vivid blue-green urine',
      'Mitoxantrone (chemotherapy) — produces blue-green urine as an expected side effect',
      'Pseudomonas aeruginosa UTI — gram-negative bacterium producing pyocyanin (blue-green) and pyoverdin (yellow-green/fluorescent) pigments; combined, these produce green urine; more common in catheterized patients, ICU patients, and immunosuppressed individuals; frequently antibiotic-resistant — requires urine culture to guide therapy',
      'Obstructive jaundice (chronic/severe) — bilirubin oxidizes to biliverdin (a blue-green compound); seen in primary sclerosing cholangitis (PSC), cholangiocarcinoma, or severe chronic bile duct obstruction',
      'Green food coloring in sports drinks, sodas, candies, or artificially colored foods and drinks',
      'Asparagus — asparagusic acid metabolites can give a slight green tinge in some individuals',
      'Hartnup disease (rare aminoacidopathy) — tryptophan malabsorption leading to indigo and indirubin pigments in urine',
      'Enterovesical fistula — bowel contents entering the bladder via a fistula (from Crohn\'s disease or diverticulitis) can introduce bile pigments and bacteria',
    ],
  },
};

export function getLevelColor(level: HydrationResult['level']): string {
  switch (level) {
    case 'optimal':
      return '#10B981';
    case 'overhydrated':
      return '#06B6D4';
    case 'mild':
      return '#FDE047';
    case 'moderate':
      return '#F59E0B';
    case 'severe':
      return '#EF4444';
    case 'warning':
      return '#7F1D1D';
  }
}
