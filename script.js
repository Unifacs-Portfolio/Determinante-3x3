// chamada da id do html
const btn = document.getElementById("calcular");
const resultadoContainer = document.getElementById("resultado");
const form = document.getElementById("matriz");
const passoAPassoContainer = document.getElementById("passo-a-passo");

// Função helper para criar pausas
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

form.addEventListener("submit", function(event) {
    event.preventDefault();
    // Chama a função principal de cálculo e animação
    calcularDeterminante();
});

// Função principal (agora é async para usar 'await')
async function calcularDeterminante() {
    
    // LIMPAR RESULTADOS ANTERIORES
    resultadoContainer.textContent = "";
    passoAPassoContainer.innerHTML = ""; // Limpa a animação anterior

    //  OBTER VALORES DA MATRIZ
    let a = Number(document.getElementById("matriz-1-1").value);
    let b = Number(document.getElementById("matriz-1-2").value);
    let c = Number(document.getElementById("matriz-1-3").value);
    let d = Number(document.getElementById("matriz-2-1").value);
    let e = Number(document.getElementById("matriz-2-2").value);
    let f = Number(document.getElementById("matriz-2-3").value);
    let g = Number(document.getElementById("matriz-3-1").value);
    let h = Number(document.getElementById("matriz-3-2").value);
    let i = Number(document.getElementById("matriz-3-3").value);

    // CRIAR A VISUALIZAÇÃO DA MATRIZ (REGRA DE SARRUS)
    
    // Matriz 5x3 (3 originais + 2 duplicadas)
    const valoresVis = [
        a, b, c, a, b, // Linha 1
        d, e, f, d, e, // Linha 2
        g, h, i, g, h  // Linha 3
    ];
    
    // Índices das diagonais na matriz visual 'valoresVis'
    const diagPos = [
        [0, 6, 12], // a*e*i
        [1, 7, 10], // b*f*g 
        [2, 8, 14]  // c*d*h
    ];
    // Correção dos índices Sarrus baseado na minha visualização 5x3
    diagPos[1] = [1, 7, 13]; // b*f*g 
    diagPos[2] = [2, 8, 14]; // c*d*h 

    const diagNeg = [
        [2, 6, 10], // c*e*g
        [3, 7, 11], // a*f*h 
        [4, 8, 12]  // b*d*i 
    ];


    // Cria os elementos DOM para a matriz visual
    const visMatrix = document.createElement('div');
    visMatrix.className = 'visualizacao-matriz';
    const cellElements = []; // Array para guardar as células

    for (let j = 0; j < valoresVis.length; j++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = valoresVis[j];
        
        // Marca as colunas duplicadas
        const col = j % 5;
        if (col === 3 || col === 4) {
            cell.classList.add('duplicada');
        }
        visMatrix.appendChild(cell);
        cellElements.push(cell);
    }
    
    // Adiciona a matriz visual e a área de texto ao container
    const calculoDetalhado = document.createElement('div');
    calculoDetalhado.id = 'calculo-detalhado';
    passoAPassoContainer.appendChild(visMatrix);
    passoAPassoContainer.appendChild(calculoDetalhado);
    
    // Função helper para limpar destaques
    const clearHighlights = () => {
        cellElements.forEach(c => {
            c.classList.remove('highlight-diag-pos', 'highlight-diag-neg');
        });
    };

    // ANIMAÇÃO PASSO A PASSO
    await sleep(200); // Pausa inicial

    // --- Diagonais Positivas ---
    calculoDetalhado.innerHTML = '<p>Calculando diagonais principais (Soma +):</p>';
    
    let p1 = a * e * i;
    let p2 = b * f * g;
    let p3 = c * d * h;
    let somaPos = p1 + p2 + p3;

    // Diag 1 (a, e, i)
    diagPos[0].forEach(index => cellElements[index].classList.add('highlight-diag-pos'));
    calculoDetalhado.innerHTML += `<p>(${a} * ${e} * ${i}) = ${p1}</p>`;
    await sleep(1000);
    clearHighlights();

    // Diag 2 (b, f, g)
    diagPos[1].forEach(index => cellElements[index].classList.add('highlight-diag-pos'));
    calculoDetalhado.innerHTML += `<p>(${b} * ${f} * ${g}) = ${p2}</p>`;
    await sleep(1000);
    clearHighlights();

    // Diag 3 (c, d, h)
    diagPos[2].forEach(index => cellElements[index].classList.add('highlight-diag-pos'));
    calculoDetalhado.innerHTML += `<p>(${c} * ${d} * ${h}) = ${p3}</p>`;
    await sleep(1000);
    clearHighlights();
    
    calculoDetalhado.innerHTML += `<p class="soma-pos">Soma (+): ${somaPos}</p>`;
    await sleep(1000);

    // --- Diagonais Negativas ---
    calculoDetalhado.innerHTML += '<p>Calculando diagonais secundárias (Subtração -):</p>';

    let n1 = c * e * g;
    let n2 = a * f * h;
    let n3 = b * d * i;
    let somaNeg = n1 + n2 + n3;
    
    // Diag 1 (c, e, g)
    diagNeg[0].forEach(index => cellElements[index].classList.add('highlight-diag-neg'));
    calculoDetalhado.innerHTML += `<p>- (${c} * ${e} * ${g}) = -${n1}</p>`;
    await sleep(1000);
    clearHighlights();

    // Diag 2 (a, f, h)
    diagNeg[1].forEach(index => cellElements[index].classList.add('highlight-diag-neg'));
    calculoDetalhado.innerHTML += `<p>- (${a} * ${f} * ${h}) = -${n2}</p>`;
    await sleep(1000);
    clearHighlights();

    // Diag 3 (b, d, i)
    diagNeg[2].forEach(index => cellElements[index].classList.add('highlight-diag-neg'));
    calculoDetalhado.innerHTML += `<p>- (${b} * ${d} * ${i}) = -${n3}</p>`;
    await sleep(1000);
    clearHighlights();

    calculoDetalhado.innerHTML += `<p class="soma-neg">Soma (-): -${somaNeg}</p>`;
    await sleep(1000);

    // RESULTADO FINAL
    let det = somaPos - somaNeg;
    
    calculoDetalhado.innerHTML += `<p class="final">Total: (${somaPos}) - (${somaNeg}) = ${det}</p>`;
    
    // Mostra o resultado final na div principal
    resultadoContainer.textContent = `Determinante = ${det}`;
}