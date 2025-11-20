// --- VARIAVEIS GLOBAIS ---
const $ = id => document.getElementById(id); // Pegar elemento pelo ID
const formatar = n => (Number.isInteger(n) ? String(n) : Number(n).toFixed(2).replace(/\.?0+$/,'')); // Formatar número
const dormidinha = (ms) => new Promise(resolve => setTimeout(resolve, ms)); // Dormir um pouco

// --- FUNÇÕES DE AJUSTE DE NÚMEROS E LEITURA ---
function ajustarNumero(num){
    num = String(num).trim();
    if(!num) throw 'Campo vazio detectado.';
    if(num.includes('/')){
        const [n, d] = num.split('/').map(Number);
        if(isNaN(n) || isNaN(d) || d === 0) throw 'Fração inválida.';
        return n/d;
    }
    const v = Number(num);
    if(isNaN(v)) throw 'Número inválido inserido.';
    return v;
}

function lerMatriz(){
    const matriz = [[],[],[]], errors = [];
    for(let i=0; i<3; i++){
        for(let j=0; j<3; j++){
            const el = $(`a${i}${j}`);
            try {
                matriz[i][j] = ajustarNumero(el.value);
                el.classList.remove('is-invalid');
            } catch(e){
                matriz[i][j] = 0;
                errors.push(`Célula [${i+1},${j+1}]: ${e}`);
                el.classList.add('is-invalid');
            }
        }
    }
    return {matriz, errors};
}

// --- CÁLCULOS (clara) ---
function calcularDeterminante(M){
    // Diagonais Positivas
    const p1 = M[0][0]*M[1][1]*M[2][2];
    const p2 = M[0][1]*M[1][2]*M[2][0];
    const p3 = M[0][2]*M[1][0]*M[2][1];
    const somaPos = p1 + p2 + p3;

    // Diagonais Negativas
    const n1 = M[0][2]*M[1][1]*M[2][0];
    const n2 = M[0][0]*M[1][2]*M[2][1];
    const n3 = M[0][1]*M[1][0]*M[2][2];
    const somaNeg = n1 + n2 + n3;

    const det = somaPos - somaNeg;
    return { p1, p2, p3, somaPos, n1, n2, n3, somaNeg, det };
}

// --- VISUALIZAÇÃO E COORDENADAS ---
function renderizarGradeSarrus(matriz){
    const area = $('sarrusArea');
    area.innerHTML = '';
    // Matriz expandida 3x5
    const vals = [
        [matriz[0][0], matriz[0][1], matriz[0][2], matriz[0][0], matriz[0][1]],
        [matriz[1][0], matriz[1][1], matriz[1][2], matriz[1][0], matriz[1][1]],
        [matriz[2][0], matriz[2][1], matriz[2][2], matriz[2][0], matriz[2][1]]
    ];

    for(let i=0; i<3; i++){
        for(let j=0; j<5; j++){
            const div = document.createElement('div');
            div.className = 'cell' + (j>2 ? ' dup' : '');
            div.id = `cell-${i}-${j}`; 
            div.textContent = formatar(vals[i][j]);
            area.appendChild(div);
        }
    }
    // Chama ajuste imediatamente após renderizar
    setTimeout(ajustarTamanhoSVG, 50);
}

// Calcula coordenadas relativas ao Wrapper 
function getCoords(r, c){
    const el = $(`cell-${r}-${c}`);
    const wrapper = $('sarrusWrapper'); 
    
    if (!el || !wrapper) {
        console.warn(`Elemento cell-${r}-${c} ou sarrusWrapper não encontrado.`);
        return { x: 0, y: 0 };
    }
    
    const wrapperRect = wrapper.getBoundingClientRect();
    const cellRect = el.getBoundingClientRect();

    const xOffset = 0; 
    const yOffset = 0; 
    
    return {
        x: (cellRect.left + cellRect.width / 2) - wrapperRect.left + xOffset,
        y: (cellRect.top + cellRect.height / 2) - wrapperRect.top + yOffset
    };
}

// Ajusta o SVG para cobrir toda a área da grid
function ajustarTamanhoSVG(){
    const svg = $('arrowsSvg');
    const wrapper = $('sarrusWrapper');
    if(!svg || !wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const width = wrapperRect.width;
    const height = wrapperRect.height;
    
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
}

// Desenha seta SVG 
function desenharSeta(svg, x1,y1,x2,y2, color){
    const ns = 'http://www.w3.org/2000/svg';
    let defs = svg.querySelector('defs');
    if(!defs){ defs = document.createElementNS(ns,'defs'); svg.prepend(defs); }
    
    // Cria ID único para o marcador baseado na cor
    const idMarker = 'arrowhead-'+color.replace('#','');
    
    if(!document.getElementById(idMarker)){
        const m = document.createElementNS(ns,'marker');
        m.setAttribute('id',idMarker);
        m.setAttribute('markerWidth','6'); m.setAttribute('markerHeight','6');
        m.setAttribute('refX','5'); m.setAttribute('refY','3'); m.setAttribute('orient','auto');
        const p = document.createElementNS(ns,'path');
        p.setAttribute('d','M0,0 L6,3 L0,6 L2,3 z');
        p.setAttribute('fill', color);
        m.appendChild(p);
        defs.appendChild(m);
    }

    const line = document.createElementNS(ns,'line');
    line.setAttribute('x1',x1); line.setAttribute('y1',y1);
    line.setAttribute('x2',x2); line.setAttribute('y2',y2);
    line.setAttribute('stroke', color); line.setAttribute('stroke-width','2');
    line.setAttribute('marker-end', `url(#${idMarker})`);
    svg.appendChild(line);
}

function limparEfeitos(){
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('highlight-diag-pos', 'highlight-diag-neg'));
    const svg = $('arrowsSvg'); if(svg) svg.innerHTML = '';
}

// --- ANIMAÇÃO PRINCIPAL ---
async function animarSarrus(matriz, calc){
    const svg = $('arrowsSvg');
    const txtArea = $('calculo-detalhado');
    const posColor = '#6366f1';
    const negColor = '#f97316';

    // Garante alinhamento antes de começar
    ajustarTamanhoSVG();
    limparEfeitos();
    txtArea.innerHTML = '';

    // Definição das diagonais (Linha, Coluna)
    const posSets = [ [[0,0],[1,1],[2,2]], [[0,1],[1,2],[2,3]], [[0,2],[1,3],[2,4]] ];
    const negSets = [ [[0,2],[1,1],[2,0]], [[0,3],[1,2],[2,1]], [[0,4],[1,3],[2,2]] ];
    const pVals = [calc.p1, calc.p2, calc.p3];
    const nVals = [calc.n1, calc.n2, calc.n3];

    // Diagonais POSITIVAS
    txtArea.innerHTML += `<p class="text-primary mb-1"><strong>Diagonais Principais (Soma):</strong></p>`;
    for(let i=0; i<3; i++){
        const [c1, c2, c3] = posSets[i];
        
        // Efeito Visual
        $(`cell-${c1[0]}-${c1[1]}`).classList.add('highlight-diag-pos');
        $(`cell-${c2[0]}-${c2[1]}`).classList.add('highlight-diag-pos');
        $(`cell-${c3[0]}-${c3[1]}`).classList.add('highlight-diag-pos');

        // Setas
        const p1 = getCoords(c1[0], c1[1]);
        const p2 = getCoords(c2[0], c2[1]);
        const p3 = getCoords(c3[0], c3[1]);
        
        desenharSeta(svg, p1.x, p1.y, p2.x, p2.y, posColor);
        desenharSeta(svg, p2.x, p2.y, p3.x, p3.y, posColor);

        // Texto
        const v1 = formatar(matriz[c1[0]][c1[1]%3]);
        const v2 = formatar(matriz[c2[0]][c2[1]%3]);
        const v3 = formatar(matriz[c3[0]][c3[1]%3]);
        
        txtArea.innerHTML += `<div class="mb-1">(${v1} × ${v2} × ${v3}) = <strong>${formatar(pVals[i])}</strong></div>`;
        
        await dormidinha(1000);
        limparEfeitos();
    }
    txtArea.innerHTML += `<div class="mb-3 border-top">Soma (+): <strong>${formatar(calc.somaPos)}</strong></div>`;
    await dormidinha(500);

    //  Diagonais NEGATIVAS
    txtArea.innerHTML += `<p class="text-warning mb-1"><strong>Diagonais Secundárias (Subtração):</strong></p>`;
    for(let i=0; i<3; i++){
        const [c1, c2, c3] = negSets[i];
        
        $(`cell-${c1[0]}-${c1[1]}`).classList.add('highlight-diag-neg');
        $(`cell-${c2[0]}-${c2[1]}`).classList.add('highlight-diag-neg');
        $(`cell-${c3[0]}-${c3[1]}`).classList.add('highlight-diag-neg');

        const p1 = getCoords(c1[0], c1[1]);
        const p2 = getCoords(c2[0], c2[1]);
        const p3 = getCoords(c3[0], c3[1]);
        
        desenharSeta(svg, p1.x, p1.y, p2.x, p2.y, negColor);
        desenharSeta(svg, p2.x, p2.y, p3.x, p3.y, negColor);

        const v1 = formatar(matriz[c1[0]][c1[1]%3]);
        const v2 = formatar(matriz[c2[0]][c2[1]%3]);
        const v3 = formatar(matriz[c3[0]][c3[1]%3]);

        txtArea.innerHTML += `<div class="mb-1">- (${v1} × ${v2} × ${v3}) = <strong>-${formatar(nVals[i])}</strong></div>`;
        
        await dormidinha(1000);
        limparEfeitos();
    }
    txtArea.innerHTML += `<div class="mb-3 border-top">Soma (-): <strong>${formatar(calc.somaNeg)}</strong></div>`;
    await dormidinha(500);

    // 3. Final
    txtArea.innerHTML += `<p class="mt-2 p-2 bg-light border rounded text-center"><strong>Total:</strong> ${formatar(calc.somaPos)} - ${formatar(calc.somaNeg)} = <span class="text-success fs-5"><strong>${formatar(calc.det)}</strong></span></p>`;
}

function atualizarApps(M, calc){
    const det = calc.det;
    $('current_det_value').textContent = formatar(det);
    
    const app1 = $('app1_interpretation');
    app1.innerHTML = det !== 0 ? 
        `<span class="text-success">Sim, Solução Única (SPD).</span>` : 
        `<span class="text-danger">Não tem solução única (SPI ou SI).</span>`;

    const app2 = $('app2_interpretation');
    app2.innerHTML = det !== 0 ? 
        `<span class="text-success">LI (Linearmente Independentes).</span>` : 
        `<span class="text-danger">LD (Linearmente Dependentes).</span>`;

    $('app4_volume').textContent = `${formatar(Math.abs(det))} u.v.`;
    
    const is2D = M[0][2]===0 && M[1][2]===0 && M[2][0]===0 && M[2][1]===0 && M[2][2]===1;
    if(is2D){
        $('app3_area').textContent = `${formatar(Math.abs(det))} u.a.`;
        $('app3_note').textContent = "Formato 2D válido.";
        $('app3_note').className = "text-success small";
    } else {
        $('app3_area').textContent = "—";
        $('app3_note').textContent = "Não é formato 2D.";
        $('app3_note').className = "text-danger small";
    }
}

// --- EVENTO PRINCIPAL ---
$('calcBtn').addEventListener('click', async () => {
    const btn = $('calcBtn');
    const msg = $('validationMsg'); 
    msg.innerHTML = '';
    
    // Limpa interface
    $('stepsContainer').style.display = 'none';
    $('applications-panel').style.display = 'none';
    $('result').innerHTML = 'Resultado: <span class="fw-bold">—</span>';
    
    try {
        // Lê dados
        const { matriz: M, errors } = lerMatriz();
        if(errors.length){
            msg.innerHTML = errors.map(e => `<div class="text-error">${e}</div>`).join('');
            return; 
        }

        //  Bloqueia botão
        btn.disabled = true; 
        btn.textContent = "Calculando...";

        // Prepara Visualização
        renderizarGradeSarrus(M);
        const calc = calcularDeterminante(M);
        ajustarTamanhoSVG();


        $('stepsContainer').style.display = 'block';

        btn.disabled = true;
        btn.textContent = "Calculando...";

        // Executa Animação 
        await animarSarrus(M, calc);

        //Sucesso - Mostra resultados finais
        $('result').innerHTML = `Resultado: <span class="fw-bold text-dark">${formatar(calc.det)}</span>`;
        atualizarApps(M, calc);
        $('applications-panel').style.display = 'block';


    } catch (err) {
        console.error("Erro na animação:", err);
        msg.innerHTML = `<div class="text-error">Ocorreu um erro na animação. Verifique o console.</div>`;
        if(typeof calc !== 'undefined') {
             $('result').innerHTML = `Resultado: <span class="fw-bold">${formatar(calc.det)}</span>`;
        }
    } finally {
        btn.disabled = false; 
        btn.textContent = "CALCULAR";
    }
});

// Redimensionamento
window.addEventListener('resize', () => setTimeout(ajustarTamanhoSVG, 150));

// Enter key
document.querySelectorAll('.matrix-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') $('calcBtn').click();
    });
});