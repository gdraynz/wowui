import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Icon, Dropdown, Tab } from "semantic-ui-react";

import { AddonStore, InstallButton, numberWithSpaces } from "../utils";

const STOREKEY = "addons.curseforge";
const GAMEVERSION = "1.13.2";

/*
Unofficial twitch api doc:
    https://twitchappapi.docs.apiary.io
*/

const fetchAddon = async (id, currentVersion) => {
    const response = await fetch(
        "https://addons-ecs.forgesvc.net/api/v2/addon/" + id
    );
    const data = await response.json();

    // Pick only the latest file with the right game version
    let latestFile = {};
    const BreakException = {};
    try {
        data.latestFiles.forEach(file => {
            file.gameVersion.forEach(version => {
                if (version === GAMEVERSION) {
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
                    GAMEVERSION +
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

    return (
        <Dropdown
            fluid
            selection
            search
            onSearchChange={customSearch}
            loading={loading}
            placeholder="Search addon"
            options={refAddonList.current}
            onChange={(_, { value }) => fetchAddon(value, null)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const CFTab = props => {
    const [addons, setAddons] = useState([]);
    const refTimer = useRef(null);

    useEffect(() => {
        setAddons(Object.values(AddonStore.get(STOREKEY, {})));
        const stopListening = AddonStore.onDidChange(
            STOREKEY,
            (newValue, oldValue) => {
                clearTimeout(refTimer.current);
                refTimer.current = setTimeout(() => {
                    setAddons(Object.values(newValue || {}));
                    refTimer.current = null;
                }, 100);
            }
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
                        <Addon key={addon.id} {...addon} />
                    ))}
                </Table.Body>
            </Table>
        </Tab.Pane>
    );
};
