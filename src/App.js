import React, { useState, useEffect } from "react";
import { Grid, Input, Tab, Button } from "semantic-ui-react";

import { AddonStore, NotifyDownloadFinished } from "./utils";
import { CFTab } from "./curseforge/CurseForge";
import { WITab } from "./wowinterface/WowInterface";
import { GithubTab } from "./github/Github";

const { dialog } = window.require("electron").remote;
const ipcRenderer = window.require("electron").ipcRenderer;

const App = () => {
    const [pathValue, setPathValue] = useState(AddonStore.get("path", ""));

    useEffect(() => {
        // Automatically set downloadInProgress as false at end of download
        ipcRenderer.on("download complete", (event, info) => {
            NotifyDownloadFinished();
        });
    }, []);

    // Hide tabs until a folder is selected
    let panes = [];
    if (pathValue !== "")
        panes = [
            {
                menuItem: "Curse Forge (classic)",
                pane: <CFTab key="curseforge" />
            },
            { menuItem: "WoW Interface", pane: <WITab key="wowinterface" /> },
            { menuItem: "Github", pane: <GithubTab key="github" /> }
        ];

    return (
        <Grid centered style={{ marginTop: "2vh" }}>
            <Grid.Column width={14}>
                <Grid.Row>
                    <Grid>
                        <Grid.Column width={15}>
                            <Input
                                fluid
                                disabled
                                value={pathValue}
                                placeholder="Path to WoW addons folder"
                            />
                        </Grid.Column>
                        <Grid.Column>
                            <Button
                                color={pathValue ? "grey" : "red"}
                                icon="folder"
                                onClick={() => {
                                    const path = dialog.showOpenDialogSync({
                                        properties: ["openDirectory"]
                                    });
                                    if (path) {
                                        AddonStore.set("path", path[0]);
                                        setPathValue(path[0]);
                                    }
                                }}
                            />
                        </Grid.Column>
                    </Grid>
                </Grid.Row>
                <Grid.Row style={{ marginTop: "2vh" }}>
                    <Tab
                        renderActiveOnly={false}
                        menu={{ secondary: true, pointing: true }}
                        panes={panes}
                    />
                </Grid.Row>
            </Grid.Column>
        </Grid>
    );
};

export default App;
