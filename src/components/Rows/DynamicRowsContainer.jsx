import { useEffect, useState } from "react";
import api from "../../utils/api";
import DynamicRow from "../Common/DynamicRow";

export default function DynamicRowsContainer({ page = "home" }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let isCurrent = true;

    api.get(`/featured-rows/public?visibleOn=${page}`)
      .then((data) => {
        if (isCurrent) {
          setRows(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setRows([]);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [page]);

  return (
    <>
      {rows.map((row) => (
        <DynamicRow key={row.rowId} row={row} />
      ))}
    </>
  );
}
