import React from "react";
import ReactDOM from "react-dom";
import "semantic-ui-css/semantic.min.css";

import App from "./App";
import { GameVersionProvider, DownloadProvider } from "./utils";

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

ReactDOM.render(
	<DownloadProvider>
		<GameVersionProvider>
			<App />
		</GameVersionProvider>
	</DownloadProvider>,
	document.getElementById("root")
);
