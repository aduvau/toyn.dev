import { relative } from "node:path";
import { build } from "./build/build.ts";
import { DEPLOY_BRANCH, deploy } from "./build/deploy.ts";
import { makeConfig } from "./config.ts";
import { loadSite } from "./content/load.ts";
import { startServer } from "./server/serve.ts";

const [command] = process.argv.slice(2);

switch (command) {
  case "serve": {
    const server = startServer(makeConfig({ liveReload: true }));
    console.log(`toyn: serving on ${server.url}`);
    break;
  }
  case "build": {
    const result = await build(makeConfig());
    if (!result.ok) {
      for (const error of result.errors) console.error(error);
      console.error(
        `toyn: build failed with ${result.errors.length} error(s), dist/ left as it was`,
      );
      process.exit(1);
    }
    for (const warning of result.warnings) console.warn(`warning: ${warning}`);
    console.log(
      `toyn: wrote ${result.files.length} files to ${relative(process.cwd(), result.outDir)}/`,
    );
    break;
  }
  case "check": {
    const loaded = await loadSite(makeConfig());
    for (const warning of loaded.warnings) console.warn(`warning: ${warning}`);
    if (!loaded.ok) {
      for (const error of loaded.errors) console.error(error);
      process.exit(1);
    }
    console.log(`toyn: content OK, ${loaded.warnings.length} open TODO(antoine) note(s)`);
    break;
  }
  case "deploy": {
    const result = await deploy(makeConfig());
    if (!result.ok) {
      for (const error of result.errors) console.error(error);
      console.error("toyn: deploy failed, nothing was pushed");
      process.exit(1);
    }
    console.log(
      result.commit
        ? `toyn: built ${result.files} files, pushed ${result.commit} to origin/${DEPLOY_BRANCH}`
        : `toyn: site unchanged, origin/${DEPLOY_BRANCH} is up to date`,
    );
    break;
  }
  default:
    console.error("usage: toyn <serve|build|check|deploy>");
    process.exit(1);
}
