import { useEffect, useMemo, useState } from "react";
import { publicCatalogService } from "../../public-cache/publicData";
import "./PackageCategoryFilters.css";

const codeOf = (category = {}) => String(category.code || category.categoryCode || "").trim();

export function packageMatchesCategoryFilters(pkg = {}, parentCode = "", subcategoryCode = "") {
  const categories = Array.isArray(pkg.categories) ? pkg.categories : [];
  const directCodes = Array.isArray(pkg.categoryCodes) ? pkg.categoryCodes : categories.map(codeOf);
  const parentCodes = Array.isArray(pkg.parentCategoryCodes)
    ? pkg.parentCategoryCodes
    : categories.map((category) => category.parentCode || codeOf(category));

  return (!parentCode || parentCodes.some((code) => code === parentCode))
    && (!subcategoryCode || directCodes.some((code) => code === subcategoryCode));
}

export default function PackageCategoryFilters({ parentCode, subcategoryCode, onChange, className = "" }) {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    let active = true;
    publicCatalogService.getCategoryTree()
      .then((data) => active && setTree(Array.isArray(data) ? data : []))
      .catch(() => active && setTree([]));
    return () => {
      active = false;
    };
  }, []);

  const parentCategories = useMemo(() => tree.map((category) => ({
    code: codeOf(category),
    name: category.name || category.categoryName || codeOf(category),
    children: Array.isArray(category.children) ? category.children : []
  })).filter((category) => category.code), [tree]);

  const subcategories = useMemo(() => {
    if (parentCode) {
      return parentCategories.find((category) => category.code === parentCode)?.children || [];
    }
    return parentCategories.flatMap((category) => category.children || []);
  }, [parentCategories, parentCode]);

  const updateParent = (nextParentCode) => {
    onChange({ parentCode: nextParentCode, subcategoryCode: "" });
  };

  return (
    <div className={`package-category-filters ${className}`}>
      <label>
        <span>Parent category</span>
        <select value={parentCode} onChange={(event) => updateParent(event.target.value)}>
          <option value="">All parent categories</option>
          {parentCategories.map((category) => (
            <option key={category.code} value={category.code}>{category.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Subcategory</span>
        <select value={subcategoryCode} onChange={(event) => onChange({ parentCode, subcategoryCode: event.target.value })}>
          <option value="">{parentCode ? "All subcategories" : "All subcategories"}</option>
          {subcategories.map((category) => {
            const code = codeOf(category);
            return <option key={code} value={code}>{category.name || category.categoryName || code}</option>;
          })}
        </select>
      </label>
    </div>
  );
}
