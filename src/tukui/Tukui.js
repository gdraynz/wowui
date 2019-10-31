import React, { useState, useEffect, useMemo } from "react";
import { Table, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { Addon } from "../Addon";
import { AddonStore, useGameVersion } from "../utils";

const BASESTOREKEY = "addons.tukui";

const AddonSearch = props => {
    const customSearch = (options, query) => {
        if (query.length < 2) {
            return [];
        }
        const re = new RegExp(_.escapeRegExp(query), "i");
        return props.addonList.filter(item => re.test(item.text));
    };

    return (
        <Dropdown
            fluid
            selection
            options={[]}
            search={customSearch}
            placeholder="Search addon"
            onChange={(_, { value }) => props.checkForUpdate(value, null)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const TukuiTab = props => {
    const gameVersion = useGameVersion();
    const [addons, setAddons] = useState([]);
    const [addonList, setAddonList] = useState([]);

    const storeKey = [gameVersion.name, BASESTOREKEY].join(".");

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            storeKey,
            (newValue, oldValue) => setAddons(Object.values(newValue || {}))
        );
        setAddons(Object.values(AddonStore.get(storeKey, [])));
        fetch(
            "https://www.tukui.org/api.php?" +
                (gameVersion.name === "classic" ? "classic-" : "") +
                "addons=all"
        )
            .then(response => response.json())
            .then(data =>
                setAddonList(
                    data.map(item => ({
                        key: item.id,
                        value: item.id,
                        text: item.name,
                        description: item.small_desc
                    }))
                )
            );
        return () => stopListening();
    }, [gameVersion.name, storeKey]);

    const checkForUpdate = async (id, currentVersion) => {
        const response = await fetch(
            "https://www.tukui.org/api.php?" +
                (gameVersion.name === "classic" ? "classic-" : "") +
                "addon=" +
                id
        );
        const addon = await response.json();
        AddonStore.set([storeKey, id].join("."), {
            id: id,
            name: addon.name,
            version: currentVersion,
            latestVersion: addon.version,
            downloadUrl: addon.url,
            downloadCount: addon.downloads,
            websiteUrl: addon.web_url
        });
        return addon.version;
    };

    return (
        addonList && (
            <Tab.Pane {...props}>
                <AddonSearch
                    addonList={addonList}
                    checkForUpdate={checkForUpdate}
                />
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
                                storeKey={storeKey}
                                checkForUpdate={checkForUpdate}
                            />
                        ))}
                    </Table.Body>
                </Table>
            </Tab.Pane>
        )
    );
};
