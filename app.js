// --- REGISTRO DO SERVICE WORKER (PWA) ---
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('./sw.js')
//             .then(reg => console.log('Service Worker registrado com sucesso!', reg.scope))
//             .catch(err => console.error('Erro ao registrar Service Worker:', err));
//     });
// }



// --- CONSTANTES ---
const STORAGE_KEY = '@myryde:routes'; 

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

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal(); 
    }
});

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

confirmDeleteModal.addEventListener('click', (e) => {
    if (e.target === confirmDeleteModal) {
        confirmDeleteModal.classList.add('hidden');
        routeSelectedId = null; // Limpamos a memória para não apagar a rota errada depois
    }
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


// --- LÓGICA DE BACKUP (EXPORTAR) ---

const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const exportBackupBtn = document.getElementById('export-backup-btn');

// Abrir e fechar configurações
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

settingsModal.addEventListener('click', (e) => {
    // Se onde eu cliquei foi EXATAMENTE o fundo escuro (e não o card dentro dele)
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});

// Ação de baixar o backup
exportBackupBtn.addEventListener('click', () => {
    const routes = getRoutes();
    
    if (routes.length === 0) {
        alert("Não há trajetos para exportar no momento.");
        return;
    }

    // 1. Transforma os dados JS em um texto JSON bonito e identado
    const dataStr = JSON.stringify(routes, null, 2);
    
    // 2. Cria um "arquivo de texto" na memória do navegador
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // 3. Cria um link invisível, aperta nele e depois apaga (Truque para forçar download)
    const link = document.createElement('a');
    link.href = url;
    
    // Gera um nome de arquivo automático com a data de hoje
    const dataHoje = new Date().toISOString().split('T')[0];
    link.download = `myryde-backup-${dataHoje}.json`;
    
    link.click();
    
    // Limpa a memória para não pesar o navegador
    URL.revokeObjectURL(url);
});


// --- LÓGICA DE BACKUP (IMPORTAR) ---

const importBackupBtn = document.getElementById('import-backup-btn');
const importFileInput = document.getElementById('import-file-input');

// 1. Truque: O botão bonito clica no input invisível
importBackupBtn.addEventListener('click', () => {
    importFileInput.click();
});

// 2. Quando o usuário escolhe um arquivo no celular/PC
importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    // Se o usuário cancelou a escolha, não faz nada
    if (!file) return;

    // Ferramenta nativa do JS para ler arquivos
    const reader = new FileReader();

    // 3. O que fazer quando terminar de ler o arquivo
    reader.onload = (evento) => {
        try {
            // Pega o texto do arquivo e transforma de volta em um Array de trajetos
            const dadosRecuperados = JSON.parse(evento.target.result);

            // Confirma se o que veio no arquivo é realmente uma lista (Array)
            if (Array.isArray(dadosRecuperados)) {
                
                // Usamos um confirm() rápido para evitar que o usuário apague tudo sem querer
                if(confirm("Isso vai substituir TODOS os seus trajetos atuais por este backup. Deseja continuar?")) {
                    
                    saveRoutes(dadosRecuperados); // Salva no banco de dados local
                    renderRoutes(dadosRecuperados); // Redesenha a tela
                    
                    alert("Backup importado com sucesso!");
                    settingsModal.classList.add('hidden'); // Fecha a aba de configurações
                }
                
            } else {
                alert("Arquivo inválido. Certifique-se de que é um backup do MyRyde.");
            }
        } catch (erro) {
            alert("Erro ao ler o arquivo. Ele pode estar corrompido ou não ser um .json válido.");
        }
        
        // Limpa o input invisível para permitir importar o mesmo arquivo de novo se necessário
        importFileInput.value = '';
    };

    // Manda o leitor ler o arquivo como texto
    reader.readAsText(file);
});



// --- INICIALIZAÇÃO ---

function initApp() {
    const routes = getRoutes();
    
    // Se a lista estiver vazia no banco, salva as rotas padrão
    if (localStorage.getItem(STORAGE_KEY) === null) {
        saveRoutes(routes);
    }

    // Desenha a interface na mesma hora
    renderRoutes(routes); 
}

initApp();