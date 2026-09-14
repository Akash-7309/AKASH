const TOTAL_LAPS = 3;
const TRACK_LENGTH = 5000;
const TOTAL_DISTANCE = TOTAL_LAPS * TRACK_LENGTH;

let turn = 0;
let raceOver = false;
let currentEvent = "Race ready on the starting grid.";

let drivers = [
  {
    name: "Alex",
    car: "Scarlet Apex R8",
    distance: 0,
    lap: 1,
    damage: 0,
    speed: 0,
    nitro: 2,
    pitRequired: false,
    status: "Ready",
    cssClass: "car-alex"
  },
  {
    name: "Zephyr",
    car: "Midnight Vortex GT",
    distance: 0,
    lap: 1,
    damage: 0,
    speed: 0,
    nitro: 2,
    pitRequired: false,
    status: "Ready",
    cssClass: "car-zephyr"
  },
  {
    name: "Tara",
    car: "White Falcon RS",
    distance: 0,
    lap: 1,
    damage: 0,
    speed: 0,
    nitro: 2,
    pitRequired: false,
    status: "Ready",
    cssClass: "car-tara"
  },
  {
    name: "Marcus",
    car: "Graphite Ironclad X",
    distance: 0,
    lap: 1,
    damage: 0,
    speed: 0,
    nitro: 2,
    pitRequired: false,
    status: "Ready",
    cssClass: "car-marcus"
  }
];

const raceInfo = document.getElementById("raceInfo");
const track = document.getElementById("track");
const driversElement = document.getElementById("drivers");
const commentary = document.getElementById("commentary");
const gameState = document.getElementById("gameState");
const actionButtons = document.querySelectorAll("[data-action]");
const restartButton = document.getElementById("restart");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const startRaceButton = document.getElementById("startRace");
const backHomeButton = document.getElementById("backHome");

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addCommentary(text) {
  const entry = document.createElement("div");
  entry.textContent = text;
  commentary.prepend(entry);
}

function getTrackSection(driver) {
  const distanceOnLap = driver.distance % TRACK_LENGTH;

  if (distanceOnLap < 900) {
    return "Start/Finish Straight";
  }

  if (distanceOnLap < 1800) {
    return "Turn 1 Hairpin";
  }

  if (distanceOnLap < 2900) {
    return "Mountain Esses";
  }

  if (distanceOnLap < 4100) {
    return "Tunnel Straight";
  }

  return "Final Chicane";
}

function updateLap(driver) {
  const completedLaps = Math.floor(driver.distance / TRACK_LENGTH);
  driver.lap = Math.min(TOTAL_LAPS, completedLaps + 1);

  if (driver.distance >= TOTAL_DISTANCE) {
    driver.lap = TOTAL_LAPS;
  }
}

function applyTrackEvent(driver) {
  const section = getTrackSection(driver);
  const roll = randomNumber(1, 6);

  if (section === "Turn 1 Hairpin" && roll <= 2) {
    driver.damage = Math.min(100, driver.damage + 12);
    driver.distance = Math.max(0, driver.distance - 100);
    driver.status = "Braked too late at the hairpin";
    return {
      text: `${driver.name} locks the brakes at Turn 1, loses 100 meters, and takes 12% damage.`,
      event: "Late braking at Turn 1"
    };
  }

  if (section === "Mountain Esses" && roll === 1) {
    driver.damage = Math.min(100, driver.damage + 18);
    driver.distance = Math.max(0, driver.distance - 180);
    driver.status = "Spun on the mountain esses";
    return {
      text: `${driver.name}'s car snaps sideways through the mountain esses. A spin costs 180 meters and causes 18% damage.`,
      event: "Spin in the mountain esses"
    };
  }

  if (section === "Final Chicane" && roll <= 2) {
    driver.damage = Math.min(100, driver.damage + 8);
    driver.distance = Math.max(0, driver.distance - 80);
    driver.status = "Ran wide at the chicane";
    return {
      text: `${driver.name} runs wide at the final chicane and loses 80 meters.`,
      event: "Final chicane incident"
    };
  }

  driver.status = `Clean run through ${section}`;
  return {
    text: `${driver.name} handles ${section} cleanly.`,
    event: `Clear track at ${section}`
  };
}

function performAction(driver, action) {
  let reasoning = "";
  let movement = 0;

  if (driver.pitRequired && action !== "pit") {
    return {
      reasoning: "The vehicle has critical damage, so racing actions are unavailable until a pit stop is completed.",
      text: `${driver.name} cannot continue at race pace and must pit.`,
      event: "Mandatory pit stop"
    };
  }

  if (action === "accelerate") {
    reasoning = "Acceleration gives strong forward movement but increases the chance of a track incident.";
    movement = randomNumber(170, 280);

    if (randomNumber(1, 6) === 1) {
      driver.damage = Math.min(100, driver.damage + 8);
      driver.status = "Engine strain under acceleration";
    }
  }

  if (action === "corner") {
    reasoning = "Holding the racing line reduces risk while maintaining moderate speed.";
    movement = randomNumber(110, 190);
  }

  if (action === "overtake") {
    reasoning = "An overtake attempt gives extra speed, but a failed attempt can cause contact.";
    movement = randomNumber(140, 250);

    if (randomNumber(1, 6) <= 2) {
      driver.damage = Math.min(100, driver.damage + 10);
      movement -= 70;
      driver.status = "Contact during overtake";
    }
  }

  if (action === "nitro") {
    reasoning = "Nitro provides the largest boost, but it consumes one charge and may overheat the car.";

    if (driver.nitro <= 0) {
      return {
        reasoning: "No nitro charges remain, so the action cannot be used.",
        text: `${driver.name} presses the nitro button, but the system is empty.`,
        event: "Nitro unavailable"
      };
    }

    driver.nitro--;
    movement = randomNumber(280, 420);

    if (randomNumber(1, 6) === 1) {
      driver.damage = Math.min(100, driver.damage + 15);
      driver.status = "Nitro overheating";
    }
  }

  if (action === "pit") {
    reasoning = "A pit stop sacrifices one turn but repairs damage and restores race reliability.";
    driver.damage = Math.max(0, driver.damage - 45);
    driver.pitRequired = false;
    driver.status = "Leaving the pit lane";

    return {
      reasoning,
      text: `${driver.name} makes a pit stop. Mechanics repair the car before the driver rejoins the race.`,
      event: "Pit stop"
    };
  }

  driver.distance += movement;
  driver.speed = movement;
  updateLap(driver);

  const trackEvent = applyTrackEvent(driver);

  if (driver.damage >= 70) {
    driver.pitRequired = true;
    driver.status = "Critical damage - pit required";
  }

  return {
    reasoning,
    text:
      `${driver.name} covers ${movement} meters. ` +
      trackEvent.text,
    event: trackEvent.event
  };
}

function chooseAiAction() {
  const roll = randomNumber(1, 100);

  if (roll <= 15) return "pit";
  if (roll <= 35) return "overtake";
  if (roll <= 55) return "nitro";
  if (roll <= 75) return "accelerate";
  return "corner";
}

function getWinner() {
  return drivers.find(driver => driver.distance >= TOTAL_DISTANCE);
}

function renderTrack() {
  track.innerHTML = '<div class="finish-line"></div>';

  drivers.forEach(driver => {
    const marker = document.createElement("div");
    const percent = Math.min(
      97,
      Math.max(2, (driver.distance / TOTAL_DISTANCE) * 100)
    );

    marker.className = `car-marker ${driver.cssClass}`;
    marker.style.left = `${percent}%`;
    marker.style.top = `${15 + drivers.indexOf(driver) * 23}px`;
    marker.textContent = driver.name;

    track.appendChild(marker);
  });
}

function renderDrivers() {
  driversElement.innerHTML = "";

  const ranking = [...drivers].sort(
    (a, b) => b.distance - a.distance
  );

  ranking.forEach((driver, index) => {
    const card = document.createElement("div");
    card.className = "driver-card";

    const health = Math.max(0, 100 - driver.damage);

    card.innerHTML = `
      <h3>${index + 1}. ${driver.name}</h3>
      <p><strong>Car:</strong> ${driver.car}</p>
      <p><strong>Lap:</strong> ${driver.lap}/${TOTAL_LAPS}</p>
      <p><strong>Section:</strong> ${getTrackSection(driver)}</p>
      <p><strong>Distance:</strong> ${driver.distance}m</p>
      <p><strong>Speed:</strong> ${driver.speed}m/turn</p>
      <p><strong>Nitro:</strong> ${driver.nitro}</p>
      <p><strong>Status:</strong> ${driver.status}</p>
      <p><strong>Vehicle Health:</strong> ${health}%</p>
      <div class="health">
        <div class="health-bar" style="width: ${health}%"></div>
      </div>
    `;

    driversElement.appendChild(card);
  });
}

function updateState() {
  const ranking = [...drivers].sort(
    (a, b) => b.distance - a.distance
  );

  raceInfo.textContent =
    `Turn ${turn} | Leader: ${ranking[0].name} | ` +
    `Race distance: ${Math.min(ranking[0].distance, TOTAL_DISTANCE)} / ${TOTAL_DISTANCE}m`;

  const state = {
    turn,
    drivers: drivers.map(driver => ({
      name: driver.name,
      car: driver.car,
      position: `${Math.min(driver.distance, TOTAL_DISTANCE)}m - ${getTrackSection(driver)}`,
      lap: driver.lap,
      status: driver.status,
      damage: `${driver.damage}%`,
      speed: `${driver.speed}m per turn`,
      nitro_remaining: driver.nitro,
      pit_required: driver.pitRequired
    })),
    current_event: currentEvent
  };

  gameState.textContent = JSON.stringify(state, null, 2);
  renderTrack();
  renderDrivers();
}

function disableButtons() {
  actionButtons.forEach(button => {
    button.disabled = true;
  });
}

function enableButtons() {
  actionButtons.forEach(button => {
    button.disabled = false;
  });
}

function checkWinner() {
  const winner = getWinner();

  if (!winner) {
    return false;
  }

  raceOver = true;
  currentEvent = `Race finished - ${winner.name} wins!`;
  winner.status = "Race winner";
  disableButtons();

  addCommentary(
    `🏆 ${winner.name} crosses the finish line first in the ${winner.car}! ` +
    `The crowd erupts as the checkered flag waves above Thunder Ridge.`
  );

  updateState();
  return true;
}

function playerTurn(action) {
  if (raceOver) return;

  turn++;

  addCommentary(`\n--- Turn ${turn}: Alex's move ---`);

  const player = drivers[0];
  const result = performAction(player, action);

  addCommentary(`Reasoning: ${result.reasoning}`);
  addCommentary(result.text);

  currentEvent = result.event;
  updateState();

  if (checkWinner()) return;

  setTimeout(aiTurns, 700);
}

function aiTurns() {
  for (let i = 1; i < drivers.length; i++) {
    if (raceOver) return;

    const driver = drivers[i];
    const action = chooseAiAction();
    const result = performAction(driver, action);

    addCommentary(`\n--- ${driver.name}'s move ---`);
    addCommentary(`Reasoning: ${result.reasoning}`);
    addCommentary(result.text);

    currentEvent = result.event;
    updateState();

    if (checkWinner()) return;
  }

  currentEvent = "Waiting for Alex's next decision.";
  updateState();
}

function resetRace() {
  turn = 0;
  raceOver = false;
  currentEvent = "Race ready on the starting grid.";

  drivers = [
    {
      name: "Alex",
      car: "Scarlet Apex R8",
      distance: 0,
      lap: 1,
      damage: 0,
      speed: 0,
      nitro: 2,
      pitRequired: false,
      status: "Ready",
      cssClass: "car-alex"
    },
    {
      name: "Zephyr",
      car: "Midnight Vortex GT",
      distance: 0,
      lap: 1,
      damage: 0,
      speed: 0,
      nitro: 2,
      pitRequired: false,
      status: "Ready",
      cssClass: "car-zephyr"
    },
    {
      name: "Tara",
      car: "White Falcon RS",
      distance: 0,
      lap: 1,
      damage: 0,
      speed: 0,
      nitro: 2,
      pitRequired: false,
      status: "Ready",
      cssClass: "car-tara"
    },
    {
      name: "Marcus",
      car: "Graphite Ironclad X",
      distance: 0,
      lap: 1,
      damage: 0,
      speed: 0,
      nitro: 2,
      pitRequired: false,
      status: "Ready",
      cssClass: "car-marcus"
    }
  ];

  commentary.innerHTML = "";
  addCommentary(
    "The engines fire beneath a storm-dark sky. " +
    "Thunder Ridge Raceway is ready for another battle."
  );

  enableButtons();
  updateState();
}

function startRace() {
  homeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  resetRace();
  addCommentary("🏁 The starting lights are on. Make your move, Alex!");
}

function showHome() {
  raceOver = true;
  disableButtons();
  gameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
}

actionButtons.forEach(button => {
  button.addEventListener("click", () => {
    playerTurn(button.dataset.action);
  });
});

restartButton.addEventListener("click", resetRace);
startRaceButton.addEventListener("click", startRace);
backHomeButton.addEventListener("click", showHome);

// The game now starts from the Home screen.
disableButtons();