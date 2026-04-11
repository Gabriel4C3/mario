const gameBoard = document.querySelector('.game-board')
const mario = document.querySelector('.mario')
const pipe = document.querySelector('.pipe')
const startPanel = document.querySelector('.start-panel')
const startButton = document.querySelector('.start-button')
const gameOverPanel = document.querySelector('.game-over-panel')
const restartButton = document.querySelector('.restart-button')
const scoreValue = document.querySelector('.score-value')
const recordValue = document.querySelector('.record-value')
const startMusic = document.querySelector('.start-music')
const startSound = document.querySelector('.start-sound')
const bgMusic = document.querySelector('.bg-music')
const jumpSound = document.querySelector('.jump-sound')
const coinSound = document.querySelector('.coin-sound')
const restartSound = document.querySelector('.restart-sound')
const gameOverSound = document.querySelector('.game-over-sound')

const highScore = Number(localStorage.getItem('mario-high-score')) || 0
const START_DELAY_MS = 280
let score = 0
let isGameStarted = false
let isGameOver = false
let isRestarting = false
let isStarting = false
let hasPlayedNewRecordSound = false

gameBoard.classList.add('is-paused')
recordValue.textContent = String(highScore)

const tryPlayStartMusic = () => {
    const isOnStartScreen = startPanel.classList.contains('show')

    if (!isOnStartScreen || isGameStarted || isStarting || isRestarting) {
        return
    }

    startMusic.play().catch(() => {})
}

tryPlayStartMusic()

const jump = () => {
    if (!isGameStarted || isGameOver) {
        return
    }

    jumpSound.currentTime = 0
    jumpSound.play().catch(() => {})
    mario.classList.add('jump')
    setTimeout(() => {
        mario.classList.remove('jump')
    }, 700)
}

const handleBoardTouch = (event) => {
    if (
        event.target.closest('.start-button') ||
        event.target.closest('.restart-button')
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

const startGame = () => {
    if (isGameStarted || isStarting) {
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

const endGame = (pipePosition, marioPosition) => {
    isGameOver = true
    pipe.style.animation = 'none'
    pipe.style.left = `${pipePosition}px`

    mario.style.animation = 'none'
    mario.style.bottom = `${marioPosition}px`
    mario.src = 'assets/game-over.png'
    mario.style.width = '75px'
    mario.style.marginLeft = '50px'

    gameOverPanel.classList.add('show')

    if (score > highScore) {
        localStorage.setItem('mario-high-score', String(score))
    }

    bgMusic.pause()
    bgMusic.currentTime = 0
    gameOverSound.currentTime = 0
    gameOverSound.play().catch(() => {})
}

const playDetachedSound = (soundElement) => {
    const soundInstance = soundElement.cloneNode()
    soundInstance.currentTime = 0
    return {
        soundInstance,
        playPromise: soundInstance.play()
    }
}

const loop = setInterval(() => {
    if (!isGameStarted || isGameOver) {
        return
    }

    const pipePosition = pipe.offsetLeft
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '')

    if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
        endGame(pipePosition, marioPosition)
        clearInterval(loop)
    }
}, 10)

const scoreLoop = setInterval(updateScore, 150)

document.addEventListener('keydown', jump)
window.addEventListener('load', tryPlayStartMusic)
window.addEventListener('focus', tryPlayStartMusic)
document.addEventListener('click', tryPlayStartMusic, { once: true })
document.addEventListener('touchstart', tryPlayStartMusic, { once: true })
gameBoard.addEventListener('pointerdown', handleBoardTouch)
startButton.addEventListener('click', startGame)
restartButton.addEventListener('click', () => {
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
