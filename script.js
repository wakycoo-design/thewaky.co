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


// Mark current nav link active
const path = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach(a=>{
  if(a.getAttribute("href") === path) a.classList.add("active");
});
const form = document.getElementById("contact-form");

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = new FormData(form);

    try {
      const response = await fetch(form.action, {
  method: "POST",
  headers: {
    Accept: "application/json"
  },
  body: data
});

const result = await response.json();

console.log(response.status);
console.log(result);

if (result.success) {
  document.querySelector(".contact-left").style.display = "none";

document.querySelector(".contact-layout").style.gridTemplateColumns = "1fr";

document.getElementById("contact-card").style.maxWidth = "650px";
document.getElementById("contact-card").style.margin = "0 auto";

document.getElementById("contact-card").innerHTML = `
<h2>✓ Request received!</h2>

<p>Thanks for reaching out to Waky.</p>

<p>We'll review your requirements and get back to you shortly.</p>

<a href="index.html" class="btn btn-primary">
Back to Home
</a>
`;
    <h2>✓ Request received!</h2>

    <p>Thanks for reaching out to Waky.</p>

    <p>We'll review your requirements and get back to you shortly.</p>

    <a href="index.html" class="btn btn-primary">
      Back to Home
    </a>
  `;
} else {
  alert(result.message);
}

    } catch (error) {
      alert("Network error. Please try again.");
    }
  });
}
