const button = document.querySelector(".s-btn");
const spinner = document.querySelector(".loader-container");
const loadText = document.querySelector(".loader-text");
const content = document.querySelector("#main-content");

button.addEventListener("click", (e) => {
  // e.preventDefault();

  loadText.style.display = "flex";
  spinner.style.display = "flex";
  content.style.display = "none";
});
