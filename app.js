// frontend/app.js

const API_BASE = ''; // same origin

// Safely query elements
const dateInput = document.getElementById('date');
const loadSlotsBtn = document.getElementById('loadSlotsBtn');
const slotsContainer = document.getElementById('slotsContainer');
const slotsList = document.getElementById('slotsList');
const selectedSlotDisplay = document.getElementById('selectedSlotDisplay');
const bookingForm = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');
const calendarGrid = document.getElementById('calendarGrid');

let selectedSlot = null;
let selectedDate = null;

// Initialize booking UI only if elements exist
(function initBooking(){
  if (!dateInput || !loadSlotsBtn || !slotsContainer || !slotsList || !selectedSlotDisplay || !bookingForm || !submitBtn || !formMessage || !calendarGrid) {
    // Booking UI is not present on this page; skip initializing related logic.
    return;
  }

  // Set default date to today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;
  document.getElementById('year').textContent = yyyy;

  loadMonthCalendar(today);

  loadSlotsBtn.addEventListener('click', () => {
    selectedDate = dateInput.value;
    if (!selectedDate) {
      alert('Please choose a date first.');
      return;
    }
    fetchSlots(selectedDate);
    loadMonthCalendar(new Date(selectedDate));
  });

  // Handle booking form submit
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMessage.textContent = '';
    formMessage.className = 'form-message';

    if (!selectedSlot || !dateInput.value) {
      formMessage.textContent = 'Please select a date and time slot.';
      formMessage.classList.add('error');
      return;
    }

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      reason: document.getElementById('reason').value.trim(),
      date: dateInput.value,
      time: selectedSlot,
    };

    if (!payload.name || !payload.email) {
      formMessage.textContent = 'Name and email are required.';
      formMessage.classList.add('error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Booking failed');
      }

      formMessage.textContent = `Appointment booked successfully! Booking ID: ${data.bookingId}`;
      formMessage.classList.add('success');

      // Refresh slots so this time disappears
      await fetchSlots(dateInput.value);
      await loadMonthCalendar(new Date(dateInput.value));
    } catch (err) {
      console.error(err);
      formMessage.textContent = err.message || 'Booking failed. Please try again.';
      formMessage.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Appointment';
    }
  });
})();

async function fetchSlots(dateStr) {
  slotsContainer.classList.add('hidden');
  slotsList.classList.remove('fade-in');
  slotsList.innerHTML = '';
  selectedSlot = null;
  selectedSlotDisplay.value = '';
  submitBtn.disabled = true;
  formMessage.textContent = '';

  try {
    const res = await fetch(`/api/slots?date=${encodeURIComponent(dateStr)}`);
    if (!res.ok) {
      throw new Error('Failed to load slots');
    }
    const data = await res.json();
    if (!data.availableSlots || data.availableSlots.length === 0) {
      slotsList.innerHTML = '<p>No available slots for this date.</p>';
    } else {
      data.availableSlots.forEach((slot) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'slot-pill';
        pill.textContent = slot;
        pill.addEventListener('click', () => {
          document.querySelectorAll('.slot-pill').forEach((el) =>
            el.classList.remove('selected')
          );
          pill.classList.add('selected');
          selectedSlot = slot;
          selectedSlotDisplay.value = `${dateStr} at ${slot}`;
          submitBtn.disabled = false;
        });
        slotsList.appendChild(pill);
      });
    }
    slotsContainer.classList.remove('hidden');
    void slotsList.offsetWidth; // reflow
    slotsList.classList.add('fade-in');
  } catch (err) {
    console.error(err);
    slotsList.innerHTML = '<p class="error">Error loading slots. Please try again.</p>';
    slotsContainer.classList.remove('hidden');
  }
}

async function loadMonthCalendar(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;
  try {
    const res = await fetch(`/api/month-summary?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Failed to load month summary');
    const data = await res.json();
    renderCalendar(baseDate, data.days);
    void calendarGrid.offsetWidth; // reflow
    calendarGrid.classList.add('fade-in');
  } catch (err) {
    console.error(err);
    if (calendarGrid) {
      calendarGrid.innerHTML = '<p style="grid-column: span 7; font-size: 0.8rem; color: #b91c1c;">Error loading calendar</p>';
    }
  }
}

function renderCalendar(baseDate, daysSummary) {
  if (!calendarGrid) return;
  calendarGrid.innerHTML = '';
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const map = {};
  (daysSummary || []).forEach(d => { map[d.date] = d; });
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  weekdays.forEach(w => {
    const cell = document.createElement('div');
    cell.className = 'cal-header';
    cell.textContent = w;
    calendarGrid.appendChild(cell);
  });
  for (let i = 0; i < startWeekday; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell empty';
    calendarGrid.appendChild(cell);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    const dateObj = new Date(year, month, day);
    const dateStr = dateObj.toISOString().slice(0, 10);
    const info = map[dateStr];
    let statusClass = 'available';
    if (dateObj < todayMidnight) statusClass = 'past';
    if (info && info.availableSlots === 0) statusClass = 'full';
    cell.classList.add(statusClass);
    cell.textContent = day;
    if (statusClass !== 'past') {
      cell.addEventListener('click', () => {
        if (!dateInput) return;
        dateInput.value = dateStr;
        fetchSlots(dateStr);
      });
    } else {
      cell.style.cursor = 'default';
    }
    calendarGrid.appendChild(cell);
  }
}

// Scroll reveal implementation
(function(){
  const onReveal = () => {
    const els = document.querySelectorAll('.reveal');
    const vh = window.innerHeight;
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if(rect.top < vh * 0.88){
        el.classList.add('revealed');
      }
    });
  };
  window.addEventListener('load', onReveal);
  window.addEventListener('scroll', onReveal, { passive: true });
})();

// Referral functions
function scrollToReferralForm() {
  const referralForm = document.getElementById('referralForm');
  if (referralForm) {
    referralForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus on the email input
    setTimeout(() => {
      const emailInput = document.getElementById('newsletterEmail');
      if (emailInput) {
        emailInput.focus();
      }
    }, 500);
  }
}

function scrollToBooking() {
  const bookingSection = document.getElementById('booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function openReferralModal(imageType) {
  const modal = document.getElementById('referralModal');
  const modalImage = modal ? modal.querySelector('.modal-image img') : null;
  if (!modal || !modalImage) return;
  
  // Set the appropriate image based on which button was clicked
  if (imageType === 'image2') {
    modalImage.src = 'image 2.png';
    modalImage.alt = 'Telehealth Services';
  } else if (imageType === 'image3') {
    modalImage.src = 'Image 3.png';
    modalImage.alt = 'Friend discount';
  } else if (imageType === 'image4') {
    modalImage.src = 'image 4.png';
    modalImage.alt = 'Special Offer';
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReferralModal() {
  const modal = document.getElementById('referralModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function submitReferral() {
  const emailInput = document.getElementById('referralEmail');
  const consent = document.getElementById('marketingConsent');
  
  if (emailInput && emailInput.value) {
    const email = emailInput.value.trim();
    if (validateEmail(email)) {
      // Here you would typically send the referral to your backend
      alert('Thank you! Your referral link will be sent to ' + email);
      emailInput.value = '';
      closeReferralModal();
    } else {
      alert('Please enter a valid email address.');
    }
  } else {
    alert('Please enter your email address.');
  }
}

function submitNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  if (emailInput && emailInput.value) {
    const email = emailInput.value.trim();
    if (validateEmail(email)) {
      // Here you would typically send the email to your backend
      alert('Thank you for subscribing! We\'ll keep you updated with exclusive offers.');
      emailInput.value = '';
    } else {
      alert('Please enter a valid email address.');
    }
  } else {
    alert('Please enter your email address.');
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Social sharing functions
function shareViaEmail() {
  const subject = encodeURIComponent('Check out Zintas Family Clinic');
  const body = encodeURIComponent('I wanted to share Zintas Family Clinic with you. They offer quality healthcare services. Visit: ' + window.location.href);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function shareViaFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareViaMessenger() {
  const url = encodeURIComponent(window.location.href);
  window.open(`fb-messenger://share/?link=${url}`, '_blank');
}

function shareViaWhatsApp() {
  const text = encodeURIComponent('Check out Zintas Family Clinic for quality healthcare services: ' + window.location.href);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeReferralModal();
    closeDisclaimersModal();
    closePrivacyModal();
    closeTermsModal();
    closeHipaaModal();
  }
});

// ========================================
// Disclaimers Modal Functions
// ========================================
function openDisclaimersModal() {
  console.log('Opening disclaimers modal');
  const modal = document.getElementById('disclaimersModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeDisclaimersModal() {
  console.log('Closing disclaimers modal');
  const modal = document.getElementById('disclaimersModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ========================================
// Privacy Policy Modal Functions
// ========================================
function openPrivacyModal() {
  console.log('Opening privacy modal');
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closePrivacyModal() {
  console.log('Closing privacy modal');
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ========================================
// Terms of Service Modal Functions
// ========================================
function openTermsModal() {
  console.log('Opening terms modal');
  const modal = document.getElementById('termsModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeTermsModal() {
  console.log('Closing terms modal');
  const modal = document.getElementById('termsModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ========================================
// HIPAA Notice Modal Functions
// ========================================
function openHipaaModal() {
  console.log('Opening HIPAA modal');
  const modal = document.getElementById('hipaaModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeHipaaModal() {
  console.log('Closing HIPAA modal');
  const modal = document.getElementById('hipaaModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ========================================
// FAQ Toggle Functionality
// ========================================
function toggleFAQ(button) {
  const faqItem = button.parentElement;
  const isActive = faqItem.classList.contains('active');
  
  // Close all FAQ items in the same category
  const category = faqItem.closest('.faq-category');
  const allItems = category.querySelectorAll('.faq-item');
  allItems.forEach(item => item.classList.remove('active'));
  
  // Toggle current item
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ========================================
// Footer Modal Link Event Listeners
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  // Privacy Policy link
  const privacyLinks = document.querySelectorAll('a[href="#privacy"]');
  privacyLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openPrivacyModal();
    });
  });

  // Terms of Service link
  const termsLinks = document.querySelectorAll('a[href="#terms"]');
  termsLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openTermsModal();
    });
  });

  // HIPAA Notice link
  const hipaaLinks = document.querySelectorAll('a[href="#hipaa"]');
  hipaaLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openHipaaModal();
    });
  });

  // Telehealth Disclaimers link
  const disclaimerLinks = document.querySelectorAll('a[href="#telehealth-disclaimers"]');
  disclaimerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openDisclaimersModal();
    });
  });
});

// ========================================
// Generic modal close handlers (X button & overlay)
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  // Close when clicking any .modal-close button
  document.querySelectorAll('.modal .modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal');
      if (!modal) return;
      modal.style.display = 'none';
      document.body.style.overflow = '';
    });
  });

  // Close when clicking any overlay
  document.querySelectorAll('.modal .modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = overlay.closest('.modal');
      if (!modal) return;
      modal.style.display = 'none';
      document.body.style.overflow = '';
    });
  });
});
