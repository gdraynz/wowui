import React, { useState } from "react";
import { Grid, Input, Tab, Button } from "semantic-ui-react";

import { AddonStore } from "./Store";
import { CFTab } from "./CurseForge/CurseForge";
import { WITab } from "./WowInterface/WowInterface";
// import { TukuiTab } from "./Tukui/Tukui";

const { dialog } = window.require("electron").remote;

const App = () => {
    const [pathValue, setPathValue] = useState(AddonStore.get("path", ""));

    // Hide tabs until a folder is selected
    let panes = [];
    if (pathValue !== "")
        panes = [
            {
                menuItem: "Curse Forge (classic)",
                pane: <CFTab key="curseforge" />
            },
            { menuItem: "WoW Interface", pane: <WITab key="wowinterface" /> }
            // { menuItem: "Tukui", pane: <TukuiTab key="tukui" /> }
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
                                color={pathValue ? "" : "red"}
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
