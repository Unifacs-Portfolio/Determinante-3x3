// --- VARIAVEIS GLOBAIS ---
const formatar = n => (Number.isInteger(n) ? String(n) : Number(n).toFixed(2).replace(/\.?0+$/, '')) // Formatar número
const pausarPorMs = (ms) => new Promise(resolve => setTimeout(resolve, ms)) // Dormir um pouco

// --- FUNÇÕES DE AJUSTE DE NÚMEROS E LEITURA ---
function ajustarNumero(numero) {
    numero = String(numero).trim()
    if (!numero) {
        throw 'Campo vazio detectado.'
    }
    if (numero.includes('/')) {
        const [numerador, denominador] = numero.split('/').map(Number)
        if (isNaN(numerador) || isNaN(denominador) || denominador === 0) {
            throw 'Fração inválida.'
        }
        return numerador / denominador
    }
    numero = Number(numero)
    if (isNaN(numero)) {
        throw 'Número inválido inserido.'
    }
    return numero
}

function lerMatriz() {
    const matriz = [[], [], []]
    const errors = []
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const element = document.getElementById(`a${i}${j}`)
            try {
                matriz[i][j] = ajustarNumero(element.value)
                element.classList.remove('is-invalid')
            } catch (error) {
                matriz[i][j] = 0
                errors.push(`Célula [${i + 1},${j + 1}]: ${error}`)
                element.classList.add('is-invalid')
            }
        }
    }
    return { matriz, errors }
}

// --- CÁLCULOS (clara) ---
function calcularDeterminante(matriz) {
    // Diagonais principais
    const produtoDiagonalPrincipal1 = matriz[0][0] * matriz[1][1] * matriz[2][2]
    const produtoDiagonalPrincipal2 = matriz[0][1] * matriz[1][2] * matriz[2][0]
    const produtoDiagonalPrincipal3 = matriz[0][2] * matriz[1][0] * matriz[2][1]
    const somaProdutosDiagonaisPrincipais = produtoDiagonalPrincipal1 + produtoDiagonalPrincipal2 + produtoDiagonalPrincipal3

    // Diagonais secundárias
    const produtoDiagonalSecundaria1 = matriz[0][2] * matriz[1][1] * matriz[2][0]
    const produtoDiagonalSecundaria2 = matriz[0][0] * matriz[1][2] * matriz[2][1]
    const produtoDiagonalSecundaria3 = matriz[0][1] * matriz[1][0] * matriz[2][2]
    const somaProdutosDiagonaisSecundarias = produtoDiagonalSecundaria1 + produtoDiagonalSecundaria2 + produtoDiagonalSecundaria3

    const determinante = somaProdutosDiagonaisPrincipais - somaProdutosDiagonaisSecundarias
    return { produtoDiagonalPrincipal1, produtoDiagonalPrincipal2, produtoDiagonalPrincipal3, somaProdutosDiagonaisPrincipais, produtoDiagonalSecundaria1, produtoDiagonalSecundaria2, produtoDiagonalSecundaria3, somaProdutosDiagonaisSecundarias, determinante }
}

// --- VISUALIZAÇÃO E COORDENADAS ---
function renderizarGradeSarrus(matriz) {
    const area = document.getElementById('sarrusArea')
    area.innerHTML = ''
    // Matriz expandida 3x5
    const matrizExpandida = [
        [matriz[0][0], matriz[0][1], matriz[0][2], matriz[0][0], matriz[0][1]],
        [matriz[1][0], matriz[1][1], matriz[1][2], matriz[1][0], matriz[1][1]],
        [matriz[2][0], matriz[2][1], matriz[2][2], matriz[2][0], matriz[2][1]]
    ]

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
            const div = document.createElement('div')
            div.className = 'cell' + (j > 2 ? ' dup' : '')
            div.id = `cell-${i}-${j}`
            div.textContent = formatar(matrizExpandida[i][j])
            area.appendChild(div)
        }
    }
    // Chama ajuste imediatamente após renderizar
    setTimeout(ajustarTamanhoSVG, 50)
}

// Calcula coordenadas relativas ao Wrapper 
function getCoords(r, c) {
    const elementoCelula = document.getElementById(`cell-${r}-${c}`)
    const wrapper = document.getElementById('sarrusWrapper')

    if (!elementoCelula || !wrapper) {
        console.warn(`Elemento cell-${r}-${c} ou sarrusWrapper não encontrado.`)
        return { x: 0, y: 0 }
    }

    const wrapperRect = wrapper.getBoundingClientRect()
    const cellRect = elementoCelula.getBoundingClientRect()

    const xOffset = 0
    const yOffset = 0

    return {
        x: (cellRect.left + cellRect.width / 2) - wrapperRect.left + xOffset,
        y: (cellRect.top + cellRect.height / 2) - wrapperRect.top + yOffset
    }
}

// Ajusta o SVG para cobrir toda a área da grid
function ajustarTamanhoSVG() {
    const svg = document.getElementById('arrowsSvg')
    const wrapper = document.getElementById('sarrusWrapper')
    if (!svg || !wrapper) return

    const wrapperRect = wrapper.getBoundingClientRect()
    const width = wrapperRect.width
    const height = wrapperRect.height

    svg.setAttribute('width', width)
    svg.setAttribute('height', height)
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
}

// Desenha seta SVG 
function desenharSeta(svg, x1, y1, x2, y2, color) {
    const ns = 'http://www.w3.org/2000/svg'
    let defs = svg.querySelector('defs')
    if (!defs) {
        defs = document.createElementNS(ns, 'defs')
        svg.prepend(defs)
    }

    // Cria ID único para o marcador baseado na cor
    const idMarker = 'arrowhead-' + color.replace('#', '')

    if (!document.getElementById(idMarker)) {
        const m = document.createElementNS(ns, 'marker')
        m.setAttribute('id', idMarker)
        m.setAttribute('markerWidth', '6')
        m.setAttribute('markerHeight', '6')
        m.setAttribute('refX', '5')
        m.setAttribute('refY', '3')
        m.setAttribute('orient', 'auto')
        const p = document.createElementNS(ns, 'path')
        p.setAttribute('d', 'M0,0 L6,3 L0,6 L2,3 z')
        p.setAttribute('fill', color)
        m.appendChild(p)
        defs.appendChild(m)
    }

    const line = document.createElementNS(ns, 'line')
    line.setAttribute('x1', x1)
    line.setAttribute('y1', y1)
    line.setAttribute('x2', x2)
    line.setAttribute('y2', y2)
    line.setAttribute('stroke', color)
    line.setAttribute('stroke-width', '2')
    line.setAttribute('marker-end', `url(#${idMarker})`)
    svg.appendChild(line)
}

function limparEfeitos() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight-diag-pos', 'highlight-diag-neg'))
    const svg = document.getElementById('arrowsSvg')
    if (svg) {
        svg.innerHTML = ''
    }
}

// --- ANIMAÇÃO PRINCIPAL ---
async function animarSarrus(matriz, calc) {
    const svg = document.getElementById('arrowsSvg')
    const txtArea = document.getElementById('calculo-detalhado')
    const posColor = '#6366f1'
    const negColor = '#f97316'

    // Garante alinhamento antes de começar
    ajustarTamanhoSVG()
    limparEfeitos()
    txtArea.innerHTML = ''

    // Definição das diagonais (Linha, Coluna)
    const posSets = [[[0, 0], [1, 1], [2, 2]], [[0, 1], [1, 2], [2, 3]], [[0, 2], [1, 3], [2, 4]]]
    const negSets = [[[0, 2], [1, 1], [2, 0]], [[0, 3], [1, 2], [2, 1]], [[0, 4], [1, 3], [2, 2]]]
    const valoresPos = [calc.produtoDiagonalPrincipal1, calc.produtoDiagonalPrincipal2, calc.produtoDiagonalPrincipal3]
    const valoresNeg = [calc.produtoDiagonalSecundaria1, calc.produtoDiagonalSecundaria2, calc.produtoDiagonalSecundaria3]

    // Diagonais principais
    txtArea.innerHTML += `<p class="text-primary mb-1"><strong>Diagonais Principais:</strong></p>`
    const resultadosDiagonaisPrincipais = []
    for (let i = 0; i < 3; i++) {
        const [c1, c2, c3] = posSets[i]

        // Efeito Visual
        document.getElementById(`cell-${c1[0]}-${c1[1]}`).classList.add('highlight-diag-pos')
        document.getElementById(`cell-${c2[0]}-${c2[1]}`).classList.add('highlight-diag-pos')
        document.getElementById(`cell-${c3[0]}-${c3[1]}`).classList.add('highlight-diag-pos')

        // Setas
        const p1 = getCoords(c1[0], c1[1])
        const p2 = getCoords(c2[0], c2[1])
        const p3 = getCoords(c3[0], c3[1])

        desenharSeta(svg, p1.x + 10, p1.y + 10, p2.x - 10, p2.y - 10, posColor)
        desenharSeta(svg, p2.x + 10, p2.y + 10, p3.x - 10, p3.y - 10, posColor)

        // Texto
        const v1 = formatar(matriz[c1[0]][c1[1] % 3])
        const v2 = formatar(matriz[c2[0]][c2[1] % 3])
        const v3 = formatar(matriz[c3[0]][c3[1] % 3])
        const resultadoDiagonalPrincipal = formatar(valoresPos[i])
        txtArea.innerHTML += `<div class="mb-1">(${v1} × ${v2} × ${v3}) = <strong>${resultadoDiagonalPrincipal}</strong></div>`
        resultadosDiagonaisPrincipais.push(resultadoDiagonalPrincipal)
        await pausarPorMs(1000)
        limparEfeitos()
    }
    const somaDasDiagonaisPrincipais = `(${resultadosDiagonaisPrincipais[0]} + ${resultadosDiagonaisPrincipais[1]} + ${resultadosDiagonaisPrincipais[2]})`
    txtArea.innerHTML += `<div class="mb-3 border-top">Soma das diagonais principais:<br>${somaDasDiagonaisPrincipais} = <strong>${formatar(calc.somaProdutosDiagonaisPrincipais)}</strong></div>`
    await pausarPorMs(500)

    //  Diagonais secundárias
    txtArea.innerHTML += `<p class="text-warning mb-1"><strong>Diagonais Secundárias:</strong></p>`
    const resultadosDiagonaisSecundarias = []
    for (let i = 0; i < 3; i++) {
        const [c1, c2, c3] = negSets[i]

        document.getElementById(`cell-${c1[0]}-${c1[1]}`).classList.add('highlight-diag-neg')
        document.getElementById(`cell-${c2[0]}-${c2[1]}`).classList.add('highlight-diag-neg')
        document.getElementById(`cell-${c3[0]}-${c3[1]}`).classList.add('highlight-diag-neg')

        const p1 = getCoords(c1[0], c1[1])
        const p2 = getCoords(c2[0], c2[1])
        const p3 = getCoords(c3[0], c3[1])

        desenharSeta(svg, p1.x - 10, p1.y + 10, p2.x + 10, p2.y - 10, negColor)
        desenharSeta(svg, p2.x - 10, p2.y + 10, p3.x + 10, p3.y - 10, negColor)

        const v1 = formatar(matriz[c1[0]][c1[1] % 3])
        const v2 = formatar(matriz[c2[0]][c2[1] % 3])
        const v3 = formatar(matriz[c3[0]][c3[1] % 3])
        const resultadoDiagonalSecundaria = formatar(valoresNeg[i])
        txtArea.innerHTML += `<div class="mb-1">(${v1} × ${v2} × ${v3}) = <strong>${formatar(valoresNeg[i])}</strong></div>`
        resultadosDiagonaisSecundarias.push(resultadoDiagonalSecundaria)
        await pausarPorMs(1000)
        limparEfeitos()
    }
    const somaDasDiagonaisSecundarias = `(${resultadosDiagonaisSecundarias[0]} + ${resultadosDiagonaisSecundarias[1]} + ${resultadosDiagonaisSecundarias[2]})`
    txtArea.innerHTML += `<div class="mb-3 border-top">Soma das diagonais secundárias:<br>${somaDasDiagonaisSecundarias} = <strong>${formatar(calc.somaProdutosDiagonaisSecundarias)}</strong></div>`
    await pausarPorMs(500)

    // 3. Final
    txtArea.innerHTML += `<p class="mt-2 p-2 bg-light border rounded text-center"><strong>Total:</strong> ${formatar(calc.somaProdutosDiagonaisPrincipais)} - ${formatar(calc.somaProdutosDiagonaisSecundarias)} = <span class="text-success fs-5"><strong>${formatar(calc.determinante)}</strong></span></p>`
}

function atualizarApps(matriz, calc) {
    const det = calc.determinante
    document.getElementById('current_det_value').textContent = formatar(det)

    const app1 = document.getElementById('app1_interpretation')
    app1.innerHTML = det !== 0 ?
        `<span class="text-success">Sim, Solução Única (SPD).</span>` :
        `<span class="text-danger">Não tem solução única (SPI ou SI).</span>`

    const app2 = document.getElementById('app2_interpretation')
    app2.innerHTML = det !== 0 ?
        `<span class="text-success">LI (Linearmente Independentes).</span>` :
        `<span class="text-danger">LD (Linearmente Dependentes).</span>`

    document.getElementById('app4_volume').textContent = `${formatar(Math.abs(det))} u.v.`
}

// --- EVENTO PRINCIPAL ---
document.getElementById('calcBtn').addEventListener('click', async () => {
    const botaoCalcular = document.getElementById('calcBtn')
    const msgValidacao = document.getElementById('validationMsg')
    msgValidacao.innerHTML = ''

    // Limpa interface
    document.getElementById('stepsContainer').style.display = 'none'
    document.getElementById('applications-panel').style.display = 'none'
    document.getElementById('result').innerHTML = 'Resultado: <span class="fw-bold">—</span>'

    try {
        // Lê dados
        const { matriz, errors } = lerMatriz()
        if (errors.length) {
            msgValidacao.innerHTML = errors.map(e => `<div class="text-error">${e}</div>`).join('')
            return
        }

        //  Bloqueia botão
        botaoCalcular.disabled = true
        botaoCalcular.textContent = "Calculando..."

        // Prepara Visualização
        renderizarGradeSarrus(matriz)
        const calc = calcularDeterminante(matriz)
        ajustarTamanhoSVG()


        document.getElementById('stepsContainer').style.display = 'block'

        botaoCalcular.disabled = true
        botaoCalcular.textContent = "Calculando..."

        // Executa Animação 
        await animarSarrus(matriz, calc)

        //Sucesso - Mostra resultados finais
        document.getElementById('result').innerHTML = `Resultado: <span class="fw-bold text-dark">${formatar(calc.determinante)}</span>`
        atualizarApps(matriz, calc)
        document.getElementById('applications-panel').style.display = 'block'


    } catch (err) {
        console.error("Erro na animação:", err)
        msgValidacao.innerHTML = `<div class="text-error">Ocorreu um erro na animação. Verifique o console.</div>`
        if (typeof calc !== 'undefined') {
            document.getElementById('result').innerHTML = `Resultado: <span class="fw-bold">${formatar(calc.determinante)}</span>`
        }
    } finally {
        botaoCalcular.disabled = false
        botaoCalcular.textContent = "CALCULAR"
    }
})

// Redimensionamento
window.addEventListener('resize', () => setTimeout(ajustarTamanhoSVG, 150))

// Enter key
document.querySelectorAll('.matrix-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('calcBtn').click()
        }
    })
})