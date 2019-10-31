import React, { useState, useEffect } from "react";
import { Grid, Input, Tab, Button, Message, Icon } from "semantic-ui-react";

import { AddonStore, setGameVersion, useGameVersion } from "./utils";
import { Options } from "./Options";
import { CFTab } from "./curseforge/CurseForge";
import { WITab } from "./wowinterface/WowInterface";
import { TukuiTab } from "./tukui/Tukui";
// import { GithubTab } from "./github/Github";

const { dialog, app } = window.require("electron").remote;

export const VersionCheck = () => {
    const [latestVersion, setLatestVersion] = useState(null);
    const [url, setUrl] = useState(null);

    useEffect(() => {
        fetch("https://api.github.com/repos/gdraynz/wowui/releases/latest")
            .then(response => response.json())
            .then(data => {
                if (data["tag_name"] !== app.getVersion()) {
                    setLatestVersion(data["tag_name"]);
                    setUrl(data["assets"][0]["browser_download_url"]);
                }
            });
    }, []);

    return (
        latestVersion &&
        url && (
            <Grid.Row>
                <Message warning icon>
                    <Icon name="exclamation" />
                    <Message.Content>
                        <Message.Header>New version available</Message.Header>
                        <a href={url}>Download {latestVersion}</a>
                    </Message.Content>
                </Message>
            </Grid.Row>
        )
    );
};

const VersionSwitch = () => {
    const [freeze, setFreeze] = useState(false);
    const gameVersion = useGameVersion();

    const switchVersion = () => {
        setFreeze(true);
        const newVersion = gameVersion.name === "retail" ? "classic" : "retail";
        setGameVersion(newVersion);
        setTimeout(() => setFreeze(false), 500);
    };

    return (
        <Button
            basic
            disabled={freeze}
            color={gameVersion.color}
            onClick={() => switchVersion()}
            content={gameVersion.label}
        />
    );
};

const App = () => {
    const gameVersion = useGameVersion();
    const [pathValue, setPathValue] = useState("");

    useEffect(() => {
        setPathValue(AddonStore.get([gameVersion.name, "path"].join("."), ""));
        const stopListening = AddonStore.onDidChange(
            [gameVersion.name, "path"].join("."),
            (newValue, oldValue) => {
                setPathValue(newValue);
            }
        );
        return () => stopListening();
    }, [gameVersion.name]);

    const setPath = path =>
        AddonStore.set([gameVersion.name, "path"].join("."), path);

    // Hide tabs until a folder is selected
    let panes = [];
    if (pathValue !== "")
        panes = [
            {
                menuItem: "Curse Forge",
                pane: <CFTab key="curseforge" />
            },
            { menuItem: "WoW Interface", pane: <WITab key="wowinterface" /> },
            { menuItem: "Tukui/Elvui", pane: <TukuiTab key="tukui" /> }
            // { menuItem: "Github", pane: <GithubTab key="github" /> }
        ];

    return (
        <Grid centered style={{ marginTop: "2vh" }}>
            <Grid.Column width={14}>
                <VersionCheck />
                <Grid.Row>
                    <Grid>
                        <Grid.Column
                            width={12}
                            textAlign="center"
                            verticalAlign="middle"
                        >
                            <Input
                                fluid
                                disabled
                                value={pathValue}
                                placeholder="Path to WoW addons folder"
                            />
                        </Grid.Column>
                        <Grid.Column
                            width={4}
                            textAlign="center"
                            verticalAlign="middle"
                        >
                            <Button.Group>
                                <Button
                                    color={pathValue ? null : "red"}
                                    icon="folder"
                                    onClick={() => {
                                        const path = dialog.showOpenDialogSync({
                                            properties: ["openDirectory"]
                                        });
                                        if (path) setPath(path[0]);
                                    }}
                                />
                                <Options />
                            </Button.Group>
                            <VersionSwitch />
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
