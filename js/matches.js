// ==========================================================
// matches.js - منطق عرض الماتشات والرهان (لليوزر العادي)
// ==========================================================

let currentUser = null;
let currentUserData = null;

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// ----- تحميل بيانات اليوزر وعرضها في الـ topbar -----
async function loadUserHeader(user) {
  currentUser = user;
  const userDoc = await db.collection('users').doc(user.uid).get();
  currentUserData = userDoc.data();

  document.getElementById('userName').textContent = currentUserData.name;
  document.getElementById('userPoints').textContent = currentUserData.points;

  // لو أدمن، اظهرله لينك لوحة التحكم
  if (currentUserData.isAdmin) {
    document.getElementById('adminLink').classList.remove('hidden');
  }
}

// ----- تحميل كل الماتشات وعرضها -----
async function loadMatches() {
  const container = document.getElementById('matchesContainer');
  container.innerHTML = '<div class="loading">جاري تحميل الماتشات...</div>';

  const snapshot = await db.collection('matches')
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎮</div>
        <p>مفيش ماتشات دلوقتي، استنى الأدمن يضيف ماتش جديد</p>
      </div>`;
    return;
  }

  // هات رهانات اليوزر الحالي على كل الماتشات عشان نعرف لو راهن قبل كده
  const betsSnapshot = await db.collection('bets')
    .where('userId', '==', currentUser.uid)
    .get();

  const userBets = {};
  betsSnapshot.forEach(doc => {
    const bet = doc.data();
    userBets[bet.matchId] = bet;
  });

  container.innerHTML = '';
  snapshot.forEach(doc => {
    const match = { id: doc.id, ...doc.data() };
    const existingBet = userBets[match.id];
    container.appendChild(renderMatchCard(match, existingBet));
  });
}

// ----- رسم كارت الماتش -----
function renderMatchCard(match, existingBet) {
  const card = document.createElement('div');
  card.className = 'match-card';

  const statusMap = {
    open: { text: 'الرهان مفتوح', class: 'status-open' },
    closed: { text: 'الرهان مقفول', class: 'status-closed' },
    finished: { text: 'انتهى', class: 'status-finished' }
  };
  const statusInfo = statusMap[match.status] || statusMap.open;

  let bodyHtml = `
    <span class="match-status ${statusInfo.class}">${statusInfo.text}</span>
    <span class="match-game-tag">${match.game}</span>
    <div class="match-players">
      <span>${match.player1}</span>
      <span class="vs-text">ضد</span>
      <span>${match.player2}</span>
    </div>
    <div class="match-meta">${match.notes || ''}</div>
  `;

  if (match.status === 'finished') {
    bodyHtml += `
      <div class="match-result">
        🏆 الفايز: <strong>${match.winner}</strong>
        ${match.finalScore ? `<br>📊 النتيجة: ${match.finalScore}` : ''}
      </div>`;
    if (existingBet) {
      const won = existingBet.predictedWinner === match.winner;
      bodyHtml += `
        <div class="match-result" style="margin-top:8px; background:${won ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)'}; border-color:${won ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)'}">
          ${won ? '✅ كسبت الرهان! +' + existingBet.potentialWin + ' نقطة' : '❌ خسرت الرهان، -' + existingBet.points + ' نقطة'}
        </div>`;
    }
  } else if (existingBet) {
    bodyHtml += `
      <div class="match-result">
        ✅ راهنت بـ <strong>${existingBet.points}</strong> نقطة على فوز <strong>${existingBet.predictedWinner}</strong>
        ${existingBet.predictedScore ? `<br>📊 توقعك للنتيجة: ${existingBet.predictedScore}` : ''}
      </div>`;
  } else if (match.status === 'open') {
    bodyHtml += renderBetForm(match);
  } else {
    bodyHtml += `<div class="match-meta">الرهان مقفول على الماتش ده</div>`;
  }

  card.innerHTML = bodyHtml;

  if (match.status === 'open' && !existingBet) {
    attachBetFormEvents(card, match);
  }

  return card;
}

// ----- فورم الرهان -----
function renderBetForm(match) {
  return `
    <div class="bet-form">
      <div class="bet-options" data-match="${match.id}">
        <div class="bet-option" data-player="${match.player1}">${match.player1} يكسب</div>
        <div class="bet-option" data-player="${match.player2}">${match.player2} يكسب</div>
      </div>
      <div class="form-group">
        <input type="text" class="predicted-score" placeholder="توقع النتيجة بالظبط (اختياري)">
      </div>
      <div class="bet-points-row">
        <input type="number" class="bet-points-input" placeholder="عدد النقاط" min="1" max="${currentUserData.points}">
        <button class="btn-primary btn-sm place-bet-btn" style="flex:0 0 auto;">راهن</button>
      </div>
    </div>
  `;
}

// ----- ربط أحداث فورم الرهان -----
function attachBetFormEvents(card, match) {
  let selectedPlayer = null;

  const options = card.querySelectorAll('.bet-option');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedPlayer = opt.dataset.player;
    });
  });

  const placeBtn = card.querySelector('.place-bet-btn');
  placeBtn.addEventListener('click', async () => {
    const pointsInput = card.querySelector('.bet-points-input');
    const scoreInput = card.querySelector('.predicted-score');
    const points = parseInt(pointsInput.value);

    if (!selectedPlayer) {
      showToast('اختار مين هيكسب الأول', 'error');
      return;
    }
    if (!points || points < 1) {
      showToast('اكتب عدد نقاط صحيح', 'error');
      return;
    }
    if (points > currentUserData.points) {
      showToast('معندكش نقاط كفاية', 'error');
      return;
    }

    placeBtn.disabled = true;
    placeBtn.textContent = '...';

    try {
      await placeBet(match, selectedPlayer, points, scoreInput.value.trim());
      showToast('تم تسجيل رهانك بنجاح!');
      await loadUserHeader(currentUser);
      await loadMatches();
    } catch (err) {
      console.error(err);
      showToast('حصل خطأ، حاول تاني', 'error');
      placeBtn.disabled = false;
      placeBtn.textContent = 'راهن';
    }
  });
}

// ----- تسجيل الرهان في Firestore وخصم النقاط -----
async function placeBet(match, predictedWinner, points, predictedScore) {
  const userRef = db.collection('users').doc(currentUser.uid);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data();

    if (userData.points < points) {
      throw new Error('نقاط غير كافية');
    }

    // خصم النقاط
    transaction.update(userRef, {
      points: userData.points - points
    });

    // تسجيل الرهان
    const betRef = db.collection('bets').doc();
    transaction.set(betRef, {
      userId: currentUser.uid,
      userName: userData.name,
      matchId: match.id,
      matchLabel: `${match.player1} ضد ${match.player2}`,
      predictedWinner: predictedWinner,
      predictedScore: predictedScore || null,
      points: points,
      potentialWin: points * 2, // مكسب مضاعف عند الفوز
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
}

// ----- لوحة الترتيب -----
async function loadLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  container.innerHTML = '<div class="loading">جاري التحميل...</div>';

  const snapshot = await db.collection('users')
    .orderBy('points', 'desc')
    .limit(50)
    .get();

  if (snapshot.empty) {
    container.innerHTML = '<div class="empty-state">مفيش لاعبين لسه</div>';
    return;
  }

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الاسم</th>
          <th>النقاط</th>
          <th>فوز</th>
          <th>خسارة</th>
        </tr>
      </thead>
      <tbody>
  `;

  let rank = 1;
  snapshot.forEach(doc => {
    const u = doc.data();
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    html += `
      <tr>
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td>${u.name}${doc.id === currentUser.uid ? ' (انت)' : ''}</td>
        <td><strong>${u.points}</strong></td>
        <td>${u.wins || 0}</td>
        <td>${u.losses || 0}</td>
      </tr>
    `;
    rank++;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// ----- التبديل بين التابات -----
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`content-${tabName}`).classList.remove('hidden');

  if (tabName === 'leaderboard') {
    loadLeaderboard();
  }
}
