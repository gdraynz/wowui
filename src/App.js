import React, { useRef } from "react";
import { Grid, Input, Tab, Button } from "semantic-ui-react";

import { AddonStore } from "./Store";
import { CFTab } from "./CurseForge/CurseForge";
import { WITab } from "./WowInterface/WowInterface";
import { TukuiTab } from "./Tukui/Tukui";

const App = () => {
    const refPathTimeout = useRef(null);

    const updatePath = path => {
        clearTimeout(refPathTimeout.current);
        refPathTimeout.current = setTimeout(() => {
            AddonStore.set("path", path);
            refPathTimeout.current = null;
        }, 500);
    };

    const panes = [
        { menuItem: "Curse Forge", pane: <CFTab key="cf" /> },
        { menuItem: "WoW Interface", pane: <WITab key="wi" /> },
        { menuItem: "Tukui", pane: <TukuiTab key="tukui" /> }
    ];

    return (
        <Grid centered style={{ marginTop: "2vh" }}>
            <Grid.Column width={14}>
                <Grid.Row>
                    <Input
                        fluid
                        defaultValue={AddonStore.get("path")}
                        placeholder="Path to WoW addons folder"
                        onChange={(e, { value }) => updatePath(value)}
                    />
                    <Input
                        floated="right"
                        as={() => <Button icon="folder" />}
                    />
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
