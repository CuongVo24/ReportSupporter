"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateCatalogEntry } from "@/types";
import { createProjectFromTemplate } from "@/modules/write/create-project";
import { saveProjectBundle } from "@/modules/write/project-store";
import {
  BUNDLED_TEMPLATE_CATALOG,
  exportPersonalTemplate,
  importPersonalTemplate,
  listPersonalTemplates,
} from "@/modules/templates/template-catalog";
import styles from "./ProjectLibrary.module.css";

export function TemplateCatalog() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [personal, setPersonal] = useState<TemplateCatalogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => { void listPersonalTemplates().then(setPersonal); }, []);
  const entries = useMemo(() => [...BUNDLED_TEMPLATE_CATALOG, ...personal], [personal]);
  const faculties = useMemo(() => Array.from(new Set(entries.map((entry) => entry.faculty))), [entries]);
  const visible = entries.filter((entry) => {
    const text = `${entry.template.name} ${entry.faculty} ${entry.tags.join(" ")}`.toLocaleLowerCase("vi");
    return (faculty === "all" || entry.faculty === faculty) && text.includes(query.toLocaleLowerCase("vi"));
  });

  const create = async (entry: TemplateCatalogEntry) => {
    const bundle = createProjectFromTemplate(entry.template);
    bundle.formatSettings = entry.formatPreset;
    await saveProjectBundle(bundle);
    router.push(`/workspace/${encodeURIComponent(bundle.project.id)}`);
  };

  const download = (entry: TemplateCatalogEntry) => {
    const url = URL.createObjectURL(exportPersonalTemplate(entry));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${entry.template.id}.rstemplate.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><h1>Catalog mẫu nội bộ</h1><p>Bundled/offline; không tải code hay nội dung từ marketplace từ xa.</p></div>
      <div className={styles.cardActions}>
        <button className={styles.secondary} onClick={() => router.push("/")}>Thư viện dự án</button>
        <button className={styles.primary} onClick={() => fileRef.current?.click()}>Nhập .rstemplate.json</button>
      </div>
    </header>
    <section className={styles.content}>
      <div className={styles.toolbar}>
        <input className={styles.search} type="search" placeholder="Tìm mẫu, khoa, tag…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className={styles.search} value={faculty} onChange={(event) => setFaculty(event.target.value)}>
          <option value="all">Tất cả khoa</option>
          {faculties.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className={styles.grid}>
        {visible.map((entry) => <article className={styles.card} key={entry.id}>
          <h2>{entry.cover.title}</h2>
          <p>{entry.cover.subtitle}</p>
          <p className={styles.meta}>{entry.faculty} · v{entry.version} · {entry.source === "bundled" ? "bundled" : "cá nhân"}</p>
          <p className={styles.meta}>{entry.tags.join(" · ")}</p>
          <div className={styles.cardActions}>
            <button className={styles.primary} onClick={() => void create(entry)}>Dùng mẫu</button>
            {entry.source === "personal" && <button className={styles.secondary} onClick={() => download(entry)}>Xuất mẫu</button>}
          </div>
        </article>)}
      </div>
    </section>
    <input ref={fileRef} hidden type="file" accept=".json,application/json" onChange={async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try { await importPersonalTemplate(file); setPersonal(await listPersonalTemplates()); setError(""); }
      catch (importError) { setError(importError instanceof Error ? importError.message : "Template không hợp lệ."); }
      event.target.value = "";
    }} />
  </main>;
}
