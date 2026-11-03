import type { Site } from "../content/load.ts";
import { contracts } from "../system/contracts.tsx";
import { contrastRows, ratio, tokenGroups } from "../system/report.ts";
import { type Contract, contractId } from "../system/schema.ts";
import { isColor, readTokens, type Tokens } from "../system/tokens.ts";
import { Eyebrow, SiteFooter, SiteHeader } from "./components.tsx";
import type { Child, SafeHtml } from "./html.ts";
import { Layout } from "./layout.tsx";
import { Inline, SelectorsRow, SpecList } from "./spec.tsx";
import { SYSTEM_ROOT } from "./urls.ts";

const KINDS = { component: "Components", layout: "Layout", utility: "Utilities" } as const;

function ContractEntry({ contract, site }: { contract: Contract; site: Site }): SafeHtml {
  const id = contractId(contract);
  return (
    <article class="contract" id={id} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{contract.name}</h3>
      <p>
        <Inline text={contract.purpose} />
      </p>
      <dl class="contract-spec">
        <SelectorsRow contract={contract} />
        <SpecList label="States" items={contract.states} />
        <SpecList label="Accessibility" items={contract.a11y} />
        <SpecList label="Do" items={contract.do} />
        <SpecList label="Don't" items={contract.dont} />
      </dl>
      {contract.example && (
        // biome-ignore lint/a11y/useSemanticElements: a group of live UI, not a form, so no <fieldset>.
        <div class="contract-example" role="group" aria-label={`${contract.name} example`}>
          {contract.example(site, SYSTEM_ROOT)}
        </div>
      )}
    </article>
  );
}

/** Wide tables scroll inside a focusable region, so keyboard users can scroll them too. */
function Scroll({ label, children }: { label: string; children: Child }): SafeHtml {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a scroll container inside a section, not a section of its own.
    <div class="table-scroll" role="region" aria-label={label} tabindex="0">
      {children}
    </div>
  );
}

function Colors({ tokens }: { tokens: Tokens }): SafeHtml {
  const names = [...tokens.light.keys()].filter(isColor);
  return (
    <ul class="swatches">
      {names.map((name) => (
        <li class="swatch">
          <span class="swatch-chip" style={`background: var(${name})`}></span>
          <code>{name}</code>
          <span class="muted">
            {tokens.light.get(name)}
            <br />
            {tokens.dark.get(name) ?? tokens.light.get(name)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ContrastTable({ tokens }: { tokens: Tokens }): SafeHtml {
  return (
    <table class="system-table">
      <caption>
        Every colour pair the contracts rely on, checked in both themes by the tests.
      </caption>
      <thead>
        <tr>
          <th scope="col">Text / UI</th>
          <th scope="col">On</th>
          <th scope="col">Used for</th>
          <th scope="col">Minimum</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
        </tr>
      </thead>
      <tbody>
        {contrastRows(contracts, tokens).map((r) => (
          <tr>
            <td>
              <code>{r.fg}</code>
            </td>
            <td>
              <code>{r.bg}</code>
            </td>
            <td>{r.uses.join("; ")}</td>
            <td>{ratio(r.min)}</td>
            <td>{ratio(r.light)}</td>
            <td>{ratio(r.dark)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TypeScale({ tokens }: { tokens: Tokens }): SafeHtml {
  const names = [...tokens.light.keys()].filter((n) => n.startsWith("--text-"));
  return (
    <ul>
      {names.map((name) => (
        <li class="type-sample">
          <code>{name}</code>
          <span style={`font-size: var(${name})`}>Ship the right path</span>
        </li>
      ))}
    </ul>
  );
}

function SpaceScale({ tokens }: { tokens: Tokens }): SafeHtml {
  const names = [...tokens.light.keys()].filter((n) => n.startsWith("--space-"));
  return (
    <ul>
      {names.map((name) => (
        <li class="type-sample">
          <code>{name}</code>
          <span class="space-bar" style={`inline-size: var(${name})`}></span>
        </li>
      ))}
    </ul>
  );
}

function OtherTokens({ tokens }: { tokens: Tokens }): SafeHtml {
  const skip = new Set(["color", "text", "space"]);
  const rows = [...tokenGroups(tokens)].filter(([family]) => !skip.has(family));
  return (
    <table class="system-table">
      <caption>
        Type, layout, shape and motion. Durations drop to 0 under{" "}
        <code>prefers-reduced-motion</code>.
      </caption>
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([, names]) =>
          names.map((name) => (
            <tr>
              <td>
                <code>{name}</code>
              </td>
              <td>
                <code>{tokens.light.get(name)}</code>
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  );
}

export function SystemPage({ site }: { site: Site }): SafeHtml {
  const tokens = readTokens();
  return (
    <Layout
      title={`Design system — ${site.profile.name}`}
      description="The tokens and component contracts of toyn.dev, generated from the code."
      root={SYSTEM_ROOT}
    >
      <SiteHeader site={site} root={SYSTEM_ROOT} current="system" />
      <main id="main" class="page">
        <header class="case-header">
          <Eyebrow>Design system</Eyebrow>
          <h1>How this site is built</h1>
          <p class="tagline">
            Tokens and component contracts, generated from the code. The same contracts feed{" "}
            <a href={`${SYSTEM_ROOT}llms.txt`}>llms.txt</a>,{" "}
            <a href={`${SYSTEM_ROOT}system.md`}>system.md</a> and the tests that fail when a page
            breaks them.
          </p>
        </header>
        <nav class="system-toc" aria-label="On this page">
          <ul>
            <li>
              <a href="#tokens-title">Tokens</a>
            </li>
            {Object.values(KINDS).map((label) => (
              <li>
                <a href={`#${label.toLowerCase()}-title`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <section class="section" aria-labelledby="tokens-title">
          <h2 id="tokens-title">Tokens</h2>
          <p class="muted">
            Every colour, pixel value and duration lives in <code>styles/tokens.css</code>; a test
            fails if one appears anywhere else.
          </p>
          <h3 class="subheading">Colour</h3>
          <p class="muted">Light value, then dark value. The chips follow your system theme.</p>
          <Colors tokens={tokens} />
          <h3 class="subheading">Contrast</h3>
          <Scroll label="Contrast pairs">
            <ContrastTable tokens={tokens} />
          </Scroll>
          <h3 class="subheading">Type scale</h3>
          <TypeScale tokens={tokens} />
          <h3 class="subheading">Space</h3>
          <SpaceScale tokens={tokens} />
          <h3 class="subheading">Everything else</h3>
          <Scroll label="Other tokens">
            <OtherTokens tokens={tokens} />
          </Scroll>
        </section>
        {Object.entries(KINDS).map(([kind, label]) => (
          <section class="section" aria-labelledby={`${label.toLowerCase()}-title`}>
            <h2 id={`${label.toLowerCase()}-title`}>{label}</h2>
            {contracts
              .filter((c) => c.kind === kind)
              .map((c) => (
                <ContractEntry contract={c} site={site} />
              ))}
          </section>
        ))}
      </main>
      <SiteFooter site={site} />
    </Layout>
  );
}
