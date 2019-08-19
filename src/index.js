import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "semantic-ui-css/semantic.min.css";

const shell = window.require("electron").shell;

// Open links externally by default
document.addEventListener("click", event => {
	if (event.target.tagName === "a" && event.target.href.startsWith("http")) {
		event.preventDefault();
		shell.openExternal(event.target.href);
	}
});

ReactDOM.render(<App />, document.getElementById("root"));
