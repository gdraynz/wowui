import React, { useState, useRef, useEffect, useCallback } from "react";
import { Table, Dropdown, Tab } from "semantic-ui-react";

import { Addon } from "../Addon";
import { AddonStore, useGameVersion } from "../utils";

/*
Unofficial twitch api doc:
    https://twitchappapi.docs.apiary.io
*/

const BASESTOREKEY = "addons.curseforge";

const AddonSearch = (props) => {
    const [loading, setLoading] = useState(false);
    const refAddonList = useRef([]);
    const refSearchTimeout = useRef(null);
    const gameVersion = useGameVersion();

    const customSearch = useCallback(
        (e, { searchQuery }) => {
            if (searchQuery.length === 0) return;
            if (refAddonList.current.length > 0 && searchQuery.length > 4)
                return;
            setLoading(true);
            clearTimeout(refSearchTimeout.current);
            refSearchTimeout.current = setTimeout(() => {
                fetch(
                    "https://addons-ecs.forgesvc.net/api/v2/addon/search?gameId=1&gameVersion=" +
                        gameVersion.version +
                        "&searchFilter=" +
                        searchQuery
                )
                    .then((response) => response.json())
                    .then(
                        (data) =>
                            (refAddonList.current = data.map((addon) => ({
                                key: addon.id,
                                value: addon.id,
                                text: addon.name,
                                description: addon.summary,
                            })))
                    )
                    .then(() => {
                        clearTimeout(refSearchTimeout.current);
                        refSearchTimeout.current = null;
                        setLoading(false);
                    });
            }, 500);
        },
        [gameVersion.version]
    );

    return (
        <Dropdown
            fluid
            selection
            search
            onSearchChange={customSearch}
            loading={loading}
            placeholder="Search addon"
            options={refAddonList.current}
            onChange={(_, { value }) => props.checkForUpdate(value, null)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const CFTab = (props) => {
    const gameVersion = useGameVersion();
    const [addons, setAddons] = useState([]);

    const storeKey = [gameVersion.name, BASESTOREKEY].join(".");

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            storeKey,
            (newValue, oldValue) => setAddons(Object.values(newValue || {}))
        );
        setAddons(Object.values(AddonStore.get(storeKey, [])));
        return () => stopListening();
    }, [storeKey]);

    const checkForUpdate = useCallback(
        async (id, currentVersion) => {
            const response = await fetch(
                "https://addons-ecs.forgesvc.net/api/v2/addon/" + id
            );
            const data = await response.json();

            // Pick only the latest file with the right game version
            let latestFile = {};
            const BreakException = {};
            try {
                data.latestFiles.reverse().forEach((file) => {
                    file.gameVersion.forEach((version) => {
                        if (
                            version.substring(0, 2) ===
                            gameVersion.version.substring(0, 2)
                        ) {
                            latestFile = file;
                            throw BreakException;
                        }
                    });
                });
            } catch (e) {}

            AddonStore.set([storeKey, id].join("."), {
                id: id,
                name: data.name,
                version: currentVersion,
                latestVersion: latestFile.displayName,
                downloadUrl: latestFile.downloadUrl,
                downloadCount: data.downloadCount,
                websiteUrl: data.websiteUrl,
            });
            return latestFile.displayName;
        },
        [gameVersion.version, storeKey]
    );

    return (
        <Tab.Pane {...props}>
            <AddonSearch checkForUpdate={checkForUpdate} />
            <Table selectable celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell />
                        <Table.HeaderCell>Name</Table.HeaderCell>
                        <Table.HeaderCell collapsing textAlign="center">
                            Downloads
                        </Table.HeaderCell>
                        <Table.HeaderCell collapsing textAlign="center" />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {addons.map((addon) => (
                        <Addon
                            key={addon.id}
                            {...addon}
                            storeKey={storeKey}
                            checkForUpdate={checkForUpdate}
                        />
                    ))}
                </Table.Body>
            </Table>
        </Tab.Pane>
    );
};
