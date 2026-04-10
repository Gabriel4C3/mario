// Seleciona o elemento do Mario no HTML para podermos manipulá-lo com JavaScript.
const mario = document.querySelector('.mario')

// Seleciona o elemento do cano no HTML para controlar a colisão e a animação.
const pipe = document.querySelector('.pipe')

// Cria a função responsável pelo pulo do Mario.
const jump = () => {

// Adiciona a classe `jump`, que ativa a animação de pulo definida no CSS.
mario.classList.add('jump')

// Aguarda 750 milissegundos, o mesmo tempo da animação, antes de remover a classe.
setTimeout(() =>{

    // Remove a classe `jump` para permitir que um novo pulo aconteça depois.
    mario.classList.remove('jump')

// Fecha a função executada após o tempo de espera.
},700)

// Fecha a função de pulo.
}

// Cria um loop que roda a cada 10 milissegundos para verificar a colisão continuamente.
const loop = setInterval(() => {

    // Pega a posição horizontal atual do cano em relação à esquerda da tela.
    const pipePosition = pipe.offsetLeft

    // Lê a posição vertical atual do Mario no CSS e converte de texto para número.
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '')

    // Verifica se o cano está na área do Mario e se ele está baixo o suficiente para colidir.
    if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {

        // Para a animação do cano quando acontece a colisão.
        pipe.style.animation = 'none'

        // Mantém o cano parado exatamente na posição em que a colisão aconteceu.
        pipe.style.left = `${pipePosition}px`

        // Para qualquer animação do Mario no momento da colisão.
        mario.style.animation = 'none'

        // Mantém o Mario congelado na altura exata em que ele bateu no cano.
        mario.style.bottom = `${marioPosition}px`

        // Troca a imagem do Mario pela imagem de game over.
        mario.src = 'assets/game-over.png'

        // Diminui a largura da imagem de game over para ela ficar proporcional.
        mario.style.width = '75px'

        // Ajusta a margem esquerda para alinhar melhor a imagem de game over.
        mario.style.marginLeft = '50px'

        // Encerra o loop para o jogo parar de verificar colisão após o game over.
        clearInterval(loop)
    }

// Fecha a função executada repetidamente pelo setInterval.
}

// Define que o loop de colisão será executado a cada 10 milissegundos.
,10)

// Faz o Mario pular sempre que uma tecla do teclado for pressionada.
document.addEventListener('keydown', jump)
