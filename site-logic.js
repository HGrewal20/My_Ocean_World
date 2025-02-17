/***********************************************
* 2. YOUR SITE LOGIC (QOTD, Timer, etc.)       *
************************************************/
alert("Welcome to my website!");

const startButton = document.getElementById('start-button');
const widgetContainer = document.getElementById('widget-container');
const qotdWidget = document.getElementById('qotd-widget');
const qotdPopup = document.getElementById('qotd-popup');
const timerWidget = document.getElementById('timer-widget');
const timerPopup = document.getElementById('timer-popup');

let timerInterval;
let remainingTime = 0;
let currentQuote = null;
let lastQuoteDate = null;

startButton.addEventListener('click', () => {
  widgetContainer.classList.toggle('open');
});

qotdWidget.addEventListener('click', toggleQOTD);
timerWidget.addEventListener('click', toggleTimer);

document.getElementById('start-timer').addEventListener('click', startTimer);
document.getElementById('pause-timer').addEventListener('click', pauseTimer);
document.getElementById('reset-timer').addEventListener('click', resetTimer);

// "The Sea" button functionality using a persistent audio instance
var seaAudio = new Audio('sfx/(insert_file_here).mp3');
document.getElementById('sea-button').addEventListener('click', function () {
  if (seaAudio.paused) {
    seaAudio.play();
  } else {
    seaAudio.pause();
  }
});

function toggleQOTD() {
  if (qotdPopup.style.display === 'block') {
    qotdPopup.style.display = 'none';
  } else {
    qotdPopup.style.display = 'block';
    updateQuote();
  }
}

function toggleTimer() {
  if (timerPopup.style.display === 'block') {
    timerPopup.style.display = 'none';
  } else {
    timerPopup.style.display = 'block';
  }
}

function startTimer() {
  if (remainingTime === 0) {
    const days = parseInt(document.getElementById('days').value) || 0;
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;

    remainingTime = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;

    // Update input fields with actual values (including zeros)
    document.getElementById('days').value = days;
    document.getElementById('hours').value = hours;
    document.getElementById('minutes').value = minutes;
    document.getElementById('seconds').value = seconds;
  }

  if (remainingTime > 0) {
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('start-timer').textContent = 'Resume';
  } else {
    alert('Please set a time greater than 0.');
  }
}

function pauseTimer() {
  clearInterval(timerInterval);
  document.getElementById('start-timer').textContent = 'Resume';
}

function resetTimer() {
  clearInterval(timerInterval);
  remainingTime = 0;
  updateTimerDisplay();
  document.getElementById('start-timer').textContent = 'Start';

  // Clear all input fields
  document.getElementById('days').value = '';
  document.getElementById('hours').value = '';
  document.getElementById('minutes').value = '';
  document.getElementById('seconds').value = '';
}

function updateTimer() {
  if (remainingTime > 0) {
    remainingTime--;
    updateTimerDisplay();
  } else {
    clearInterval(timerInterval);
    alert('Timer finished!');
    document.getElementById('start-timer').textContent = 'Start';
  }
}

function updateTimerDisplay() {
  const days = Math.floor(remainingTime / (24 * 60 * 60));
  const hours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
  const seconds = remainingTime % 60;

  document.getElementById('timer-display').textContent =
    `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateClock() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  const timeString = `${day} ${month} ${date}, ${hours}:${minutes}:${seconds} ${ampm}`;
  document.getElementById('clock').textContent = timeString;
}

function updateQuote() {
  const today = new Date().toDateString();
  if (lastQuoteDate !== today) {
    const quotes = [
      { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
      { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
    ];
    currentQuote = quotes[Math.floor(Math.random() * quotes.length)];
    lastQuoteDate = today;
  }
  document.getElementById('qotd-quote').textContent = `"${currentQuote.text}"`;
  document.getElementById('qotd-author').textContent = `- ${currentQuote.author}`;
}

// Initialize
updateClock();
setInterval(updateClock, 1000);
