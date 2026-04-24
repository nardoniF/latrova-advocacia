// Adiciona uma classe ao body para o CSS saber que o JS está ativo
document.body.classList.add('js-enabled');

const reveals = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
  reveals.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 100) {
      el.classList.add('active');
    }
  });
};

// MÁGICA DO REDIRECIONAMENTO DINÂMICO
const setDynamicRedirect = () => {
  const nextField = document.getElementById('next-url');
  if (nextField) {
    // Pega a URL atual sem os parâmetros de busca (?...) se quiser uma limpeza maior,
    // ou apenas window.location.href para ser direto.
    nextField.value = window.location.href;
  }
};

window.addEventListener('scroll', revealOnScroll);

window.addEventListener('load', () => {
  revealOnScroll();      // Dispara as animações iniciais
  setDynamicRedirect();  // Configura o link de retorno do formulário
});