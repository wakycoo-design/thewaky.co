// ---- Waky shared behaviour ----

// Replace with the real WhatsApp business number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = "919105999888";

function waLink(message){
  const text = encodeURIComponent(message || "Hi Waky, I'd like to book a free consultation.");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

document.querySelectorAll("[data-wa-button]").forEach(el=>{
  el.setAttribute("href", waLink(el.getAttribute("data-wa-message")));
  el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener");
});

// Contact form: no backend wired up yet, so we confirm + open WhatsApp with the details prefilled.
const contactForm = document.getElementById("contact-form");
if(contactForm){
  contactForm.addEventListener("submit", function(e){
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get("name") || "";
    const company = data.get("company") || "";
    const message = data.get("message") || "";
    const summary = `Hi Waky, I'm ${name}${company ? " from " + company : ""}. ${message}`;
    const status = document.getElementById("form-status");
    if(status){
      status.textContent = "Thanks — opening WhatsApp so we can pick this up right away.";
      status.classList.add("show");
    }
    window.open(waLink(summary), "_blank", "noopener");
  });
}

// Mark current nav link active
const path = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach(a=>{
  if(a.getAttribute("href") === path) a.classList.add("active");
});
