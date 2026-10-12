  // ---------- Nav scroll state + mobile toggle ----------
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
  const navLinks = document.getElementById('navLinks');
  document.getElementById('navToggle').addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // ---------- Countdown ----------
  // EDIT HERE: altere a data/hora da festa se necessário (formato ISO, com fuso horário explícito)
  const weddingDate = new Date('2027-01-16T15:30:00-03:00').getTime();
  // Contagem EXATA: a diferença é calculada em milissegundos reais entre agora e
  // a data/hora da festa (sem acúmulo de erro, recalculada do zero a cada segundo).
  // Por conta disso, o número de "dias" só desce 1 no exato horário da festa (16h) a cada dia
  // que passa — é o comportamento esperado, não um bug. Ex.: às 15h59 ainda mostra N dias,
  // às 16h00 já mostra N-1, porque nesse instante já se passaram 24h completas desde a virada anterior.
  function tickCountdown(){
    const now = Date.now();
    const diff = Math.max(0, weddingDate - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-min').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-sec').textContent = String(s).padStart(2,'0');
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // ---------- RSVP radio toggle ----------
  const optYes = document.getElementById('optYes');
  const optNo = document.getElementById('optNo');
  [optYes, optNo].forEach(opt => {
    opt.addEventListener('click', () => {
      optYes.classList.toggle('active', opt === optYes);
      optNo.classList.toggle('active', opt === optNo);
    });
  });

  // ---------- RSVP submit ----------
  // NOTE: este formulário não envia os dados a lugar nenhum ainda.
  // Para receber as respostas de verdade, conecte a um serviço como
  // Google Forms, Formspree ou uma planilha via API antes de publicar o site.
  document.getElementById('rsvpForm').addEventListener('submit', function(e){
    e.preventDefault();
    document.getElementById('rsvpMsg').style.display = 'block';
    this.reset();
    optYes.classList.add('active'); optNo.classList.remove('active');
  });

  // ---------- Presentes via Pix (gera o código Pix "copia e cola" e o QR Code direto no navegador) ----------
  // EDIT AQUI antes de publicar o site:
  //   PIX_KEY   -> a chave Pix real do casal (CPF, e-mail, telefone ou chave aleatória)
  //   PIX_NAME  -> nome do recebedor, SEM acentos, até 25 caracteres
  //   PIX_CITY  -> cidade do recebedor, SEM acentos, até 15 caracteres
  const PIX_KEY  = '00000000000';       // <-- troque pela chave Pix de vocês
  const PIX_NAME = 'DEBORA E MATHEUS';  // <-- sem acentos, max 25 caracteres
  const PIX_CITY = 'SAO PAULO';         // <-- sem acentos, max 15 caracteres

  // Monta um campo no formato TLV usado pelo padrão BR Code (Pix) do Banco Central
  function tlv(id, value){
    const len = String(value.length).padStart(2, '0');
    return `${id}${len}${value}`;
  }

  // Checksum CRC16-CCITT exigido no final do código Pix
  function crc16(payload){
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++){
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++){
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // Gera o código Pix "copia e cola" completo, com o valor já preenchido
  function buildPixPayload(amount, description){
    const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', PIX_KEY);
    const amountStr = Number(amount).toFixed(2);
    const txid = (description || 'PRESENTE').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,25) || 'PRESENTE';

    let payload =
      tlv('00', '01') +                          // Payload Format Indicator
      tlv('26', merchantAccount) +                // Informações da conta Pix
      tlv('52', '0000') +                         // Merchant Category Code
      tlv('53', '986') +                          // Moeda: Real (BRL)
      tlv('54', amountStr) +                      // Valor da transação
      tlv('58', 'BR') +                           // País
      tlv('59', PIX_NAME.slice(0,25)) +           // Nome do recebedor
      tlv('60', PIX_CITY.slice(0,15)) +           // Cidade do recebedor
      tlv('62', tlv('05', txid));                 // Identificador da transação

    payload += '6304';
    payload += crc16(payload);
    return payload;
  }

  // ---------- Lista de presentes ----------
  // EDIT: número do WhatsApp do casal (55 + DDD + número, sem espaços) para o aviso pós-Pix
  const WHATSAPP_NUMBER = '5511999999999';
  const MAX_GIFTS = 3;     // máximo de presentes por compra
  const PAGE_SIZE = 12;    // quantos presentes aparecem por vez ("Ver mais presentes")

  // EDIT: lista de presentes. Para colocar a foto de um item, preencha "img" com o caminho
  // da imagem (ex.: 'img/panela.jpg' — crie uma pasta "img" ao lado deste arquivo).
  // Enquanto "img" estiver vazio, aparece o quadrado cinza com o ícone de presente.
  const GIFTS = [
    { id: 1,  name: 'Kit 4 almofadas estilo boho',     price: 121.25, img: 'img/Kit 4 Almofadas Elegante Rustica Boho.png' },
    { id: 2,  name: 'Cortina romana para quarto',      price: 92.52,  img: 'img/Cortina Roma Quarto.png' },
    { id: 3,  name: 'Manta para sofá',                 price: 91.72,  img: 'img/Manta para sofá.jpg' },
    { id: 4,  name: 'Kit banheiro',                    price: 87.97,  img: 'img/Kit banheiro.jpg' },
    { id: 5,  name: 'Balança de cozinha',              price: 84.30,  img: 'img/Balança de cozinha.jpg' },
    { id: 6,  name: 'Cesto para roupas',               price: 61.92,  img: 'img/Cesto para roupas.png' },
    { id: 7,  name: 'Porta detergente de cerâmica',    price: 48.51,  img: 'img/Porta Detergente Granilite 360ml Cerâmica Lyor.png' },
    { id: 8,  name: 'Conjunto de potes em vidro',      price: 147.80, img: 'img/Conjunto de potes em vidro.png' },
    { id: 9,  name: 'Jogo de talheres',                price: 147.00, img: 'img/Jogo de talher.jpg' },
    { id: 10, name: 'Forno de micro-ondas (1ª parcela)', price: 128.86, img: 'img/Forno de Micro-ondas (1° parcela).jpeg' },
    { id: 11, name: 'Forno de micro-ondas (2ª parcela)', price: 128.86, img: 'img/Forno de Micro-ondas (2° parcela).jpeg' },
    { id: 12, name: 'Forno de micro-ondas (3ª parcela)', price: 128.86, img: 'img/Forno de Micro-ondas (3° parcela ).jpeg' },
    { id: 13, name: 'Escorredor de louça',             price: 126.55, img: 'img/Escorredor de louça.png' },
    { id: 14, name: 'Panela elétrica de arroz',        price: 228.85, img: 'img/Panela Elétrica Britânia para Arroz.jpeg' },
    { id: 15, name: 'Jogo de travesseiros',            price: 226.22, img: 'img/Jogo de travesseiros.jpg' },
    { id: 16, name: 'Conjunto de cadeiras',            price: 181.61, img: 'img/Conjunto cadeiras Nanna Design Retro.png' },
    { id: 17, name: 'Chaleira elétrica',               price: 179.90, img: 'img/Chaleira Elétrica.jpg' },
    { id: 18, name: 'Aparelho de fondue',              price: 174.84, img: 'img/Aparelho de Fondue Preto.jpg' },
    { id: 19, name: 'Sanduicheira',                    price: 174.84, img: 'img/Sanduicheira Mondial Master Grill.jpeg' },
    { id: 20, name: 'Pipoqueira elétrica',             price: 159.60, img: 'img/Pipoqueira Britânia POPFIT.jpg' },
    { id: 21, name: 'Armário de banheiro com espelho', price: 157.76, img: 'img/Armário banheiro com porta de espelho.png' },
    { id: 22, name: 'Ferro de passar',                 price: 284.24, img: 'img/Ferro de passar.jpg' },
    { id: 23, name: 'Batedeira',                       price: 278.54, img: 'img/Batedeira.jpg' },
    { id: 24, name: 'Persiana',                        price: 274.29, img: 'img/Persiana.jpg' },
    { id: 25, name: 'Processador de alimentos',        price: 274.29, img: 'img/Processador de alimentos.jpg' },
    { id: 26, name: 'Garrafa térmica em aço inox',     price: 271.78, img: 'img/Garrafa Térmica Hauskraft em Aço Inox.jpg' },
    { id: 27, name: 'Frigideira antiaderente',         price: 257.93, img: 'img/Frigideira antiaderente.jpg' },
    { id: 28, name: 'Jogo de lençol casal 4 peças',    price: 237.16, img: 'img/Jogo de Lençol Casal New Soft 4 peças - Home Stye.jpg' },
    { id: 29, name: 'Cama box + colchão (parcela 1/6)', price: 454.35, img: 'img/Cama box + colchão (parcela 1_6).jpg' },
    { id: 30, name: 'Cama box + colchão (parcela 2/6)', price: 454.35, img: 'img/Cama box + colchão (parcela 2_6).jpg' },
    { id: 31, name: 'Cama box + colchão (parcela 3/6)', price: 454.35, img: 'img/Cama box + colchão (parcela 3_6).jpg' },
    { id: 32, name: 'Purificador de água',             price: 424.98, img: 'img/Purificador de água.jpg' },
    { id: 33, name: 'Depurador de ar',                 price: 413.60, img: 'img/Depurador de Ar.jpeg' },
    { id: 34, name: 'Edredom',                         price: 399.80, img: 'img/Edredom.jpg' },
    { id: 35, name: 'Tapete para sala',                price: 389.61, img: 'img/Tapete Sala 2.50x2.00m boho artesanal rustico.png' },
    { id: 36, name: 'Ducha elétrica',                  price: 313.32, img: 'img/Ducha Lorenzetti Duo Shower Quadra.jpeg' },
    { id: 37, name: 'Liquidificador',                  price: 285.63, img: 'img/Liquidificador Super Chef 750W.jpg' },
    { id: 38, name: 'Armário de cozinha',              price: 2218.41, img: 'img/Armario cozinha Rubi Yescasa Verde_Oliva Verde Oliva.png' },
    { id: 39, name: 'Sofá',                            price: 2049.06, img: 'img/Sofá.jpg' },
    { id: 40, name: 'TV LED 42"',                      price: 1419.57, img: 'img/TV LED 42_.jpg' },
    { id: 41, name: 'Fogão',                           price: 1089.49, img: 'img/Fogão.jpg' },
    { id: 42, name: 'Mesa de jantar',                  price: 506.24, img: 'img/Mesa Espanha 1100x700 Tampo Eucalipto.png' },
    { id: 43, name: 'Climatizador',                    price: 461.29, img: 'img/Climatizador.jpg' },
    { id: 44, name: "Curso intensivo de 'Como guardar segredo' para o noivo boca de sacola", price: 282.62, img: 'img/Curso intensivo de _Como guardar segredo_ para o noivo boca de sacola.jpg' },
    { id: 45, name: 'Convite para convidado levar acompanhante', price: 6615.70, img: 'img/Convite para convidado levar acompanhante.jpg' }
  ];

  const PLACEHOLDER_SVG =
    '<svg class="ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">' +
    '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 9v11M4 13h16"/>' +
    '<path d="M8 9c-2 0-3-1.4-3-3s1-3 3-1 1 4-3 4zM16 9c2 0 3-1.4 3-3s-1-3-3-1-1 4 3 4z"/></svg>';

  let cart = [];            // ids dos presentes escolhidos
  let shown = PAGE_SIZE;    // quantos cards estão visíveis
  let sortMode = 'desc';

  const money = v => 'R$' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const byId = id => GIFTS.find(g => g.id === id);
  const cartTotal = () => cart.reduce((sum, id) => sum + byId(id).price, 0);

  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function sortedGifts(){
    const list = GIFTS.slice();
    if (sortMode === 'desc') list.sort((a, b) => b.price - a.price);
    else if (sortMode === 'asc') list.sort((a, b) => a.price - b.price);
    else list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
  }

  function renderGrid(){
    const grid = document.getElementById('giftGrid');
    grid.innerHTML = '';
    const list = sortedGifts();
    list.slice(0, shown).forEach(g => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const imgBox = document.createElement('div');
      imgBox.className = 'product-img';
      if (g.img){
        const im = document.createElement('img');
        im.src = g.img; im.alt = g.name; im.loading = 'lazy';
        imgBox.appendChild(im);
      } else {
        imgBox.innerHTML = PLACEHOLDER_SVG;
      }

      const info = document.createElement('div');
      info.className = 'product-info';
      const h4 = document.createElement('h4'); h4.textContent = g.name;
      const price = document.createElement('span'); price.className = 'product-price'; price.textContent = money(g.price);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-solid btn-gift';
      const inCart = cart.includes(g.id);
      btn.textContent = inCart ? 'No carrinho ✓' : 'Presentear';
      if (inCart) btn.classList.add('in-cart');
      btn.addEventListener('click', () => addToCart(g.id));

      info.append(h4, price, btn);
      card.append(imgBox, info);
      grid.appendChild(card);
    });
    document.getElementById('giftMore').style.display = shown >= list.length ? 'none' : 'inline-block';
  }

  function updateCartPill(){
    const pill = document.getElementById('cartPill');
    const n = cart.length;
    document.getElementById('cartLabel').textContent =
      n === 0 ? 'Carrinho vazio' : `Ver carrinho (${n} ${n === 1 ? 'presente' : 'presentes'})`;
    pill.classList.toggle('has-items', n > 0);
  }

  function addToCart(id){
    if (cart.includes(id)){ openGiftModal('cart'); return; }
    if (cart.length >= MAX_GIFTS){
      showToast('Você pode escolher até três presentes por compra.');
      return;
    }
    cart.push(id);
    updateCartPill();
    renderGrid();
    showToast('Presente adicionado ao carrinho!');
  }

  function removeFromCart(id){
    cart = cart.filter(x => x !== id);
    updateCartPill();
    renderGrid();
    renderCart();
  }

  function renderCart(){
    const empty = cart.length === 0;
    document.getElementById('cartEmpty').style.display = empty ? 'block' : 'none';
    document.getElementById('cartFilled').style.display = empty ? 'none' : 'block';
    const ul = document.getElementById('cartItems');
    ul.innerHTML = '';
    cart.forEach(id => {
      const g = byId(id);
      const li = document.createElement('li');
      const left = document.createElement('div');
      const name = document.createElement('span'); name.textContent = g.name;
      const rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'ci-remove'; rm.textContent = 'Remover';
      rm.addEventListener('click', () => removeFromCart(id));
      left.append(name, rm);
      const price = document.createElement('span'); price.className = 'ci-price'; price.textContent = money(g.price);
      li.append(left, price);
      ul.appendChild(li);
    });
    document.getElementById('cartTotal').textContent = money(cartTotal());
  }

  // ----- Modal (3 passos: carrinho -> mensagem -> pix) -----
  const giftModal = document.getElementById('giftModal');
  function goStep(step){
    ['stepCart', 'stepMessage', 'stepPix'].forEach(s =>
      document.getElementById(s).classList.toggle('active', s === 'step' + step[0].toUpperCase() + step.slice(1)));
  }
  function openGiftModal(step){
    if (step === 'cart') renderCart();
    goStep(step);
    giftModal.classList.add('open');
  }
  function closeGiftModal(){ giftModal.classList.remove('open'); }

  document.getElementById('cartPill').addEventListener('click', () => openGiftModal('cart'));
  document.getElementById('giftModalClose').addEventListener('click', closeGiftModal);
  giftModal.addEventListener('click', e => { if (e.target === giftModal) closeGiftModal(); });
  document.getElementById('cartBack').addEventListener('click', () => {
    closeGiftModal();
    document.getElementById('presentes').scrollIntoView({behavior: 'smooth'});
  });
  document.getElementById('cartAddMore').addEventListener('click', closeGiftModal);
  document.getElementById('cartCheckout').addEventListener('click', () => goStep('message'));
  document.getElementById('msgBack').addEventListener('click', () => openGiftModal('cart'));
  document.getElementById('giftMsg').addEventListener('input', e => {
    document.getElementById('giftMsgCount').textContent = e.target.value.length;
  });

  document.getElementById('msgConfirm').addEventListener('click', () => {
    const name = document.getElementById('giftName').value.trim();
    const msg = document.getElementById('giftMsg').value.trim();
    const err = document.getElementById('giftNameError');
    if (!name){ err.style.display = 'block'; return; }
    err.style.display = 'none';

    const total = cartTotal();
    const names = cart.map(id => byId(id).name);
    const payload = buildPixPayload(total, 'PRESENTE');

    document.getElementById('pixAmount').textContent = money(total);
    document.getElementById('pixCode').value = payload;
    document.getElementById('pixQrImg').src =
      'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(payload);
    document.getElementById('pixCopiedMsg').style.display = 'none';

    const text = `Oi, Débora e Matheus! Aqui é ${name}. Acabei de fazer um Pix de ${money(total)} ` +
                 `referente a: ${names.join(', ')}.` + (msg ? ` Mensagem: ${msg}` : '');
    document.getElementById('pixWhats').href =
      `https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(text);

    goStep('pix');
  });

  document.getElementById('pixCopyBtn').addEventListener('click', () => {
    const codeBox = document.getElementById('pixCode');
    codeBox.select();
    const done = () => { document.getElementById('pixCopiedMsg').style.display = 'block'; };
    if (navigator.clipboard) navigator.clipboard.writeText(codeBox.value).then(done).catch(() => { document.execCommand('copy'); done(); });
    else { document.execCommand('copy'); done(); }
  });

  document.getElementById('giftSort').addEventListener('change', e => {
    sortMode = e.target.value;
    shown = PAGE_SIZE;
    renderGrid();
  });
  document.getElementById('giftMore').addEventListener('click', () => {
    shown += PAGE_SIZE;
    renderGrid();
  });

  renderGrid();
  updateCartPill();

