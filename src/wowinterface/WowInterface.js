import React, { useState, useEffect, useCallback } from "react";
import { Table, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { Addon } from "../Addon";
import { AddonStore, useGameVersion } from "../utils";

const BASESTOREKEY = "addons.wowinterface";

const AddonSearch = (props) => {
    const customSearch = (options, query) => {
        if (query.length < 2) {
            return [];
        }
        const re = new RegExp(_.escapeRegExp(query), "i");
        return props.addonList.filter((item) => re.test(item.text));
    };

    return (
        <Dropdown
            fluid
            selection
            options={[]}
            search={customSearch}
            minCharacters={2}
            placeholder="Search addon"
            onChange={(_, { value }) => props.checkForUpdate(value, null)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const WITab = (props) => {
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
        fetch("https://api.mmoui.com/v3/game/WOW/filelist.json")
            .then((response) => response.json())
            .then((data) =>
                setAddonList(
                    data.map((item) => ({
                        key: item.UID,
                        value: item.UID,
                        text: item.UIName,
                    }))
                )
            );
        return () => stopListening();
    }, [storeKey]);

    const checkForUpdate = useCallback(
        async (id, currentVersion) => {
            const response = await fetch(
                "https://api.mmoui.com/v3/game/WOW/filedetails/" + id + ".json"
            );
            const data = await response.json();
            const addon = data[0];
            AddonStore.set([storeKey, id].join("."), {
                id: id,
                name: addon.UIName,
                version: currentVersion,
                latestVersion: addon.UIVersion,
                downloadUrl: addon.UIDownload,
                downloadCount: addon.UIHitCount,
                websiteUrl: null,
            });
            return addon.UIVersion;
        },
        [storeKey]
    );

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
        )
    );
};
