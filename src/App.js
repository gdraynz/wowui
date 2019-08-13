import React, { useState, useRef, useEffect } from "react";
import { Table, Grid, Button, Input, Icon, Dropdown } from "semantic-ui-react";
import _ from "lodash";

const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

const Store = window.require("electron-store");
const addonStore = new Store();

const Addon = props => {
    const [loading, setLoading] = useState(false);
    const refName = useRef(props.name);
    const refUrl = useRef(props.url);
    const refVersion = useRef(props.version);
    const refAuthor = useRef(props.author);
    const refDownloads = useRef(props.downloads);
    const refMDownloads = useRef(props.mDownloads);
    const [latestVersion, setLatestVersion] = useState(props.version);

    useEffect(() => {
        setLoading(true);
        fetch(
            "https://api.mmoui.com/v3/game/WOW/filedetails/" +
                props.id +
                ".json"
        )
            .then(response => response.json())
            .then(data => data[0])
            .then(addon => {
                refName.current = addon.UIName;
                refUrl.current = addon.UIDownload;
                refAuthor.current = addon.UIAuthorName;
                refDownloads.current = addon.UIHitCount;
                refMDownloads.current = addon.UIHitCountMonthly;
                setLatestVersion(addon.UIVersion);
            })
            .then(() => {
                addonStore.set("addons." + props.id, {
                    id: props.id,
                    name: refName.current,
                    downloadUrl: refUrl.current,
                    version: refVersion.current,
                    author: refAuthor.current,
                    downloads: refDownloads.current,
                    mDownloads: refMDownloads.current
                });
            })
            .then(() => setLoading(false));
    }, [props.id]);

    const install = () => {
        setLoading(true);
        ipcRenderer.send("download", {
            url: refUrl.current,
            properties: { directory: addonStore.get("path") }
        });
        ipcRenderer.on("download complete", (event, file) => {
            extract(file, { dir: addonStore.get("path") }, err => {
                if (err) console.log(err);
                // Cleanup zip file silently
                setTimeout(() => {
                    try {
                        fs.unlinkSync(file);
                    } catch (err) {}
                }, 1000);
                refVersion.current = latestVersion;
                addonStore.set("addons." + props.id, {
                    id: props.id,
                    name: refName.current,
                    downloadUrl: refUrl.current,
                    version: refVersion.current,
                    author: refAuthor.current,
                    downloads: refDownloads.current,
                    mDownloads: refMDownloads.current
                });
                setLoading(false);
            });
        });
    };

    const installButton =
        latestVersion !== props.version ? (
            // Update available
            <Button
                color="blue"
                loading={loading}
                disabled={loading}
                onClick={() => install()}
            >
                <Icon name="download" />
                {props.version + " -> " + latestVersion}
            </Button>
        ) : (
            <Button
                color="green"
                loading={loading}
                disabled={loading}
                onClick={() => install()}
            >
                <Icon name="download" />
                {props.version}
            </Button>
        );

    return (
        <Table.Row>
            <Table.Cell collapsing>
                <Button
                    color="red"
                    icon="trash alternate"
                    onClick={() => addonStore.delete("addons." + props.id)}
                />
            </Table.Cell>
            <Table.Cell>{refName.current}</Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {refAuthor.current}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {refDownloads.current}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {refMDownloads.current}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {installButton}
            </Table.Cell>
        </Table.Row>
    );
};

const AddonSearch = props => {
    const [loading, setLoading] = useState(false);
    const { addonList, ...childProps } = props;

    const customSearch = (options, query) => {
        if (query.length < 2) {
            return [];
        }
        const re = new RegExp(_.escapeRegExp(query), "i");
        return addonList.filter(item => re.test(item.text));
    };

    const fetchAddon = async uid => {
        setLoading(true);
        const response = await fetch(
            "https://api.mmoui.com/v3/game/WOW/filedetails/" + uid + ".json"
        );
        let data = await response.json();
        data = data[0];
        addonStore.set("addons." + data.UID, {
            id: data.UID,
            name: data.UIName,
            downloadUrl: data.UIDownload,
            version: data.UIVersion,
            author: data.UIAuthorName,
            downloads: data.UIDownloadTotal,
            mDownloads: data.UIDownloadMonthly
        });
        setLoading(false);
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
            {...childProps}
        />
    );
};

const App = () => {
    const [addons, setAddons] = useState([]);
    const [addonList, setAddonList] = useState([]);

    addonStore.onDidAnyChange((newValue, oldValue) => {
        setAddons(Object.values(newValue.addons));
    });

    useEffect(() => {
        setAddons(Object.values(addonStore.get("addons", {})));
        fetch("https://api.mmoui.com/v3/game/WOW/filelist.json")
            .then(response => response.json())
            .then(data =>
                setAddonList(
                    data.map(item => ({
                        key: item.UID,
                        value: item.UID,
                        text: item.UIName,
                        description:
                            "Monthly downloads: " + item.UIDownloadMonthly
                    }))
                )
            );
    }, []);

    return (
        <Grid centered style={{ marginTop: "5vh" }}>
            <Grid.Column width={14}>
                <AddonSearch addonList={addonList} />
                <Table selectable celled>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell />
                            <Table.HeaderCell>Name</Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center">
                                Author
                            </Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center">
                                Total downloads
                            </Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center">
                                Monthly downloads
                            </Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center" />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {addons.map(addon => (
                            <Addon key={addon.id} {...addon} />
                        ))}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell colSpan={10}>
                                <Input
                                    fluid
                                    defaultValue={addonStore.get("path")}
                                    placeholder="Path to WoW addons folder"
                                    onChange={(e, { value }) =>
                                        addonStore.set("path", value)
                                    }
                                />
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Footer>
                </Table>
            </Grid.Column>
        </Grid>
    );
};

export default App;
