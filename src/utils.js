import { useState, useEffect } from "react";
const Store = window.require("electron-store");

export const AddonStore = new Store();

const VERSIONSTOREKEY = "gameVersion";

export const availableGameVersions = {
    classic: {
        name: "classic",
        label: "Classic",
        version: "1.13.2",
        color: "red"
    },
    retail: {
        name: "retail",
        label: "Retail",
        version: "8.2.5",
        color: "blue"
    }
};

export const useGameVersion = () => {
    const [gameVersion, setGameVersion] = useState(
        AddonStore.get(VERSIONSTOREKEY, availableGameVersions.classic)
    );

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            VERSIONSTOREKEY,
            (newValue, oldValue) => {
                setGameVersion(newValue);
            }
        );
        return () => stopListening();
    }, []);

    return gameVersion;
};

export const setGameVersion = version =>
    AddonStore.set(VERSIONSTOREKEY, availableGameVersions[version]);

export const getGameVersion = () =>
    AddonStore.get(VERSIONSTOREKEY, availableGameVersions.classic);
