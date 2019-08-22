import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Icon, Dropdown, Tab } from "semantic-ui-react";
import _ from "lodash";

import { AddonStore, InstallButton } from "../utils";

const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

const STOREKEY = "addons.wowinterface";

const updateAddon = async (id, currentVersion) => {
    const response = await fetch(
        "https://api.mmoui.com/v3/game/WOW/filedetails/" + id + ".json"
    );
    const data = await response.json();
    const addon = data[0];
    AddonStore.set(STOREKEY + "." + id, {
        id: id,
        name: addon.UIName,
        downloadUrl: addon.UIDownload,
        version: currentVersion || addon.UIVersion,
        downloads: addon.UIHitCount
    });
    return addon.UIVersion;
};

const Addon = props => {
    const [loading, setLoading] = useState(false);
    const refVersion = useRef(props.version);
    const refLatestVersion = useRef(props.version);

    useEffect(() => {
        setLoading(true);
        updateAddon(props.id, props.version).then(v => {
            refLatestVersion.current = v;
            setLoading(false);
        });
    }, [props.id, props.version]);

    const install = async () => {
        const promise = new Promise(resolve => {
            const path = AddonStore.get("path");
            ipcRenderer.send("download", {
                url: props.downloadUrl,
                properties: { directory: path }
            });
            ipcRenderer.once("download complete", (event, file) => {
                extract(file, { dir: path }, err => {
                    if (err) console.log(err);
                    // Silently remove zip file
                    try {
                        fs.unlinkSync(file);
                    } catch (e) {}
                    refVersion.current = refLatestVersion.current;
                    AddonStore.set(
                        [STOREKEY, props.id, "version"].join("."),
                        refVersion.current
                    );
                    resolve();
                });
            });
        });
        await promise;
    };

    const installButton =
        refLatestVersion.current !== props.version ? (
            // Update available
            <InstallButton
                color="green"
                loading={loading}
                disabled={loading}
                onClick={async () => await install()}
            >
                <Icon name="download" />
                {props.version + " -> " + refLatestVersion.current}
            </InstallButton>
        ) : (
            <InstallButton
                color="blue"
                loading={loading}
                disabled={loading}
                onClick={async () => await install()}
            >
                <Icon name="download" />
                {props.version}
            </InstallButton>
        );

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
                {props.downloads}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {installButton}
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
        updateAddon(id, null).then(v => {
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
                if (newValue) setAddons(Object.values(newValue));
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
