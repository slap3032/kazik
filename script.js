document.addEventListener("DOMContentLoaded", () => {

  // ===== СОХРАНЕНИЕ ДАННЫХ =====
  const store = {
    get(key, def) {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? JSON.parse(v) : def;
      } catch { return def; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }
  };

  // ===== БАЛАНС =====
  let balance = store.get("roulette_balance", 1000);
  const balEl = document.getElementById("balance");
  balEl.textContent = balance;

  function setBal(n) {
    balance = n;
    balEl.textContent = balance;
    store.set("roulette_balance", balance);
  }

  // ===== ТЕМЫ =====
  const themeBtn = document.getElementById("themeBtn");
  const savedTheme = store.get("roulette_theme", "dark");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeBtn.textContent = "☀️";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isL = document.body.classList.contains("light");
    themeBtn.textContent = isL ? "☀️" : "🌙";
    store.set("roulette_theme", isL ? "light" : "dark");
  });

  // ===== ЭЛЕМЕНТЫ =====
  const home = document.getElementById("home");
  const playBtn = document.getElementById("playBtn");
  const promoBtn = document.getElementById("promoBtn");
  const rouletteBox = document.getElementById("rouletteBox");
  const rouletteResult = document.getElementById("rouletteResult");
  const replayBtn = document.getElementById("replayBtn");
  const backBtn = document.getElementById("backBtn");
  const jackpot = document.getElementById("jackpot");
  const jackpotBtn = document.getElementById("jackpotBtn");
  const notification = document.getElementById("notification");
  const notifIcon = document.getElementById("notifIcon");
  const notifText = document.getElementById("notifText");
  const promoOverlay = document.getElementById("promoOverlay");
  const promoInput = document.getElementById("promoInput");
  const promoSubmit = document.getElementById("promoSubmit");
  const promoClose = document.getElementById("promoClose");

  // ===== РУЛЕТКА =====
  const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 450, 500, 1000];
  const ITEM_W = 90;
  const COUNT = 80;
  const WIN = 65;

  let spinning = false;
  let usedPromos = store.get("roulette_promos", []);

  function getIcon(val) {
    if (val === 500) return "💎";
    if (val === 1000) return "🎰";
    if (val >= 50) return "💵";
    return "🪙";
  }

  function getPrize(val) {
    if (val === 100) return 1000;
    return val;
  }

  // Уведомление
  let notifTimer = null;
  function showNotif(icon, text) {
    notifIcon.textContent = icon;
    notifText.textContent = text;
    notification.classList.add("show");
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  function buildTrack() {
    const existing = rouletteBox.querySelector(".roulette-track");
    if (existing) existing.remove();

    const track = document.createElement("div");
    track.className = "roulette-track";

    for (let i = 0; i < COUNT; i++) {
      const div = document.createElement("div");
      div.className = "roulette-item";
      const v = values[Math.floor(Math.random() * values.length)];
      div.innerHTML = `<span>${getIcon(v)}</span><span>${v}</span>`;
      track.appendChild(div);
    }

    rouletteBox.querySelector(".roulette-window").appendChild(track);
    return track;
  }

  function spin() {
    if (spinning) return;
    spinning = true;

    rouletteResult.textContent = "";
    replayBtn.style.display = "none";
    playBtn.disabled = true;
    backBtn.disabled = true;

    const track = buildTrack();
    const winVal = values[Math.floor(Math.random() * values.length)];

    const items = track.querySelectorAll(".roulette-item");
    const wins = [];
    items.forEach((el, i) => {
      if (parseInt(el.querySelector("span:last-child").textContent) === winVal) {
        wins.push(i);
      }
    });

    const near = wins.filter(i => i >= WIN - 4 && i <= WIN + 4);
    const idx = near.length > 0 ? near[Math.floor(Math.random() * near.length)] : WIN;

    const winW = rouletteBox.querySelector(".roulette-window").offsetWidth;
    const offset = idx * ITEM_W - winW / 2 + ITEM_W / 2;
    const jitter = Math.floor(Math.random() * 30) - 15;

    track.style.transition = "none";
    track.style.transform = "translateX(0)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        track.style.transition = "transform 4s cubic-bezier(0.12, 0.8, 0.2, 1)";
        track.style.transform = `translateX(-${offset + jitter}px)`;
      });
    });

    setTimeout(() => {
      spinning = false;
      playBtn.disabled = false;
      backBtn.disabled = false;
      replayBtn.style.display = "inline-block";

      const prize = getPrize(winVal);

      if (winVal === 100) {
        setBal(balance + prize);
        showNotif("🎰", `+${prize} 💰`);
        jackpot.classList.add("active");
      } else {
        setBal(balance + prize);
        const icon = getIcon(winVal);
        rouletteResult.textContent = `+${prize} ${icon}`;
        showNotif(icon, `+${prize}`);
      }
    }, 4300);
  }

  // ===== КНОПКИ =====
  playBtn.addEventListener("click", () => {
    home.style.display = "none";
    rouletteBox.classList.add("active");
    spin();
  });

  replayBtn.addEventListener("click", () => {
    spin();
  });

  backBtn.addEventListener("click", () => {
    rouletteBox.classList.remove("active");
    home.style.display = "flex";
  });

  jackpotBtn.addEventListener("click", () => {
    jackpot.classList.remove("active");
  });

  // ===== ПРОМОКОДЫ =====
  const promoCodes = ["FREE", "BONUS", "START", "LUCKY"];

  promoBtn.addEventListener("click", () => {
    promoOverlay.classList.add("active");
    promoInput.value = "";
    promoInput.focus();
  });

  promoClose.addEventListener("click", () => {
    promoOverlay.classList.remove("active");
  });

  promoSubmit.addEventListener("click", () => {
    const code = promoInput.value.trim().toUpperCase();

    if (!code) return;

    if (usedPromos.includes(code)) {
      promoInput.style.borderColor = "#ff1744";
      promoInput.placeholder = "Уже использован!";
      setTimeout(() => {
        promoInput.style.borderColor = "#ffd700";
        promoInput.placeholder = "Введите промокод...";
      }, 2000);
      return;
    }

    if (promoCodes.includes(code)) {
      usedPromos.push(code);
      store.set("roulette_promos", usedPromos);
      setBal(balance + 500);
      showNotif("🎁", `+500 за промокод!`);
      promoOverlay.classList.remove("active");
    } else {
      promoInput.style.borderColor = "#ff1744";
      promoInput.placeholder = "Неверный код!";
      setTimeout(() => {
        promoInput.style.borderColor = "#ffd700";
        promoInput.placeholder = "Введите промокод...";
      }, 2000);
    }
  });

  promoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") promoSubmit.click();
  });
});
