import React, { useState, useEffect } from "react";
import { Grid, Input, Tab, Button } from "semantic-ui-react";

import { AddonStore } from "./utils";
import { Options } from "./Options";
import { CFTab } from "./curseforge/CurseForge";
import { WITab } from "./wowinterface/WowInterface";
// import { GithubTab } from "./github/Github";

const { dialog } = window.require("electron").remote;

const App = () => {
    const [pathValue, setPathValue] = useState(AddonStore.get("path", ""));

    useEffect(() => {
        // Listen to importation event
        const stopListening = AddonStore.onDidChange(
            "path",
            (newValue, oldValue) => {
                setPathValue(newValue);
            }
        );
        return () => stopListening();
    }, []);

    // Hide tabs until a folder is selected
    let panes = [];
    if (pathValue !== "")
        panes = [
            {
                menuItem: "Curse Forge (classic)",
                pane: <CFTab key="curseforge" />
            },
            { menuItem: "WoW Interface", pane: <WITab key="wowinterface" /> }
            // { menuItem: "Github", pane: <GithubTab key="github" /> }
        ];

    return (
        <Grid centered style={{ marginTop: "2vh" }}>
            <Grid.Column width={14}>
                <Grid.Row>
                    <Grid>
                        <Grid.Column width={13}>
                            <Input
                                fluid
                                disabled
                                value={pathValue}
                                placeholder="Path to WoW addons folder"
                            />
                        </Grid.Column>
                        <Grid.Column>
                            <Button.Group>
                                <Button
                                    color={pathValue ? null : "red"}
                                    icon="folder"
                                    onClick={() => {
                                        const path = dialog.showOpenDialogSync({
                                            properties: ["openDirectory"]
                                        });
                                        if (path) {
                                            AddonStore.set("path", path[0]);
                                        }
                                    }}
                                />
                                <Options />
                            </Button.Group>
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
