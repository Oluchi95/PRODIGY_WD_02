document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const millisecondsElement = document.getElementById('milliseconds');
    const startResumeBtn = document.getElementById('startResumeBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const lapBtn = document.getElementById('lapBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const themeToggle = document.getElementById('themeToggle');
    const lapsList = document.getElementById('lapsList');
    const totalLapsElement = document.getElementById('totalLaps');
    const fastestLapElement = document.getElementById('fastestLap');
    const slowestLapElement = document.getElementById('slowestLap');

    // Audio Elements
    const startSound = document.getElementById('startSound');
    const lapSound = document.getElementById('lapSound');
    const resetSound = document.getElementById('resetSound');

    // Variables
    let startTime;
    let elapsedTime = 0;
    let timerInterval;
    let isRunning = false;
    let isPaused = false;
    let lapCount = 0;
    let laps = [];
    let fastestLap = null;
    let slowestLap = null;

    // Theme Management
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('stopwatchTheme', theme);
        updateThemeButton(theme);
    }

    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('stopwatchTheme') || 'light';
    setTheme(savedTheme);

    // Theme toggle event
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Format time to always show 2 digits
    function formatTime(time) {
        return time.toString().padStart(2, '0');
    }

    // Format milliseconds to always show 2 digits
    function formatMilliseconds(time) {
        return time.toString().padStart(2, '0').slice(0, 2);
    }

    // Convert milliseconds to time object
    function msToTime(ms) {
        const milliseconds = Math.floor(ms % 1000 / 10);
        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / (1000 * 60)) % 60;
        const hours = Math.floor(ms / (1000 * 60 * 60));

        return {
            hours,
            minutes,
            seconds,
            milliseconds,
            formatted: `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}.${formatMilliseconds(milliseconds)}`,
            totalMs: ms
        };
    }

    // Update the stopwatch display
    function updateDisplay() {
        const time = msToTime(elapsedTime);
        millisecondsElement.textContent = formatMilliseconds(time.milliseconds);
        secondsElement.textContent = formatTime(time.seconds);
        minutesElement.textContent = formatTime(time.minutes);
        hoursElement.textContent = formatTime(time.hours);
    }

    // Update button states
    function updateButtonStates() {
        startResumeBtn.disabled = isRunning;
        pauseBtn.disabled = !isRunning;
        stopBtn.disabled = !isRunning;
        lapBtn.disabled = !isRunning;
        resetBtn.disabled = isRunning;
    }

    // Start or Resume the stopwatch
    function startResumeTimer() {
        if (!isRunning && !isPaused) {
            // Initial start
            startSound.play();
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(() => {
                elapsedTime = Date.now() - startTime;
                updateDisplay();
            }, 10);
            isRunning = true;
            isPaused = false;
            
            startResumeBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            updateButtonStates();
        } else if (!isRunning && isPaused) {
            // Resuming from pause
            startSound.play();
            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(() => {
                elapsedTime = Date.now() - startTime;
                updateDisplay();
            }, 10);
            isRunning = true;
            isPaused = false;
            
            updateButtonStates();
        }
    }

    // Pause the stopwatch
    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        isPaused = true;
        
        // Change Start button to Resume
        startResumeBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        updateButtonStates();
    }

    // Stop the stopwatch
    function stopTimer() {
        resetSound.play();
        clearInterval(timerInterval);
        isRunning = false;
        isPaused = false;
        
        // Reset Start/Resume button
        startResumeBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        updateButtonStates();
    }

    // Reset the stopwatch
    function resetTimer() {
        stopTimer();
        elapsedTime = 0;
        lapCount = 0;
        laps = [];
        fastestLap = null;
        slowestLap = null;
        
        updateDisplay();
        totalLapsElement.textContent = '0';
        fastestLapElement.textContent = '00:00:00.00';
        slowestLapElement.textContent = '00:00:00.00';
        lapsList.innerHTML = '';
    }

    // Record a lap time
    function recordLap() {
        if (!isRunning) return;
        
        lapSound.play();
        const currentTime = msToTime(elapsedTime);
        const lapTime = currentTime.formatted;
        lapCount++;
        
        // Add to laps array
        laps.push({
            number: lapCount,
            time: lapTime,
            totalMs: currentTime.totalMs
        });
        
        // Update fastest and slowest laps
        if (!fastestLap || currentTime.totalMs < fastestLap.totalMs) {
            fastestLap = currentTime;
            fastestLapElement.textContent = lapTime;
        }
        
        if (!slowestLap || currentTime.totalMs > slowestLap.totalMs) {
            slowestLap = currentTime;
            slowestLapElement.textContent = lapTime;
        }
        
        // Update total laps count
        totalLapsElement.textContent = lapCount;
        
        // Add to DOM
        const lapItem = document.createElement('li');
        lapItem.innerHTML = `
            <span>Lap ${lapCount}</span>
            <span>${lapTime}</span>
        `;
        lapsList.prepend(lapItem);
    }

    // Export lap times to CSV
    function exportLapsToCSV() {
        if (laps.length === 0) {
            alert('No lap times to export!');
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,Lap Number,Time\n";
        
        laps.forEach(lap => {
            csvContent += `${lap.number},${lap.time}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lap_times.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Initialize button states
    updateButtonStates();

    // Event Listeners
    startResumeBtn.addEventListener('click', startResumeTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    stopBtn.addEventListener('click', stopTimer);
    resetBtn.addEventListener('click', resetTimer);
    lapBtn.addEventListener('click', recordLap);
    exportBtn.addEventListener('click', exportLapsToCSV);
});