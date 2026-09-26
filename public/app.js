const textInput = document.getElementById("textInput");
const wordCount = document.getElementById("wordCount");
const checkButton = document.getElementById("checkButton");
const clearButton = document.getElementById("clearButton");

const loading = document.getElementById("loading");
const results = document.getElementById("results");

const correctedText = document.getElementById("correctedText");
const copyButton = document.getElementById("copyButton");

const changesList = document.getElementById("changesList");
const changeCount = document.getElementById("changeCount");
const overallText = document.getElementById("overallText");


// ============================
// WORD COUNTER
// ============================

function updateWordCount() {
  const text = textInput.value.trim();

  if (!text) {
    wordCount.textContent = "0 words";
    return;
  }

  const words = text.split(/\s+/).filter(Boolean);

  wordCount.textContent =
    `${words.length} ${words.length === 1 ? "word" : "words"}`;
}

textInput.addEventListener("input", updateWordCount);


// ============================
// CLEAR BUTTON
// ============================

clearButton.addEventListener("click", () => {
  textInput.value = "";

  updateWordCount();

  results.classList.add("hidden");

  textInput.focus();
});


// ============================
// CHECK WRITING
// ============================

checkButton.addEventListener("click", async () => {

  const text = textInput.value.trim();

  if (!text) {
    textInput.focus();
    return;
  }

  // Show loading
  loading.classList.remove("hidden");
  results.classList.add("hidden");

  checkButton.disabled = true;

  try {

    const response = await fetch("/api/check", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        text: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Something went wrong."
      );
    }


    // ============================
    // CORRECTED TEXT
    // ============================

    correctedText.textContent =
      data.corrected || text;


    // ============================
    // CHANGES
    // ============================

    changesList.innerHTML = "";

    const changes = Array.isArray(data.changes)
      ? data.changes
      : [];

    changeCount.textContent =
      `${changes.length} ${
        changes.length === 1 ? "change" : "changes"
      }`;


    if (changes.length === 0) {

      const noChanges = document.createElement("div");

      noChanges.className = "change-item";

      noChanges.innerHTML = `
        <div class="change-content">
          <strong>✨ No changes needed!</strong>
          <p>Your writing already looks good.</p>
        </div>
      `;

      changesList.appendChild(noChanges);

    } else {

      changes.forEach((change) => {

        const item = document.createElement("div");

        item.className = "change-item";

        item.innerHTML = `
          <div class="change-content">

            <div class="change-row">
              <span class="change-label">Before</span>
              <span class="change-original">
                ${escapeHtml(change.original || "")}
              </span>
            </div>

            <div class="change-arrow">↓</div>

            <div class="change-row">
              <span class="change-label">After</span>
              <span class="change-corrected">
                ${escapeHtml(change.corrected || "")}
              </span>
            </div>

            <p class="change-reason">
              💡 ${escapeHtml(change.reason || "Grammar correction")}
            </p>

          </div>
        `;

        changesList.appendChild(item);
      });

    }


    // ============================
    // WHY?
    // ============================

    overallText.textContent =
      data.overall ||
      "Your writing has been checked by Grammie. ♡";


    // ============================
    // SHOW RESULTS
    // ============================

    results.classList.remove("hidden");

    results.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  } catch (error) {

    console.error("Grammie error:", error);

    alert(
      "Oops! Grammie couldn't check your writing yet. ♡\n\n" +
      error.message
    );

  } finally {

    loading.classList.add("hidden");

    checkButton.disabled = false;

  }

});


// ============================
// COPY CORRECTED TEXT
// ============================

copyButton.addEventListener("click", async () => {

  const text = correctedText.textContent.trim();

  if (!text) return;

  try {

    await navigator.clipboard.writeText(text);

    const originalText = copyButton.textContent;

    copyButton.textContent = "♡ Copied!";

    setTimeout(() => {
      copyButton.textContent = originalText;
    }, 1500);

  } catch (error) {

    console.error("Copy failed:", error);

  }

});


// ============================
// HTML ESCAPE
// ============================

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ============================
// INITIALIZE
// ============================

updateWordCount();