import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Icon } from "semantic-ui-react";

import { AddonStore } from "./utils";

// Stuff to download/extract zip sequentially
const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");
const downloadKey = "downloadInProgress";

const numberWithSpaces = s =>
    s ? s.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

const InstallButton = props => {
    const [loading, setLoading] = useState(props.loading);
    const [disabled, setDisabled] = useState(false);
    const { id, version, latestVersion, downloadUrl } = props.addon;

    useEffect(() => {
        // Disable install buttons while a download is in progress
        const stopListening = AddonStore.onDidChange(
            downloadKey,
            (newValue, oldValue) => setDisabled(newValue)
        );
        return () => stopListening();
    }, []);

    useEffect(() => {
        setLoading(props.loading);
    }, [props.loading]);

    const install = () => {
        AddonStore.set(downloadKey, true);
        setLoading(true);
        const path = AddonStore.get("path");
        ipcRenderer.send("download", {
            url: downloadUrl,
            properties: { directory: path }
        });
        ipcRenderer.once("download complete", (event, file) => {
            extract(file, { dir: path }, err => {
                if (err) console.log(err);
                // Silently remove zip file
                fs.unlink(file, err => (err ? console.log(err) : ""));
                AddonStore.set(
                    [props.storeKey, id, "version"].join("."),
                    latestVersion
                );
                setLoading(props.loading);
                AddonStore.set(downloadKey, false);
            });
        });
    };

    const needsUpdate = version !== latestVersion;

    return (
        <Button
            color={needsUpdate ? "green" : "blue"}
            disabled={loading || disabled}
            loading={loading}
            onClick={() => install()}
        >
            {needsUpdate ? <Icon name="download" /> : ""}
            {latestVersion === null
                ? version
                : version !== latestVersion
                ? latestVersion
                : version}
        </Button>
    );
};

export const Addon = props => {
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState(props.version);
    const refLatestVersion = useRef(null);

    const checkForUpdate = props.checkForUpdate;

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            [props.storeKey, props.id, "version"].join("."),
            (newValue, oldValue) => {
                // Avoid if this is a deletion event
                if (newValue !== undefined) {
                    setVersion(newValue);
                }
            }
        );
        return () => stopListening();
    }, [props.storeKey, props.id]);

    useEffect(() => {
        if (
            // Name is undefined in case of an Import
            !props.name ||
            // No version known, fetch the latest
            !refLatestVersion.current ||
            // Version is the latest, check if a new one exists
            version === refLatestVersion.current
        ) {
            setLoading(true);
            checkForUpdate(props.id, version).then(v => {
                refLatestVersion.current = v;
                setLoading(false);
            });
        }
    }, [checkForUpdate, props.id, props.name, version]);

    return (
        <Table.Row>
            <Table.Cell collapsing>
                <Button
                    color="red"
                    icon="trash alternate"
                    onClick={() =>
                        AddonStore.delete(props.storeKey + "." + props.id)
                    }
                />
            </Table.Cell>
            <Table.Cell>
                {props.websiteUrl ? (
                    <a
                        href={props.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Icon name="external alternate" />
                        {props.name}
                    </a>
                ) : (
                    props.name
                )}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {numberWithSpaces(props.downloadCount)}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                <InstallButton
                    storeKey={props.storeKey}
                    addon={{
                        id: props.id,
                        version: version,
                        latestVersion: refLatestVersion.current,
                        downloadUrl: props.downloadUrl
                    }}
                    loading={loading}
                />
            </Table.Cell>
        </Table.Row>
    );
};
