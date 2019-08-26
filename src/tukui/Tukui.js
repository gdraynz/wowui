import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Icon, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { AddonStore, InstallButton, numberWithSpaces } from "../utils";

const STOREKEY = "addons.tukui";

const fetchAddon = async (id, currentVersion) => {
    const response = await fetch(
        "https://www.tukui.org/api.php?classic-addon= " + id
    );
    const addon = await response.json();
    AddonStore.set([STOREKEY, id].join("."), {
        id: id,
        name: addon.name,
        version: currentVersion || addon.version,
        downloadUrl: addon.url,
        downloadCount: addon.downloads,
        websiteUrl: addon.web_url
    });
    return addon.version;
};

const Addon = props => {
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState(props.version);
    const refLatestVersion = useRef(null);

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            [STOREKEY, props.id, "version"].join("."),
            (newValue, oldValue) => {
                // Avoid if this is a deletion event
                if (newValue !== undefined) {
                    setVersion(newValue);
                }
            }
        );
        return () => stopListening();
    }, [props.id]);

    useEffect(() => {
        setLoading(true);
        fetchAddon(props.id, version).then(v => {
            refLatestVersion.current = v;
            setLoading(false);
        });
    }, [props.id, version]);

    return (
        <Table.Row>
            <Table.Cell collapsing>
                <Button
                    color="red"
                    icon="trash alternate"
                    onClick={() => AddonStore.delete(STOREKEY + "." + props.id)}
                />
            </Table.Cell>
            <Table.Cell>
                <a
                    href={props.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Icon name="external alternate" />
                    {props.name}
                </a>
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {numberWithSpaces(props.downloadCount)}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                <InstallButton
                    storeKey={STOREKEY}
                    addon={{
                        id: props.id,
                        version: version,
                        latestVersion: refLatestVersion.current,
                        downloadUrl: props.downloadUrl
                    }}
                    loading={loading}
                />
            </Table.Cell>
        </Table.Row>
    );
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
            onChange={(_, { value }) => fetchAddon(value, null)}
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
                            <Addon key={addon.id} {...addon} />
                        ))}
                    </Table.Body>
                </Table>
            </Tab.Pane>
        )
    );
};
