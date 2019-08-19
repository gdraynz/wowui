import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
