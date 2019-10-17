import React, { useState, useRef, useEffect } from "react";
import { Table, Dropdown, Tab, Grid, Checkbox } from "semantic-ui-react";

import { Addon } from "../Addon";
import { AddonStore } from "../utils";

const STOREKEY = "addons.curseforge";
const GAMEVERSIONS = {
    classic: "1.13.2",
    retail: "8.2.5"
};
var isClassic = true;

/*
Unofficial twitch api doc:
    https://twitchappapi.docs.apiary.io
*/

const checkForUpdate = async (id, currentVersion) => {
    const response = await fetch(
        "https://addons-ecs.forgesvc.net/api/v2/addon/" + id
    );
    const data = await response.json();

    // Pick only the latest file with the right game version
    let latestFile = {};
    const BreakException = {};
    try {
        data.latestFiles.reverse().forEach(file => {
            file.gameVersion.forEach(version => {
                if (
                    isClassic
                        ? version.startsWith("1.")
                        : version.startsWith("8.")
                ) {
                    latestFile = file;
                    throw BreakException;
                }
            });
        });
    } catch (e) {}

    AddonStore.set(STOREKEY + "." + id, {
        id: id,
        name: data.name,
        version: currentVersion,
        latestVersion: latestFile.displayName,
        downloadUrl: latestFile.downloadUrl,
        downloadCount: data.downloadCount,
        websiteUrl: data.websiteUrl
    });
    return latestFile.displayName;
};

const AddonSearch = props => {
    const [loading, setLoading] = useState(false);
    const refAddonList = useRef([]);
    const refSearchTimeout = useRef(null);

    const customSearch = (e, { searchQuery }) => {
        if (searchQuery.length === 0) return;
        if (refAddonList.current.length > 0 && searchQuery.length > 4) return;
        setLoading(true);
        clearTimeout(refSearchTimeout.current);
        refSearchTimeout.current = setTimeout(() => {
            fetch(
                "https://addons-ecs.forgesvc.net/api/v2/addon/search?gameId=1&gameVersion=" +
                    GAMEVERSIONS[isClassic ? "classic" : "retail"] +
                    "&searchFilter=" +
                    searchQuery
            )
                .then(response => response.json())
                .then(
                    data =>
                        (refAddonList.current = data.map(addon => ({
                            key: addon.id,
                            value: addon.id,
                            text: addon.name,
                            description: addon.summary
                        })))
                )
                .then(() => {
                    clearTimeout(refSearchTimeout.current);
                    refSearchTimeout.current = null;
                    setLoading(false);
                });
        }, 500);
    };

    const switchVersion = () => {
        isClassic = !isClassic;
    };

    return (
        <Grid>
            <Grid.Column width={14} textAlign="center" verticalAlign="middle">
                <Dropdown
                    fluid
                    selection
                    search
                    onSearchChange={customSearch}
                    loading={loading}
                    placeholder="Search addon"
                    options={refAddonList.current}
                    onChange={(_, { value }) => checkForUpdate(value, null)}
                    selectOnBlur={false}
                    selectOnNavigation={false}
                />
            </Grid.Column>
            <Grid.Column width={2} textAlign="center" verticalAlign="middle">
                <Checkbox toggle onChange={() => switchVersion()} />
                <br />
                {isClassic ? "Classic" : "Retail"}
            </Grid.Column>
        </Grid>
    );
};

export const CFTab = props => {
    const [addons, setAddons] = useState(
        Object.values(AddonStore.get(STOREKEY, {}))
    );

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            STOREKEY,
            (newValue, oldValue) => setAddons(Object.values(newValue || {}))
        );
        return () => stopListening();
    }, []);

    return (
        <Tab.Pane {...props}>
            <AddonSearch />
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
                    {addons.map(addon => (
                        <Addon
                            key={addon.id}
                            {...addon}
                            storeKey={STOREKEY}
                            checkForUpdate={checkForUpdate}
                        />
                    ))}
                </Table.Body>
            </Table>
        </Tab.Pane>
    );
};
