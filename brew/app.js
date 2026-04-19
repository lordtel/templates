import { initRouter } from "./core/router.js";
import { renderNav } from "./features/nav/nav.js";
import { renderEquipStrip } from "./features/equipment/strip.js";
import { render as renderHome } from "./features/home/home.js";
import { render as renderBagForm } from "./features/bag-form/bag-form.js";
import { render as renderBagDetail } from "./features/bag-detail/bag-detail.js";
import { render as renderRatingForm } from "./features/rating-form/rating-form.js";
import { render as renderAnalytics } from "./features/analytics/analytics.js";
import { render as renderEquipment } from "./features/equipment/equipment.js";
import { render as renderAbout } from "./features/about/about.js";

const viewEl = document.getElementById("view");
const navEl = document.getElementById("nav");
const equipEl = document.getElementById("equip-strip");

renderNav(navEl);
renderEquipStrip(equipEl);

initRouter(viewEl, [
  { path: "/", render: renderHome },
  { path: "/bag/new", render: renderBagForm },
  { path: "/bag/:id", render: renderBagDetail },
  { path: "/bag/:id/edit", render: (c, p) => renderBagForm(c, p) },
  { path: "/bag/:id/rate/:drink", render: renderRatingForm },
  { path: "/analytics", render: renderAnalytics },
  { path: "/equipment", render: renderEquipment },
  { path: "/about", render: renderAbout },
]);
