import { CatalogService } from "./services/catalog.service";

async function main() {
  const subs = await CatalogService.getSubCategories();
  console.log("Number of subcategories:", subs.length);
  if (subs.length > 0) {
    console.log("First subcategory:", JSON.stringify(subs[0], null, 2));
  }
}

main().catch(console.error);
