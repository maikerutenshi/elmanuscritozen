const CALENDAR_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CALENDAR_WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function calendarDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCalendarTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function toDatetimeLocalValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function groupByDay(items, dateField) {
  const map = {};
  items.forEach((item) => {
    const key = calendarDateKey(new Date(item[dateField]));
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

async function loadCalendarData() {
  const scheduledFile = await readRepoFile(ZEN_ADMIN.scheduledIndexPath || 'posts/scheduled.json');
  const postsFile = await readRepoFile(ZEN_ADMIN.postsIndexPath);

  const scheduled = scheduledFile ? JSON.parse(scheduledFile.content) : [];
  const posts = postsFile ? JSON.parse(postsFile.content) : [];

  return {
    scheduled: Array.isArray(scheduled) ? scheduled : [],
    published: Array.isArray(posts) ? posts : [],
  };
}

function renderPublishCalendar(container, state, handlers) {
  const { viewYear, viewMonth, scheduledByDay, selectedKey, onSelectDay } = state;
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = calendarDateKey(new Date());

  let cells = '';
  for (let i = 0; i < startOffset; i += 1) {
    cells += '<div class="cal-cell cal-cell--empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewYear, viewMonth, day);
    const key = calendarDateKey(date);
    const items = scheduledByDay[key] || [];
    const classes = ['cal-cell'];
    if (items.length) classes.push('cal-cell--scheduled');
    if (key === todayKey) classes.push('cal-cell--today');
    if (key === selectedKey) classes.push('cal-cell--selected');

    const times = items
      .map((item) => `<span class="cal-time">${formatCalendarTime(item.publishAt)}</span>`)
      .join('');

    cells += `
      <button type="button" class="${classes.join(' ')}" data-date="${key}">
        <span class="cal-day">${day}</span>
        ${times ? `<span class="cal-times">${times}</span>` : ''}
      </button>`;
  }

  container.innerHTML = `
    <div class="cal-header">
      <button type="button" class="cal-nav" data-dir="-1" aria-label="Mes anterior">‹</button>
      <h4 class="cal-title">${CALENDAR_MONTHS[viewMonth]} ${viewYear}</h4>
      <button type="button" class="cal-nav" data-dir="1" aria-label="Mes siguiente">›</button>
    </div>
    <div class="cal-weekdays">
      ${CALENDAR_WEEKDAYS.map((name) => `<span>${name}</span>`).join('')}
    </div>
    <div class="cal-grid">${cells}</div>
    <p class="cal-legend"><span class="cal-legend-dot"></span> Día con entrada programada</p>
  `;

  container.querySelectorAll('.cal-cell[data-date]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectDay(button.dataset.date);
    });
  });

  container.querySelectorAll('.cal-nav').forEach((button) => {
    button.addEventListener('click', () => {
      handlers.onMonthChange(Number(button.dataset.dir));
    });
  });
}

function initPublishCalendar({ containerId, datetimeInputId }) {
  const container = document.getElementById(containerId);
  const datetimeInput = document.getElementById(datetimeInputId);
  if (!container || !datetimeInput) return null;

  const state = {
    viewDate: new Date(),
    scheduled: [],
    selectedKey: null,
  };

  function applySelectedDate(key, keepTime) {
    state.selectedKey = key;
    const [year, month, day] = key.split('-').map(Number);
    let hours = 9;
    let minutes = 0;

    if (keepTime && datetimeInput.value) {
      const current = new Date(datetimeInput.value);
      if (!Number.isNaN(current.getTime())) {
        hours = current.getHours();
        minutes = current.getMinutes();
      }
    }

    const selected = new Date(year, month - 1, day, hours, minutes, 0, 0);
    datetimeInput.value = toDatetimeLocalValue(selected);
    render();
  }

  function render() {
    const scheduledByDay = groupByDay(state.scheduled, 'publishAt');
    renderPublishCalendar(container, {
      viewYear: state.viewDate.getFullYear(),
      viewMonth: state.viewDate.getMonth(),
      scheduledByDay,
      selectedKey: state.selectedKey,
      onSelectDay: (key) => applySelectedDate(key, true),
    }, {
      onMonthChange: (delta) => {
        state.viewDate = new Date(
          state.viewDate.getFullYear(),
          state.viewDate.getMonth() + delta,
          1
        );
        render();
      },
    });
  }

  async function refresh() {
    const data = await loadCalendarData();
    state.scheduled = data.scheduled;
    render();
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  datetimeInput.value = toDatetimeLocalValue(tomorrow);
  state.selectedKey = calendarDateKey(tomorrow);

  refresh().catch((err) => {
    console.warn('Calendario:', err);
    render();
  });

  return {
    refresh,
    render,
    resetSelection: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      state.selectedKey = calendarDateKey(d);
      applySelectedDate(state.selectedKey, false);
    },
  };
}
