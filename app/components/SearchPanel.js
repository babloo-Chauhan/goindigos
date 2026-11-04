"use client";

import { Search } from "lucide-react";
import { categories } from "../data/jobs";
import { useLanguage } from "../lib/language";

export default function SearchPanel({ filters, onChange, onSubmit, ...rest }) {
  const { language, t } = useLanguage();

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form aria-label={t.searchLabel} className="search-panel" onSubmit={handleSubmit} role="search" {...rest}>
      <label>
        {t.fieldTitle}
        <input onChange={(event) => onChange("query", event.target.value)} placeholder={t.fieldTitleHint} value={filters.query} />
      </label>
      <label>
        {t.fieldCategory}
        <select onChange={(event) => onChange("category", event.target.value)} value={filters.category}>
          <option value="">{t.categoryAny}</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
        </select>
      </label>
      <label>
        {t.fieldLocation}
        <input onChange={(event) => onChange("location", event.target.value)} placeholder={t.fieldLocationHint} value={filters.location} />
      </label>
      <button className="button button-signal" type="submit">
        <Search aria-hidden="true" size={18} /> {t.searchButton}
      </button>
    </form>
  );
}
