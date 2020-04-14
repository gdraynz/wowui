import React, { useState, useEffect, useRef, useCallback } from "react";
import { Table, Button, Icon } from "semantic-ui-react";

import { AddonStore, useGameVersion, useDownloadInProgress } from "./utils";

// Stuff to download/extract zip sequentially
const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

const numberWithSpaces = (s) =>
    s ? s.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

const InstallButton = (props) => {
    const [loading, setLoading] = useState(props.loading);
    const { id, version, latestVersion, downloadUrl } = props.addon;
    const gameVersion = useGameVersion();
    const download = useDownloadInProgress();

    useEffect(() => {
        setLoading(props.loading);
    }, [props.loading]);

    const install = useCallback(() => {
        download.start();
        setLoading(true);
        const path = AddonStore.get([gameVersion.name, "path"].join("."));
        ipcRenderer.send("download", {
            url: downloadUrl,
            properties: { directory: path },
        });
        ipcRenderer.once("download complete", async (event, file) => {
            try {
                await extract(file, { dir: path });
            } catch (err) {
                console.error(err);
            }
            // Silently remove zip file
            fs.unlink(file, (err) => (err ? console.log(err) : ""));
            AddonStore.set(
                [props.storeKey, id, "version"].join("."),
                latestVersion
            );
            setLoading(props.loading);
            download.end();
        });
    }, [
        download,
        downloadUrl,
        gameVersion.name,
        id,
        latestVersion,
        props.loading,
        props.storeKey,
    ]);

    const needsUpdate = version !== latestVersion;

    return (
        <Button
            color={needsUpdate ? "green" : "blue"}
            disabled={loading || download.inProgress}
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

export const Addon = (props) => {
    const gameVersion = useGameVersion();
    const addonGameVersion = useRef(gameVersion.name);
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
        // Bail out if the game version is not right
        if (addonGameVersion.current !== gameVersion.name) return;
        if (
            // Name is undefined in case of an Import
            !props.name ||
            // Unknown latest version, try and fetch it
            !refLatestVersion.current
        ) {
            setLoading(true);
            checkForUpdate(props.id, version).then((v) => {
                refLatestVersion.current = v;
                setLoading(false);
            });
        }
    }, [gameVersion.name, checkForUpdate, props.id, props.name, version]);

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
                        downloadUrl: props.downloadUrl,
                    }}
                    loading={loading}
                />
            </Table.Cell>
        </Table.Row>
    );
};
