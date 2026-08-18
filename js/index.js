function openModal(pageUrl) {
  const modal = document.getElementById('dynamicModal');
  const iframe = document.getElementById('modalIframe');
  
  // Set the source of the iframe directly to the target page
  iframe.src = pageUrl;
  
  // Open the native dialog backdrop
  modal.showModal();
}

function closeModal() {
  const modal = document.getElementById('dynamicModal');
  const iframe = document.getElementById('modalIframe');
  
  modal.close();
  iframe.src = ""; // Clear iframe source on close
}
