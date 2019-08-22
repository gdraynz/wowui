import React, { useState, useEffect, useCallback } from "react";
import { Button } from "semantic-ui-react";

const Store = window.require("electron-store");
export const AddonStore = new Store();

const downloadKey = "downloadInProgress";
export const NotifyDownloadStarted = () => AddonStore.set(downloadKey, true);
export const NotifyDownloadFinished = () => AddonStore.set(downloadKey, false);

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
    const { loading, disabled, ...childProps } = props;
    const [childDisabled, setDisabled] = useState(props.disabled);
    const [childLoading, setLoading] = useState(props.loading);

    useEffect(() => {
        // Disable install buttons while a download is in progress
        AddonStore.onDidChange(downloadKey, (newValue, oldValue) =>
            setDisabled(newValue)
        );
    }, []);

    useEffect(() => {
        setDisabled(props.disabled);
        setLoading(props.loading);
    }, [props]);

    async function onClick() {
        NotifyDownloadStarted();
        setLoading(true);
        await props.onClick();
        setLoading(props.loading);
    }

    return (
        <Button
            {...childProps}
            disabled={childDisabled}
            loading={childLoading}
            onClick={async () => await onClick()}
        />
    );
};
