import React from "react";
import ReactDOM from "react-dom";
import "semantic-ui-css/semantic.min.css";

import App from "./App";
import { AddonStore, getGameVersion, setGameVersion } from "./utils";

const shell = window.require("electron").shell;

// Open links externally by default
document.addEventListener("click", event => {
	if (
		event.target.tagName.toLowerCase() === "a" &&
		event.target.href.startsWith("http")
	) {
		event.preventDefault();
		shell.openExternal(event.target.href);
	}
});

// XXX: Game version migration step
const gameVersionMigration = () => {
	const oldPath = AddonStore.get("path");
	if (oldPath) {
		AddonStore.set("classic.path", oldPath);
		AddonStore.delete("path");
	}
	const oldAddons = AddonStore.get("addons");
	if (oldAddons) {
		AddonStore.set("classic.addons", oldAddons);
		AddonStore.delete("addons");
	}
	if (!getGameVersion()) {
		setGameVersion("classic");
	}
};

gameVersionMigration();
ReactDOM.render(<App />, document.getElementById("root"));
