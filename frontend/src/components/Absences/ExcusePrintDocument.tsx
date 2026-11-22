import { createPortal } from "react-dom";
import { formatUntisDate } from "@/util";

export interface ExcusePrintData {
  absenceDays: number[];
  issuedAt: Date;
}

function formatIssuedAt(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Kept outside the application root so that printing can hide the UI without
 * affecting the document sent to the browser's native print dialog.
 */
export function ExcusePrintDocument({
  absenceDays,
  issuedAt,
}: ExcusePrintData) {
  const isSingleDay = absenceDays.length === 1;

  return createPortal(
    <article className="excuse-print">
      <p className="excuse-print__issued-at">{formatIssuedAt(issuedAt)}</p>

      <h1>Entschuldigung</h1>

      <p>Sehr geehrte Damen und Herren,</p>

      {isSingleDay ? (
        <p>
          hiermit bitte ich Sie, mein Fehlen am {" "}
          <strong>{formatUntisDate(absenceDays[0])}</strong> aus
          Krankheitsgründen zu entschuldigen.
        </p>
      ) : (
        <>
          <p>
            hiermit bitte ich Sie, mein Fehlen an den folgenden Tagen aus
            Krankheitsgründen zu entschuldigen:
          </p>
          <ul>
            {absenceDays.map((day) => (
              <li key={day}>{formatUntisDate(day)}</li>
            ))}
          </ul>
        </>
      )}

      <p className="excuse-print__closing">Mit freundlichen Grüßen</p>

      <div className="excuse-print__signature-space" />
      <div className="excuse-print__signature-line" />
      <p className="excuse-print__signature-label">Unterschrift</p>
    </article>,
    document.body,
  );
}

