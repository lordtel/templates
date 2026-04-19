import { initRouter } from "./core/router.js";
import { renderNav } from "./features/nav/nav.js";
import { render as renderHome } from "./features/home/home.js";
import { render as renderBagForm } from "./features/bag-form/bag-form.js";
import { render as renderBagDetail } from "./features/bag-detail/bag-detail.js";
import { render as renderBrewForm } from "./features/brew-form/brew-form.js";
import { render as renderAnalytics } from "./features/analytics/analytics.js";

const viewEl = document.getElementById("view");
const navEl = document.getElementById("nav");

renderNav(navEl);

initRouter(viewEl, [
  { path: "/", render: renderHome },
  { path: "/bag/new", render: renderBagForm },
  { path: "/bag/:id", render: renderBagDetail },
  { path: "/bag/:id/edit", render: (c, p) => renderBagForm(c, p) },
  { path: "/bag/:id/brew", render: renderBrewForm },
  { path: "/analytics", render: renderAnalytics },
]);
