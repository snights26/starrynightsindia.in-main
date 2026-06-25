import { useEffect, useState } from "react";
import api from "../../utils/api";
import DynamicRow from "../Common/DynamicRow";

function codeOf(item = {}) {
  return item.code || item.categoryCode || item.id;
}

function flattenCategoryTree(categories = []) {
  return categories.flatMap((category) => [
    category,
    ...flattenCategoryTree(category.children || []),
  ]);
}

function toCategoryRowItem(category = {}, expandedFrom = "") {
  const code = codeOf(category);
  return {
    ...category,
    id: code,
    code,
    title: category.title || category.name || category.categoryName || code,
    type: "category",
    image: category.image || category.thumbnailUrl,
    expandedFrom,
  };
}

function expandCategoryRow(row, categoryTree) {
  const isCategory = row.rowType === "category" || row.type === "category";
  if (!isCategory) {
    return row;
  }

  const categoriesByCode = new Map(
    flattenCategoryTree(categoryTree).map((category) => [codeOf(category), category])
  );
  const expandedItems = [];
  const seenCodes = new Set();

  (row.items || []).forEach((item) => {
    const selectedCode = codeOf(item);
    const selectedCategory = categoriesByCode.get(selectedCode);
    const children = selectedCategory?.children || [];
    const itemsToAdd = children.length ? children : [selectedCategory || item];

    itemsToAdd.forEach((category) => {
      const categoryItem = toCategoryRowItem(category, selectedCode);
      if (!categoryItem.code || seenCodes.has(categoryItem.code)) {
        return;
      }
      seenCodes.add(categoryItem.code);
      expandedItems.push(categoryItem);
    });
  });

  return {
    ...row,
    items: expandedItems,
    codes: expandedItems.map((item) => item.code),
  };
}

async function expandPackageRow(row) {
  const isPackage = row.rowType === "package" || row.type === "package";
  const isSubcategoryMode = row.packageMode === "subcategory";
  if (!isPackage || !isSubcategoryMode) {
    return row;
  }

  const packageLists = await Promise.all(
    (row.items || []).map((item) => {
      const categoryCode = codeOf(item);
      if (!categoryCode) {
        return [];
      }
      return api.get(`/packages?category=${encodeURIComponent(categoryCode)}`).catch(() => []);
    })
  );

  const seenCodes = new Set();
  const packages = packageLists
    .flat()
    .filter((pkg) => {
      const code = pkg.packageCode || pkg.code || pkg.id;
      if (!code || seenCodes.has(code)) {
        return false;
      }
      seenCodes.add(code);
      return true;
    })
    .map((pkg) => ({
      ...pkg,
      id: pkg.packageCode || pkg.code || pkg.id,
      code: pkg.packageCode || pkg.code || pkg.id,
      title: pkg.title || pkg.name,
      type: "package",
    }));

  return {
    ...row,
    items: packages,
    codes: packages.map((pkg) => pkg.code),
  };
}

export default function DynamicRowsContainer({ page = "home" }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/featured-rows/public?visibleOn=${page}`),
      api.get("/categories/tree").catch(() => []),
    ])
      .then(async ([rowData, categoryTree]) => {
        const rowsList = Array.isArray(rowData) ? rowData : [];
        const tree = Array.isArray(categoryTree) ? categoryTree : [];
        const expandedRows = await Promise.all(
          rowsList
            .map((row) => expandCategoryRow(row, tree))
            .map(expandPackageRow)
        );
        setRows(expandedRows);
      })
      .catch(() => setRows([]));
  }, [page]);

  return (
    <>
      {rows.map((row) => (
        <DynamicRow key={row.rowId} row={row} />
      ))}
    </>
  );
}
