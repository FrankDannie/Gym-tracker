// Applies the saved theme before first paint to avoid a light/dark flash.
(function () {
  try {
    var raw = localStorage.getItem("iron-plan:v1");
    var theme = raw ? JSON.parse(raw).settings.theme : "system";
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
  } catch (e) {}
})();
