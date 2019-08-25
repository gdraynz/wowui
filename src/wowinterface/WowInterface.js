import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { AddonStore, InstallButton } from "../utils";

const STOREKEY = "addons.wowinterface";

const fetchAddon = async (id, currentVersion) => {
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
        downloadCount: addon.UIHitCount
    });
    return addon.UIVersion;
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
            <Table.Cell>{props.name}</Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {props.downloadCount}
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

    const customSearch = (options, query) => {
        if (query.length < 2) {
            return [];
        }
        const re = new RegExp(_.escapeRegExp(query), "i");
        return props.addonList.filter(item => re.test(item.text));
    };

    const fetchAddon = id => {
        setLoading(true);
        fetchAddon(id, null).then(v => {
            setLoading(false);
        });
    };

    return (
        <Dropdown
            fluid
            selection
            options={[]}
            search={customSearch}
            loading={loading}
            minCharacters={2}
            placeholder="Search addon"
            onChange={(_, { value }) => fetchAddon(value)}
            selectOnBlur={false}
            selectOnNavigation={false}
        />
    );
};

export const WITab = props => {
    const [addons, setAddons] = useState([]);
    const [addonList, setAddonList] = useState([]);
    const refTimer = useRef(null);

    useEffect(() => {
        AddonStore.onDidChange(STOREKEY, (newValue, oldValue) => {
            clearTimeout(refTimer.current);
            refTimer.current = setTimeout(() => {
                setAddons(Object.values(newValue || {}));
                refTimer.current = null;
            }, 100);
        });
        setAddons(Object.values(AddonStore.get(STOREKEY, {})));
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
    );
};
