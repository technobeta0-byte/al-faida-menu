export function setupPlateView() {
  const overlay = document.getElementById('plate-overlay');
  const imgElement = document.getElementById('plate-image');
  const closeBtn = overlay.querySelector('.plate-close');
  
  const thumbs = document.querySelectorAll('.item-thumbnail');
  
  function openPlate(src) {
    imgElement.src = src;
    overlay.classList.add('active');
  }
  
  function closePlate() {
    overlay.classList.remove('active');
    setTimeout(() => { imgElement.src = ''; }, 300); // clear after fade out
  }
  
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      openPlate(thumb.dataset.fullSrc);
    });
  });
  
  closeBtn.addEventListener('click', closePlate);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePlate();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closePlate();
    }
  });
}
