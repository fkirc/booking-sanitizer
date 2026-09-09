import Link from "next/link";
import { RULE_CHECKS, type RuleExample } from "./rules";

export default function RuleSuggestionsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Rule suggestions</h1>
      <p className="mt-1 text-xs text-gray-500">
        A compact booking manual mined from the imported data — common account/tax-code/cost-center patterns, and
        postings that break them.
      </p>

      <div className="mt-4 space-y-4">
        {RULE_CHECKS.map((rule) => (
          <div key={rule.title} className="rounded border border-gray-200 bg-white p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-semibold">{rule.title}</h2>
              <span className="whitespace-nowrap text-xs text-gray-500">{rule.support}</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">{rule.statement}</p>

            <ExampleList label="Evidence" examples={rule.evidence} />
            {rule.violations && <ExampleList label="Violations" examples={rule.violations} tone="warn" />}

            <p className="mt-2 text-xs text-gray-500">{rule.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleList({ label, examples, tone }: { label: string; examples: RuleExample[]; tone?: "warn" }) {
  return (
    <div className="mt-2">
      <div className={`text-xs font-medium ${tone === "warn" ? "text-red-700" : "text-gray-500"}`}>{label}</div>
      <ul className="mt-1 space-y-0.5 text-xs">
        {examples.map((ex) => (
          <li key={ex.documentId}>
            <Link
              href={`/data-sources?document=${ex.documentId}`}
              className="font-mono text-blue-600 underline hover:text-blue-800"
            >
              {ex.documentId}
            </Link>{" "}
            <span className="text-gray-600">— {ex.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
