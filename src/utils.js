import React, { useState, useEffect, useCallback } from "react";
import { Button, Icon } from "semantic-ui-react";

const Store = window.require("electron-store");
export const AddonStore = new Store();

// Stuff to download/extract zip sequentially
const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");
const downloadKey = "downloadInProgress";

/*
From https://usehooks.com/useKeyPress/
*/
export const useKeyPress = targetKey => {
    const [keyPressed, setKeyPressed] = useState(false);

    const downHandler = useCallback(
        ({ key }) => {
            if (key === targetKey) {
                setKeyPressed(true);
            }
        },
        [targetKey]
    );

    const upHandler = useCallback(
        ({ key }) => {
            if (key === targetKey) {
                setKeyPressed(false);
            }
        },
        [targetKey]
    );

    useEffect(() => {
        window.addEventListener("keydown", downHandler);
        window.addEventListener("keyup", upHandler);
        return () => {
            window.removeEventListener("keydown", downHandler);
            window.removeEventListener("keyup", upHandler);
        };
    }, [downHandler, upHandler]);

    return keyPressed;
};

export const InstallButton = props => {
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

    return (
        <Button
            color={version !== latestVersion ? "green" : "blue"}
            disabled={loading || disabled}
            loading={loading}
            onClick={() => install()}
        >
            <Icon name="download" />
            {latestVersion === null
                ? version
                : version !== latestVersion
                ? latestVersion
                : version}
        </Button>
    );
};
