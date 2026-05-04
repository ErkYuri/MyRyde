// --- REGISTRO DO SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso!', reg.scope))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    });
}



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
        li.style.cursor = 'pointer'; 

        li.innerHTML = `
            <div class="route-info">
                <span class="route-name">${route.nome}</span>
            </div>
            <div class="route-consumption">
                <span class="consumption-value">-${route.consumoPercentual}%</span>
            </div>
        `;

        // --- LÓGICA DO TOQUE LONGO ---
        let pressTimer;
        let isLongPress = false;

        // Função que inicia o cronômetro
        const startPress = (e) => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate(50);
                
                // Captura a coordenada Y de onde o usuário tocou
                const touchY = e.touches ? e.touches[0].clientY : e.clientY;
                
                openOptionsMenu(route, touchY);
            }, 600); 
        };

        // Função que cancela o cronômetro se o usuário soltar ou arrastar o dedo antes da hora
        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        // Eventos para o Mouse (Computador)
        li.addEventListener('mousedown', startPress);
        li.addEventListener('mouseup', cancelPress);
        li.addEventListener('mouseleave', cancelPress);

        // Eventos para o Toque (Celular)
        li.addEventListener('touchstart', startPress, { passive: true });
        li.addEventListener('touchend', cancelPress);
        li.addEventListener('touchmove', cancelPress);

        // O Clique normal (deduzir bateria) agora tem uma condição
        li.addEventListener('click', () => {
            // Só subtrai a bateria se NÃO tiver sido um toque longo
            if (!isLongPress) {
                applyRouteConsumption(route.consumoPercentual);
            }
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

// --- LÓGICA DO MODAL (ADICIONAR / EDITAR) ---
let editingRouteId = null;

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
    editingRouteId = null;
    modalOverlay.classList.remove('hidden');
}

// Funcao para fechar modal e limpar inputs
function closeModal() {
    modalOverlay.classList.add('hidden');
    inputRouteName.value = '';
    inputRouteConsumption.value = '';
    editingRouteId = null;
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

    let routes = getRoutes();

    // Se a variável tiver um ID, significa que estamos no modo Edição!
    if (editingRouteId) {
        // Encontra a posição do trajeto antigo na lista
        const index = routes.findIndex(r => r.id === editingRouteId);
        if (index !== -1) {
            // Atualiza os dados na mesma posição
            routes[index].nome = nome;
            routes[index].consumoPercentual = consumo;
        }
    } else {
        // Se não tem ID, é criação normal
        const novoTrajeto = {
            id: Date.now(),
            nome: nome,
            consumoPercentual: consumo
        };
        routes.push(novoTrajeto);
    }

    
    // Salva a lista atualizada de volta no banco
    saveRoutes(routes);
    
    // Desenha a tela novamente com o item novo
    renderRoutes(routes);
    
    // Fecha o modal
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



// --- LÓGICA DO MENU DE CONTEXTO E EXCLUSÃO ---

let routeSelectedId = null; 

const optionsOverlay = document.getElementById('route-options-modal');
const contextMenu = document.getElementById('context-menu');
const deleteRouteBtn = document.getElementById('delete-route-btn');
const editRouteBtn = document.getElementById('edit-route-btn');

function openOptionsMenu(route, touchY) {
    routeSelectedId = route.id;
    
    // Posiciona o menu no centro (X) e um pouco acima do dedo do usuário (Y)
    contextMenu.style.left = '50%';
    contextMenu.style.top = `${touchY - 60}px`; // Sobe 60px para não ficar embaixo do dedo
    
    optionsOverlay.classList.remove('hidden');
}

function closeOptionsMenu() {
    optionsOverlay.classList.add('hidden');
    routeSelectedId = null;
}

// O GRANDE TRUQUE: Fecha o menu se clicar no fundo transparente
optionsOverlay.addEventListener('click', (e) => {
    if (e.target === optionsOverlay) {
        closeOptionsMenu();
    }
});

// AÇÃO: EXCLUIR TRAJETO
// Elementos da Caixinha de Confirmação
const confirmDeleteModal = document.getElementById('delete-confirm-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// 1. AÇÃO NO MENU FLUTUANTE: Abre a caixinha de confirmação em vez de excluir direto
deleteRouteBtn.addEventListener('click', () => {
    // CORREÇÃO: Apenas escondemos o menu visualmente, mantendo o routeSelectedId intacto na memória!
    optionsOverlay.classList.add('hidden'); 
    
    // Mostra a confirmação
    confirmDeleteModal.classList.remove('hidden'); 
});

// 2. SE DESISTIR: Fecha a confirmação
cancelDeleteBtn.addEventListener('click', () => {
    confirmDeleteModal.classList.add('hidden');
    routeSelectedId = null; // Limpa a memória de qual trajeto estava selecionado
});

// 3. SE CONFIRMAR DE FATO: Apaga do banco de dados
confirmDeleteBtn.addEventListener('click', () => {
    let routes = getRoutes();
    routes = routes.filter(r => r.id !== routeSelectedId);
    
    saveRoutes(routes); 
    renderRoutes(routes); 
    
    confirmDeleteModal.classList.add('hidden'); // Esconde a caixinha
    routeSelectedId = null; // Limpa a memória
});


// AÇÃO: EDITAR TRAJETO
editRouteBtn.addEventListener('click', () => {
    // 1. Pega os dados do banco
    const routes = getRoutes();
    
    // 2. Acha o trajeto específico que o usuário clicou usando o ID
    const routeToEdit = routes.find(r => r.id === routeSelectedId);
    
    if (routeToEdit) {
        // 3. Preenche as caixinhas de texto com os dados do trajeto
        inputRouteName.value = routeToEdit.nome;
        inputRouteConsumption.value = routeToEdit.consumoPercentual;
        
        // 4. Avisa o sistema que estamos no modo de edição deste ID
        editingRouteId = routeToEdit.id;
        
        // 5. Fecha o menuzinho flutuante e abre o Modal principal
        closeOptionsMenu();
        modalOverlay.classList.remove('hidden'); 
    }
});