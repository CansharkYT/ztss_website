document.querySelectorAll(".button1, .button2, .button3, .button4, .button5").forEach(btn => {
    btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url")
        window.location.href = url;
    });
});