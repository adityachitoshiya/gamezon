import './style.css';
import { createIcons, icons } from 'lucide';

const API_URL = 'http://localhost:3000/api';

// Games will be fetched from API instead of hardcoded

// ============================================================
// ALL SLOTS
// ============================================================
const ALL_SLOTS = [
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM'
];

let selectedConsole = 'PS5';

// ============================================================
// INITIALIZATION
// ============================================================
function initIcons() {
  createIcons({ icons });
}

async function fetchAndRenderGames() {
  const scroll = document.getElementById('games-scroll');
  const grid = document.getElementById('games-page-grid');
  const gameSelect = document.getElementById('b-game');
  
  if (!scroll && !grid && !gameSelect) return;

  try {
    const res = await fetch(`${API_URL}/games`);
    const games = await res.json();

    if (games.length === 0) {
      if (scroll) scroll.innerHTML = '<p class="text-sm text-gray-500 py-4">No games available.</p>';
      if (grid) grid.innerHTML = '<div class="col-span-2 text-center text-sm text-gray-500 py-4">No games available.</div>';
      if (gameSelect) gameSelect.innerHTML = '<option value="" disabled selected>No Games Found</option>';
      return;
    }

    if (scroll) {
      scroll.innerHTML = games.map(game => `
        <div class="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm shrink-0 active:scale-95 transition-transform w-[140px] snap-start flex flex-col">
          <div class="w-full h-24 rounded-xl mb-3 overflow-hidden bg-gray-100 flex items-center justify-center">
            <img src="${game.image}" alt="${game.name}" class="w-full h-full object-cover pointer-events-none" onerror="this.src='https://placehold.co/100x100?text=No+Img'" />
          </div>
          <h3 class="font-bold text-gray-900 text-sm truncate">${game.name}</h3>
          <p class="text-[10px] text-gray-500 mt-0.5 truncate">${game.type}</p>
        </div>
      `).join('');
    }

    if (grid) {
      grid.innerHTML = games.map(game => `
        <div class="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm active:scale-95 transition-transform w-full mb-4 break-inside-avoid inline-block flex flex-col">
          <div class="w-full rounded-xl mb-3 overflow-hidden bg-gray-100 flex items-center justify-center">
            <img src="${game.image}" alt="${game.name}" class="w-full h-auto object-cover pointer-events-none" onerror="this.src='https://placehold.co/400x600?text=No+Img'" />
          </div>
          <h3 class="font-bold text-gray-900 text-sm">${game.name}</h3>
          <p class="text-[10px] text-gray-500 mt-0.5">${game.type}</p>
        </div>
      `).join('');
    }
    
    if (gameSelect) {
      gameSelect.innerHTML = '<option value="" disabled selected>Select Game</option>' + 
        games.map(game => `<option value="${game.name}">${game.name}</option>`).join('');
    }

    createIcons({ icons });
  } catch (error) {
    console.error('Error fetching games:', error);
  }
}

// ============================================================
// BOOKING LOGIC & API INTEGRATION
// ============================================================
function initBookingLogic() {
  const form = document.getElementById('app-booking-form');
  if (!form) return;

  const dateInput = document.getElementById('b-date');
  const slotInput = document.getElementById('b-slot');
  const statusTxt = document.getElementById('slot-status');
  const msgBox = document.getElementById('frontend-msg');
  const dateScroll = document.getElementById('custom-date-scroll');
  const timeGrid = document.getElementById('custom-time-grid');
  const timeContainer = document.getElementById('time-container');
  const consoleCards = document.querySelectorAll('.rig-card');

  // Handle Console Selection Styling
  consoleCards.forEach(card => {
    card.addEventListener('click', () => {
      consoleCards.forEach(c => {
        c.classList.remove('border-blue-500', 'border-2', 'shadow-[0_4px_12px_rgba(59,130,246,0.15)]', 'opacity-100');
        c.classList.add('border-gray-200', 'border', 'shadow-sm', 'opacity-60');
        const icon = c.querySelector('.check-icon');
        if (icon) icon.remove();
      });

      card.classList.remove('border-gray-200', 'border', 'shadow-sm', 'opacity-60');
      card.classList.add('border-blue-500', 'border-2', 'shadow-[0_4px_12px_rgba(59,130,246,0.15)]', 'opacity-100');
      
      const checkIcon = document.createElement('div');
      checkIcon.className = 'absolute top-0 right-0 p-2 text-blue-500 check-icon';
      checkIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
      card.appendChild(checkIcon);

      selectedConsole = card.dataset.console;
      if (dateInput.value) fetchAvailableSlots(); 
    });
  });

  // Generate Calendar UI (Next 14 Days)
  const today = new Date();
  let dateHtml = '';
  
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    
    dateHtml += `
      <div class="calendar-card min-w-[70px] flex flex-col items-center justify-center py-3 bg-gray-50 border border-gray-200 rounded-xl snap-start shrink-0 transition-all hover:bg-gray-100" data-date="${isoDate}">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 pointer-events-none">${dayName}</span>
        <span class="text-xl font-black text-gray-800 pointer-events-none">${dayNum}</span>
      </div>
    `;
  }
  dateScroll.innerHTML = dateHtml;

  // Calendar Click Handling
  dateScroll.addEventListener('click', (e) => {
    const card = e.target.closest('.calendar-card');
    if (!card) return;

    dateScroll.querySelectorAll('.calendar-card').forEach(c => {
      c.classList.remove('bg-blue-600', 'text-white', 'border-blue-700', 'shadow-md');
      c.classList.add('bg-gray-50', 'text-gray-800', 'border-gray-200');
      c.querySelector('span:first-child').classList.replace('text-blue-200', 'text-gray-400');
      c.querySelector('span:last-child').classList.replace('text-white', 'text-gray-800');
    });

    card.classList.remove('bg-gray-50', 'text-gray-800', 'border-gray-200');
    card.classList.add('bg-blue-600', 'text-white', 'border-blue-700', 'shadow-md');
    card.querySelector('span:first-child').classList.replace('text-gray-400', 'text-blue-200');
    card.querySelector('span:last-child').classList.replace('text-gray-800', 'text-white');

    dateInput.value = card.dataset.date;
    slotInput.value = ''; // reset time
    fetchAvailableSlots();
  });

  // Fetch Slots Box Generator
  async function fetchAvailableSlots() {
    timeContainer.classList.remove('opacity-50', 'pointer-events-none');
    statusTxt.textContent = 'Syncing...';
    statusTxt.className = 'text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 animate-pulse';
    timeGrid.innerHTML = '';

    try {
      const res = await fetch(`${API_URL}/booked-slots?date=${dateInput.value}&console=${selectedConsole}`);
      const bookedSlots = await res.json();
      
      let html = '';
      let availableCount = 0;

      ALL_SLOTS.forEach(slot => {
        // Parse "10:00 AM - 11:00 AM" to just "10:00 AM" for UI brevity
        const shortSlot = slot.split(' - ')[0];
        
        if (bookedSlots.includes(slot)) {
          html += `<div class="bg-gray-100 text-gray-400 font-bold text-xs py-3 rounded-lg text-center border border-gray-100 opacity-60 cursor-not-allowed flex flex-col"><span class="line-through">${shortSlot}</span><span class="text-[8px] uppercase tracking-widest mt-0.5">Booked</span></div>`;
        } else {
          html += `<div class="time-card bg-white text-gray-700 font-bold text-xs py-3 rounded-lg text-center border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors" data-fullslot="${slot}">${shortSlot}</div>`;
          availableCount++;
        }
      });

      timeGrid.innerHTML = html;
      
      if (availableCount > 0) {
        statusTxt.textContent = `${availableCount} Slots Open`;
        statusTxt.className = 'text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200';
      } else {
        statusTxt.textContent = `Fully Booked`;
        statusTxt.className = 'text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200';
      }
    } catch (error) {
      console.error(error);
      statusTxt.textContent = 'Network Error';
      statusTxt.className = 'text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200';
    }
  }

  // Time Grid Click Handling
  timeGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.time-card');
    if (!card) return;

    timeGrid.querySelectorAll('.time-card').forEach(c => {
      c.classList.remove('bg-blue-600', 'text-white', 'border-blue-700', 'shadow-md');
      c.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
    });

    card.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
    card.classList.add('bg-blue-600', 'text-white', 'border-blue-700', 'shadow-md');
    
    slotInput.value = card.dataset.fullslot;
  });

  // Submit Booking
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!dateInput.value || !slotInput.value) {
      msgBox.textContent = 'Please select a valid date and time slot.';
      msgBox.className = 'mt-6 p-4 rounded-xl text-sm font-bold text-center border text-red-600 bg-red-50 border-red-100 block';
      return;
    }

    const submitBtn = document.getElementById('b-submit');
    const textSpan = document.getElementById('b-btn-text');
    
    const data = {
      name: document.getElementById('b-name').value.trim(),
      phone: document.getElementById('b-phone').value.trim(),
      game: document.getElementById('b-game').value,
      console: selectedConsole,
      date: dateInput.value,
      slot: slotInput.value,
    };

    submitBtn.disabled = true;
    textSpan.textContent = 'Processing...';

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseData = await res.json();

      if (res.ok) {
        msgBox.innerHTML = '<span class="block text-2xl mb-2">🎉</span>Booking Confirmed! Pay at venue.';
        msgBox.className = 'mt-6 p-4 rounded-xl text-sm font-bold text-center border text-green-700 bg-green-50 border-green-200 block';
        form.reset();
        dateScroll.querySelectorAll('.calendar-card').forEach(c => c.classList.remove('bg-blue-600', 'text-white', 'border-blue-700', 'shadow-md'));
        timeGrid.innerHTML = '';
        timeContainer.classList.add('opacity-50', 'pointer-events-none');
        statusTxt.textContent = 'Pick a date first';
        statusTxt.className = 'text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100';
        dateInput.value = '';
        slotInput.value = '';
      } else {
        msgBox.textContent = responseData.error || 'Failed to book slot.';
        msgBox.className = 'mt-6 p-4 rounded-xl text-sm font-bold text-center border text-red-600 bg-red-50 border-red-100 block';
      }
    } catch (err) {
      msgBox.textContent = 'Server connection failed.';
      msgBox.className = 'mt-6 p-4 rounded-xl text-sm font-bold text-center border text-red-600 bg-red-50 border-red-100 block';
    } finally {
      submitBtn.disabled = false;
      textSpan.textContent = 'Confirm Booking';
      
      setTimeout(() => {
        msgBox.classList.add('hidden');
        msgBox.classList.remove('block');
      }, 5000);
    }
  });
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  fetchAndRenderGames();
  initBookingLogic();
});
