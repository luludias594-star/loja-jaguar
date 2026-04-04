let carrinho = JSON.parse(localStorage.getItem('oncaCarrinho') || '[]');
let favoritos = JSON.parse(localStorage.getItem('oncaFavoritos') || '[]');
let produtoAtual = {};

// quando a pagina carrega
document.addEventListener('DOMContentLoaded', () => {
    atualizarContadorCarrinho();
    atualizarIconeFavoritos();
    atualizarIconeUsuario();

    // inicializa busca via JS — mais confiável que oninput/onkeydown inline no HTML
    const campoBusca = document.getElementById('campoBusca');
    if (campoBusca) {
        campoBusca.addEventListener('input', filtrarBusca);
        campoBusca.addEventListener('keydown', teclasBusca);
    }

    if (document.querySelector('.checkout-page')) {
        carregarCheckout();
        configurarMascaras();
        configurarPagamento();
    }

    if (document.querySelector('.categoria')) {
        inicializarCards();
        inicializarFiltros();
        marcarFavoritosNosCards();
    }
});

function salvarCarrinho() { localStorage.setItem('oncaCarrinho', JSON.stringify(carrinho)); }
function salvarFavoritos() { localStorage.setItem('oncaFavoritos', JSON.stringify(favoritos)); }

function atualizarContadorCarrinho() {
    const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    document.querySelectorAll('#cartCount').forEach(el => el.textContent = total);
}

function atualizarIconeFavoritos() {
    const total = favoritos.length;
    document.querySelectorAll('#favCount').forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? 'flex' : 'none';
    });
}

/* =============================================
   BUSCA INLINE
============================================= */
function toggleBusca() {
    const wrap = document.getElementById('buscaWrap');
    const campo = document.getElementById('campoBusca');
    if (!wrap) return;

    const estaAberta = wrap.classList.contains('aberta');
    if (estaAberta) {
        fecharBusca();
    } else {
        wrap.classList.add('aberta');
        campo.focus();
    }
}

function fecharBusca() {
    const wrap = document.getElementById('buscaWrap');
    const campo = document.getElementById('campoBusca');
    if (!wrap) return;

    wrap.classList.remove('aberta');
    campo.value = '';
    filtrarBusca();
}

// chamado pelo onkeydown no input
function teclasBusca(e) {
    if (e.key === 'Escape') {
        fecharBusca();
    } else if (e.key === 'Enter') {
        e.preventDefault(); // evita perder o foco ou submeter form
        filtrarBusca();
    }
}

function filtrarBusca() {
    const termo = (document.getElementById('campoBusca')?.value || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.card');

    if (cards.length === 0) return;

    let visiveis = 0;
    cards.forEach(card => {
        const nome = (card.dataset.nome || '').toLowerCase();
        // se nao tem termo, mostra tudo; senão filtra pelo nome
        const bate = !termo || nome.includes(termo);
        card.style.display = bate ? 'block' : 'none';
        if (bate) visiveis++;
    });

    const aviso = document.getElementById('semResultados');
    if (aviso) aviso.style.display = visiveis === 0 ? 'block' : 'none';
}

/* =============================================
   LOGIN / USUARIO
============================================= */

// atualiza o icone do usuario dependendo se ta logado ou nao
function atualizarIconeUsuario() {
    const usuario = JSON.parse(localStorage.getItem('oncaUsuario') || 'null');
    const btnLogin = document.getElementById('btnLogin');
    if (!btnLogin) return;

    if (usuario) {
        // mostra iniciais do nome no lugar do icone
        const iniciais = usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        btnLogin.className = 'usuario-avatar';
        btnLogin.innerHTML = iniciais;
        btnLogin.title = `Olá, ${usuario.nome}`;
        btnLogin.onclick = abrirMenuUsuario;

        // adiciona estilo do avatar inline pq é simples mesmo
        btnLogin.style.cssText = `
            width: 34px; height: 34px; background: #800080;
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; font-size: 13px; font-weight: 700;
            cursor: pointer; border: 2px solid #a020a0;
        `;
    } else {
        btnLogin.className = 'fa-regular fa-user';
        btnLogin.innerHTML = '';
        btnLogin.style.cssText = '';
        btnLogin.title = 'Entrar';
        btnLogin.onclick = abrirLogin;
    }
}

function abrirLogin() {
    document.getElementById('modalLogin')?.classList.add('aberto');
    document.getElementById('modalOverlay')?.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    mostrarAba('entrar'); // sempre começa na aba de entrar
}

function fecharLogin() {
    document.getElementById('modalLogin')?.classList.remove('aberto');
    document.getElementById('modalOverlay')?.classList.remove('aberto');
    document.body.style.overflow = '';
}

// alterna entre as abas entrar / cadastrar
function mostrarAba(qual) {
    document.getElementById('abaEntrar').style.display = qual === 'entrar' ? 'block' : 'none';
    document.getElementById('abaCadastrar').style.display = qual === 'cadastrar' ? 'block' : 'none';

    document.getElementById('tabEntrar').classList.toggle('ativo', qual === 'entrar');
    document.getElementById('tabCadastrar').classList.toggle('ativo', qual === 'cadastrar');
}

// mostra/esconde a senha
function toggleVerSenha() {
    const input = document.getElementById('loginSenha');
    const icone = document.getElementById('toggleSenha');
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        icone.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        icone.className = 'fa-regular fa-eye';
    }
}

function fazerLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const senha = document.getElementById('loginSenha')?.value;

    // validacao simples mesmo
    if (!email || !senha) {
        alert('Preencha o e-mail e a senha!');
        return;
    }

    if (!email.includes('@')) {
        alert('E-mail inválido!');
        return;
    }

    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }

    // pega usuarios cadastrados no localStorage
    const usuarios = JSON.parse(localStorage.getItem('oncaUsuarios') || '[]');
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (!usuario) {
        alert('E-mail ou senha incorretos. Tente novamente.');
        return;
    }

    // salva sessao do usuario
    localStorage.setItem('oncaUsuario', JSON.stringify({ nome: usuario.nome, email: usuario.email }));

    fecharLogin();
    atualizarIconeUsuario();
    mostrarToast(`Bem-vindo de volta, ${usuario.nome.split(' ')[0]}! 👋`);
}

function fazerCadastro() {
    const nome = document.getElementById('cadNome')?.value.trim();
    const email = document.getElementById('cadEmail')?.value.trim();
    const senha = document.getElementById('cadSenha')?.value;
    const confirm = document.getElementById('cadSenhaConfirm')?.value;

    // valida tudo
    if (!nome || !email || !senha || !confirm) {
        alert('Preencha todos os campos!');
        return;
    }

    if (!email.includes('@')) {
        alert('E-mail inválido!');
        return;
    }

    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }

    if (senha !== confirm) {
        alert('As senhas não coincidem!');
        return;
    }

    // verifica se email ja existe
    const usuarios = JSON.parse(localStorage.getItem('oncaUsuarios') || '[]');
    if (usuarios.some(u => u.email === email)) {
        alert('Já existe uma conta com esse e-mail!');
        return;
    }

    // cria o usuario
    const novoUsuario = { nome, email, senha };
    usuarios.push(novoUsuario);
    localStorage.setItem('oncaUsuarios', JSON.stringify(usuarios));

    // ja loga automaticamente
    localStorage.setItem('oncaUsuario', JSON.stringify({ nome, email }));

    fecharLogin();
    atualizarIconeUsuario();
    mostrarToast(`Conta criada com sucesso! Bem-vindo, ${nome.split(' ')[0]}! 🎉`);
}

// login social (so visual por enquanto)
function loginSocial(provedor) {
    mostrarToast(`Login com ${provedor} em breve!`);
}

// pequeno menu quando ja ta logado
function abrirMenuUsuario() {
    const usuario = JSON.parse(localStorage.getItem('oncaUsuario') || 'null');
    if (!usuario) return;

    // cria menu temporario
    const menu = document.createElement('div');
    menu.id = 'menuUsuario';
    menu.style.cssText = `
        position: fixed; top: 80px; right: 5%;
        background: #1a1a1a; border: 1px solid #333;
        border-radius: 10px; padding: 16px; z-index: 2000;
        min-width: 180px; text-align: center;
        animation: modalEntrar 0.2s ease;
    `;
    menu.innerHTML = `
        <p style="font-size: 14px; color: #aaa; margin-bottom: 4px;">Olá,</p>
        <p style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #fff;">${usuario.nome.split(' ')[0]}</p>
        <p style="font-size: 13px; color: #666; margin-bottom: 16px; border-top: 1px solid #333; padding-top: 12px;">${usuario.email}</p>
        <button onclick="fazerLogout()" style="
            width: 100%; background: #800080; color: #fff; border: none;
            padding: 10px; border-radius: 6px; cursor: pointer;
            font-family: 'Roboto Slab', serif; font-size: 14px; font-weight: 600;
        ">Sair</button>
    `;

    document.body.appendChild(menu);

    // fecha ao clicar fora
    setTimeout(() => {
        document.addEventListener('click', function fecharMenu() {
            document.getElementById('menuUsuario')?.remove();
            document.removeEventListener('click', fecharMenu);
        });
    }, 100);
}

function fazerLogout() {
    localStorage.removeItem('oncaUsuario');
    document.getElementById('menuUsuario')?.remove();
    atualizarIconeUsuario();
    mostrarToast('Até logo! 👋');
}

/* =============================================
   CARDS
============================================= */
function inicializarCards() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-btn-rapido')) return;
            if (e.target.closest('.card-btn-fav')) return;
            abrirModal(card);
        });

        const btnVer = card.querySelector('.card-btn-rapido');
        if (btnVer) btnVer.addEventListener('click', (e) => { e.stopPropagation(); abrirModal(card); });

        const btnFav = card.querySelector('.card-btn-fav');
        if (btnFav) btnFav.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorito(card, btnFav); });
    });

    const btnAdd = document.getElementById('addCarrinho');
    const btnComprar = document.getElementById('comprarAgora');
    const btnFechar = document.getElementById('fecharModal');
    const overlayModal = document.getElementById('modalOverlay');

    if (btnAdd) btnAdd.addEventListener('click', adicionarAoCarrinho);
    if (btnComprar) btnComprar.addEventListener('click', comprarAgora);
    if (btnFechar) btnFechar.addEventListener('click', fecharModal);
    if (overlayModal) overlayModal.addEventListener('click', fecharModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { fecharModal(); fecharCarrinho(); fecharFavoritos(); fecharLogin(); }
    });
}

/* =============================================
   FAVORITOS — CARD
============================================= */
function toggleFavorito(card, btn) {
    const nome = card.dataset.nome;
    const preco = parseFloat(card.dataset.preco);
    const img = card.dataset.img;
    const index = favoritos.findIndex(f => f.nome === nome);

    if (index === -1) {
        favoritos.push({ nome, preco, img });
        btn.classList.add('favoritado');
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        mostrarToast('❤️ Adicionado aos favoritos!');
    } else {
        favoritos.splice(index, 1);
        btn.classList.remove('favoritado');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        mostrarToast('Removido dos favoritos.');
    }

    salvarFavoritos();
    atualizarIconeFavoritos();
}

function marcarFavoritosNosCards() {
    document.querySelectorAll('.card').forEach(card => {
        const btn = card.querySelector('.card-btn-fav');
        if (!btn) return;
        if (favoritos.some(f => f.nome === card.dataset.nome)) {
            btn.classList.add('favoritado');
            btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        }
    });
}

/* =============================================
   FAVORITOS — SIDEBAR
============================================= */
function abrirFavoritos() {
    renderizarFavoritosSidebar();
    document.getElementById('favoritosSidebar')?.classList.add('aberto');
    document.getElementById('overlayFavoritos')?.classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

function fecharFavoritos() {
    document.getElementById('favoritosSidebar')?.classList.remove('aberto');
    document.getElementById('overlayFavoritos')?.classList.remove('aberto');
    document.body.style.overflow = '';
}

function renderizarFavoritosSidebar() {
    const container = document.getElementById('favoritosItens');
    if (!container) return;

    if (favoritos.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:50px 0;color:#aaa">
                <i class="fa-regular fa-heart" style="font-size:40px;display:block;margin-bottom:14px;color:#444"></i>
                Nenhum favorito ainda.
            </div>`;
        return;
    }

    container.innerHTML = '';
    favoritos.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.nome}">
            <div class="item-info">
                <p>${item.nome}</p>
                <strong>${formatarPreco(item.preco)}</strong>
                <div class="item-controles" style="margin-top:8px">
                    <button class="btn-add-fav-carrinho" onclick="irParaCompra('${item.nome}')">
                        <i class="fa-solid fa-cart-shopping"></i> Comprar
                    </button>
                </div>
            </div>
            <button class="item-remover" onclick="removerFavorito(${index})">
                <i class="fa-solid fa-heart-crack"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

function removerFavorito(index) {
    const nome = favoritos[index].nome;
    favoritos.splice(index, 1);
    salvarFavoritos();
    atualizarIconeFavoritos();
    renderizarFavoritosSidebar();

    document.querySelectorAll('.card').forEach(card => {
        if (card.dataset.nome === nome) {
            const btn = card.querySelector('.card-btn-fav');
            if (btn) { btn.classList.remove('favoritado'); btn.innerHTML = '<i class="fa-regular fa-heart"></i>'; }
        }
    });
}

function irParaCompra(nome) {
    fecharFavoritos();
    const card = [...document.querySelectorAll('.card')].find(c => c.dataset.nome === nome);
    if (card) abrirModal(card);
    else window.location.href = 'camisetas.html';
}

/* =============================================
   MODAL DO PRODUTO
============================================= */
function abrirModal(card) {
    const nome = card.dataset.nome;
    const preco = parseFloat(card.dataset.preco);
    const img = card.dataset.img;
    const tamanhos = card.dataset.tamanhos ? card.dataset.tamanhos.split(',') : ['P', 'M', 'G', 'GG'];

    produtoAtual = { nome, preco, img, tamanho: null };

    document.getElementById('nomeProduto').textContent = nome;
    document.getElementById('precoProduto').textContent = formatarPreco(preco);
    document.getElementById('modalImg').src = img;
    document.getElementById('modalImg').alt = nome;

    const container = document.getElementById('tamanhosBtns');
    container.innerHTML = '';
    ['P', 'M', 'G', 'GG'].forEach(tam => {
        const btn = document.createElement('button');
        btn.textContent = tam;
        if (!tamanhos.includes(tam)) btn.disabled = true;
        btn.addEventListener('click', () => selecionarTamanho(btn, tam));
        container.appendChild(btn);
    });

    const btnFavModal = document.getElementById('btnFavModal');
    if (btnFavModal) {
        const jaSalvo = favoritos.some(f => f.nome === nome);
        btnFavModal.innerHTML = jaSalvo ? '<i class="fa-solid fa-heart"></i> Favoritado' : '<i class="fa-regular fa-heart"></i> Favoritar';
        btnFavModal.classList.toggle('favoritado', jaSalvo);
        btnFavModal.onclick = () => toggleFavoritoModal(nome, preco, img, btnFavModal);
    }

    document.getElementById('modalProduto').classList.add('aberto');
    document.getElementById('modalOverlay').classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    document.getElementById('modalProduto')?.classList.remove('aberto');
    document.getElementById('modalOverlay')?.classList.remove('aberto');
    document.body.style.overflow = '';
}

function selecionarTamanho(btn, tam) {
    document.querySelectorAll('.tamanhos button').forEach(b => b.classList.remove('selecionado'));
    btn.classList.add('selecionado');
    produtoAtual.tamanho = tam;
}

function toggleFavoritoModal(nome, preco, img, btn) {
    const index = favoritos.findIndex(f => f.nome === nome);
    if (index === -1) {
        favoritos.push({ nome, preco, img });
        btn.innerHTML = '<i class="fa-solid fa-heart"></i> Favoritado';
        btn.classList.add('favoritado');
        mostrarToast('❤️ Adicionado aos favoritos!');
    } else {
        favoritos.splice(index, 1);
        btn.innerHTML = '<i class="fa-regular fa-heart"></i> Favoritar';
        btn.classList.remove('favoritado');
        mostrarToast('Removido dos favoritos.');
    }
    salvarFavoritos();
    atualizarIconeFavoritos();
    marcarFavoritosNosCards();
}

/* =============================================
   CARRINHO
============================================= */
function adicionarAoCarrinho() {
    if (!produtoAtual.tamanho) { sacudirBotaoTamanho(); return; }

    const existente = carrinho.find(item => item.nome === produtoAtual.nome && item.tamanho === produtoAtual.tamanho);
    if (existente) existente.quantidade++;
    else carrinho.push({ ...produtoAtual, quantidade: 1 });

    salvarCarrinho();
    atualizarContadorCarrinho();
    fecharModal();
    mostrarToast('✓ Produto adicionado ao carrinho!');
    animarIconeCarrinho();
}

function comprarAgora() {
    if (!produtoAtual.tamanho) { sacudirBotaoTamanho(); return; }

    const existente = carrinho.find(item => item.nome === produtoAtual.nome && item.tamanho === produtoAtual.tamanho);
    if (existente) existente.quantidade++;
    else carrinho.push({ ...produtoAtual, quantidade: 1 });

    salvarCarrinho();
    window.location.href = 'checkout.html';
}

/* =============================================
   CARRINHO SIDEBAR
============================================= */
function abrirCarrinho() {
    renderizarCarrinhoSidebar();
    document.getElementById('carrinhoSidebar')?.classList.add('aberto');
    document.getElementById('overlayCarrinho')?.classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
    document.getElementById('carrinhoSidebar')?.classList.remove('aberto');
    document.getElementById('overlayCarrinho')?.classList.remove('aberto');
    document.body.style.overflow = '';
}

function renderizarCarrinhoSidebar() {
    const container = document.getElementById('carrinhoItens');
    const totalEl = document.getElementById('totalCarrinho');
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:50px 0;color:#aaa">
                <i class="fa-solid fa-cart-shopping" style="font-size:40px;display:block;margin-bottom:14px;color:#444"></i>
                Seu carrinho está vazio.
            </div>`;
        if (totalEl) totalEl.textContent = 'R$ 0,00';
        return;
    }

    container.innerHTML = '';
    let total = 0;

    carrinho.forEach((item, index) => {
        total += item.preco * item.quantidade;
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.setAttribute('id', `cart-item-${index}`);
        div.innerHTML = `
            <img src="${item.img}" alt="${item.nome}">
            <div class="item-info">
                <p>${item.nome}</p>
                <small>Tamanho: ${item.tamanho}</small>
                <strong>${formatarPreco(item.preco * item.quantidade)}</strong>
                <div class="item-controles">
                    <button onclick="alterarQuantidade(${index}, -1)">−</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${index}, 1)">+</button>
                </div>
            </div>
            <button class="item-remover" onclick="removerDoCarrinho(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    });

    if (totalEl) totalEl.textContent = formatarPreco(total);
}

function alterarQuantidade(index, delta) {
    carrinho[index].quantidade += delta;
    if (carrinho[index].quantidade <= 0) carrinho.splice(index, 1);
    salvarCarrinho();
    atualizarContadorCarrinho();
    renderizarCarrinhoSidebar();
}

function removerDoCarrinho(index) {
    const el = document.getElementById(`cart-item-${index}`);
    if (el) {
        el.style.transition = 'opacity 0.25s, transform 0.25s';
        el.style.opacity = '0';
        el.style.transform = 'translateX(40px)';
        setTimeout(() => {
            carrinho.splice(index, 1);
            salvarCarrinho();
            atualizarContadorCarrinho();
            renderizarCarrinhoSidebar();
        }, 250);
    } else {
        carrinho.splice(index, 1);
        salvarCarrinho();
        atualizarContadorCarrinho();
        renderizarCarrinhoSidebar();
    }
}

/* =============================================
   FILTROS
============================================= */
function inicializarFiltros() {
    document.querySelectorAll('[data-filtro]').forEach(cb => cb.addEventListener('change', aplicarFiltros));
}

function aplicarFiltros() {
    const tamanhosSel = [...document.querySelectorAll('[data-filtro="tamanho"]:checked')].map(c => c.value);
    const coresSel = [...document.querySelectorAll('[data-filtro="cor"]:checked')].map(c => c.value);
    const precosSel = [...document.querySelectorAll('[data-filtro="preco"]:checked')].map(c => c.value);

    let visiveis = 0;
    document.querySelectorAll('.card').forEach(card => {
        const tamCard = card.dataset.tamanhos ? card.dataset.tamanhos.split(',') : [];
        const corCard = card.dataset.cor || '';
        const precoCard = parseFloat(card.dataset.preco);

        const passaTamanho = tamanhosSel.length === 0 || tamanhosSel.some(t => tamCard.includes(t));
        const passaCor = coresSel.length === 0 || coresSel.includes(corCard);
        const passaPreco = precosSel.length === 0 || precosSel.some(faixa => {
            const [min, max] = faixa.split('-').map(Number);
            return precoCard >= min && precoCard <= max;
        });

        const visivel = passaTamanho && passaCor && passaPreco;
        card.style.display = visivel ? 'block' : 'none';
        if (visivel) visiveis++;
    });

    const semResultados = document.getElementById('semResultados');
    if (semResultados) semResultados.style.display = visiveis === 0 ? 'block' : 'none';
}

function limparFiltros() {
    document.querySelectorAll('[data-filtro]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.card').forEach(card => card.style.display = 'block');
    const semResultados = document.getElementById('semResultados');
    if (semResultados) semResultados.style.display = 'none';
}

/* =============================================
   ORDENAÇÃO
============================================= */
function ordenarProdutos() {
    const criterio = document.getElementById('ordenar').value;
    const grid = document.getElementById('gridProdutos');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.card')];
    cards.sort((a, b) => {
        const pa = parseFloat(a.dataset.preco), pb = parseFloat(b.dataset.preco);
        const na = a.dataset.nome || '', nb = b.dataset.nome || '';
        if (criterio === 'menor') return pa - pb;
        if (criterio === 'maior') return pb - pa;
        if (criterio === 'nome') return na.localeCompare(nb, 'pt-BR');
        return 0;
    });
    cards.forEach(card => grid.appendChild(card));
}

/* =============================================
   CHECKOUT
============================================= */
function carregarCheckout() {
    const container = document.getElementById('resumoItens');
    const vazio = document.getElementById('resumoVazio');
    const totais = document.getElementById('resumoTotais');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('totalFinal');
    if (!container) return;

    if (carrinho.length === 0) {
        container.style.display = 'none';
        if (vazio) vazio.style.display = 'block';
        if (totais) totais.style.display = 'none';
        return;
    }

    let subtotal = 0;
    container.innerHTML = '';
    carrinho.forEach(item => {
        subtotal += item.preco * item.quantidade;
        const div = document.createElement('div');
        div.className = 'resumo-item';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.nome}">
            <div class="resumo-item-info">
                <p>${item.nome} × ${item.quantidade}</p>
                <small>Tamanho: ${item.tamanho}</small>
            </div>
            <strong>${formatarPreco(item.preco * item.quantidade)}</strong>
        `;
        container.appendChild(div);
    });

    if (subtotalEl) subtotalEl.textContent = formatarPreco(subtotal);
    if (totalEl) totalEl.textContent = formatarPreco(subtotal);
    atualizarContadorCarrinho();
}

function confirmarPedido() {
    if (carrinho.length === 0) { alert('Seu carrinho está vazio!'); return; }

    const nome = document.getElementById('nomeCliente')?.value.trim();
    const email = document.getElementById('emailCliente')?.value.trim();
    const endereco = document.getElementById('enderecoCliente')?.value.trim();

    if (!nome || !email || !endereco) {
        alert('Por favor, preencha nome, e-mail e endereço para continuar.');
        return;
    }

    carrinho = [];
    salvarCarrinho();
    atualizarContadorCarrinho();
    document.getElementById('modalConfirmado')?.classList.add('aberto');
    document.getElementById('modalOverlay')?.classList.add('aberto');
}

/* =============================================
   MASCARAS
============================================= */
function configurarMascaras() {
    const mascaras = [
        { id: 'cpfCliente', fn: v => { v = v.replace(/\D/g, '').slice(0, 11); v = v.replace(/(\d{3})(\d)/, '$1.$2'); v = v.replace(/(\d{3})(\d)/, '$1.$2'); return v.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); } },
        { id: 'cepCliente', fn: v => { v = v.replace(/\D/g, '').slice(0, 8); return v.replace(/(\d{5})(\d)/, '$1-$2'); } },
        { id: 'numCartao', fn: v => { v = v.replace(/\D/g, '').slice(0, 16); return v.replace(/(\d{4})(?=\d)/g, '$1 '); } },
        { id: 'validadeCartao', fn: v => { v = v.replace(/\D/g, '').slice(0, 4); return v.replace(/(\d{2})(\d)/, '$1/$2'); } }
    ];
    mascaras.forEach(({ id, fn }) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { el.value = fn(el.value); });
    });
}

function configurarPagamento() {
    document.querySelectorAll('[name="pagamento"]').forEach(radio => {
        radio.addEventListener('change', () => {
            ['formCartao', 'formPix', 'formBoleto'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            const mapa = { cartao: 'formCartao', pix: 'formPix', boleto: 'formBoleto' };
            const alvo = document.getElementById(mapa[radio.value]);
            if (alvo) alvo.style.display = 'block';
        });
    });
}

/* =============================================
   TOAST
============================================= */
function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visivel');
    setTimeout(() => toast.classList.remove('visivel'), 2500);
}

/* =============================================
   ANIMACOES
============================================= */
function animarIconeCarrinho() {
    const icone = document.querySelector('.cart');
    if (!icone) return;
    icone.style.transform = 'scale(1.4)';
    setTimeout(() => icone.style.transform = '', 300);
}

function sacudirBotaoTamanho() {
    const container = document.getElementById('tamanhosBtns');
    if (!container) return;
    container.style.animation = 'none';
    container.offsetHeight;
    container.style.animation = 'sacudir 0.4s ease';
}

/* =============================================
   UTILITARIOS
============================================= */
function formatarPreco(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function toggleMenuMobile() {
    const menu = document.getElementById('menuMobile');
    const toggle = document.getElementById('menuToggle');
    menu.classList.toggle('aberto');
    toggle.classList.toggle('aberto');
    document.body.style.overflow = menu.classList.contains('aberto') ? 'hidden' : '';
}

function fecharMenuMobile() {
    const menu = document.getElementById('menuMobile');
    const toggle = document.getElementById('menuToggle');
    menu.classList.remove('aberto');
    toggle.classList.remove('aberto');
    document.body.style.overflow = '';
}