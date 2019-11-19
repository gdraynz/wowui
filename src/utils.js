import React, { useState, useEffect, createContext, useContext } from "react";
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

const gameVersionContext = createContext();

export const GameVersionProvider = ({ children }) => {
    const gameVersion = useProvideGameVersion();
    return (
        <gameVersionContext.Provider value={gameVersion}>
            {children}
        </gameVersionContext.Provider>
    );
};

export const useGameVersion = () => {
    return useContext(gameVersionContext);
};

const useProvideGameVersion = () => {
    const [gameVersion, setGameVersion] = useState("classic");

    useEffect(() => {
        // XXX: 1.x => 2.x migration
        const oldPath = AddonStore.get("path");
        if (oldPath) {
            AddonStore.set("classic.path", oldPath);
            AddonStore.delete("path");
        }
        const oldAddons = AddonStore.get("addons");
        if (oldAddons) {
            AddonStore.set("classic.addons", oldAddons);
            AddonStore.delete("addons");
        }
        const lastVersionUsed = AddonStore.get(VERSIONSTOREKEY);
        if (!lastVersionUsed) {
            AddonStore.set(VERSIONSTOREKEY, "classic");
        } else {
            setGameVersion(lastVersionUsed.name || lastVersionUsed);
        }
    }, []);

    const changeTo = name => {
        AddonStore.set(VERSIONSTOREKEY, name);
        setGameVersion(name);
    };

    const fullVersion = availableGameVersions[gameVersion];
    return {
        name: fullVersion.name,
        label: fullVersion.label,
        version: fullVersion.version,
        color: fullVersion.color,
        changeTo
    };
};

// Download stuff

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    const inProgress = useDownloadProvider();
    return (
        <DownloadContext.Provider value={inProgress}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloadInProgress = () => {
    return useContext(DownloadContext);
};

const useDownloadProvider = () => {
    const [inProgress, setInProgress] = useState(false);
    const start = () => setInProgress(true);
    const end = () => setInProgress(false);
    return { inProgress, start, end };
};
