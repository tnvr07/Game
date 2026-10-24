export function createLegacyGame(canvas, onRender) {

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create the game render context.");
    const titleBackground = new Image();
    titleBackground.onload = () => {
      if (mode === "title") draw();
      onRender();
    };
    titleBackground.onerror = () => console.error("Could not load title-background.png.");
    titleBackground.src = "title-background.png";
    const tile = 32;
    const areas = {
      village: {
        name: "Noodlewick",
        width: 24,
        height: 18,
        terrain: "village",
        obstacles: [[1, 2], [3, 3], [20, 2], [21, 3], [2, 15], [4, 16], [19, 15], [21, 16],
          [8, 5], [9, 5], [8, 6], [15, 5], [16, 5], [15, 6],
          [7, 13], [8, 13], [10, 13], [11, 13], [7, 14], [8, 14], [10, 14], [11, 14],
          [16, 12], [17, 12], [16, 13]],
        gates: [
          { edge: "east", position: 9, target: "woods", entrance: "west", arrival: 10, label: "The Upside-Down Woods" },
          { edge: "west", position: 10, target: "woods", entrance: "east", arrival: 14, label: "The Upside-Down Woods" },
          { edge: "north", position: 12, target: "glen", entrance: "south", arrival: 9, label: "The Hush-Hush Glen" }
        ]
      },
      woods: {
        name: "The Upside-Down Woods",
        width: 30,
        height: 22,
        terrain: "woods",
        obstacles: [
          [1, 1], [3, 1], [5, 1], [8, 1], [10, 1], [18, 1], [21, 1], [24, 1], [27, 1],
          [0, 3], [2, 3], [5, 3], [8, 3], [19, 3], [22, 3], [26, 3], [28, 3],
          [1, 5], [4, 5], [20, 5], [23, 5], [27, 5], [29, 5], [2, 7], [7, 7], [21, 7], [26, 7],
          [2, 13], [5, 13], [8, 13], [19, 13], [22, 13], [27, 13],
          [19, 15], [22, 15], [26, 15], [28, 15], [2, 18], [5, 18], [9, 18], [18, 18], [23, 18], [27, 18],
          [12, 2], [17, 2], [12, 3], [17, 3], [12, 5], [17, 5], [12, 6], [17, 6],
          [12, 14], [17, 14], [12, 16], [17, 16], [12, 18], [17, 18], [12, 19], [17, 19]
        ],
        gates: [
          { edge: "west", position: 10, target: "village", entrance: "east", arrival: 9, label: "Noodlewick" },
          { edge: "east", position: 10, target: "ruins", entrance: "west", arrival: 9, label: "The Teacup Catacombs" },
          { edge: "east", position: 14, target: "village", entrance: "west", arrival: 10, label: "Noodlewick" },
          { edge: "north", position: 14, target: "glen", entrance: "south", arrival: 9, label: "The Hush-Hush Glen" }
        ]
      },
      glen: {
        name: "The Hush-Hush Glen",
        width: 20,
        height: 18,
        terrain: "glen",
        obstacles: [[1, 2], [4, 2], [7, 1], [12, 2], [16, 2], [2, 5], [6, 5], [12, 5], [17, 5],
          [2, 13], [5, 15], [8, 15], [13, 14], [17, 13]],
        gates: [
          { edge: "south", position: 9, target: "village", entrance: "north", arrival: 12, label: "Noodlewick" },
          { edge: "east", position: 9, target: "woods", entrance: "west", arrival: 14, label: "The Upside-Down Woods" }
        ]
      },
      ruins: {
        name: "The Teacup Catacombs",
        width: 24,
        height: 18,
        terrain: "ruins",
        obstacles: [[11, 1], [12, 1], [14, 1], [16, 1], [18, 1], [9, 3], [10, 3], [13, 3], [16, 3], [19, 3],
          [6, 4], [7, 4], [11, 5], [14, 5], [17, 6], [19, 7], [4, 8], [7, 8], [14, 8], [19, 9],
          [5, 12], [9, 12], [13, 13], [16, 14], [20, 14]],
        gates: [
          { edge: "west", position: 9, target: "woods", entrance: "east", arrival: 10, label: "The Upside-Down Woods" }
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
    let selectedHotbarSlot = 0;
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
      if (mode === "playing" && !mapExpanded && /^[1-9]$/.test(key)) {
        selectedHotbarSlot = Number(key) - 1;
      }
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
      message = "Auntie Fizz is waiting by the crooked fountain.";
      messageTimer = 4;
      mode = "playing";
      mapExpanded = false;
      selectedHotbarSlot = 0;
      blocked = new Set(area().obstacles.map(([x, y]) => `${x},${y}`));
      updateCamera();
    }

    function isBlocked(x, y) {
      const tx = Math.floor(x / tile);
      const ty = Math.floor(y / tile);
      if (tx < 0 || ty < 0 || tx >= area().width || ty >= area().height || blocked.has(`${tx},${ty}`)) return true;
      if (areaId === "village" && isRiverTile(tx, ty)) return true;
      if (areaId === "woods" && isPondTile(tx, ty)) return true;
      if (areaId === "glen" && tx >= 3 && tx <= 7 && ty >= 8 && ty <= 12) return true;
      if (areaId === "ruins" && isMountainTile(tx, ty)) return true;
      return false;
    }

    function isBridgeTile(x, y) {
      if (areaId !== "village") return false;
      return ((x === 11 || x === 12) && (y === 3 || y === 4 || y === 15 || y === 16)) ||
        ((x === 5 || x === 6 || x === 18 || x === 19) && (y === 9 || y === 10));
    }

    function isRiverTile(x, y) {
      if (isBridgeTile(x, y)) return false;
      const westBend = x >= 5 && x <= 6 && y >= 4 && y <= 14;
      const northBend = y >= 3 && y <= 4 && x >= 6 && x <= 18;
      const eastBend = x >= 18 && x <= 19 && y >= 4 && y <= 15;
      const southBend = y >= 15 && y <= 16 && x >= 7 && x <= 18;
      return westBend || northBend || eastBend || southBend;
    }

    function isPondTile(x, y) {
      if (x <= 10 && y >= 9 && y <= 11) return false;
      const dx = (x - 5) / 4.3;
      const dy = (y - 10) / 3.2;
      return dx * dx + dy * dy < 1;
    }

    function isMountainTile(x, y) {
      return (x > 14 && y < 7 && x + y > 19) ||
        (x > 16 && y > 5 && x - y > 11) ||
        (x > 18 && y > 10 && x - y > 8);
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
        showMessage(questStage === 2 ? "Auntie Fizz is waiting for the Moonbell." : "Auntie Fizz: Go east. If a tree is upside-down, wave politely.");
      } else if (areaId === "ruins" && near(player, relic, 58) && questStage < 1) {
        showMessage("A little bell is asleep beneath a very suspicious teacup.");
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
        if (item.edge === "west") return player.x < 1.2 * tile && Math.abs(player.y / tile - item.position) < 0.8;
        if (item.edge === "north") return player.y < 1.2 * tile && Math.abs(player.x / tile - item.position) < 0.8;
        return player.y > (area().height - 1.2) * tile && Math.abs(player.x / tile - item.position) < 0.8;
      });
      if (!gate) return;

      const previous = areaId;
      areaId = gate.target;
      blocked = new Set(area().obstacles.map(([x, y]) => `${x},${y}`));
      shots.length = 0;
      if (gate.entrance === "west") {
        player.x = 1.5 * tile;
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
        : areaId === "glen" ? x >= 3 && x <= 7 && y >= 8 && y <= 12
        : false;
      if (water) {
        const waterColor = {
          village: "#357fa4",
          woods: "#f05a24",
          glen: "#8ed9ed",
          ruins: "#65777a"
        }[areaId];
        ctx.fillStyle = waterColor;
        ctx.fillRect(sx, sy, tile, tile);
        ctx.fillStyle = areaId === "woods" ? "#ffb13b" : areaId === "glen" ? "#d6f7ff" : "#70b0c1";
        if ((x * 3 + y * 7) % 3 === 0) {
          ctx.fillRect(sx + 5 + (x % 4) * 3, sy + 8, 8, 2);
          ctx.fillRect(sx + 17, sy + 23 - (y % 3) * 2, 7, 2);
        }
        ctx.fillStyle = "#b5d5bf";
        if ((x + y) % 5 === 0) ctx.fillRect(sx + 11, sy + 15, 3, 2);
        return;
      }
      const road = areaId === "village"
        ? ((y >= 9 && y <= 10) || (y === 8 && x >= 7)) ||
          (x >= 11 && x <= 12)
        : areaId === "woods"
          ? (y >= 9 && y <= 11) || (x >= 10 && x <= 14 && y <= 10)
          : areaId === "glen"
            ? (x >= 8 && x <= 11) || (y >= 7 && y <= 10 && x >= 8 && x <= 11)
            : y >= 8 && y <= 11;
      const terrainColors = {
        village: ["#c7e86e", "#d5f27b", "#b68650"],
        woods: ["#583744", "#68404a", "#8c493b"],
        glen: ["#d8e9fa", "#e7f4ff", "#a7cde5"],
        ruins: ["#e5b267", "#efc478", "#ba854d"]
      };
      const palette = terrainColors[area().terrain];
      ctx.fillStyle = road ? palette[2] : ((x * 7 + y * 13) % 5 === 0 ? palette[1] : palette[0]);
      ctx.fillRect(sx, sy, tile, tile);
      if (areaId === "village" && !road) {
        ctx.fillStyle = "#c7a46c";
        if (isRiverTile(x - 1, y)) ctx.fillRect(sx, sy, 3, tile);
        if (isRiverTile(x + 1, y)) ctx.fillRect(sx + tile - 3, sy, 3, tile);
        if (isRiverTile(x, y - 1)) ctx.fillRect(sx, sy, tile, 3);
        if (isRiverTile(x, y + 1)) ctx.fillRect(sx, sy + tile - 3, tile, 3);
        ctx.fillStyle = "#dec287";
        if ((x * 5 + y * 3) % 7 === 0) ctx.fillRect(sx + 9, sy + 11, 2, 2);
      }
      if ((areaId === "village" && isBridgeTile(x, y)) ||
          (areaId === "woods" && x <= 10 && y >= 9 && y <= 11)) {
        ctx.fillStyle = "#694a36";
        ctx.fillRect(sx, sy + 2, tile, 28);
        ctx.fillStyle = "#a96d42";
        ctx.fillRect(sx + 2, sy + 4, tile - 4, 23);
        ctx.fillStyle = "#dfb16d";
        if (areaId === "village" && ((x >= 11 && x <= 12 && (y <= 4 || y >= 15)))) {
          for (let plank = 1; plank < 6; plank++) ctx.fillRect(sx + 2, sy + plank * 4, tile - 4, 2);
        } else {
          for (let plank = 1; plank < 6; plank++) ctx.fillRect(sx + plank * 5, sy + 4, 2, 23);
        }
        ctx.fillStyle = "#493d34";
        ctx.fillRect(sx, sy + 1, tile, 3);
        ctx.fillRect(sx, sy + 28, tile, 3);
      } else if (areaId === "village" && isBridgeTile(x, y)) {
        ctx.fillStyle = "#493d34";
        ctx.fillRect(sx, sy + 1, tile, 3);
        ctx.fillRect(sx, sy + 28, tile, 3);
      } else if (road) {
        ctx.fillStyle = {
          village: "#b68650",
          woods: "#8c493b",
          glen: "#a7cde5",
          ruins: "#ba854d"
        }[areaId];
        if ((x + y) % 4 === 0) ctx.fillRect(sx + 8, sy + 13, 4, 2);
        if ((x * 3 + y) % 7 === 0) ctx.fillRect(sx + 21, sy + 24, 3, 2);
      } else if (areaId === "village") {
        const seed = (x * 17 + y * 29) % 11;
        ctx.fillStyle = seed < 3 ? "#9ac54a" : seed < 7 ? "#8dbd46" : "#e8e787";
        ctx.fillRect(sx + 4 + seed % 5, sy + 5 + (seed * 3) % 6, 4, 2);
        ctx.fillRect(sx + 18 + (seed * 2) % 8, sy + 17 + seed % 7, 3, 3);
        ctx.fillStyle = "#89aa4b";
        if (seed === 1 || seed === 6) {
          ctx.fillRect(sx + 25, sy + 6 + seed % 6, 2, 2);
          ctx.fillRect(sx + 24, sy + 5 + seed % 6, 2, 2);
          ctx.fillRect(sx + 26, sy + 5 + seed % 6, 2, 2);
        }
        if (seed === 4 || seed === 9) {
          ctx.fillStyle = "#e866b7";
          ctx.fillRect(sx + 7, sy + 21, 2, 2);
          ctx.fillRect(sx + 6, sy + 20, 2, 2);
          ctx.fillRect(sx + 8, sy + 20, 2, 2);
          ctx.fillStyle = "#fff0b4";
          ctx.fillRect(sx + 7, sy + 20, 1, 1);
        }
      } else if (areaId === "woods") {
        ctx.fillStyle = "#d65732";
        if ((x * 7 + y * 11) % 4 === 0) {
          ctx.fillRect(sx + 4 + (x % 5), sy + 7 + (y % 4), 7, 2);
          ctx.fillRect(sx + 10 + (y % 5), sy + 9 + (x % 4), 2, 5);
        }
        ctx.fillStyle = "#ffb13b";
        if ((x * 13 + y * 3) % 6 === 0) ctx.fillRect(sx + 20, sy + 21, 3, 3);
        if ((x + y) % 7 === 0) ctx.fillRect(sx + 7, sy + 24, 2, 2);
      } else if (areaId === "glen") {
        ctx.fillStyle = "#a8d8ef";
        if ((x * 3 + y * 5) % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 7);
          ctx.lineTo(sx + 12, sy + 9);
          ctx.lineTo(sx + 16, sy + 15);
          ctx.strokeStyle = "#a8d8ef";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillRect(sx + 22, sy + 22, 4, 2);
        }
        ctx.fillStyle = "#ffffff";
        if ((x + y) % 6 === 0) ctx.fillRect(sx + 5, sy + 19, 3, 2);
      } else if ((x * 3 + y * 5) % 3 === 0) {
        ctx.fillStyle = "#d59650";
        ctx.fillRect(sx + 5 + (x % 7), sy + 8, 5, 2);
        ctx.fillRect(sx + 21, sy + 23 - (y % 5), 4, 2);
        ctx.fillStyle = "#f7d38c";
        if ((x + y) % 5 === 0) ctx.fillRect(sx + 13, sy + 14, 2, 2);
      } else if ((x * 3 + y * 5) % 4 === 0) {
        ctx.fillStyle = "#85866a";
        ctx.fillRect(sx + 7, sy + 8, 3, 3);
        ctx.fillRect(sx + 22, sy + 23, 2, 3);
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
        ctx.fillStyle = "#6a4770";
        ctx.fillRect(sx + 14, sy + 16, 5, 15);
        ctx.fillStyle = "#e966b4";
        ctx.fillRect(sx + 3, sy + 7, 11, 13);
        ctx.fillRect(sx + 9, sy + 3, 15, 17);
        ctx.fillRect(sx + 19, sy + 8, 11, 12);
        ctx.fillStyle = "#f58bcd";
        ctx.fillRect(sx + 7, sy + 7, 6, 5);
        ctx.fillRect(sx + 14, sy + 5, 7, 5);
        ctx.fillStyle = "#ffd2ef";
        ctx.fillRect(sx + 10, sy + 6, 4, 3);
        ctx.fillRect(sx + 20, sy + 10, 4, 3);
        if ((x + y) % 3 === 0) {
          ctx.fillStyle = "#45a99e";
          ctx.fillRect(sx + 8, sy + 12, 13, 12);
          ctx.fillStyle = "#89e0ca";
          ctx.fillRect(sx + 11, sy + 13, 7, 5);
          ctx.fillStyle = "#497a52";
          ctx.fillRect(sx + 14, sy + 21, 5, 10);
        }
        return;
      }
      if (areaId === "woods") {
        ctx.fillStyle = "#382a37";
        ctx.fillRect(sx + 3, sy + 20, 26, 11);
        ctx.fillStyle = "#e24e24";
        ctx.fillRect(sx + 8, sy + 23, 5, 6);
        ctx.fillRect(sx + 19, sy + 22, 5, 7);
        ctx.fillStyle = "#642e3b";
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + 23);
        ctx.lineTo(sx + 8, sy + 7);
        ctx.lineTo(sx + 13, sy + 19);
        ctx.lineTo(sx + 19, sy + 3);
        ctx.lineTo(sx + 29, sy + 23);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#a54439";
        ctx.fillRect(sx + 8, sy + 15, 3, 3);
        ctx.fillRect(sx + 19, sy + 12, 3, 4);
        return;
      }
      if (areaId === "glen") {
        ctx.fillStyle = "#9bbbd8";
        ctx.fillRect(sx + 4, sy + 23, 24, 6);
        ctx.fillStyle = "#71a9d6";
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + 24);
        ctx.lineTo(sx + 12, sy + 4);
        ctx.lineTo(sx + 16, sy + 17);
        ctx.lineTo(sx + 23, sy + 1);
        ctx.lineTo(sx + 28, sy + 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e6f8ff";
        ctx.fillRect(sx + 11, sy + 7, 3, 9);
        ctx.fillRect(sx + 22, sy + 4, 3, 10);
        return;
      }
      if (areaId !== "ruins") {
        ctx.fillStyle = "#25402e";
        ctx.fillRect(sx + 3, sy + 19, 26, 12);
        ctx.fillStyle = "#276239";
        ctx.fillRect(sx + 1, sy + 9, 16, 18);
        ctx.fillRect(sx + 13, sy + 5, 18, 20);
        ctx.fillStyle = "#378041";
        ctx.fillRect(sx + 5, sy + 5, 13, 16);
        ctx.fillRect(sx + 16, sy + 2, 12, 17);
        ctx.fillStyle = "#55a046";
        ctx.fillRect(sx + 7, sy + 4, 7, 7);
        ctx.fillRect(sx + 18, sy + 1, 6, 7);
        ctx.fillStyle = "#7a5940";
        ctx.fillRect(sx + 14, sy + 20, 5, 10);
        return;
      }
      if (areaId === "ruins") {
        ctx.fillStyle = "#8e603c";
        ctx.fillRect(sx + 2, sy + 5, 28, 25);
        ctx.fillStyle = "#b9814d";
        ctx.fillRect(sx + 5, sy + 2, 22, 24);
        ctx.fillStyle = "#e1b875";
        ctx.fillRect(sx + 10, sy + 4, 12, 4);
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
      const horizontal = facing === "left" || facing === "right";
      const sign = facing === "left" || facing === "up" ? -1 : 1;

      ctx.fillStyle = "#1c2526";
      ctx.beginPath();
      ctx.ellipse(sx, sy + 7, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#252530";
      if (horizontal) {
        ctx.fillRect(sx - 5, sy - 24, 10, 31);
        ctx.fillRect(sx - 10, sy - 8, 5, 12);
      } else {
        ctx.fillRect(sx - 8, sy - 19, 16, 24);
        ctx.fillRect(sx - 11, sy - 5, 5, 10);
        ctx.fillRect(sx + 6, sy - 5, 5, 10);
      }

      ctx.fillStyle = "#334446";
      ctx.fillRect(sx - 9, sy + 2, 7, 12);
      ctx.fillRect(sx + 2, sy + 2, 7, 12);
      ctx.fillStyle = "#c9c5ae";
      ctx.fillRect(sx - 9, sy + 11, 7, 4);
      ctx.fillRect(sx + 2, sy + 11, 7, 4);

      ctx.fillStyle = "#123c3c";
      ctx.fillRect(sx - 10, sy - 15, 20, 18);
      ctx.fillStyle = "#17645f";
      ctx.fillRect(sx - 8, sy - 15, 16, 13);
      ctx.fillStyle = "#278b7c";
      ctx.fillRect(sx - 6, sy - 13, 12, 7);
      ctx.fillStyle = "#d8d1ad";
      ctx.fillRect(sx - 8, sy - 7, 16, 3);
      ctx.fillStyle = "#b64e43";
      ctx.fillRect(sx - 8, sy - 5, 16, 2);
      ctx.fillStyle = "#e2d7b2";
      ctx.fillRect(sx - 7, sy - 1, 14, 2);
      ctx.fillStyle = "#d8d1ad";
      ctx.fillRect(sx - 8, sy + 2, 16, 4);
      ctx.fillStyle = "#bd5144";
      ctx.fillRect(sx - 7, sy + 3, 14, 2);
      ctx.fillStyle = "#27766d";
      ctx.fillRect(sx - 10, sy - 13, 4, 10);
      ctx.fillRect(sx + 6, sy - 13, 4, 10);

      ctx.fillStyle = "#d4b98d";
      ctx.fillRect(sx - 5, sy - 24, 10, 9);
      ctx.fillStyle = "#222a2c";
      ctx.fillRect(sx - 7, sy - 27, 14, 7);
      ctx.fillRect(sx - 5, sy - 31, 10, 6);
      ctx.fillRect(sx - 2, sy - 35, 5, 6);
      ctx.fillRect(sx + 3, sy - 32, 4, 4);
      ctx.fillStyle = "#177268";
      ctx.fillRect(sx - 6, sy - 26, 12, 4);
      ctx.fillStyle = "#d4b98d";
      if (facing === "left") {
        ctx.fillRect(sx - 6, sy - 22, 3, 2);
      } else if (facing === "right") {
        ctx.fillRect(sx + 3, sy - 22, 3, 2);
      } else {
        ctx.fillStyle = "#343436";
        ctx.fillRect(sx - 5, sy - 22, 10, 3);
      }

      ctx.fillStyle = "#b8b29b";
      ctx.fillRect(sx - 13, sy - 12, 5, 8);
      ctx.fillRect(sx + 8, sy - 12, 5, 8);
      ctx.fillStyle = "#278b7c";
      ctx.fillRect(sx - 12, sy - 11, 4, 5);
      ctx.fillRect(sx + 8, sy - 11, 4, 5);
      ctx.fillStyle = "#d7c78f";
      ctx.fillRect(sx - 12, sy - 5, 4, 2);
      ctx.fillRect(sx + 8, sy - 5, 4, 2);

      if (horizontal) {
        const staffY = sy - 25;
        ctx.fillStyle = "#393329";
        ctx.fillRect(sx - 25, staffY, 50, 2);
        ctx.fillStyle = "#a9a081";
        ctx.fillRect(sx + sign * 22, staffY - 2, 4, 6);
        ctx.fillStyle = "#d5c69a";
        ctx.fillRect(sx + sign * 26, staffY - 1, 3, 4);
        const pennantX = sx - sign * 23;
        ctx.fillStyle = "#236a58";
        ctx.fillRect(pennantX - 2, staffY - 8, 5, 8);
        ctx.fillRect(pennantX - 1, staffY - 12, 8, 5);
        ctx.fillStyle = "#69a16d";
        ctx.fillRect(pennantX + 3, staffY - 10, 7, 4);
        ctx.fillRect(pennantX + 8, staffY - 8, 5, 3);
        ctx.fillStyle = "#9ab77d";
        ctx.fillRect(pennantX + 10, staffY - 7, 4, 2);
      } else {
        const staffX = sx + 15;
        ctx.fillStyle = "#393329";
        ctx.fillRect(staffX, sy - 38, 2, 48);
        ctx.fillStyle = "#a9a081";
        ctx.fillRect(staffX - 2, sy - 39, 6, 4);
        ctx.fillStyle = "#d5c69a";
        ctx.fillRect(staffX - 1, sy - 43, 4, 4);
        ctx.fillStyle = "#236a58";
        ctx.fillRect(staffX + 2, sy - 34, 8, 5);
        ctx.fillStyle = "#69a16d";
        ctx.fillRect(staffX + 7, sy - 33, 6, 4);
        ctx.fillStyle = "#9ab77d";
        ctx.fillRect(staffX + 11, sy - 32, 4, 3);
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
        const x = 13 * tile - camera.x;
        const y = 8 * tile - camera.y;
        ctx.fillStyle = "#684a36";
        ctx.fillRect(x - 17, y - 9, 35, 25);
        ctx.fillStyle = "#c58c51";
        ctx.fillRect(x - 13, y - 8, 27, 20);
        ctx.fillStyle = "#784b3d";
        ctx.fillRect(x - 16, y - 13, 32, 7);
        ctx.fillStyle = "#ebc179";
        ctx.fillRect(x - 8, y - 6, 8, 7);
        ctx.fillRect(x + 5, y - 5, 6, 6);
        ctx.fillStyle = "#493d3b";
        ctx.fillRect(x + 1, y + 3, 7, 13);
      } else if (areaId === "woods") {
        ctx.fillStyle = "#6b4b37";
        ctx.fillRect(13 * tile - camera.x, 9 * tile - camera.y, 36, 5);
        ctx.fillStyle = "#bd8650";
        ctx.fillRect(13 * tile - camera.x, 9 * tile - camera.y + 2, 36, 3);
      } else if (areaId === "glen") {
        const x = 9 * tile - camera.x;
        const y = 4 * tile - camera.y;
        ctx.fillStyle = "#293e3d";
        ctx.fillRect(x - 13, y + 1, 52, 35);
        ctx.fillStyle = "#6f9f87";
        ctx.fillRect(x - 8, y + 5, 42, 24);
        ctx.fillStyle = "#a8caa0";
        ctx.fillRect(x + 2, y + 11, 9, 8);
      } else {
        const castleX = 17 * tile - camera.x;
        const castleY = 2 * tile - camera.y;
        ctx.fillStyle = "#4c4850";
        ctx.fillRect(castleX - 15, castleY + 6, 44, 36);
        ctx.fillStyle = "#9a7860";
        ctx.fillRect(castleX - 11, castleY + 10, 36, 29);
        ctx.fillStyle = "#d2b17a";
        ctx.fillRect(castleX - 4, castleY + 20, 7, 19);
        ctx.fillRect(castleX + 9, castleY + 17, 7, 8);
        ctx.fillRect(castleX - 24, castleY - 1, 12, 30);
        ctx.fillRect(castleX + 20, castleY - 5, 12, 34);
        ctx.fillStyle = "#695444";
        ctx.fillRect(castleX - 26, castleY - 5, 16, 6);
        ctx.fillRect(castleX + 18, castleY - 9, 16, 6);
        ctx.fillRect(castleX + 2, castleY - 8, 12, 18);
        ctx.fillStyle = "#b88b54";
        ctx.fillRect(castleX + 5, castleY - 13, 6, 7);

        const caveX = 15 * tile - camera.x;
        const caveY = 11 * tile - camera.y;
        ctx.fillStyle = "#a39a7b";
        ctx.fillRect(caveX - 13, caveY - 11, 28, 24);
        ctx.fillStyle = "#514b46";
        ctx.fillRect(caveX - 9, caveY - 6, 20, 18);
        ctx.fillStyle = "#161d24";
        ctx.fillRect(caveX - 6, caveY - 2, 14, 14);
      }
    }

    function drawMountainTile(x, y) {
      const sx = x * tile - camera.x;
      const sy = y * tile - camera.y;
      ctx.fillStyle = "#875e42";
      ctx.fillRect(sx, sy + 18, tile, 14);
      ctx.fillStyle = "#bc8553";
      ctx.fillRect(sx + 2, sy + 10, 28, 18);
      ctx.fillStyle = "#d5a26a";
      ctx.fillRect(sx + 7, sy + 4, 18, 18);
      ctx.fillStyle = "#efd195";
      ctx.fillRect(sx + 13, sy + 1, 9, 9);
      ctx.fillStyle = "#fff0c5";
      if ((x + y) % 3 !== 0) {
        ctx.fillRect(sx + 15, sy + 1, 6, 4);
        ctx.fillRect(sx + 11, sy + 7, 5, 3);
      }
      ctx.fillStyle = "#976945";
      ctx.fillRect(sx + 21, sy + 17, 4, 7);
      ctx.fillRect(sx + 5, sy + 23, 6, 3);
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

    function drawQuickbar() {
      const slotSize = 28;
      const gap = 2;
      const startX = (canvas.width - (slotSize * 9 + gap * 8)) / 2;
      const slotY = 286;
      const heartPixels = ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"];

      for (let heart = 0; heart < 6; heart++) {
        const heartX = 192 + heart * 16;
        const heartY = 271;
        ctx.fillStyle = heart < player.hp ? "#ed4e55" : "#51525a";
        for (let row = 0; row < heartPixels.length; row++) {
          for (let column = 0; column < heartPixels[row].length; column++) {
            if (heartPixels[row][column] === "1") ctx.fillRect(heartX + column, heartY + row, 1, 1);
          }
        }
        ctx.fillStyle = "#ffb0a2";
        if (heart < player.hp) {
          ctx.fillRect(heartX + 2, heartY + 2, 2, 1);
          ctx.fillRect(heartX + 10, heartY + 2, 2, 1);
        }
      }

      for (let slot = 0; slot < 9; slot++) {
        const slotX = startX + slot * (slotSize + gap);
        ctx.fillStyle = "#171c27";
        ctx.fillRect(slotX, slotY, slotSize, slotSize);
        ctx.fillStyle = slot === selectedHotbarSlot ? "#f2ca70" : "#7a806d";
        ctx.fillRect(slotX, slotY, slotSize, 2);
        ctx.fillRect(slotX, slotY + slotSize - 2, slotSize, 2);
        ctx.fillRect(slotX, slotY, 2, slotSize);
        ctx.fillRect(slotX + slotSize - 2, slotY, 2, slotSize);
        ctx.fillStyle = "#c7d1bb";
        ctx.font = "7px monospace";
        ctx.fillText(String(slot + 1), slotX + 3, slotY + 8);

        if (slot === 0) {
          ctx.fillStyle = "#e4ab43";
          ctx.fillRect(slotX + 12, slotY + 9, 4, 12);
          ctx.fillRect(slotX + 8, slotY + 13, 12, 4);
          ctx.fillStyle = "#fff0a1";
          ctx.fillRect(slotX + 13, slotY + 10, 2, 10);
          ctx.fillRect(slotX + 9, slotY + 14, 10, 2);
        } else if (slot === 1) {
          ctx.fillStyle = "#f0d59a";
          ctx.fillRect(slotX + 11, slotY + 9, 8, 2);
          ctx.fillRect(slotX + 10, slotY + 11, 10, 11);
          ctx.fillRect(slotX + 12, slotY + 7, 6, 2);
          ctx.fillStyle = "#8a3555";
          ctx.fillRect(slotX + 12, slotY + 15, 6, 5);
          ctx.fillStyle = "#f58bcd";
          ctx.fillRect(slotX + 13, slotY + 13, 3, 3);
          if (player.tonics > 0) {
            ctx.fillStyle = "#fff0bd";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "right";
            ctx.fillText(String(player.tonics), slotX + slotSize - 3, slotY + slotSize - 4);
            ctx.textAlign = "left";
          }
        } else if (slot === 2 && questStage >= 2) {
          ctx.fillStyle = "#e8c86e";
          ctx.fillRect(slotX + 13, slotY + 8, 3, 4);
          ctx.fillRect(slotX + 10, slotY + 12, 9, 7);
          ctx.fillRect(slotX + 12, slotY + 19, 5, 2);
          ctx.fillStyle = "#fff1a8";
          ctx.fillRect(slotX + 13, slotY + 13, 3, 4);
        } else if (slot === 3) {
          ctx.fillStyle = "#507568";
          ctx.fillRect(slotX + 10, slotY + 12, 10, 9);
          ctx.fillRect(slotX + 8, slotY + 15, 3, 4);
          ctx.fillRect(slotX + 19, slotY + 15, 3, 4);
          ctx.fillStyle = "#c5e78b";
          ctx.fillRect(slotX + 12, slotY + 10, 6, 8);
          ctx.fillStyle = "#fff0a1";
          ctx.fillRect(slotX + 14, slotY + 13, 2, 3);
        }
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
        { id: "village", label: "NOODLEWICK", x: 15, y: 101, color: "#82794a", detail: "#d2a45e" },
        { id: "woods", label: "UPSIDE-DOWN WOODS", x: 145, y: 101, color: "#376347", detail: "#85a95b" },
        { id: "ruins", label: "TEACUP CATACOMBS", x: 275, y: 101, color: "#706553", detail: "#b6a27a" },
        { id: "glen", label: "HUSH-HUSH GLEN", x: 145, y: 184, color: "#42705c", detail: "#76b5aa" }
      ] : [
        { id: "village", label: "VIL", x: 2, y: 17, color: "#82794a", detail: "#d2a45e" },
        { id: "woods", label: "WDS", x: 25, y: 17, color: "#376347", detail: "#85a95b" },
        { id: "ruins", label: "RNS", x: 48, y: 17, color: "#706553", detail: "#b6a27a" },
        { id: "glen", label: "GLN", x: 25, y: 40, color: "#42705c", detail: "#76b5aa" }
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
          x = camera.x === 0 ? 10 : tile - camera.x;
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

      drawPanel(8, 8, 126, 24);
      ctx.fillStyle = "#111719";
      ctx.fillRect(21, 16, 98, 8);
      ctx.fillStyle = "#3b8d47";
      ctx.fillRect(22, 17, 96 * (player.energy / 100), 6);
      ctx.fillStyle = "#8bd65e";
      ctx.fillRect(22, 17, 96 * (player.energy / 100), 2);
      ctx.fillStyle = "#f5e8bd";
      ctx.font = "8px monospace";
      ctx.fillText("KI", 10, 23);

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
      if (messageTimer <= 0 && (nearGuide ||
          (nearRelic && questStage === 1) ||
          (nearChest && !secretChest.opened) ||
          (areaId === "woods" && player.x > 26 * tile && Math.abs(player.y / tile - 10) < 1))) {
        drawPanel(145, 239, 190, 28);
        ctx.fillStyle = "#fff0aa";
        ctx.font = "10px monospace";
        ctx.fillText(areaId === "woods" && player.x > 26 * tile ? "EAST  SUNKEN RUINS" : "E  TALK / INTERACT", 163, 257);
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
      if (!mapExpanded) drawQuickbar();

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