"use client";

import { CompaniesProvider } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import CompaniesFilters from "@/components/sections/cms/CompaniesFilters/CompaniesFilters";
import CompaniesTable from "@/components/sections/cms/CompaniesTable/CompaniesTable";
import CompaniesPagination from "@/components/sections/cms/CompaniesPagination/CompaniesPagination";
import s from "./CompaniesPage.module.css";

export default function CompaniesPage() {
  return (
    <CompaniesProvider>
      <div className={s.page}>
        <h1 className={s.title}>კომპანიები</h1>
        <CompaniesFilters />
        <CompaniesTable />
        <CompaniesPagination />
      </div>
    </CompaniesProvider>
  );
}
