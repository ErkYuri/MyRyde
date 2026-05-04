// --- CONSTANTES ---
const STORAGE_KEY = '@ryde:routes'; 

// --- SERVIÇOS DE DADOS (LocalStorage) ---

function getRoutes() {
    const storedRoutes = localStorage.getItem(STORAGE_KEY);
    if (storedRoutes) {
        return JSON.parse(storedRoutes);
    }
    return [
        {
            id: 1714500000000,
            nome: "Casa -> UFOP",
            consumoPercentual: 15
        },
        {
            id: 1714500005000,
            nome: "UFOP -> Casa",
            consumoPercentual: 10
        }
    ];
}

function saveRoutes(routes) {
    const routesJSON = JSON.stringify(routes);
    localStorage.setItem(STORAGE_KEY, routesJSON);
}

// --- RENDERIZAÇÃO DA INTERFACE (UI) ---

/**
 * Pega o array de trajetos e transforma em elementos HTML na tela.
 */
function renderRoutes(routes) {
    // 1. Capturamos a lista (ul) do HTML
    const listElement = document.getElementById('routes-list');
    
    // 2. Limpamos a lista antes de desenhar para não duplicar itens 
    // se chamarmos essa função várias vezes
    listElement.innerHTML = ''; 

    // 3. Se a lista estiver vazia, mostramos uma mensagem amigável
    if (routes.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">Nenhum trajeto cadastrado ainda.</p>';
        return; // Para a execução da função aqui
    }

    // 4. Se tiver rotas, percorremos o array criando os cartõezinhos
    routes.forEach(route => {
        const li = document.createElement('li');
        li.className = 'route-item';
        
        // NOVO: Muda o ponteiro do mouse para a "mãozinha" indicando que é clicável no PC
        li.style.cursor = 'pointer'; 

        li.innerHTML = `
            <div class="route-info">
                <span class="route-name">${route.nome}</span>
            </div>
            <div class="route-consumption">
                <span class="consumption-value">-${route.consumoPercentual}%</span>
            </div>
        `;

        // NOVO: Adiciona a ação de clique neste cartão específico
        li.addEventListener('click', () => {
            applyRouteConsumption(route.consumoPercentual);
        });

        listElement.appendChild(li);
    });


}

// --- INICIALIZAÇÃO DO APP ---

function initApp() {
    console.log("Iniciando Ryde...");

    const routes = getRoutes();
    saveRoutes(routes); // Garante que o exemplo seja salvo no primeiro uso

    // Chamamos a função para desenhar a interface!
    renderRoutes(routes); 
}

// LOGICA DO OVERLAY E CADASTRO DE ROTAS

// Pegando do HTML
const modalOverlay = document.getElementById('add-route-modal');
const openModalBtn = document.getElementById('add-route-btn');
const closeModalBtn = document.getElementById('cancel-route-btn');
const saveRouteBtn = document.getElementById('save-route-btn');

// Inputs do overlay
const inputRouteName = document.getElementById('route-name-input');
const inputRouteConsumption = document.getElementById('route-consumption-input');

// Funcao para abrir modal
function openModal() {
    modalOverlay.classList.remove('hidden');
}

// Funcao para fechar modal e limpar inputs
function closeModal() {
    modalOverlay.classList.add('hidden');
    inputRouteName.value = '';
    inputRouteConsumption.value = '';
}

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Funcao atrelada ao Salvar no modal
saveRouteBtn.addEventListener('click', () => {
    const nome = inputRouteName.value.trim(); // .trim() remove espaços vazios
    const consumo = parseInt(inputRouteConsumption.value);

    // Validação básica: impede salvar se os campos estiverem vazios ou inválidos
    if (!nome || isNaN(consumo) || consumo <= 0) {
        alert("Por favor, preencha o nome e um consumo válido.");
        return;
    }

    // Cria o objeto do novo trajeto
    const novoTrajeto = {
        id: Date.now(), // Gera um ID único baseado na data/hora atual
        nome: nome,
        consumoPercentual: consumo
    };

    // 1. Puxa os trajetos que já existem no LocalStorage
    const routes = getRoutes();
    
    // 2. Adiciona o novo trajeto na lista
    routes.push(novoTrajeto);
    
    // 3. Salva a lista atualizada de volta no banco
    saveRoutes(routes);
    
    // 4. Desenha a tela novamente com o item novo
    renderRoutes(routes);
    
    // 5. Fecha o modal
    closeModal();
});


// --- LÓGICA DOS ALERTAS DE BATERIA ---

// Elementos do Modal de Erro (Vermelho)
const alertOverlay = document.getElementById('battery-alert');
const closeAlertBtn = document.getElementById('close-alert-btn');

// Elementos do Modal de Aviso (Laranja)
const adviceOverlay = document.getElementById('battery-advice');
const closeAdviceBtn = document.getElementById('close-advice-btn');

// Funções de abrir e fechar o Erro
function showBatteryAlert() { alertOverlay.classList.remove('hidden'); }
function hideBatteryAlert() { alertOverlay.classList.add('hidden'); }

// Funções de abrir e fechar o Aviso
function showBatteryAdvice() { adviceOverlay.classList.remove('hidden'); }
function hideBatteryAdvice() { adviceOverlay.classList.add('hidden'); }

// Ouvintes de clique nos botões
closeAlertBtn.addEventListener('click', hideBatteryAlert);
closeAdviceBtn.addEventListener('click', hideBatteryAdvice);


// --- FUNCAO DE CALCULO DA AUTONOMIA ---

function applyRouteConsumption(consumoDoTrajeto) {
    const batteryInput = document.getElementById('current-battery');
    let bateriaAtual = parseInt(batteryInput.value);

    if(isNaN(bateriaAtual)) {
        bateriaAtual = 100;
    }

    let novaBateria = bateriaAtual - consumoDoTrajeto;
    
    // 1. Verifica se deu ERRO (Menor que zero)
    if(novaBateria <= 0) {
        showBatteryAlert();
        novaBateria = 0; // Trava no zero pq não é possível fazer o trajeto
    } 
    // 2. Verifica se é um AVISO (Entre 1 e 10)
    else if (novaBateria < 10 && novaBateria > 0) {
        showBatteryAdvice();
        // Aqui NÃO zeramos a bateria. O cálculo segue normal, apenas mostramos o aviso.
    }

    // Atualiza a interface
    batteryInput.value = novaBateria;
}

// Executa a inicialização
initApp();