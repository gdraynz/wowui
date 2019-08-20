import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Icon, Dropdown, Tab } from "semantic-ui-react";

import { AddonStore } from "../utils";

const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

export const GithubTab = props => {
	return <Tab.Pane {...props}>wesh</Tab.Pane>;
};
