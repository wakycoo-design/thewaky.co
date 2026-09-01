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

async function testZohoOTP() {

  const phone = "+919753999888";

  console.log("🚀 Starting Zoho OTP API test...");
  console.log("📱 Phone:", phone);

  try {

    const response = await fetch(
      "https://www.zohoapis.in/creator/custom/mindlappvtltd/Send_OTP?publickey=xRTH2rD0N9uCxyZSeYp3Fe53p",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Phone: phone
        })
      }
    );

    console.log("📡 Response received!");
    console.log("Status:", response.status);

    const result = await response.text();

    console.log("📦 Zoho Response:", result);

    if (response.ok) {
      alert("SUCCESS! Check Console for Zoho response.");
    } else {
      alert("API FAILED! Status: " + response.status);
    }

  } catch (error) {

    console.error("❌ ZOHO FETCH FAILED:", error);

    alert(
      "FETCH FAILED!\n\n" +
      "Open DevTools → Console.\n" +
      "Check if this is a CORS error."
    );

  }

}
console.log("🔥 JS FILE LOADED");
