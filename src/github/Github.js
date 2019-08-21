import React, { useState, useEffect, useCallback } from "react";
import { Button, Tab, Input, Grid } from "semantic-ui-react";

import {
    AddonStore,
    OnDownloadInProgress,
    NotifyDownloadStarted,
    useKeyPress
} from "../utils";

const rimraf = window.require("rimraf");
const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

const STOREKEY = "addons.github";

const GithubLink = props => {
    const [loading, setLoading] = useState(false);

    const getAddonPath = () => {
        const path = AddonStore.get("path");
        const parts = props.link.split("/");
        const addonPath = [path, parts[parts.length - 1]].join("/");
        return { path, addonPath };
    };

    const install = () => {
        setLoading(true);
        NotifyDownloadStarted();
        const { path, addonPath } = getAddonPath();
        ipcRenderer.send("download", {
            url: props.link + "/archive/master.zip",
            properties: { directory: path }
        });
        ipcRenderer.once("download complete", (event, file) => {
            // Remove old folder
            rimraf(addonPath, () =>
                // Extract zip
                extract(file, { dir: path }, err => {
                    if (err) console.log(err);
                    // Cleanup
                    fs.rename(addonPath + "-master", addonPath, e =>
                        e ? console.log(e) : ""
                    );
                    fs.unlink(file, e => (e ? console.log(e) : ""));
                    setLoading(false);
                })
            );
        });
    };

    return (
        <Grid.Row>
            <Grid.Column width={1}>
                <Button
                    icon="trash alternate"
                    floated="left"
                    color="red"
                    onClick={() => {
                        let links = AddonStore.get(STOREKEY, []);
                        links.splice(links.indexOf(props.link), 1);
                        AddonStore.set(STOREKEY, links);
                        // Remove the addon
                        const { addonPath } = getAddonPath();
                        rimraf(addonPath, e => (e ? console.log(e) : ""));
                    }}
                />
            </Grid.Column>
            <Grid.Column width={14}>
                <Input fluid disabled value={props.link} />
            </Grid.Column>
            <Grid.Column width={1}>
                <Button
                    disabled={props.downloadInProgress || loading}
                    loading={loading}
                    icon="download"
                    floated="right"
                    color="blue"
                    onClick={() => install()}
                />
            </Grid.Column>
        </Grid.Row>
    );
};

export const GithubTab = props => {
    const [downloadInProgress, setDownloadInProgress] = useState(false);
    const [links, setLinks] = useState([]);
    const [linkValue, setLinkValue] = useState("");
    const enterPressed = useKeyPress("Enter");

    const addLink = useCallback(() => {
        if (linkValue) {
            AddonStore.set(STOREKEY, links.concat(linkValue));
            setLinkValue("");
        }
    }, [linkValue, links]);

    useEffect(() => {
        OnDownloadInProgress(value => setDownloadInProgress(value));
        setLinks(AddonStore.get(STOREKEY, []));
        AddonStore.onDidChange(STOREKEY, (newValue, oldValue) =>
            setLinks(newValue)
        );
    }, []);

    useEffect(() => {
        if (enterPressed) addLink();
    }, [enterPressed, addLink]);

    return (
        <Tab.Pane {...props}>
            <Grid>
                {links.map((link, i) =>
                    link ? (
                        <GithubLink
                            key={i}
                            index={i}
                            link={link}
                            downloadInProgress={downloadInProgress}
                        />
                    ) : (
                        ""
                    )
                )}
                <Grid.Row>
                    <Grid.Column width={15}>
                        <Input
                            fluid
                            placeholder="Github link to an addon"
                            value={linkValue}
                            onChange={(e, { value }) => setLinkValue(value)}
                        />
                    </Grid.Column>
                    <Grid.Column width={1}>
                        <Button
                            icon="plus"
                            floated="right"
                            color="green"
                            onClick={() => addLink()}
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Tab.Pane>
    );
};
