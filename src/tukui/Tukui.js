import React, { useState, useEffect } from "react";
import { Table, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { Addon } from "../Addon";
import { AddonStore } from "../utils";

const STOREKEY = "addons.tukui";

const checkForUpdate = async (id, currentVersion) => {
    const response = await fetch(
        "https://www.tukui.org/api.php?classic-addon=" + id
    );
    const addon = await response.json();
    AddonStore.set([STOREKEY, id].join("."), {
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
            onChange={(_, { value }) => checkForUpdate(value, null)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const TukuiTab = props => {
    const [addons, setAddons] = useState(
        Object.values(AddonStore.get(STOREKEY, {}))
    );
    const [addonList, setAddonList] = useState([]);

    useEffect(() => {
        AddonStore.onDidChange(STOREKEY, (newValue, oldValue) =>
            setAddons(Object.values(newValue || {}))
        );
        fetch("https://www.tukui.org/api.php?classic-addons=all")
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
