// game.js
function closeFinishDialog() {
  // 1. Grab the time and wind scores from our current URL bar
  const urlParams = new URLSearchParams(window.location.search);
  const finalTimeScore = Number(urlParams.get('time')) || 0;
  const windSpeedValue = urlParams.get('wind') || '0';

  // 2. Fetch the existing leaderboard records from localStorage
  // (Assuming your leaderboard records are saved under the key 'leaderboardScores')
  const savedScoresRaw = localStorage.getItem('leaderboardScores') || "[]";
  const leaderboardArray = JSON.parse(savedScoresRaw);

  // 3. Run your ranking check calculation dynamically!
  let makesTop10 = false;

  if (leaderboardArray.length < 10) {
    // If the leaderboard has fewer than 10 scores, ANY completed time makes the list!
    makesTop10 = true;
  } else {
    // Sort scores from fastest to slowest just to be completely safe
    leaderboardArray.sort((a, b) => Number(a.time) - Number(b.time));
    
    // Check if the current time is faster than the slow 10th-place cutoff score
    const cutoffTime = Number(leaderboardArray[9].time);
    if (finalTimeScore < cutoffTime) {
      makesTop10 = true;
    }
  }

  // 4. Direct the player based on the outcome
  if (makesTop10) { 
    alert(`Congratulations! Your time of ${finalTimeScore} seconds qualified for the Top 10!`);
    window.location.href = `enterName.html?time=${finalTimeScore}&wind=${windSpeedValue}`;
  } else {
    alert(`Great race! However, your time of ${finalTimeScore} seconds did not break into the Top 10.`);
    window.location.href = "leaderboard.html";
  }
}



async function loadPartial(id, file) {
const res = await fetch(file);
const html = await res.text();
document.getElementById(id).innerHTML = html;

// Attach click handlers once dashboard is loaded
if (id === "dashboard-container") {
    document.querySelectorAll(".dashboard-item").forEach(item => {
    item.addEventListener("click", function() {
        const targetId = this.getAttribute("data-target");

        // Hide all input sections
        document.querySelectorAll(".input-section").forEach(div => {
        div.classList.remove("active");
        });

        // Show the one that matches
        const targetDiv = document.getElementById(targetId);
        if (targetDiv) {
        targetDiv.classList.add("active");
        }
    });
    });
}
}

// Load both partials
loadPartial("dashboard-container", "partials/dashboard.html");
loadPartial("input-container", "partials/input.html");

// Map start simulation button logic
const mapStartSimulationBtn = document.getElementById('mapStartSimulationBtn');
if (mapStartSimulationBtn) {
    mapStartSimulationBtn.addEventListener('click', () => {
    launchSimulation();
    mapStartSimulationBtn.style.display = 'none';
    // Show the feedback notification
    showNotification("You are in Irons! Do something to start moving.");
    });
}
