document.body.classList.add('js-enabled');

const revealOnScroll = () => {
  document.querySelectorAll('.reveal').forEach((el) => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    if (elementTop < windowHeight - 100) {
      el.classList.add('active');
    }
  });
};

const setDynamicRedirect = () => {
  const nextField = document.getElementById('next-url');
  if (nextField) {
    nextField.value = window.location.href;
  }
};

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('content:applied', revealOnScroll);

window.addEventListener('load', async () => {
  try {
    await window.LatrovaContent.loadSiteContent();
  } catch (err) {
    console.error(err);
  }
  revealOnScroll();
  setDynamicRedirect();
});
