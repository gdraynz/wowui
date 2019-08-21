import { useState, useEffect, useCallback } from "react";

const Store = window.require("electron-store");
export const AddonStore = new Store();

const downloadKey = "downloadInProgress";
export const NotifyDownloadStarted = () => AddonStore.set(downloadKey, true);
export const NotifyDownloadFinished = () => AddonStore.set(downloadKey, false);
export const OnDownloadInProgress = callback => {
    AddonStore.onDidChange(downloadKey, (newValue, oldValue) => {
        callback(newValue);
    });
};

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
