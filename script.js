// ---- Waky shared behaviour ----

// Replace with the real WhatsApp business number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = "919105999888";

function waLink(message) {
  const text = encodeURIComponent(
    message || "Hi Waky, I'd like to book a free consultation."
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

document.querySelectorAll("[data-wa-button]").forEach(el => {
  el.setAttribute("href", waLink(el.getAttribute("data-wa-message")));
  el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener");
});


// Mark current nav link active
const path = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-links a").forEach(a => {
  if (a.getAttribute("href") === path) {
    a.classList.add("active");
  }
});


// ---- Contact Form ----

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

      console.log("Contact Form Status:", response.status);
      console.log("Contact Form Result:", result);

      if (result.success) {

        document.querySelector(".contact-left").style.display = "none";

        document.querySelector(".contact-layout").style.gridTemplateColumns = "1fr";

        document.getElementById("contact-card").style.maxWidth = "650px";

        document.getElementById("contact-card").style.margin = "0 auto";

        document.querySelector("footer.site").style.display = "none";

        document.getElementById("contact-card").innerHTML = `
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

      console.error("Contact Form Error:", error);
      alert("Network error. Please try again.");

    }

  });
}


// ============================================
// TEMP TEST — ZOHO CREATOR OTP API
// ============================================
console.log("🔥 JS FILE LOADED");

const testButton = document.getElementById("test-zoho-otp");

console.log("BUTTON ELEMENT:", testButton);

if (testButton) {
    console.log("✅ BUTTON FOUND");

    testButton.addEventListener("click", function () {
        console.log("🔥 BUTTON CLICKED");
        alert("BUTTON CLICK WORKS!");
    });

} else {
    console.error("❌ BUTTON NOT FOUND");
}
function testZohoOTP() {

    console.log("🚀 BUTTON CLICKED - FUNCTION WORKS");

    alert("Button click detected!");

}
