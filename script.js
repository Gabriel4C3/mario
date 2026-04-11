import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'
import {
    addDoc,
    collection,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
;

const firebaseConfig = {
  apiKey: "AIzaSyBfXKJ7Zj6SxxEEEywNaQQTDVrEZNP5DGs",
  authDomain: "mario-jump-9daa1.firebaseapp.com",
  projectId: "mario-jump-9daa1",
  storageBucket: "mario-jump-9daa1.firebasestorage.app",
  messagingSenderId: "665048851942",
  appId: "1:665048851942:web:faeec9725b6d37ae086227",
  measurementId: "G-9XY3CKMQNG"
}

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app)
const isFirebaseConfigured = () =>
    Object.values(firebaseConfig).every(
        (value) => typeof value === 'string' && value.trim() !== '' && !value.startsWith('COLE_')
    )

const gameBoard = document.querySelector('.game-board')
const mario = document.querySelector('.mario')
const pipe = document.querySelector('.pipe')
const startPanel = document.querySelector('.start-panel')
const startButton = document.querySelector('.start-button')
const startFeedback = document.querySelector('.start-feedback')
const nameInput = document.querySelector('.player-name-input')
const gameOverPanel = document.querySelector('.game-over-panel')
const restartButton = document.querySelector('.restart-button')
const playAgainButton = document.querySelector('.play-again-button')
const playerResult = document.querySelector('.player-result')
const saveFeedback = document.querySelector('.save-feedback')
const scoreValue = document.querySelector('.score-value')
const recordValue = document.querySelector('.record-value')
const rankingPanel = document.querySelector('.ranking-panel')
const rankingBody = document.querySelector('.ranking-body')
const rankingStatus = document.querySelector('.ranking-status')
const startMusic = document.querySelector('.start-music')
const startSound = document.querySelector('.start-sound')
const bgMusic = document.querySelector('.bg-music')
const jumpSound = document.querySelector('.jump-sound')
const coinSound = document.querySelector('.coin-sound')
const restartSound = document.querySelector('.restart-sound')
const gameOverSound = document.querySelector('.game-over-sound')

const scoresCollectionName = 'rankings'
const highScore = Number(localStorage.getItem('mario-high-score')) || 0
const storedPlayerName = localStorage.getItem('mario-player-name') || ''
const START_DELAY_MS = 280
const MOBILE_BREAKPOINT = 700
const RANKING_LIMIT = 10
let score = 0
let isGameStarted = false
let isGameOver = false
let isRestarting = false
let isStarting = false
let hasPlayedNewRecordSound = false
let jumpTimeoutId
let playerName = storedPlayerName
let isScoreSaved = false
let db = null
let latestSavedEntry = null

gameBoard.classList.add('is-paused')
recordValue.textContent = String(highScore)
nameInput.value = storedPlayerName

const tryPlayStartMusic = () => {
    const isOnStartScreen = startPanel.classList.contains('show')

    if (!isOnStartScreen || isGameStarted || isStarting || isRestarting) {
        return
    }

    startMusic.play().catch(() => {})
}

const normalizePlayerName = (value) => value.trim().replace(/\s+/g, ' ').slice(0, 16)
const escapeHtml = (value) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')

const renderRankingRows = (entries) => {
    if (!entries.length) {
        rankingBody.innerHTML = `
            <tr>
                <td colspan="3">Nenhum score enviado ainda.</td>
            </tr>
        `
        return
    }

    rankingBody.innerHTML = entries
        .map(
            (entry, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(entry.name)}</td>
                    <td>${entry.score}</td>
                </tr>
            `
        )
        .join('')

    if (!latestSavedEntry) {
        return
    }

    const matchingRows = [...rankingBody.querySelectorAll('tr')]
    const highlightedRow = matchingRows.find((row) => {
        const cells = row.querySelectorAll('td')

        if (cells.length < 3) {
            return false
        }

        return (
            cells[1].textContent === latestSavedEntry.name &&
            cells[2].textContent === String(latestSavedEntry.score)
        )
    })

    if (highlightedRow) {
        highlightedRow.classList.add('is-current-player')
    }
}

const setupRanking = () => {
    if (!isFirebaseConfigured()) {
        rankingStatus.textContent = 'Configure o Firebase'
        renderRankingRows([])
        saveFeedback.textContent = 'Preencha as credenciais do Firebase para salvar o ranking global.'
        return
    }

    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    const rankingQuery = query(
        collection(db, scoresCollectionName),
        orderBy('score', 'desc'),
        limit(RANKING_LIMIT)
    )

    onSnapshot(
        rankingQuery,
        (snapshot) => {
            const entries = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    name: data.name || 'Sem nome',
                    score: Number(data.score) || 0
                }
            })

            rankingStatus.textContent = 'Online'
            renderRankingRows(entries)
        },
        () => {
            rankingStatus.textContent = 'Erro ao carregar'
            rankingBody.innerHTML = `
                <tr>
                    <td colspan="3">Nao foi possivel ler o ranking.</td>
                </tr>
            `
        }
    )
}

tryPlayStartMusic()
setupRanking()

const getJumpDuration = () => {
    const jumpDurationValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--jump-duration')
        .trim()
    const jumpDuration = Number.parseFloat(jumpDurationValue)

    return Number.isFinite(jumpDuration) ? jumpDuration : 700
}

const jump = () => {
    if (!isGameStarted || isGameOver) {
        return
    }

    jumpSound.currentTime = 0
    jumpSound.play().catch(() => {})
    mario.classList.remove('jump')
    void mario.offsetWidth
    mario.classList.add('jump')
    clearTimeout(jumpTimeoutId)
    jumpTimeoutId = setTimeout(() => {
        mario.classList.remove('jump')
    }, getJumpDuration())
}

const handleBoardTouch = (event) => {
    if (
        event.target.closest('.start-button') ||
        event.target.closest('.restart-button') ||
        event.target.closest('.play-again-button') ||
        event.target.closest('.player-name-input')
    ) {
        return
    }

    event.preventDefault()
    jump()
}

const updateScore = () => {
    if (!isGameStarted || isGameOver) {
        return
    }

    score += 1
    scoreValue.textContent = String(score)

    if (!hasPlayedNewRecordSound && score > highScore) {
        hasPlayedNewRecordSound = true
        coinSound.currentTime = 0
        coinSound.play().catch(() => {})
    }

    if (score > Number(recordValue.textContent)) {
        recordValue.textContent = String(score)
    }
}

const validatePlayerName = () => {
    const normalizedName = normalizePlayerName(nameInput.value)

    if (!normalizedName) {
        startFeedback.textContent = 'Digite seu nome antes de iniciar.'
        nameInput.focus()
        return false
    }

    playerName = normalizedName
    nameInput.value = normalizedName
    localStorage.setItem('mario-player-name', normalizedName)
    startFeedback.textContent = ''
    return true
}

const startGame = () => {
    if (isGameStarted || isStarting || !validatePlayerName()) {
        return
    }

    isStarting = true
    startMusic.pause()
    startMusic.currentTime = 0
    startPanel.classList.remove('show')
    startSound.currentTime = 0

    const beginRun = () => {
        if (isGameStarted) {
            return
        }

        isGameStarted = true
        isStarting = false
        gameBoard.classList.remove('is-paused')
        bgMusic.currentTime = 0
        bgMusic.play().catch(() => {})
    }

    startSound.play().catch(() => {
        beginRun()
    })
    setTimeout(beginRun, START_DELAY_MS)
}

const saveScoreToRanking = async () => {
    if (isScoreSaved) {
        return
    }

    isScoreSaved = true

    if (!db || !playerName) {
        saveFeedback.textContent = 'Score local salvo. Configure o Firebase para publicar no ranking global.'
        return
    }

    try {
        saveFeedback.textContent = 'Salvando score no ranking global...'
        await addDoc(collection(db, scoresCollectionName), {
            name: playerName,
            score,
            createdAt: serverTimestamp()
        })
        latestSavedEntry = {
            name: playerName,
            score
        }
        saveFeedback.textContent = `${playerName} entrou no ranking com ${score} pontos.`
    } catch {
        saveFeedback.textContent = 'Nao foi possivel salvar no ranking global.'
    }
}

const endGame = (pipePosition, marioPosition) => {
    isGameOver = true
    pipe.style.animation = 'none'
    pipe.style.left = `${pipePosition}px`

    mario.style.animation = 'none'
    mario.style.bottom = `${marioPosition}px`
    mario.src = 'assets/game-over.png'
    mario.style.width = '75px'
    mario.style.marginLeft = '50px'

    playerResult.textContent = `${playerName} - ${score} pontos`
    gameOverPanel.classList.add('show')

    if (score > highScore) {
        localStorage.setItem('mario-high-score', String(score))
    }

    bgMusic.pause()
    bgMusic.currentTime = 0
    gameOverSound.currentTime = 0
    gameOverSound.play().catch(() => {})
    saveScoreToRanking()
}

const showGlobalRanking = () => {
    gameOverPanel.classList.remove('show')
    rankingPanel.classList.add('is-focused')
    rankingPanel.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    })

    setTimeout(() => {
        rankingPanel.classList.remove('is-focused')
    }, 1800)
}

const playDetachedSound = (soundElement) => {
    const soundInstance = soundElement.cloneNode()
    soundInstance.currentTime = 0
    return {
        soundInstance,
        playPromise: soundInstance.play()
    }
}

const getCollisionThresholds = () => {
    const marioRect = mario.getBoundingClientRect()
    const pipeRect = pipe.getBoundingClientRect()
    const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT
    const horizontalThreshold = Math.max(
        45,
        marioRect.width * (isMobileViewport ? 0.6 : 0.72)
    )
    const verticalThreshold = pipeRect.height * (isMobileViewport ? 0.82 : 0.9)

    return {
        horizontalThreshold,
        verticalThreshold
    }
}

const loop = setInterval(() => {
    if (!isGameStarted || isGameOver) {
        return
    }

    const pipePosition = pipe.offsetLeft
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '')
    const { horizontalThreshold, verticalThreshold } = getCollisionThresholds()

    if (
        pipePosition <= horizontalThreshold &&
        pipePosition > 0 &&
        marioPosition < verticalThreshold
    ) {
        endGame(pipePosition, marioPosition)
        clearInterval(loop)
    }
}, 10)

setInterval(updateScore, 150)

nameInput.addEventListener('input', () => {
    startFeedback.textContent = ''
})
nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault()
        startGame()
    }
})
document.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault()
    }

    if (isGameStarted) {
        jump()
    }
})
window.addEventListener('load', tryPlayStartMusic)
window.addEventListener('focus', tryPlayStartMusic)
document.addEventListener('click', tryPlayStartMusic, { once: true })
document.addEventListener('touchstart', tryPlayStartMusic, { once: true })
document.body.addEventListener('pointerdown', handleBoardTouch)
startButton.addEventListener('click', startGame)
restartButton.addEventListener('click', showGlobalRanking)
playAgainButton.addEventListener('click', () => {
    if (isRestarting) {
        return
    }

    isRestarting = true
    gameOverSound.pause()
    const { soundInstance: restartInstance, playPromise } = playDetachedSound(restartSound)

    const reloadGame = () => {
        window.location.reload()
    }

    restartInstance.addEventListener('ended', reloadGame, { once: true })
    restartInstance.addEventListener('error', reloadGame, { once: true })
    playPromise.catch(reloadGame)

    if (!Number.isFinite(restartInstance.duration) || restartInstance.duration === 0) {
        restartInstance.addEventListener('loadedmetadata', () => {
            setTimeout(reloadGame, restartInstance.duration * 1000)
        }, { once: true })
    }
})
