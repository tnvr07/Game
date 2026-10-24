export function createLegacyGame(canvas, onRender, titleBackgroundUrl) {

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create the game render context.");
    const titleBackground = new Image();
    titleBackground.onload = () => {
      if (mode === "title") draw();
      onRender();
    };
    titleBackground.onerror = () => console.error("Could not load title-background.png.");
    titleBackground.src = titleBackgroundUrl;
    const tile = 32;
    const areas = {
      village: {
        name: "Noodlewick Candy Meadows",
        width: 24,
        height: 18,
        terrain: "meadow",
        obstacles: [[1, 2], [3, 3], [20, 2], [21, 3], [2, 15], [4, 16], [19, 15], [21, 16],
          [8, 5], [9, 5], [8, 6], [15, 5], [16, 5], [15, 6],
          [7, 13], [8, 13], [10, 13], [11, 13], [7, 14], [8, 14], [10, 14], [11, 14],
          [16, 12], [17, 12], [16, 13]],
        gates: [
          { edge: "east", position: 9, target: "woods", entrance: "west", arrival: 10, label: "Cinderfall Barrens" },
          { edge: "west", position: 10, target: "woods", entrance: "east", arrival: 14, label: "Cinderfall Barrens" },
          { edge: "north", position: 12, target: "glen", entrance: "south", arrival: 9, label: "Frostglass Glen" }
        ]
      },
      woods: {
        name: "Cinderfall Barrens",
        width: 30,
        height: 22,
        terrain: "volcanic",
        obstacles: [
          [1, 1], [3, 1], [5, 1], [8, 1], [10, 1], [18, 1], [21, 1], [24, 1], [27, 1],
          [0, 3], [2, 3], [5, 3], [8, 3], [19, 3], [22, 3], [26, 3], [28, 3],
          [1, 5], [4, 5], [20, 5], [23, 5], [27, 5], [29, 5], [2, 7], [7, 7], [21, 7], [26, 7],
          [2, 13], [5, 13], [8, 13], [19, 13], [22, 13], [27, 13],
          [19, 15], [22, 15], [26, 15], [28, 15], [2, 18], [5, 18], [9, 18], [18, 18], [23, 18], [27, 18],
          [12, 2], [17, 2], [12, 3], [17, 3], [12, 5], [17, 5], [12, 6], [17, 6],
          [17, 14], [12, 16], [17, 16], [12, 18], [17, 18], [12, 19], [17, 19]
        ],
        gates: [
          { edge: "west", position: 10, target: "village", entrance: "east", arrival: 9, label: "Noodlewick Candy Meadows" },
          { edge: "west", position: 14, target: "glen", entrance: "east", arrival: 9, label: "Frostglass Glen" },
          { edge: "east", position: 10, target: "ruins", entrance: "west", arrival: 9, label: "Saffron Ruins" },
          { edge: "east", position: 14, target: "village", entrance: "west", arrival: 10, label: "Noodlewick Candy Meadows" },
          { edge: "north", position: 14, target: "glen", entrance: "south", arrival: 9, label: "Frostglass Glen" }
        ]
      },
      glen: {
        name: "Frostglass Glen",
        width: 20,
        height: 18,
        terrain: "ice",
        obstacles: [[1, 2], [4, 2], [7, 1], [12, 2], [16, 2], [2, 5], [6, 5], [12, 5], [17, 5],
          [2, 13], [5, 15], [8, 15], [13, 14], [17, 13]],
        gates: [
          { edge: "south", position: 9, target: "village", entrance: "north", arrival: 12, label: "Noodlewick Candy Meadows" },
          { edge: "east", position: 9, target: "woods", entrance: "west", arrival: 14, label: "Cinderfall Barrens" }
        ]
      },
      ruins: {
        name: "Saffron Ruins",
        width: 24,
        height: 18,
        terrain: "desert",
        obstacles: [[11, 1], [12, 1], [14, 1], [16, 1], [18, 1], [9, 3], [10, 3], [13, 3], [16, 3], [19, 3],
          [6, 4], [7, 4], [11, 5], [14, 5], [17, 6], [19, 7], [4, 8], [7, 8], [14, 8], [19, 9],
          [5, 12], [9, 12], [13, 13], [16, 14], [20, 14]],
        gates: [
          { edge: "west", position: 9, target: "woods", entrance: "east", arrival: 10, label: "Cinderfall Barrens" }
        ]
      }
    };
    let areaId = "village";
    const area = () => areas[areaId];
    const enemiesRemaining = () => enemies.filter((enemy) => enemy.area === "woods").length;
    const keys = new Set();
    let blocked = new Set();
    const player = {
      x: 5.5 * tile, y: 11 * tile, direction: "right",
      hp: 6, energy: 100, shotCooldown: 0, hurt: 0, tonics: 0
    };
    const guide = { x: 12 * tile, y: 8.5 * tile };
    const relic = { x: 17 * tile, y: 10 * tile };
    const secretChest = { x: 9.5 * tile, y: 8.5 * tile, opened: false };
    const enemies = [];
    const shots = [];
    let camera = { x: 0, y: 0 };
    let mode = "title";
    let mapExpanded = false;
    let questStage = 0;
    let message = "";
    let messageTimer = 0;
    let animationTime = 0;
    let lastTime = 0;

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      keys.add(key);
      if (key === "enter" && (mode === "title" || mode === "lost" || mode === "won")) startGame();
      if (mode === "playing" && key === "m" && !event.repeat) {
        mapExpanded = !mapExpanded;
        keys.delete(key);
      }
      if (mode === "playing" && !mapExpanded && key === "e" && !event.repeat) interact();
      if (mode === "playing" && !mapExpanded && (key === "z" || key === " ")) attack();
      if (mode === "playing" && !mapExpanded && key === "q" && !event.repeat) useTonic();
    };
    const handleKeyUp = (event) => keys.delete(event.key.toLowerCase());
    const handleBlur = () => keys.clear();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    function startGame() {
      areaId = "village";
      player.x = 11 * tile;
      player.y = 9 * tile;
      player.direction = "right";
      player.hp = 6;
      player.energy = 100;
      player.shotCooldown = 0;
      player.hurt = 0;
      player.tonics = 0;
      shots.length = 0;
      secretChest.opened = false;
      enemies.splice(0, enemies.length,
        { area: "woods", x: 13 * tile, y: 10 * tile, hp: 2 },
        { area: "woods", x: 21 * tile, y: 8.5 * tile, hp: 2 },
        { area: "woods", x: 25 * tile, y: 12 * tile, hp: 2 });
      questStage = 0;
      message = "Auntie Fizz is waiting by the meadow trail.";
      messageTimer = 4;
      mode = "playing";
      mapExpanded = false;
      blocked = new Set(area().obstacles.map(([x, y]) => `${x},${y}`));
      updateCamera();
    }

    function isBlocked(x, y) {
      const tx = Math.floor(x / tile);
      const ty = Math.floor(y / tile);
      if (tx < 0 || ty < 0 || tx >= area().width || ty >= area().height || blocked.has(`${tx},${ty}`)) return true;
      if (areaId === "village" && isRiverTile(tx, ty)) return true;
      if (areaId === "woods" && isPondTile(tx, ty)) return true;
      if (areaId === "glen" && isGlacierSheet(tx, ty)) return true;
      if (areaId === "ruins" && isMountainTile(tx, ty)) return true;
      return false;
    }

    function isBridgeTile(x, y) {
      if (areaId !== "village") return false;
      return ((x === 11 || x === 12) && y >= 2 && y <= 4) ||
        ((x >= 4 && x <= 7 || x >= 17 && x <= 21) && (y === 9 || y === 10));
    }

    function isRiverTile(x, y) {
      if (isBridgeTile(x, y)) return false;
      const westEdge = [4, 4, 5, 5, 4, 4, 5, 6, 5, 4, 4, 5, 6, 6, 5, 4, 4, 5][y];
      const northEdge = [4, 4, 4, 3, 3, 2, 2, 3, 3, 2, 2, 2, 2, 3, 3, 2, 2, 3, 3, 3, 4, 4, 4, 4][x];
      const eastEdge = [18, 18, 17, 17, 18, 19, 19, 20, 19, 18, 18, 19, 20, 20, 19, 18, 18, 19][y];
      const southEdge = [15, 15, 15, 15, 15, 15, 14, 14, 15, 16, 15, 14, 14, 14, 15, 15, 16, 16, 15, 14, 14, 15, 15, 15][x];
      const westBend = y >= 3 && y <= 14 && x >= westEdge && x <= westEdge + 2;
      const northBend = x >= 4 && x <= 19 && y >= northEdge && y <= northEdge + 2;
      const eastBend = y >= 4 && y <= 15 && x >= eastEdge && x <= eastEdge + 2;
      const southBend = x >= 6 && x <= 20 && y >= southEdge && y <= southEdge + 2;
      return westBend || northBend || eastBend || southBend;
    }

    function isPondTile(x, y) {
      const lavaShoreline = [7, 8, 8, 9, 9, 10, 11, 12, 12, 11, 10, 10, 11, 12, 13, 13, 12, 11, 10, 9, 8, 8];
      if (y < 0 || y >= lavaShoreline.length) return false;
      return x <= lavaShoreline[y];
    }

    function isMountainTile(x, y) {
      const northwestShelf = x >= 0 && x <= 3 && y <= 3;
      const southwestShelf = x <= 4 && y >= 14;
      const upperShelf = x >= 7 && x <= 10 && y >= 1 && y <= 3;
      const northeastShelf = x >= 20 && y >= 5 && y <= 7;
      const southeastShelf = x >= 20 && y >= 12 && y <= 15;
      return northwestShelf || southwestShelf || upperShelf || northeastShelf || southeastShelf;
    }

    function isGlacierSheet(x, y) {
      const westernShelf = x >= 1 && x <= 8 && y >= 2 && y <= 13 &&
        !(x >= 5 && x <= 8 && y >= 7 && y <= 9);
      const northeasternShelf = x >= 13 && x <= 19 && y >= 0 && y <= 9 &&
        !(x <= 15 && y >= 5 && y <= 8) && !(x >= 17 && y >= 8);
      const southeasternShelf = x >= 12 && x <= 18 && y >= 12 && y <= 16 &&
        !(x <= 12 && y >= 15);
      return westernShelf || northeasternShelf || southeasternShelf;
    }

    function moveEntity(entity, dx, dy, radius) {
      const nx = entity.x + dx;
      const ny = entity.y + dy;
      if (!isBlocked(nx - radius, entity.y) && !isBlocked(nx + radius, entity.y)) entity.x = nx;
      if (!isBlocked(entity.x, ny - radius) && !isBlocked(entity.x, ny + radius)) entity.y = ny;
    }

    function near(a, b, distance) {
      return Math.hypot(a.x - b.x, a.y - b.y) < distance;
    }

    function interact() {
      if (areaId === "glen" && near(player, secretChest, 54) && !secretChest.opened) {
        secretChest.opened = true;
        player.tonics++;
        showMessage("A fizzy plum tonic! Press Q for a two-heart top-up.");
      } else if (areaId === "village" && questStage === 0 && near(player, guide, 58)) {
        questStage = 1;
        showMessage("Auntie Fizz: The Moonbell's gone! Grumble-moths mistook it for a cricket. Please fetch it before the moon gets cranky.");
      } else if (areaId === "ruins" && questStage === 1 && near(player, relic, 58)) {
        if (enemiesRemaining() > 0) {
          showMessage("The grumble-moths are still fluttering around the Moonbell.");
        } else {
          questStage = 2;
          showMessage("You found the Moonbell! It gives a tiny, sleepy ding. Take it back to Noodlewick.");
        }
      } else if (areaId === "village" && questStage === 2 && near(player, guide, 58)) {
        mode = "won";
        message = "Auntie Fizz: Ding! The moon yawned. You saved bedtime, brave little weird-o!";
      } else if (areaId === "village" && near(player, guide, 58)) {
        showMessage(questStage === 2 ? "Auntie Fizz is waiting for the Moonbell." : "Auntie Fizz: Follow the ember road east, and mind the hot springs.");
      } else if (areaId === "ruins" && near(player, relic, 58) && questStage < 1) {
        showMessage("A little bell is buried beneath the old sandstone arch.");
      } else if (areaId === "glen" && near(player, secretChest, 54)) {
        showMessage("The old chest is empty. It looks mildly embarrassed.");
      } else {
        showMessage("There is nothing to interact with here.");
      }
    }

    function useTonic() {
      if (player.tonics === 0) {
        showMessage("No plum tonic left. The bottle says, 'Good luck, champ.'");
      } else if (player.hp === 6) {
        showMessage("You're feeling pretty bouncy already.");
      } else {
        player.tonics--;
        player.hp = Math.min(6, player.hp + 2);
        showMessage("Gulp! Fizzy plums restore two hearts.");
      }
    }

    function transitionAtGate() {
      const gate = area().gates.find((item) => {
        if (item.edge === "east") return player.x > (area().width - 1.2) * tile && Math.abs(player.y / tile - item.position) < 0.8;
        if (item.edge === "west") {
          const threshold = areaId === "woods" ? (item.target === "glen" ? 15 : 12) : 1.2;
          return player.x < threshold * tile && Math.abs(player.y / tile - item.position) < 0.8;
        }
        if (item.edge === "north") return player.y < 1.2 * tile && Math.abs(player.x / tile - item.position) < 0.8;
        return player.y > (area().height - 1.2) * tile && Math.abs(player.x / tile - item.position) < 0.8;
      });
      if (!gate) return;

      const previous = areaId;
      areaId = gate.target;
      blocked = new Set(area().obstacles.map(([x, y]) => `${x},${y}`));
      shots.length = 0;
      if (gate.entrance === "west") {
        player.x = areaId === "woods" ? (gate.arrival === 14 ? 16 : 14) * tile : 1.5 * tile;
        player.y = gate.arrival * tile;
        player.direction = "right";
      } else if (gate.entrance === "east") {
        player.x = (area().width - 1.5) * tile;
        player.y = gate.arrival * tile;
        player.direction = "left";
      } else if (gate.entrance === "north") {
        player.x = gate.arrival * tile;
        player.y = 1.5 * tile;
        player.direction = "down";
      } else if (gate.entrance === "south") {
        player.x = gate.arrival * tile;
        player.y = (area().height - 1.5) * tile;
        player.direction = "up";
      }
      updateCamera();
      if (previous !== areaId) showMessage(`Entered ${gate.label}.`);
    }

    function attack() {
      if (player.shotCooldown > 0 || player.energy < 14) return;
      const velocity = {
        left: [-220, 0],
        right: [220, 0],
        up: [0, -220],
        down: [0, 220]
      }[player.direction];
      shots.push({
        x: player.x,
        y: player.y - 5,
        vx: velocity[0],
        vy: velocity[1],
        life: 1.2
      });
      player.energy -= 14;
      player.shotCooldown = 0.28;
    }

    function showMessage(text) {
      message = text;
      messageTimer = 3.2;
    }

    function questText() {
      if (questStage === 0) return "QUEST  Find Auntie Fizz";
      if (questStage === 1) return enemiesRemaining()
        ? `QUEST  Chase grumble-moths (${3 - enemiesRemaining()}/3)`
        : "QUEST  Find the Moonbell in the catacombs";
      if (questStage === 2) return "QUEST  Bring the Moonbell home";
      return "QUEST  Complete";
    }

    function updateCamera() {
      camera.x = Math.max(0, Math.min(area().width * tile - canvas.width, player.x - canvas.width / 2));
      camera.y = Math.max(0, Math.min(area().height * tile - canvas.height, player.y - canvas.height / 2));
    }

    function update(dt) {
      if (mode !== "playing" || mapExpanded) return;
      let dx = 0;
      let dy = 0;
      if (keys.has("arrowleft") || keys.has("a")) dx--;
      if (keys.has("arrowright") || keys.has("d")) dx++;
      if (keys.has("arrowup") || keys.has("w")) dy--;
      if (keys.has("arrowdown") || keys.has("s")) dy++;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        dx = dx / length * 118 * dt;
        dy = dy / length * 118 * dt;
        player.direction = Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? "left" : "right")
          : (dy < 0 ? "up" : "down");
        moveEntity(player, dx, dy, 9);
      }
      transitionAtGate();

      player.shotCooldown = Math.max(0, player.shotCooldown - dt);
      player.energy = Math.min(100, player.energy + 14 * dt);
      player.hurt = Math.max(0, player.hurt - dt);
      messageTimer = Math.max(0, messageTimer - dt);
      if (keys.has("z") || keys.has(" ")) attack();

      for (let shotIndex = shots.length - 1; shotIndex >= 0; shotIndex--) {
        const shot = shots[shotIndex];
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.life -= dt;
        let removeShot = shot.life <= 0 || isBlocked(shot.x, shot.y);
        for (let enemyIndex = enemies.length - 1; enemyIndex >= 0 && !removeShot; enemyIndex--) {
          const enemy = enemies[enemyIndex];
          if (enemy.area === areaId && near(shot, enemy, 19)) {
            enemy.hp--;
            removeShot = true;
            if (enemy.hp <= 0) {
              enemies.splice(enemyIndex, 1);
              player.hp = Math.min(6, player.hp + 1);
              showMessage("A grumble-moth poofs into harmless glitter. You feel a little stronger.");
            } else {
              showMessage("Star spark! Right in the grumble-moth's grumbles.");
            }
          }
        }
        if (removeShot) shots.splice(shotIndex, 1);
      }

      for (const enemy of enemies) {
        if (enemy.area !== areaId) continue;
        const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distance < 190 && distance > 25) {
          const speed = 34;
          moveEntity(enemy, (player.x - enemy.x) / distance * speed * dt,
            (player.y - enemy.y) / distance * speed * dt, 9);
        } else if (distance < 25 && player.hurt === 0) {
          player.hp--;
          player.hurt = 0.85;
          if (player.hp <= 0) {
            mode = "lost";
            message = "The grumble-moths sent you home for a nap.";
          } else {
            showMessage("A grumble-moth bonked you. Rude! Keep your distance.");
          }
        }
      }
      updateCamera();
    }

    function drawTile(x, y) {
      const sx = x * tile - camera.x;
      const sy = y * tile - camera.y;
      const water = areaId === "village" ? isRiverTile(x, y)
        : areaId === "woods" ? isPondTile(x, y)
        : areaId === "glen" ? isGlacierSheet(x, y)
        : false;
      if (water) {
        const waterColor = areaId === "village" || areaId === "woods" ? "#ed4c27" : "#a9e7f2";
        const shoreColor = areaId === "village" ? "#8d382f" : areaId === "woods" ? "#682e32" : "#728cbd";
        if (areaId === "village" || areaId === "woods") {
          ctx.fillStyle = waterColor;
          ctx.fillRect(sx, sy, tile, tile);
          ctx.fillStyle = shoreColor;
          const lavaAt = areaId === "village" ? isRiverTile : isPondTile;
          if (!lavaAt(x - 1, y)) ctx.fillRect(sx, sy, 2, tile);
          if (!lavaAt(x + 1, y)) ctx.fillRect(sx + tile - 2, sy, 2, tile);
          if (!lavaAt(x, y - 1)) ctx.fillRect(sx, sy, tile, 2);
          if (!lavaAt(x, y + 1)) ctx.fillRect(sx, sy + tile - 2, tile, 2);
        } else {
          ctx.fillStyle = shoreColor;
          ctx.fillRect(sx, sy, tile, tile);
          ctx.fillStyle = waterColor;
          ctx.fillRect(sx + 2, sy + 2, tile - 4, tile - 4);
        }
        if (areaId === "village" || areaId === "woods") {
          ctx.fillStyle = "#ff9a35";
          if ((x * 3 + y * 7) % 3 === 0) {
            ctx.fillRect(sx + 5 + (x % 4) * 3, sy + 8, 9, 2);
            ctx.fillRect(sx + 17, sy + 23 - (y % 3) * 2, 7, 2);
          }
          ctx.fillStyle = "#ffd17b";
          if ((x + y) % 5 === 0) ctx.fillRect(sx + 11, sy + 15, 3, 2);
        } else {
          ctx.fillStyle = "#d7f8ff";
          if ((x + y) % 2 === 0) {
            ctx.fillRect(sx + 5, sy + 7, 9, 1);
            ctx.fillRect(sx + 5, sy + 7, 1, 6);
            ctx.fillRect(sx + 17, sy + 21, 8, 1);
            ctx.fillRect(sx + 24, sy + 17, 1, 5);
          }
          ctx.fillStyle = "#81cbe0";
          if ((x * 5 + y) % 4 === 0) ctx.fillRect(sx + 12, sy + 15, 3, 2);
        }
        return;
      }
      const road = areaId === "glen" &&
        ((x === 9 && y >= 7 && y <= 10) || (y === 9 && x >= 8 && x <= 11));
      const terrainColors = {
        meadow: ["#c9e66d", "#d7ef83", "#d6ad68"],
        volcanic: ["#512f3b", "#673744", "#55404a"],
        ice: ["#d8e2f6", "#eaf3ff", "#b9c7e6"],
        desert: ["#dfa85f", "#edbd75", "#c98d50"]
      };
      const palette = terrainColors[area().terrain];
      const seed = (x * 17 + y * 29) % 11;
      ctx.fillStyle = road ? palette[2] : palette[0];
      ctx.fillRect(sx, sy, tile, tile);
      if (!road && seed === 8) {
        ctx.fillStyle = palette[1];
        ctx.fillRect(sx + 4 + seed % 7, sy + 5 + seed % 9, 7, 4);
      }
      if (areaId === "glen" && isGlacierSheet(x, y)) {
        ctx.fillStyle = "#a8dff1";
        ctx.fillRect(sx + 2, sy + 2, tile - 4, tile - 4);
        ctx.fillStyle = "#d8f5ff";
        if ((x + y) % 2 === 0) {
          ctx.fillRect(sx + 5, sy + 7, 10, 2);
          ctx.fillRect(sx + 5, sy + 7, 2, 8);
          ctx.fillRect(sx + 18, sy + 20, 9, 2);
          ctx.fillRect(sx + 25, sy + 16, 2, 6);
        }
        return;
      }
      if (areaId === "village" && !road) {
        ctx.fillStyle = "#d3a66c";
        if (isRiverTile(x - 1, y)) ctx.fillRect(sx, sy, 3, tile);
        if (isRiverTile(x + 1, y)) ctx.fillRect(sx + tile - 3, sy, 3, tile);
        if (isRiverTile(x, y - 1)) ctx.fillRect(sx, sy, tile, 3);
        if (isRiverTile(x, y + 1)) ctx.fillRect(sx, sy + tile - 3, tile, 3);
      } else if (areaId === "woods" && !road) {
        ctx.fillStyle = "#d24d38";
        if (isPondTile(x - 1, y)) ctx.fillRect(sx, sy, 4, tile);
        if (isPondTile(x + 1, y)) ctx.fillRect(sx + tile - 4, sy, 4, tile);
        if (isPondTile(x, y - 1)) ctx.fillRect(sx, sy, tile, 4);
        if (isPondTile(x, y + 1)) ctx.fillRect(sx, sy + tile - 4, tile, 4);
      }
      if (!road && areaId === "village") {
        ctx.fillStyle = seed < 4 ? "#92bc49" : "#abc94e";
        ctx.fillRect(sx + 4 + seed % 5, sy + 5 + (seed * 3) % 6, 3, 2);
        if (seed === 1 || seed === 6) {
          ctx.fillStyle = "#f08ab9";
          ctx.fillRect(sx + 24, sy + 6 + seed % 6, 3, 3);
          ctx.fillRect(sx + 23, sy + 7 + seed % 6, 5, 1);
          ctx.fillStyle = "#fff0aa";
          ctx.fillRect(sx + 25, sy + 7 + seed % 6, 1, 1);
        }
        if (seed === 4 || seed === 9) {
          ctx.fillStyle = "#f4a8d0";
          ctx.fillRect(sx + 14, sy + 22, 6, 4);
          ctx.fillStyle = "#fff0bd";
          ctx.fillRect(sx + 16, sy + 23, 2, 2);
        }
      } else if (!road && areaId === "woods") {
        ctx.fillStyle = "#3a2633";
        if (seed % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(sx + 4, sy + 5 + seed % 4);
          ctx.lineTo(sx + 11, sy + 12 + seed % 3);
          ctx.lineTo(sx + 8, sy + 19);
          ctx.strokeStyle = "#3a2633";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#c55136";
          ctx.fillRect(sx + 8, sy + 18, 5, 2);
        }
        if (seed === 1 || seed === 6) {
          ctx.fillStyle = "#f36a2e";
          ctx.fillRect(sx + 23, sy + 6 + seed % 5, 3, 2);
          ctx.fillStyle = "#ffb34d";
          ctx.fillRect(sx + 24, sy + 5 + seed % 5, 1, 1);
        }
        if ((x + y) % 4 === 0) {
          ctx.fillStyle = "#f39a45";
          ctx.fillRect(sx + 17, sy + 23, 2, 2);
          ctx.fillRect(sx + 20, sy + 22, 1, 2);
        }
      } else if (!road && areaId === "glen") {
        ctx.fillStyle = "#c4d7f0";
        if (seed % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(sx + 4, sy + 7 + seed % 4);
          ctx.lineTo(sx + 12, sy + 13 + seed % 3);
          ctx.lineTo(sx + 8, sy + 20);
          ctx.strokeStyle = "#a9c6e8";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx + 5, sy + 7 + seed % 4, 3, 1);
        }
        if (seed === 1 || seed === 6) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx + 24, sy + 6 + seed % 5, 3, 2);
          ctx.fillRect(sx + 25, sy + 5 + seed % 5, 1, 4);
        }
        if (seed === 4 || seed === 9) {
          ctx.fillStyle = "#84c8e1";
          ctx.fillRect(sx + 16, sy + 23, 3, 2);
        }
      } else if (!road) {
        ctx.fillStyle = "#c7894d";
        if (seed % 3 === 0) {
          ctx.fillRect(sx + 5, sy + 9 + seed % 5, 7, 1);
          ctx.fillRect(sx + 9, sy + 8 + seed % 5, 2, 1);
          ctx.fillRect(sx + 7, sy + 10 + seed % 5, 3, 1);
        }
        if ((x + y) % 5 === 0) {
          ctx.fillStyle = "#f3ce89";
          ctx.fillRect(sx + 19, sy + 5 + seed % 8, 2, 1);
          ctx.fillRect(sx + 21, sy + 4 + seed % 8, 1, 2);
        }
        if (seed === 1 || seed === 6) {
          ctx.fillStyle = "#855541";
          ctx.fillRect(sx + 23, sy + 7 + seed % 5, 4, 3);
          ctx.fillStyle = "#e7b66e";
          ctx.fillRect(sx + 24, sy + 7 + seed % 5, 2, 1);
        }
        if (seed === 4 || seed === 9) {
          ctx.fillStyle = "#f2d08c";
          ctx.fillRect(sx + 17, sy + 22, 5, 2);
        }
      }
      if (areaId === "village" && isBridgeTile(x, y)) {
        ctx.fillStyle = "#694a36";
        ctx.fillRect(sx, sy + 2, tile, 28);
        ctx.fillStyle = "#a96d42";
        ctx.fillRect(sx + 2, sy + 4, tile - 4, 23);
        ctx.fillStyle = "#dfb16d";
        if (x === 11 || x === 12) {
          for (let plank = 1; plank < 6; plank++) ctx.fillRect(sx + 2, sy + plank * 4, tile - 4, 2);
        } else {
          for (let plank = 1; plank < 6; plank++) ctx.fillRect(sx + plank * 5, sy + 4, 2, 23);
        }
        ctx.fillStyle = "#493d34";
        ctx.fillRect(sx, sy + 1, tile, 3);
        ctx.fillRect(sx, sy + 28, tile, 3);
      } else if (road) {
        if (areaId === "woods") {
          ctx.fillStyle = "#89504d";
          if ((x + y) % 4 === 0) ctx.fillRect(sx + 8, sy + 13, 5, 2);
          if ((x * 3 + y) % 7 === 0) ctx.fillStyle = "#f28b37";
          ctx.fillRect(sx + 21, sy + 24, 3, 2);
        } else if (areaId === "glen") {
          ctx.fillStyle = "#f5f8ff";
          if ((x + y) % 4 === 0) ctx.fillRect(sx + 8, sy + 13, 8, 2);
          if ((x * 3 + y) % 7 === 0) ctx.fillRect(sx + 21, sy + 24, 4, 2);
        } else if (areaId === "ruins") {
          ctx.fillStyle = "#e9c17c";
          if ((x + y) % 4 === 0) ctx.fillRect(sx + 8, sy + 13, 5, 2);
          if ((x * 3 + y) % 7 === 0) ctx.fillRect(sx + 21, sy + 24, 3, 2);
        } else {
          ctx.fillStyle = "#efd095";
          if ((x + y) % 4 === 0) ctx.fillRect(sx + 8, sy + 13, 4, 2);
          if ((x * 3 + y) % 7 === 0) ctx.fillRect(sx + 21, sy + 24, 3, 2);
        }
      }
    }

    function drawObstacle(x, y) {
      const sx = x * tile - camera.x;
      const sy = y * tile - camera.y;
      if (areaId === "village" && ((x >= 7 && x <= 11 && y >= 13 && y <= 14) ||
          (x >= 15 && x <= 17 && y >= 12 && y <= 13))) {
        ctx.fillStyle = "#574c35";
        ctx.fillRect(sx + 1, sy + 3, 30, 26);
        ctx.fillStyle = "#915f3b";
        ctx.fillRect(sx + 4, sy + 5, 24, 20);
        ctx.fillStyle = "#54854c";
        ctx.fillRect(sx + 5, sy + 8, 4, 4);
        ctx.fillRect(sx + 20, sy + 15, 5, 4);
        return;
      }
      if (areaId === "village") {
        const seed = (x * 7 + y * 11) % 3;
        ctx.fillStyle = "#58624a";
        ctx.fillRect(sx + 9, sy + 22, 15, 8);
        ctx.fillStyle = "#986b58";
        ctx.fillRect(sx + 15, sy + 14, 4, 13);
        ctx.fillRect(sx + 13, sy + 24, 8, 3);
        if (seed === 1) {
          ctx.fillStyle = "#176d72";
          ctx.fillRect(sx + 6, sy + 5, 19, 16);
          ctx.fillRect(sx + 9, sy + 2, 13, 5);
          ctx.fillStyle = "#57bbc0";
          ctx.fillRect(sx + 10, sy + 4, 10, 8);
          ctx.fillStyle = "#b2f2db";
          ctx.fillRect(sx + 11, sy + 4, 5, 4);
        } else {
          ctx.fillStyle = "#b6438c";
          ctx.fillRect(sx + 3, sy + 7, 13, 13);
          ctx.fillRect(sx + 12, sy + 4, 14, 16);
          ctx.fillRect(sx + 20, sy + 9, 10, 10);
          ctx.fillStyle = "#ed72bb";
          ctx.fillRect(sx + 5, sy + 7, 9, 8);
          ctx.fillRect(sx + 14, sy + 4, 10, 9);
          ctx.fillRect(sx + 21, sy + 9, 7, 6);
          ctx.fillStyle = "#ffd3eb";
          ctx.fillRect(sx + 7, sy + 8, 4, 3);
          ctx.fillRect(sx + 16, sy + 5, 5, 3);
          ctx.fillRect(sx + 23, sy + 10, 3, 2);
          ctx.fillStyle = "#d956a3";
          ctx.fillRect(sx + 7, sy + 19, 4, 4);
          ctx.fillRect(sx + 18, sy + 19, 4, 7);
        }
        return;
      }
      if (areaId === "woods") {
        const seed = (x * 13 + y * 7) % 4;
        ctx.fillStyle = "#302630";
        ctx.fillRect(sx + 3, sy + 22, 26, 8);
        if (seed === 0) {
          ctx.fillStyle = "#542e3b";
          ctx.fillRect(sx + 4, sy + 11, 23, 15);
          ctx.fillStyle = "#241e2b";
          ctx.fillRect(sx + 8, sy + 5, 5, 18);
          ctx.fillRect(sx + 13, sy + 2, 4, 22);
          ctx.fillRect(sx + 17, sy + 8, 7, 16);
          ctx.fillStyle = "#f06a32";
          ctx.fillRect(sx + 7, sy + 22, 19, 5);
          ctx.fillStyle = "#ffb344";
          ctx.fillRect(sx + 11, sy + 21, 8, 2);
        } else {
          ctx.fillStyle = "#5b3440";
          ctx.fillRect(sx + 2, sy + 13, 15, 13);
          ctx.fillRect(sx + 13, sy + 9, 17, 17);
          ctx.fillStyle = "#82404a";
          ctx.fillRect(sx + 5, sy + 9, 12, 13);
          ctx.fillRect(sx + 17, sy + 6, 10, 14);
          ctx.fillStyle = "#eb6731";
          ctx.fillRect(sx + 8, sy + 8, 5, 4);
          ctx.fillRect(sx + 20, sy + 5, 4, 4);
          ctx.fillStyle = "#f7a541";
          ctx.fillRect(sx + 9, sy + 7, 2, 2);
          ctx.fillRect(sx + 21, sy + 4, 2, 2);
        }
        return;
      }
      if (areaId === "glen") {
        const seed = (x * 11 + y * 5) % 4;
        if (seed === 0) {
          ctx.fillStyle = "#8b9ab7";
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 24, 13, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#dceafa";
          ctx.fillRect(sx + 6, sy + 15, 20, 10);
          ctx.fillRect(sx + 9, sy + 12, 14, 5);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx + 9, sy + 14, 4, 3);
          ctx.fillStyle = "#a1b2cf";
          ctx.fillRect(sx + 7, sy + 23, 19, 2);
        } else {
          ctx.fillStyle = "#839bc7";
          ctx.fillRect(sx + 4, sy + 21, 24, 9);
          ctx.fillStyle = "#a9c9ee";
          ctx.fillRect(sx + 5, sy + 12, 21, 15);
          ctx.fillStyle = "#e1f3ff";
          if (seed === 1) {
            ctx.fillRect(sx + 8, sy + 12, 8, 13);
            ctx.fillRect(sx + 12, sy + 5, 8, 19);
            ctx.fillRect(sx + 18, sy + 10, 8, 15);
          } else {
            ctx.fillRect(sx + 10, sy + 5, 13, 18);
            ctx.fillRect(sx + 14, sy + 2, 6, 6);
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx + 12, sy + 7, 3, 10);
          ctx.fillRect(sx + 19, sy + 10, 2, 8);
          ctx.fillStyle = "#8dd8ef";
          ctx.fillRect(sx + 8, sy + 15, 4, 2);
        }
        return;
      }
      if (areaId === "ruins") {
        const seed = (x * 9 + y * 13) % 3;
        ctx.fillStyle = "#89573e";
        ctx.fillRect(sx + 3, sy + 24, 26, 6);
        ctx.fillStyle = "#b8784c";
        const height = seed === 0 ? 17 : seed === 1 ? 23 : 28;
        for (let layer = 0; layer < Math.ceil(height / 6); layer++) {
          const layerY = sy + 24 - (layer + 1) * 6;
          const inset = layer % 2;
          ctx.fillRect(sx + 6 + inset, layerY, 20 - inset * 2, 6);
          ctx.fillStyle = layer % 2 === 0 ? "#d49a5a" : "#c28653";
          ctx.fillRect(sx + 7 + inset, layerY + 1, 18 - inset * 2, 3);
          ctx.fillStyle = "#b8784c";
        }
        ctx.fillStyle = "#efbf75";
        ctx.fillRect(sx + 9, sy + 24 - height, 5, 2);
        ctx.fillStyle = "#754a3b";
        ctx.fillRect(sx + 14, sy + 21, 4, 9);
        return;
      }
      if (areaId === "village") {
        ctx.fillStyle = "#9b5c69";
        ctx.fillRect(sx + 3, sy + 21, 26, 9);
        ctx.fillStyle = "#d976a4";
        ctx.fillRect(sx + 2, sy + 12, 15, 16);
        ctx.fillRect(sx + 13, sy + 8, 17, 18);
        ctx.fillStyle = "#f39bc4";
        ctx.fillRect(sx + 5, sy + 8, 12, 15);
        ctx.fillRect(sx + 17, sy + 5, 10, 15);
        ctx.fillStyle = "#ffcae2";
        ctx.fillRect(sx + 8, sy + 7, 5, 4);
        ctx.fillRect(sx + 20, sy + 4, 4, 4);
        ctx.fillStyle = "#be7548";
        ctx.fillRect(sx + 14, sy + 20, 5, 10);
        return;
      }
      ctx.fillStyle = "#263c35";
      ctx.fillRect(sx + 2, sy + 12, 28, 18);
      ctx.fillStyle = "#4e7652";
      ctx.fillRect(sx + 4, sy + 7, 24, 18);
      ctx.fillStyle = "#67905a";
      ctx.fillRect(sx + 9, sy + 3, 14, 15);
      ctx.fillStyle = "#87a461";
      ctx.fillRect(sx + 13, sy + 2, 6, 5);
    }

    function drawCharacter(x, y, color, facing, isPlayer) {
      const sx = Math.round(x - camera.x);
      const sy = Math.round(y - camera.y);
      ctx.fillStyle = "#26352f";
      ctx.fillRect(sx - 8, sy + 5, 16, 9);
      ctx.fillStyle = isPlayer ? "#24335f" : "#695c78";
      ctx.fillRect(sx - 7, sy - 4, 14, 12);
      ctx.fillStyle = isPlayer ? "#5a77c1" : "#93839b";
      ctx.fillRect(sx - 6, sy - 3, 12, 7);
      ctx.fillStyle = isPlayer ? "#f2d1a2" : "#d2bd91";
      ctx.fillRect(sx - 5, sy - 12, 10, 9);
      ctx.fillRect(sx - 7, sy - 9, 2, 4);
      ctx.fillRect(sx + 5, sy - 9, 2, 4);
      ctx.fillStyle = "#273431";
      const eyeX = facing === "left" ? -4 : facing === "right" ? 2 : -3;
      ctx.fillRect(sx + eyeX, sy - 9, 2, 2);
      if (isPlayer) {
        ctx.fillStyle = "#171b2c";
        ctx.fillRect(sx - 7, sy - 16, 5, 5);
        ctx.fillRect(sx - 3, sy - 19, 5, 7);
        ctx.fillRect(sx + 1, sy - 17, 6, 5);
        ctx.fillRect(sx - 9, sy - 12, 4, 4);
        ctx.fillStyle = "#5268a0";
        ctx.fillRect(sx - 8, sy + 7, 6, 7);
        ctx.fillRect(sx + 2, sy + 7, 6, 7);
        ctx.fillStyle = "#e1d7c0";
        ctx.fillRect(sx - 8, sy + 12, 7, 3);
        ctx.fillRect(sx + 2, sy + 12, 7, 3);
        ctx.fillStyle = "#e4b852";
        ctx.fillRect(sx - 8, sy + 1, 16, 3);
      } else {
        ctx.fillStyle = "#d6ed96";
        ctx.fillRect(sx - 5, sy - 9, 2, 2);
        ctx.fillRect(sx + 3, sy - 9, 2, 2);
      }
    }

    function drawPlayer(x, y, facing) {
      const sx = Math.round(x - camera.x);
      const sy = Math.round(y - camera.y);
      const isLeft = facing === "left";
      const isRight = facing === "right";

      ctx.fillStyle = "#2a2c2f";
      ctx.beginPath();
      ctx.ellipse(sx, sy + 10, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f4f3ef";
      ctx.fillRect(sx - 5, sy + 3, 4, 9);
      ctx.fillRect(sx + 1, sy + 3, 4, 9);

      ctx.fillStyle = "#382f2d";
      ctx.fillRect(sx - 6, sy + 11, 6, 2);
      ctx.fillRect(sx + 1, sy + 11, 6, 2);

      ctx.fillStyle = "#d7c598";
      ctx.fillRect(sx - 10, sy - 2, 3, 8);
      ctx.fillRect(sx + 7, sy - 2, 3, 8);

      ctx.fillStyle = "#4f84ea";
      ctx.fillRect(sx - 8, sy - 8, 16, 12);
      ctx.fillStyle = "#dfe8ff";
      ctx.fillRect(sx - 6, sy - 7, 12, 3);

      ctx.fillStyle = "#d5b97b";
      ctx.fillRect(sx - 8, sy + 3, 16, 2);

      ctx.fillStyle = "#f3efe8";
      ctx.fillRect(sx - 7, sy - 18, 14, 12);

      ctx.fillStyle = "#2a2e34";
      ctx.fillRect(sx - 8, sy - 20, 16, 4);
      ctx.fillRect(sx - 7, sy - 22, 4, 4);
      ctx.fillRect(sx + 3, sy - 22, 4, 4);
      ctx.fillRect(sx - 3, sy - 23, 6, 3);

      ctx.fillStyle = "#2c3438";
      if (isLeft) {
        ctx.fillRect(sx - 4, sy - 15, 2, 2);
        ctx.fillRect(sx + 2, sy - 15, 2, 2);
      } else if (isRight) {
        ctx.fillRect(sx - 2, sy - 15, 2, 2);
        ctx.fillRect(sx + 4, sy - 15, 2, 2);
      } else {
        ctx.fillRect(sx - 3, sy - 15, 2, 2);
        ctx.fillRect(sx + 1, sy - 15, 2, 2);
      }

      ctx.fillStyle = "#d78667";
      ctx.fillRect(sx - 1, sy - 11, 2, 1);

      ctx.fillStyle = "#d7c598";
      ctx.fillRect(sx - 10, sy - 16, 3, 5);
      ctx.fillRect(sx + 7, sy - 16, 3, 5);

      if (isLeft) {
        ctx.fillStyle = "#4f84ea";
        ctx.fillRect(sx - 8, sy - 2, 3, 2);
      } else if (isRight) {
        ctx.fillStyle = "#4f84ea";
        ctx.fillRect(sx + 5, sy - 2, 3, 2);
      }
    }

    function drawShot(shot) {
      const x = Math.round(shot.x - camera.x);
      const y = Math.round(shot.y - camera.y);
      ctx.fillStyle = "#ffcb56";
      ctx.fillRect(x - 6, y - 4, 12, 8);
      ctx.fillStyle = "#fff0a1";
      ctx.fillRect(x - 3, y - 3, 7, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 1, y - 2, 3, 4);
      ctx.fillStyle = "#e88435";
      if (Math.abs(shot.vx) > 0) ctx.fillRect(x - Math.sign(shot.vx) * 9 - 3, y - 2, 4, 4);
      else ctx.fillRect(x - 2, y - Math.sign(shot.vy) * 9 - 3, 4, 4);
    }

    function drawCompanion(x, y, facing, time) {
      const trailing = {
        left: [25, -9],
        right: [-25, -9],
        up: [18, 15],
        down: [-18, -15]
      }[facing];
      const bob = Math.round(Math.sin(time * 5) * 2);
      const sx = Math.round(x - camera.x + trailing[0]);
      const sy = Math.round(y - camera.y + trailing[1] + bob);

      ctx.fillStyle = "#b8df79";
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#274743";
      ctx.fillRect(sx - 7, sy - 5, 14, 13);
      ctx.fillRect(sx - 10, sy - 1, 4, 7);
      ctx.fillRect(sx + 6, sy - 1, 4, 7);
      ctx.fillStyle = "#85b978";
      ctx.fillRect(sx - 6, sy - 7, 12, 12);
      ctx.fillStyle = "#b6da83";
      ctx.fillRect(sx - 4, sy - 5, 8, 8);
      ctx.fillStyle = "#498d7a";
      ctx.fillRect(sx - 7, sy - 11, 4, 6);
      ctx.fillRect(sx + 3, sy - 11, 4, 6);
      ctx.fillStyle = "#fff0a1";
      ctx.fillRect(sx - 2, sy - 1, 4, 4);
      ctx.fillStyle = "#385048";
      ctx.fillRect(sx - 1, sy, 2, 2);
      ctx.fillStyle = "#fff3bd";
      ctx.fillRect(sx - 1, sy + 5, 2, 3);
    }

    function drawGuide() {
      if (areaId !== "village") return;
      const x = guide.x - camera.x;
      const y = guide.y - camera.y;
      ctx.fillStyle = "#26352f";
      ctx.fillRect(x - 9, y + 5, 18, 10);
      ctx.fillStyle = "#4f7773";
      ctx.fillRect(x - 8, y - 8, 16, 16);
      ctx.fillStyle = "#e2bd8b";
      ctx.fillRect(x - 6, y - 16, 12, 10);
      ctx.fillStyle = "#26352f";
      ctx.fillRect(x - 3, y - 13, 2, 2);
      ctx.fillRect(x + 2, y - 13, 2, 2);
      ctx.fillStyle = "#c5c1a0";
      ctx.fillRect(x - 8, y - 7, 16, 3);
    }

    function drawLandmark() {
      if (areaId === "village") {
        return;
      } else if (areaId === "woods") {
        const x = 15 * tile - camera.x;
        const y = 7 * tile - camera.y;
        ctx.fillStyle = "#302631";
        ctx.fillRect(x - 18, y + 20, 52, 12);
        ctx.fillStyle = "#633844";
        ctx.fillRect(x - 13, y + 13, 42, 13);
        ctx.fillStyle = "#28222f";
        ctx.fillRect(x - 8, y - 2, 9, 22);
        ctx.fillRect(x + 3, y - 13, 8, 34);
        ctx.fillRect(x + 14, y + 2, 11, 23);
        ctx.fillStyle = "#f05c2b";
        ctx.fillRect(x - 13, y + 24, 42, 6);
        ctx.fillStyle = "#ffb447";
        ctx.fillRect(x - 5, y + 22, 9, 3);
        ctx.fillRect(x + 10, y + 23, 12, 2);
      } else if (areaId === "glen") {
        const x = 10 * tile - camera.x;
        const y = 5 * tile - camera.y;
        ctx.fillStyle = "#8b9ab7";
        ctx.fillRect(x - 19, y + 20, 52, 12);
        ctx.fillStyle = "#87b8df";
        ctx.fillRect(x - 12, y + 5, 39, 24);
        ctx.fillStyle = "#c9f0ff";
        ctx.fillRect(x - 7, y - 5, 9, 30);
        ctx.fillRect(x + 2, y - 19, 10, 44);
        ctx.fillRect(x + 13, y - 1, 9, 27);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 5, y - 3, 3, 15);
        ctx.fillRect(x + 5, y - 17, 3, 21);
        ctx.fillRect(x + 16, y + 1, 3, 12);
        ctx.fillStyle = "#8dd8ef";
        ctx.fillRect(x - 12, y + 24, 39, 4);
      } else {
        const castleX = 17 * tile - camera.x;
        const castleY = 2 * tile - camera.y;
        ctx.fillStyle = "#86533e";
        ctx.fillRect(castleX - 25, castleY + 22, 56, 17);
        ctx.fillStyle = "#bd7949";
        ctx.fillRect(castleX - 19, castleY + 12, 18, 19);
        ctx.fillRect(castleX + 5, castleY + 8, 20, 23);
        ctx.fillStyle = "#e1aa63";
        ctx.fillRect(castleX - 16, castleY + 8, 12, 6);
        ctx.fillRect(castleX + 9, castleY + 4, 12, 6);
        ctx.fillRect(castleX - 1, castleY + 20, 7, 19);
        ctx.fillStyle = "#f0ca83";
        ctx.fillRect(castleX - 14, castleY + 10, 5, 2);
        ctx.fillRect(castleX + 12, castleY + 6, 5, 2);
        ctx.fillStyle = "#704238";
        ctx.fillRect(castleX - 22, castleY + 36, 50, 4);

        const caveX = 15 * tile - camera.x;
        const caveY = 11 * tile - camera.y;
        ctx.fillStyle = "#d19b5f";
        ctx.fillRect(caveX - 13, caveY - 11, 28, 24);
        ctx.fillStyle = "#88533f";
        ctx.fillRect(caveX - 9, caveY - 6, 20, 18);
        ctx.fillStyle = "#392f36";
        ctx.fillRect(caveX - 6, caveY - 2, 14, 14);
      }
    }

    function drawMountainTile(x, y) {
      const sx = x * tile - camera.x;
      const sy = y * tile - camera.y;
      const topEdge = !isMountainTile(x, y - 1);
      const leftEdge = !isMountainTile(x - 1, y);
      const rightEdge = !isMountainTile(x + 1, y);
      const bottomEdge = !isMountainTile(x, y + 1);
      ctx.fillStyle = "#a36343";
      ctx.fillRect(sx, sy + 8, tile, tile - 8);
      ctx.fillStyle = "#c0804b";
      ctx.fillRect(sx + 2, sy + 5, tile - 4, tile - 9);
      ctx.fillStyle = "#e1ac66";
      ctx.fillRect(sx + 2, sy + 3, tile - 4, 7);
      ctx.fillStyle = "#f0c681";
      ctx.fillRect(sx + 5, sy + 4, tile - 12, 2);
      ctx.fillStyle = "#bd7849";
      for (let layer = 0; layer < 3; layer++) {
        const layerY = sy + 13 + layer * 6;
        ctx.fillRect(sx + (layer % 2 ? 1 : 4), layerY, tile - (layer % 2 ? 7 : 9), 2);
      }
      if (topEdge) {
        ctx.fillStyle = "#f4d08f";
        ctx.fillRect(sx + 2, sy + 1, tile - 4, 2);
        if ((x + y) % 3 !== 0) ctx.fillRect(sx + 8, sy + 3, 9, 2);
      }
      if (leftEdge) {
        ctx.fillStyle = "#efc17c";
        ctx.fillRect(sx, sy + 5, 2, 7);
      }
      if (rightEdge) {
        ctx.fillStyle = "#824c3b";
        ctx.fillRect(sx + tile - 3, sy + 8, 3, tile - 8);
      }
      if (bottomEdge) {
        ctx.fillStyle = "#704238";
        ctx.fillRect(sx, sy + tile - 3, tile, 3);
      }
      ctx.fillStyle = "#a25d42";
      if ((x * 3 + y) % 4 === 0) {
        ctx.fillRect(sx + 11, sy + 16, 2, 4);
        ctx.fillRect(sx + 9, sy + 20, 4, 2);
      }
    }

    function drawChest() {
      if (areaId !== "glen") return;
      const x = secretChest.x - camera.x;
      const y = secretChest.y - camera.y;
      ctx.fillStyle = "#352e24";
      ctx.fillRect(x - 12, y + 4, 24, 12);
      ctx.fillStyle = secretChest.opened ? "#725337" : "#a76b35";
      ctx.fillRect(x - 11, y - 4, 22, 12);
      ctx.fillStyle = "#e4c875";
      ctx.fillRect(x - 2, y, 4, 6);
      if (!secretChest.opened) {
        ctx.fillStyle = "#fff0aa";
        ctx.fillRect(x - 2, y - 11, 4, 4);
      }
    }

    function drawAreaMap() {
      const expanded = mapExpanded;
      const x = expanded ? 48 : 407;
      const y = expanded ? 24 : 8;
      const width = expanded ? 384 : 70;
      const height = expanded ? 272 : 58;
      const nodeWidth = expanded ? 94 : 19;
      const nodeHeight = expanded ? 62 : 15;
      const headerHeight = expanded ? 12 : 5;
      const mapAreas = expanded ? [
        { id: "village", label: "CANDY MEADOWS", x: 15, y: 101, color: "#c9e66d", detail: "#ec9a72" },
        { id: "woods", label: "CINDERFALL", x: 145, y: 101, color: "#673744", detail: "#f28b37" },
        { id: "ruins", label: "SAFFRON RUINS", x: 275, y: 101, color: "#dfa85f", detail: "#89573e" },
        { id: "glen", label: "FROSTGLASS GLEN", x: 145, y: 184, color: "#d8e2f6", detail: "#84c8e1" }
      ] : [
        { id: "village", label: "CND", x: 2, y: 17, color: "#c9e66d", detail: "#ec9a72" },
        { id: "woods", label: "CIN", x: 25, y: 17, color: "#673744", detail: "#f28b37" },
        { id: "ruins", label: "SAF", x: 48, y: 17, color: "#dfa85f", detail: "#89573e" },
        { id: "glen", label: "ICE", x: 25, y: 40, color: "#d8e2f6", detail: "#84c8e1" }
      ];
      const current = mapAreas.find((item) => item.id === areaId);
      if (expanded) {
        ctx.fillStyle = "#071014dd";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.fillStyle = "#101916";
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = "#a4ad83";
      ctx.lineWidth = expanded ? 3 : 1;
      ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
      ctx.fillStyle = "#f2ca70";
      ctx.font = expanded ? "bold 13px monospace" : "bold 6px monospace";
      ctx.textAlign = "left";
      ctx.fillText("WORLD MAP", x + (expanded ? 12 : 2), y + (expanded ? 20 : 7));
      if (expanded) {
        ctx.fillStyle = "#c7d1bb";
        ctx.font = "9px monospace";
        ctx.textAlign = "right";
        ctx.fillText("M  CLOSE", x + width - 12, y + 20);
        ctx.textAlign = "left";
      } else {
        ctx.fillStyle = "#8ebfc0";
        ctx.fillRect(x + 48, y + 3, 3, 3);
        ctx.fillStyle = "#c7d1bb";
        ctx.font = "5px monospace";
        ctx.fillText("YOU", x + 53, y + 7);
      }

      const center = (mapArea) => ({
        x: x + mapArea.x + nodeWidth / 2,
        y: y + mapArea.y + nodeHeight / 2
      });
      for (const [fromId, toId] of [["village", "woods"], ["woods", "ruins"], ["woods", "glen"], ["village", "glen"]]) {
        const from = center(mapAreas.find((item) => item.id === fromId));
        const to = center(mapAreas.find((item) => item.id === toId));
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = "#526455";
        ctx.lineWidth = expanded ? 8 : 3;
        ctx.stroke();
        ctx.strokeStyle = "#d3b96c";
        ctx.lineWidth = expanded ? 2 : 1;
        ctx.stroke();
        const middleX = (from.x + to.x) / 2;
        const middleY = (from.y + to.y) / 2;
        ctx.fillStyle = "#f2ca70";
        ctx.fillRect(middleX - (expanded ? 3 : 1), middleY - (expanded ? 3 : 1), expanded ? 6 : 2, expanded ? 6 : 2);
      }

      for (const mapArea of mapAreas) {
        const nodeX = x + mapArea.x;
        const nodeY = y + mapArea.y;
        ctx.fillStyle = mapArea.id === areaId ? "#f2ca70" : "#758675";
        ctx.fillRect(nodeX - 2, nodeY - 2, nodeWidth + 4, nodeHeight + 4);
        ctx.fillStyle = mapArea.color;
        ctx.fillRect(nodeX, nodeY, nodeWidth, nodeHeight);
        ctx.fillStyle = "#17221d";
        ctx.fillRect(nodeX, nodeY, nodeWidth, headerHeight);
        ctx.fillStyle = "#f4edcc";
        ctx.font = expanded ? "bold 8px monospace" : "5px monospace";
        ctx.fillText(mapArea.label, nodeX + (expanded ? 5 : 2), nodeY + headerHeight - (expanded ? 3 : 1));

        ctx.fillStyle = mapArea.detail;
        const detailY = nodeY + headerHeight + 2;
        const detailHeight = nodeHeight - headerHeight - 5;
        if (mapArea.id === "village") {
          ctx.fillRect(nodeX + nodeWidth * 0.16, detailY + detailHeight * 0.25, nodeWidth * 0.18, detailHeight * 0.4);
          ctx.fillRect(nodeX + nodeWidth * 0.64, detailY + detailHeight * 0.2, nodeWidth * 0.15, detailHeight * 0.5);
          ctx.fillRect(nodeX + nodeWidth * 0.4, detailY + detailHeight * 0.75, nodeWidth * 0.4, Math.max(1, detailHeight * 0.1));
        } else if (mapArea.id === "woods") {
          ctx.fillRect(nodeX + nodeWidth * 0.17, detailY + detailHeight * 0.15, nodeWidth * 0.2, detailHeight * 0.55);
          ctx.fillRect(nodeX + nodeWidth * 0.64, detailY + detailHeight * 0.35, nodeWidth * 0.2, detailHeight * 0.45);
          ctx.fillRect(nodeX + nodeWidth * 0.43, detailY + detailHeight * 0.75, nodeWidth * 0.12, Math.max(1, detailHeight * 0.1));
        } else if (mapArea.id === "ruins") {
          ctx.fillRect(nodeX + nodeWidth * 0.15, detailY + detailHeight * 0.5, nodeWidth * 0.25, detailHeight * 0.4);
          ctx.fillRect(nodeX + nodeWidth * 0.4, detailY + detailHeight * 0.18, nodeWidth * 0.25, detailHeight * 0.72);
          ctx.fillRect(nodeX + nodeWidth * 0.68, detailY + detailHeight * 0.38, nodeWidth * 0.2, detailHeight * 0.52);
        } else {
          ctx.fillRect(nodeX + nodeWidth * 0.15, detailY + detailHeight * 0.3, nodeWidth * 0.25, detailHeight * 0.4);
          ctx.fillRect(nodeX + nodeWidth * 0.62, detailY + detailHeight * 0.15, nodeWidth * 0.22, detailHeight * 0.55);
          ctx.fillRect(nodeX + nodeWidth * 0.4, detailY + detailHeight * 0.78, nodeWidth * 0.4, Math.max(1, detailHeight * 0.1));
        }
      }

      const markerX = (worldX) => x + current.x + Math.max(0, Math.min(1, worldX / (area().width * tile))) * nodeWidth;
      const markerY = (worldY) => y + current.y + headerHeight +
        Math.max(0, Math.min(1, worldY / (area().height * tile))) * (nodeHeight - headerHeight);
      ctx.fillStyle = "#8ebfc0";
      const playerMarkerSize = expanded ? 8 : 3;
      ctx.fillRect(Math.round(markerX(player.x)) - playerMarkerSize / 2, Math.round(markerY(player.y)) - playerMarkerSize / 2, playerMarkerSize, playerMarkerSize);

      let objective = null;
      if (areaId === "village" && (questStage === 0 || questStage === 2)) objective = guide;
      if (areaId === "ruins" && questStage === 1) objective = relic;
      if (objective) {
        const objectiveMarkerSize = expanded ? 6 : 3;
        ctx.fillStyle = "#f2ca70";
        ctx.fillRect(Math.round(markerX(objective.x)) - objectiveMarkerSize / 2, Math.round(markerY(objective.y)) - objectiveMarkerSize / 2, objectiveMarkerSize, objectiveMarkerSize);
      }
      if (expanded) {
        ctx.fillStyle = "#8ebfc0";
        ctx.fillRect(x + 15, y + height - 20, 7, 7);
        ctx.fillStyle = "#c7d1bb";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("YOU", x + 27, y + height - 14);
        ctx.fillStyle = "#f2ca70";
        ctx.fillRect(x + 70, y + height - 20, 7, 7);
        ctx.fillStyle = "#c7d1bb";
        ctx.fillText("STORY OBJECTIVE", x + 82, y + height - 14);
      }
      ctx.textAlign = "left";
    }

    function drawGates() {
      for (const gate of area().gates) {
        let x;
        let y;
        if (gate.edge === "east") {
          x = (area().width - 1) * tile - camera.x;
          y = gate.position * tile - camera.y;
        } else if (gate.edge === "west") {
          if (areaId === "woods") {
            x = (gate.target === "glen" ? 14.5 : 11.5) * tile - camera.x;
          } else {
            x = camera.x === 0 ? 10 : tile - camera.x;
          }
          y = gate.position * tile - camera.y;
        } else if (gate.edge === "north") {
          x = gate.position * tile - camera.x;
          y = tile - camera.y;
        } else {
          x = gate.position * tile - camera.x;
          y = (area().height - 1) * tile - camera.y;
        }
        ctx.fillStyle = "#39453b";
        ctx.fillRect(x - 12, y - 17, 24, 36);
        ctx.fillStyle = "#e4c875";
        ctx.fillRect(x - 8, y - 14, 16, 29);
        ctx.fillStyle = "#5c765f";
        ctx.fillRect(x - 3, y - 10, 6, 24);
      }
    }

    function drawRelic() {
      if (areaId !== "ruins" || questStage < 1) return;
      const x = relic.x - camera.x;
      const y = relic.y - camera.y;
      ctx.fillStyle = "#493e2d";
      ctx.fillRect(x - 11, y + 8, 22, 7);
      ctx.fillStyle = "#c89a3c";
      ctx.fillRect(x - 8, y - 4, 16, 14);
      ctx.fillStyle = "#ffe89a";
      ctx.fillRect(x - 4, y - 12, 8, 17);
      ctx.fillStyle = "#fff6c7";
      ctx.fillRect(x - 2, y - 18, 4, 7);
    }

    function drawPanel(x, y, width, height) {
      ctx.fillStyle = "#182624";
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = "#9ca889";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    }

    function wrapMessage(text, maxCharacters) {
      const lines = [];
      let line = "";
      for (const word of text.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (next.length > maxCharacters && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      return lines.slice(0, 2);
    }

    function pixelPolygon(points, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let index = 1; index < points.length; index++) {
        ctx.lineTo(points[index][0], points[index][1]);
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawTitleBackground() {
      ctx.fillStyle = "#ff7d88";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (titleBackground.complete && titleBackground.naturalWidth > 0) {
        const imageHeight = canvas.width * titleBackground.naturalHeight / titleBackground.naturalWidth;
        const top = (canvas.height - imageHeight) / 2;
        ctx.fillStyle = "#ff7d88";
        ctx.fillRect(0, 0, canvas.width, Math.max(0, top));
        ctx.fillStyle = "#2c675f";
        ctx.fillRect(0, top + imageHeight, canvas.width, Math.max(0, canvas.height - top - imageHeight));
        ctx.drawImage(titleBackground, 0, top, canvas.width, imageHeight);
      }
      return;

      ctx.fillStyle = "#ff9a91";
      ctx.fillRect(0, 0, 480, 320);
      ctx.fillStyle = "#ffb39b";
      ctx.fillRect(0, 53, 480, 105);
      ctx.fillStyle = "#ffd19b";
      ctx.fillRect(0, 117, 480, 91);
      ctx.fillStyle = "#ffe2a0";
      ctx.fillRect(0, 175, 480, 49);

      pixelPolygon([[0, 68], [18, 68], [18, 57], [45, 57], [45, 49], [78, 49],
        [78, 58], [102, 58], [102, 68], [140, 68], [140, 77], [0, 77]], "#ffc0a0");
      pixelPolygon([[256, 39], [281, 39], [281, 31], [309, 31], [309, 40], [344, 40],
        [344, 50], [383, 50], [383, 60], [256, 60]], "#ffc0a0");
      pixelPolygon([[357, 92], [385, 92], [385, 82], [415, 82], [415, 91], [448, 91],
        [448, 101], [480, 101], [480, 110], [357, 110]], "#ffc0a0");
      pixelPolygon([[16, 117], [35, 117], [35, 109], [65, 109], [65, 116], [91, 116],
        [91, 124], [16, 124]], "#b6b1d2");
      pixelPolygon([[17, 119], [38, 119], [38, 115], [66, 115], [66, 120], [83, 120],
        [83, 124], [17, 124]], "#fff0bd");
      pixelPolygon([[329, 142], [349, 142], [349, 133], [379, 133], [379, 143],
        [409, 143], [409, 151], [438, 151], [438, 160], [329, 160]], "#aaa9d0");
      pixelPolygon([[341, 153], [369, 153], [369, 148], [396, 148], [396, 155],
        [420, 155], [420, 161], [341, 161]], "#ffeeb2");
      ctx.fillStyle = "#fff0bb";
      ctx.fillRect(213, 175, 39, 3);
      ctx.fillRect(245, 168, 29, 5);
      ctx.fillRect(268, 174, 34, 3);

      pixelPolygon([[0, 248], [0, 206], [24, 206], [24, 191], [39, 191],
        [39, 174], [52, 174], [52, 198], [68, 198], [68, 159], [82, 159],
        [82, 181], [96, 181], [96, 139], [110, 139], [110, 165], [124, 165],
        [124, 184], [140, 184], [140, 158], [153, 158], [153, 176], [168, 176],
        [168, 221], [183, 221], [183, 248]], "#999ecb");
      pixelPolygon([[0, 238], [17, 221], [30, 231], [44, 198], [55, 223], [69, 218],
        [79, 183], [89, 216], [104, 211], [113, 174], [125, 216], [140, 211],
        [150, 187], [164, 221], [184, 225], [184, 252], [0, 252]], "#7489b5");
      pixelPolygon([[100, 219], [115, 195], [125, 210], [138, 186], [154, 216],
        [173, 216], [183, 244], [100, 244]], "#b8b0d0");

      ctx.fillStyle = "#ffdd39";
      ctx.fillRect(116, 204, 123, 24);
      ctx.fillRect(132, 198, 96, 6);
      ctx.fillRect(148, 192, 59, 6);
      ctx.fillStyle = "#ffe977";
      ctx.fillRect(136, 205, 70, 5);

      pixelPolygon([[0, 245], [45, 237], [93, 240], [127, 231], [171, 235],
        [210, 225], [258, 234], [301, 222], [344, 234], [387, 228],
        [429, 239], [480, 228], [480, 320], [0, 320]], "#4c987f");
      pixelPolygon([[0, 267], [53, 249], [97, 258], [144, 246], [196, 257],
        [240, 245], [278, 257], [332, 243], [373, 259], [422, 246],
        [480, 254], [480, 320], [0, 320]], "#367d70");
      pixelPolygon([[0, 281], [52, 270], [92, 281], [140, 270], [188, 288],
        [223, 275], [274, 284], [316, 270], [356, 285], [411, 270],
        [480, 285], [480, 320], [0, 320]], "#28665f");

      ctx.fillStyle = "#596b68";
      ctx.fillRect(45, 251, 21, 9);
      ctx.fillRect(49, 246, 11, 6);
      ctx.fillStyle = "#87918a";
      ctx.fillRect(51, 246, 8, 3);
      ctx.fillStyle = "#536965";
      ctx.fillRect(393, 247, 29, 12);
      ctx.fillRect(400, 241, 14, 8);
      ctx.fillStyle = "#9c9b84";
      ctx.fillRect(402, 241, 9, 4);

      ctx.fillStyle = "#382f37";
      ctx.fillRect(306, 202, 17, 67);
      ctx.fillRect(296, 216, 13, 7);
      ctx.fillRect(318, 197, 20, 9);
      ctx.fillRect(332, 187, 7, 16);
      ctx.fillRect(302, 192, 8, 14);
      ctx.fillStyle = "#76544b";
      ctx.fillRect(301, 207, 17, 62);
      ctx.fillRect(289, 216, 18, 7);
      ctx.fillRect(318, 198, 17, 9);
      ctx.fillRect(331, 187, 5, 14);
      ctx.fillStyle = "#397e61";
      ctx.fillRect(278, 153, 24, 76);
      ctx.fillRect(292, 135, 29, 91);
      ctx.fillRect(310, 118, 27, 112);
      ctx.fillRect(327, 136, 28, 92);
      ctx.fillRect(341, 158, 22, 69);
      ctx.fillStyle = "#55a256";
      ctx.fillRect(290, 151, 11, 24);
      ctx.fillRect(300, 135, 15, 23);
      ctx.fillRect(316, 120, 17, 27);
      ctx.fillRect(335, 141, 13, 20);
      ctx.fillRect(348, 162, 10, 19);
      ctx.fillStyle = "#2c654f";
      ctx.fillRect(282, 202, 13, 22);
      ctx.fillRect(320, 180, 12, 43);
      ctx.fillRect(343, 194, 14, 30);
      ctx.fillStyle = "#d8c45c";
      ctx.fillRect(317, 148, 5, 12);
      ctx.fillRect(344, 174, 5, 9);
      ctx.fillRect(292, 184, 4, 7);
      ctx.fillStyle = "#344544";
      ctx.fillRect(353, 161, 2, 39);
      ctx.fillRect(351, 160, 7, 2);
      ctx.fillStyle = "#e44a4b";
      ctx.fillRect(355, 163, 10, 6);

      ctx.fillStyle = "#574b56";
      ctx.fillRect(354, 224, 7, 3);
      ctx.fillRect(364, 229, 13, 3);
      ctx.fillRect(375, 236, 11, 3);
      ctx.fillStyle = "#9ec0a3";
      ctx.fillRect(364, 227, 4, 2);
      ctx.fillRect(378, 234, 5, 2);
    }

    function drawTitle() {
      drawTitleBackground();
      ctx.fillStyle = "#f4d477";
      ctx.textAlign = "center";
      ctx.font = "bold 24px monospace";
      ctx.fillStyle = "#563e4b";
      ctx.fillText("THE MOONBELL MIX-UP", 241, 45);
      ctx.fillStyle = "#fff0bd";
      ctx.fillText("THE MOONBELL MIX-UP", 240, 43);
      ctx.fillStyle = "#f4edcc";
      ctx.font = "11px monospace";
      ctx.fillStyle = "#533f4e";
      ctx.fillText("The moon lost its bedtime bell. Time for a rescue.", 241, 62);
      ctx.fillStyle = "#fff0bd";
      ctx.fillText("The moon lost its bedtime bell. Time for a rescue.", 240, 61);
      camera = { x: 0, y: 0 };
      drawPlayer(205, 227, "right");
      drawCompanion(205, 227, "right", animationTime);
      ctx.fillStyle = "#483d53";
      ctx.fillRect(164, 295, 152, 17);
      ctx.fillStyle = "#fff0bd";
      ctx.font = "10px monospace";
      ctx.fillText("Press Enter to begin", 240, 307);
      ctx.textAlign = "left";
    }

    function draw() {
      animationTime += 1 / 60;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mode === "title") {
        drawTitle();
        return;
      }

      const startX = Math.floor(camera.x / tile);
      const startY = Math.floor(camera.y / tile);
      const visibleColumns = Math.ceil(canvas.width / tile) + 1;
      const visibleRows = Math.ceil(canvas.height / tile) + 1;
      for (let y = Math.max(0, startY); y <= Math.min(area().height - 1, startY + visibleRows); y++) {
        for (let x = Math.max(0, startX); x <= Math.min(area().width - 1, startX + visibleColumns); x++) drawTile(x, y);
      }
      if (areaId === "ruins") {
        for (let y = Math.max(0, startY); y <= Math.min(area().height - 1, startY + visibleRows); y++) {
          for (let x = Math.max(0, startX); x <= Math.min(area().width - 1, startX + visibleColumns); x++) {
            if (isMountainTile(x, y)) drawMountainTile(x, y);
          }
        }
      }
      for (const [x, y] of area().obstacles) {
        if (areaId !== "ruins" || !isMountainTile(x, y)) drawObstacle(x, y);
      }
      drawLandmark();
      drawGates();
      drawChest();
      drawGuide();
      drawRelic();
      for (const enemy of enemies) {
        if (enemy.area === areaId) drawCharacter(enemy.x, enemy.y, "#695c78", "down", false);
      }
      for (const shot of shots) drawShot(shot);

      if (player.hurt > 0 && Math.floor(player.hurt * 12) % 2 === 0) {
        // Blink briefly after taking a hit.
      } else {
        drawPlayer(player.x, player.y, player.direction);
      }
      drawCompanion(player.x, player.y, player.direction, animationTime);

      drawPanel(8, 8, 176, 43);
      ctx.fillStyle = "#111719";
      ctx.fillRect(22, 15, 119, 10);
      ctx.fillRect(22, 31, 119, 8);
      ctx.fillStyle = "#a92d32";
      ctx.fillRect(24, 17, 115 * (player.hp / 6), 6);
      ctx.fillStyle = "#f05a4e";
      ctx.fillRect(24, 17, 115 * (player.hp / 6), 3);
      ctx.fillStyle = "#3b8d47";
      ctx.fillRect(24, 33, 115 * (player.energy / 100), 4);
      ctx.fillStyle = "#8bd65e";
      ctx.fillRect(24, 33, 115 * (player.energy / 100), 2);
      ctx.fillStyle = "#f5e8bd";
      ctx.font = "8px monospace";
      ctx.fillText("VIT", 145, 23);
      ctx.fillText("KI", 145, 39);
      ctx.fillStyle = "#f2ca70";
      ctx.fillText(`TONIC ${player.tonics}`, 24, 48);

      drawPanel(190, 8, 214, 43);
      ctx.fillStyle = "#f2ca70";
      ctx.font = "10px monospace";
      ctx.fillText(area().name.toUpperCase(), 200, 23);
      ctx.fillStyle = "#f4edcc";
      ctx.font = "9px monospace";
      const questLines = wrapMessage(questText(), 36);
      ctx.fillText(questLines[0] || "", 200, 38);
      if (questLines[1]) ctx.fillText(questLines[1], 200, 48);

      const nearGuide = areaId === "village" && near(player, guide, 62);
      const nearRelic = areaId === "ruins" && near(player, relic, 62);
      const nearChest = areaId === "glen" && near(player, secretChest, 62);
      if (nearGuide ||
          (nearRelic && questStage === 1) ||
          (nearChest && !secretChest.opened) ||
          (areaId === "woods" && player.x > 26 * tile && Math.abs(player.y / tile - 10) < 1)) {
        drawPanel(145, 275, 190, 31);
        ctx.fillStyle = "#fff0aa";
        ctx.font = "10px monospace";
        ctx.fillText(areaId === "woods" && player.x > 26 * tile ? "EAST  SAFFRON RUINS" : "E  TALK / INTERACT", 163, 295);
      }
      if (messageTimer > 0) {
        drawPanel(46, 229, 388, 41);
        ctx.fillStyle = "#f4edcc";
        ctx.font = "9px monospace";
        const dialogue = wrapMessage(message, 64);
        ctx.fillText(dialogue[0] || "", 58, 245);
        if (dialogue[1]) ctx.fillText(dialogue[1], 58, 259);
      }
      drawAreaMap();

      if (mode === "won" || mode === "lost") {
        ctx.fillStyle = "#101820bb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawPanel(52, 105, 376, 105);
        ctx.fillStyle = mode === "won" ? "#f2ca70" : "#e3a28b";
        ctx.textAlign = "center";
        ctx.font = "bold 17px monospace";
        ctx.fillText(mode === "won" ? "BEDTIME IS SAVED!" : "NAP TIME, ADVENTURER", 240, 144);
        ctx.fillStyle = "#f4edcc";
        ctx.font = "11px monospace";
        ctx.fillText(wrapMessage(message, 48)[0] || "", 240, 170);
        ctx.fillText("Press Enter to play again", 240, 189);
        ctx.textAlign = "left";
      }
    }

    draw();
    onRender();
    return {
      update(dt) {
        update(dt);
        draw();
        onRender();
      },
      destroy() {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("blur", handleBlur);
        titleBackground.onload = null;
      }
    };
  }