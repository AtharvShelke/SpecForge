import type {
  AdvancedFilter,
  CatalogListingResult,
  DynamicCatalogFilter,
  DynamicFilterDependency,
  DynamicFilterOption,
  Product,
  SpecDefinition,
  SpecOption,
  SpecOptionDependency,
} from "@/types";

type SpecMapEntry = {
  filter: SpecDefinition;
  specKey: string;
};

function isBrandLikeFilter(filter: SpecDefinition) {
  const normalized = toCamelCase(filter.name);
  return normalized === "brand" || normalized === "manufacturer";
}

function normalizeDependencyFilterId(
  filterId: string,
  brandLikeFilterIds: Set<string>,
) {
  return brandLikeFilterIds.has(filterId) ? "brand" : filterId;
}

function toCamelCase(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase());

  if (cleaned.length === 0) return "";

  return (
    cleaned[0] +
    cleaned
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  );
}

function specValueAsString(value: unknown) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value == null) return "";
  return String(value);
}

function getProductPrice(product: Product) {
  return Number(product.variants?.[0]?.price ?? 0);
}

function buildProductValueMap(
  product: Product,
  specMap: Map<string, SpecMapEntry>,
  brandLikeFilterIds: Set<string>,
) {
  const values = new Map<string, string[]>();

  if (product.brand?.name) {
    values.set("brand", [product.brand.name]);
  }

  const specs = product.specs ?? [];
  for (const [filterId, entry] of specMap.entries()) {
    if (brandLikeFilterIds.has(filterId)) {
      if (product.brand?.name) {
        values.set(filterId, [product.brand.name]);
      }
      continue;
    }

    const productSpec = specs.find((spec) => spec.key === entry.specKey);
    if (!productSpec) continue;

    const rawValue = productSpec.value;
    if (Array.isArray(rawValue)) {
      const normalized = rawValue.map(specValueAsString).filter(Boolean);
      if (normalized.length > 0) values.set(filterId, normalized);
      continue;
    }

    const normalized = specValueAsString(rawValue);
    if (normalized) values.set(filterId, [normalized]);
  }

  return values;
}

function matchesSelectedValues(
  productValues: Map<string, string[]>,
  filterId: string,
  selected: string[],
) {
  if (selected.length === 0) return true;
  const values = productValues.get(filterId) ?? [];
  if (values.length === 0) return false;
  return selected.some((selectedValue) => values.includes(selectedValue));
}

function matchesFilterSet(
  product: Product,
  productValues: Map<string, string[]>,
  selectedFilters: Map<string, string[]>,
  query: AdvancedFilter,
  skipFilterId?: string,
) {
  if (query.priceMin !== undefined && getProductPrice(product) < query.priceMin)
    return false;
  if (query.priceMax !== undefined && getProductPrice(product) > query.priceMax)
    return false;

  for (const [filterId, selectedValues] of selectedFilters.entries()) {
    if (filterId === skipFilterId) continue;
    if (!matchesSelectedValues(productValues, filterId, selectedValues))
      return false;
  }

  return true;
}

function getFilterDependencies(
  filter: SpecDefinition,
  brandLikeFilterIds: Set<string>,
) {
  const deps = new Map<string, Set<string>>();

  for (const dep of filter.childOptionDeps ?? []) {
    if (dep.childOptionId) continue;
    const filterId = normalizeDependencyFilterId(
      dep.parentSpecId,
      brandLikeFilterIds,
    );
    const parentValues = deps.get(filterId) ?? new Set<string>();
    if (dep.parentOption?.value) parentValues.add(dep.parentOption.value);
    deps.set(filterId, parentValues);
  }

  return Array.from(deps.entries()).map(([filterId, values]) => ({
    filterId,
    values: Array.from(values),
  })) satisfies DynamicFilterDependency[];
}

function getOptionDependencies(
  option: SpecOption | null | undefined,
  brandLikeFilterIds: Set<string>,
) {
  const deps = new Map<string, Set<string>>();

  for (const dep of option?.childOptionDeps ?? []) {
    const filterId = normalizeDependencyFilterId(
      dep.parentSpecId,
      brandLikeFilterIds,
    );
    const parentValues = deps.get(filterId) ?? new Set<string>();
    if (dep.parentOption?.value) parentValues.add(dep.parentOption.value);
    deps.set(filterId, parentValues);
  }

  return Array.from(deps.entries()).map(([filterId, values]) => ({
    filterId,
    values: Array.from(values),
  })) satisfies DynamicFilterDependency[];
}

function dependencySatisfied(
  dependencies: DynamicFilterDependency[] | undefined,
  selectedFilters: Map<string, string[]>,
) {
  if (!dependencies || dependencies.length === 0) return true;

  return dependencies.every((dependency) => {
    const selected = selectedFilters.get(dependency.filterId) ?? [];
    if (selected.length === 0) return true;
    return dependency.values.some((value) => selected.includes(value));
  });
}

export function buildDynamicCatalogResult(args: {
  products: Product[];
  filterSchema: SpecDefinition[];
  query: AdvancedFilter;
}): CatalogListingResult {
  const { products, filterSchema, query } = args;
  const brandLikeFilters = filterSchema.filter(isBrandLikeFilter);
  const brandLikeFilterIds = new Set(
    brandLikeFilters.map((filter) => filter.id),
  );
  const primaryBrandFilter = [...brandLikeFilters].sort((left, right) => {
    const leftOrder = left.filterOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.filterOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.name.localeCompare(right.name);
  })[0];

  const specMap = new Map<string, SpecMapEntry>(
    filterSchema.map((filter) => [
      filter.id,
      {
        filter,
        specKey: toCamelCase(filter.name),
      },
    ]),
  );

  const selectedFilters = new Map<string, string[]>();
  if (query.brandId) selectedFilters.set("brand", [query.brandId]);
  for (const filter of query.filters) {
    if (filter.values.length === 0) continue;
    const filterId = normalizeDependencyFilterId(
      filter.specId,
      brandLikeFilterIds,
    );
    selectedFilters.set(filterId, filter.values);
  }

  const productValueMaps = products.map((product) => ({
    product,
    values: buildProductValueMap(product, specMap, brandLikeFilterIds),
  }));

  const matchingProducts = productValueMaps
    .filter(({ product, values }) =>
      matchesFilterSet(product, values, selectedFilters, query),
    )
    .map(({ product }) => product);

  const filters: DynamicCatalogFilter[] = [];

  const baseBrandProducts = productValueMaps.filter(({ product, values }) =>
    matchesFilterSet(product, values, selectedFilters, query, "brand"),
  );

  const brandCounts = new Map<string, number>();
  for (const entry of baseBrandProducts) {
    for (const value of entry.values.get("brand") ?? []) {
      brandCounts.set(value, (brandCounts.get(value) ?? 0) + 1);
    }
  }

  if (brandCounts.size > 0) {
    const brandOptions =
      primaryBrandFilter?.options?.map((option) => ({
        value: option.value,
        label: option.label || option.value,
      })) ?? [];

    const derivedBrandOptions = Array.from(brandCounts.keys())
      .filter((value) => !brandOptions.some((option) => option.value === value))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({
        value,
        label: value,
      }));

    const options = Array.from(brandCounts.entries()).reduce<
      Map<string, number>
    >((acc, [value, count]) => {
      acc.set(value, count);
      return acc;
    }, new Map<string, number>());

    const combinedBrandOptions: DynamicFilterOption[] = [
      ...brandOptions,
      ...derivedBrandOptions,
    ]
      .filter(
        (option, index, array) =>
          array.findIndex((entry) => entry.value === option.value) === index,
      )
      .map((option) => ({
        value: option.value,
        label: option.label,
        count: options.get(option.value) ?? 0,
        selected: (selectedFilters.get("brand") ?? []).includes(option.value),
        enabled: true,
      }))
      .filter(
        (option) => option.count > 0 || option.selected,
      ) satisfies DynamicFilterOption[];

    filters.push({
      id: "brand",
      key: "brand",
      label: primaryBrandFilter?.name ?? "Brand",
      type: "checkbox",
      group: primaryBrandFilter?.filterGroup ?? "General",
      order: primaryBrandFilter?.filterOrder ?? -10,
      options: combinedBrandOptions,
    });
  }

  const sortedSchema = filterSchema
    .filter((filter) => !brandLikeFilterIds.has(filter.id))
    .sort((a, b) => {
      const left = a.filterOrder ?? Number.MAX_SAFE_INTEGER;
      const right = b.filterOrder ?? Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return a.name.localeCompare(b.name);
    });

  for (const filter of sortedSchema) {
    const baseProducts = productValueMaps.filter(({ product, values }) =>
      matchesFilterSet(product, values, selectedFilters, query, filter.id),
    );

    const counts = new Map<string, number>();
    for (const entry of baseProducts) {
      for (const value of entry.values.get(filter.id) ?? []) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    const predefinedOptions = (filter.options ?? []).map((option) => ({
      option,
      value: option.value,
      label: option.label || option.value,
    }));

    const derivedValues = Array.from(counts.keys())
      .filter(
        (value) => !predefinedOptions.some((option) => option.value === value),
      )
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({
        option: undefined,
        value,
        label: value === "true" ? "Yes" : value === "false" ? "No" : value,
      }));

    const optionItems = [...predefinedOptions, ...derivedValues];
    const selected = selectedFilters.get(filter.id) ?? [];
    const filterDependencies = getFilterDependencies(
      filter,
      brandLikeFilterIds,
    );

    const options = optionItems
      .map(({ option, value, label }) => {
        const dependencies = getOptionDependencies(option, brandLikeFilterIds);
        const enabled = dependencySatisfied(dependencies, selectedFilters);
        const count = counts.get(value) ?? 0;
        const isSelected = selected.includes(value);

        if (!enabled && !isSelected) return null;
        if (count === 0 && !isSelected && !enabled) return null;
        if (
          count === 0 &&
          !isSelected &&
          optionItems.length > 0 &&
          !(filter.isRange || filter.valueType === "BOOLEAN")
        ) {
          return null;
        }

        return {
          value,
          label,
          count,
          selected: isSelected,
          enabled,
          dependencies: dependencies.length > 0 ? dependencies : undefined,
        } satisfies DynamicFilterOption;
      })
      .filter(Boolean) as DynamicFilterOption[];

    if (options.length === 0) continue;

    filters.push({
      id: filter.id,
      key: filter.id,
      label: filter.name,
      type: filter.isRange
        ? "checkbox"
        : filter.valueType === "BOOLEAN"
          ? "checkbox"
          : "checkbox",
      group: filter.filterGroup,
      order: filter.filterOrder,
      options,
      dependencies:
        filterDependencies.length > 0 ? filterDependencies : undefined,
    });
  }

  return {
    products: matchingProducts,
    total: matchingProducts.length,
    filters,
  };
}
