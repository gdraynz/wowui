import React, { useRef } from "react";
import { Grid, Input, Tab } from "semantic-ui-react";

import { AddonStore } from "./Store";
import { CFTab } from "./CurseForge/CurseForge";
import { WITab } from "./WowInterface/WowInterface";

const App = () => {
    const refPathTimeout = useRef(null);

    // AddonStore.clear();

    const updatePath = path => {
        clearTimeout(refPathTimeout.current);
        refPathTimeout.current = setTimeout(() => {
            AddonStore.set("path", path);
            refPathTimeout.current = null;
        }, 500);
    };

    const panes = [
        { menuItem: "Curse Forge", pane: <CFTab key="cf" /> },
        { menuItem: "WoW Interface", pane: <WITab key="wi" /> }
    ];

    return (
        <Grid centered style={{ marginTop: "5vh" }}>
            <Grid.Column width={14}>
                <Grid.Row>
                    <Tab
                        renderActiveOnly={false}
                        menu={{ secondary: true, pointing: true }}
                        panes={panes}
                    />
                </Grid.Row>
                <Grid.Row>
                    <Input
                        fluid
                        defaultValue={AddonStore.get("path")}
                        placeholder="Path to WoW addons folder"
                        onChange={(e, { value }) => updatePath(value)}
                    />
                </Grid.Row>
            </Grid.Column>
        </Grid>
    );
};

export default App;
