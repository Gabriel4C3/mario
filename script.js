const mario = document.querySelector('.mario')
const pipe = document.querySelector('.pipe')
const gameOverPanel = document.querySelector('.game-over-panel')
const restartButton = document.querySelector('.restart-button')

const jump = () => {
    mario.classList.add('jump')
    setTimeout(() => {
        mario.classList.remove('jump')
    }, 700)
}

const loop = setInterval(() => {
    const pipePosition = pipe.offsetLeft
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '')

    if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
        pipe.style.animation = 'none'
        pipe.style.left = `${pipePosition}px`

        mario.style.animation = 'none'
        mario.style.bottom = `${marioPosition}px`
        mario.src = 'assets/game-over.png'
        mario.style.width = '75px'
        mario.style.marginLeft = '50px'
        gameOverPanel.classList.add('show')

        clearInterval(loop)
    }
}, 10)

document.addEventListener('keydown', jump)
restartButton.addEventListener('click', () => {
    window.location.reload()
})
