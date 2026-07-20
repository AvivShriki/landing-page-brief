/* שאלון אפיון — לוגיקת טופס:
   צ'יפים, שמירה אוטומטית מקומית, פס התקדמות, ולידציה,
   ושליחת סיכום מסודר לוואטסאפ של אביב. */

const WA_NUMBER = '972528225337';
const STORAGE_KEY = 'shriki-brief-v1';

const form = document.getElementById('briefForm');
const progressFill = document.getElementById('progressFill');
const submitNote = document.getElementById('submitNote');

/* --- צ'יפים (בחירה יחידה / מרובה) --- */
const chipValues = {};

document.querySelectorAll('[data-chips]').forEach(group => {
  const name = group.dataset.name;
  const isSingle = group.dataset.chips === 'single';
  chipValues[name] = [];

  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (isSingle) {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        chipValues[name] = [chip.textContent.trim()];
      } else {
        chip.classList.toggle('selected');
        chipValues[name] = [...group.querySelectorAll('.chip.selected')].map(c => c.textContent.trim());
      }
      group.classList.remove('invalid');
      saveDraft();
      updateProgress();
    });
  });
});

/* --- שמירה אוטומטית --- */
function saveDraft() {
  const data = { fields: {}, chips: chipValues };
  new FormData(form).forEach((v, k) => { data.fields[k] = v; });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* מצב פרטי */ }
}

function loadDraft() {
  let data;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return; }
  if (!data) return;

  Object.entries(data.fields || {}).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el && 'value' in el) el.value = v;
  });
  Object.entries(data.chips || {}).forEach(([name, values]) => {
    const group = document.querySelector(`[data-chips][data-name="${name}"]`);
    if (!group) return;
    chipValues[name] = values;
    group.querySelectorAll('.chip').forEach(chip => {
      chip.classList.toggle('selected', values.includes(chip.textContent.trim()));
    });
  });
}

form.addEventListener('input', () => { saveDraft(); updateProgress(); });

/* --- פס התקדמות --- */
function updateProgress() {
  const inputs = [...form.querySelectorAll('input, textarea')];
  const filledInputs = inputs.filter(el => el.value.trim() !== '').length;
  const chipGroups = Object.keys(chipValues).length;
  const filledChips = Object.values(chipValues).filter(v => v.length > 0).length;
  const total = inputs.length + chipGroups;
  const filled = filledInputs + filledChips;
  progressFill.style.width = `${Math.round((filled / total) * 100)}%`;
}

/* --- בניית סיכום לוואטסאפ --- */
const SECTION_LAYOUT = [
  ['👤 פרטים אישיים', [
    ['fullName', 'שם מלא'], ['phone', 'טלפון'], ['email', 'אימייל'],
    ['businessName', 'שם העסק'], ['title', 'תפקיד'],
  ]],
  ['🏠 על העסק', [
    ['businessDesc', 'מה העסק עושה'], ['businessAge', 'ותק'], ['story', 'הסיפור'],
  ]],
  ['🎯 השירות והמטרה', [
    ['service', 'השירות המקודם'], ['pageGoal', 'מטרת הדף'],
    ['showPrices', 'הצגת מחירים'], ['prices', 'מחירון'],
  ]],
  ['👥 קהל היעד', [
    ['audience', 'הלקוח האידיאלי'], ['painPoint', 'הבעיה שנפתרת'], ['area', 'אזור'],
  ]],
  ['⭐ בידול ואמון', [
    ['unique', 'מה מייחד'], ['credentials', 'הכשרות'], ['testimonials', 'המלצות'],
  ]],
  ['🎨 סגנון ועיצוב', [
    ['style', 'סגנון'], ['colors', 'צבעים'], ['avoid', 'להימנע מ'],
    ['inspiration', 'השראה'], ['logo', 'לוגו'],
  ]],
  ['📸 תוכן ונכסים', [
    ['media', 'חומרים ויזואליים'], ['texts', 'טקסטים'], ['socials', 'רשתות'],
  ]],
  ['⚙️ טכני ולו"ז', [
    ['waNumber', 'וואטסאפ לפניות'], ['domain', 'דומיין'],
    ['deadline', 'דדליין'], ['notes', 'הערות'],
  ]],
];

function getValue(name) {
  if (name in chipValues) return chipValues[name].join(', ');
  const el = form.elements[name];
  return el ? el.value.trim() : '';
}

function buildSummary() {
  let msg = '✦ שאלון אפיון לדף נחיתה ✦\n\n';
  SECTION_LAYOUT.forEach(([title, fields]) => {
    const lines = fields
      .map(([name, label]) => [label, getValue(name)])
      .filter(([, v]) => v !== '')
      .map(([label, v]) => `• ${label}: ${v}`);
    if (lines.length) msg += `${title}\n${lines.join('\n')}\n\n`;
  });
  return msg.trim();
}

/* --- ולידציה --- */
function validate() {
  let firstInvalid = null;

  form.querySelectorAll('input[required], textarea[required]').forEach(el => {
    const field = el.closest('.field');
    const ok = el.value.trim() !== '';
    field.classList.toggle('invalid', !ok);
    if (!ok && !firstInvalid) firstInvalid = field;
  });

  document.querySelectorAll('[data-chips][data-required]').forEach(group => {
    const ok = chipValues[group.dataset.name].length > 0;
    group.classList.toggle('invalid', !ok);
    if (!ok && !firstInvalid) firstInvalid = group;
  });

  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    submitNote.hidden = false;
    return false;
  }
  submitNote.hidden = true;
  return true;
}

/* --- שליחה --- */
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate()) return;
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildSummary())}`;
  window.open(url, '_blank');
});

document.getElementById('copyBtn').addEventListener('click', async function () {
  try {
    await navigator.clipboard.writeText(buildSummary());
    this.textContent = 'הסיכום הועתק! ✔';
  } catch (e) {
    this.textContent = 'ההעתקה נכשלה — נסו שוב';
  }
  setTimeout(() => { this.textContent = 'או: העתקת הסיכום ללוח'; }, 2500);
});

/* --- אתחול --- */
loadDraft();
updateProgress();
