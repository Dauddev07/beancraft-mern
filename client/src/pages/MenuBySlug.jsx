import { useParams } from "react-router-dom";
import MenuPage from "../components/MenuPage";

function prettifySlug(slug) {
  if (!slug) return "Menu";
  return slug
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Dynamic menu for any category slug from the API (admin-created or seeded).
 */
function MenuBySlug() {
  const { slug } = useParams();
  const normalized = String(slug || "")
    .toLowerCase()
    .trim();

  return (
    <MenuPage title={`${prettifySlug(normalized)} Menu`} category={normalized} />
  );
}

export default MenuBySlug;
