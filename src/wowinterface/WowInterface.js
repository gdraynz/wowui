import React, { useState, useEffect } from "react";
import { Table, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { Addon } from "../Addon";
import { AddonStore } from "../utils";

const STOREKEY = "addons.wowinterface";

const checkForUpdate = async (id, currentVersion) => {
    const response = await fetch(
        "https://api.mmoui.com/v3/game/WOW/filedetails/" + id + ".json"
    );
    const data = await response.json();
    const addon = data[0];
    AddonStore.set([STOREKEY, id].join("."), {
        id: id,
        name: addon.UIName,
        version: currentVersion,
        latestVersion: addon.UIVersion,
        downloadUrl: addon.UIDownload,
        downloadCount: addon.UIHitCount,
        websiteUrl: null
    });
    return addon.UIVersion;
};

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
            minCharacters={2}
            placeholder="Search addon"
            onChange={(_, { value }) => checkForUpdate(value)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const WITab = props => {
    const [addons, setAddons] = useState(
        Object.values(AddonStore.get(STOREKEY, {}))
    );
    const [addonList, setAddonList] = useState([]);

    useEffect(() => {
        AddonStore.onDidChange(STOREKEY, (newValue, oldValue) =>
            setAddons(Object.values(newValue || {}))
        );
        fetch("https://api.mmoui.com/v3/game/WOW/filelist.json")
            .then(response => response.json())
            .then(data =>
                setAddonList(
                    data.map(item => ({
                        key: item.UID,
                        value: item.UID,
                        text: item.UIName
                    }))
                )
            );
    }, []);

    return (
        addonList && (
            <Tab.Pane {...props}>
                <AddonSearch addonList={addonList} />
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
        )
    );
};
