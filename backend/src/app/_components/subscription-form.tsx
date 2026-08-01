"use client";

import { useState } from "react";

interface Category { slug: string; name: string; }

export default function SubscriptionForm({ categories, consentText, consentTextVersion }: { categories: Category[]; consentText: string; consentTextVersion: string }) {
  const [number, setNumber] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [optOutNumber, setOptOutNumber] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number, categorySlugs: selected, consentAccepted: accepted, consentText, consentTextVersion, source: "portal" }) });
    const data = await response.json() as { accepted?: boolean; error?: string };
    setMessage(data.accepted ? "Suscripción aceptada. Conserva el control respondiendo BAJA." : data.error ?? "No se pudo registrar.");
  }
  async function optOut() { const response = await fetch("/api/subscriptions/opt-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: optOutNumber }) }); const data = await response.json() as { accepted?: boolean; error?: string }; setMessage(data.accepted ? "Solicitud recibida. No enviaremos nuevas consultas a ese número." : data.error ?? "No se pudo procesar la solicitud."); }
  return <><form onSubmit={submit}><label htmlFor="number">Número internacional de WhatsApp</label><input id="number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="+56912345678" required /><fieldset><legend>Categorías</legend>{categories.map((category) => <label key={category.slug}><input type="checkbox" aria-label={category.name} checked={selected.includes(category.slug)} onChange={(event) => setSelected(event.target.checked ? [...selected, category.slug] : selected.filter((slug) => slug !== category.slug))} /> {category.name}</label>)}</fieldset><p>{consentText}</p><label><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required /> Acepto explícitamente este consentimiento ({consentTextVersion}).</label><button type="submit">Suscribirme</button></form><section><h2>Cancelar mensajes</h2><label htmlFor="optOutNumber">Número para cancelar mensajes</label><input id="optOutNumber" value={optOutNumber} onChange={(event) => setOptOutNumber(event.target.value)} placeholder="+56912345678" /><button type="button" onClick={() => void optOut()}>Solicitar baja</button></section>{message && <p className={message.startsWith("Suscripción") ? "success" : "error"} role="status">{message}</p>}</>;
}
