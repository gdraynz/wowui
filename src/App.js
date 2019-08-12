import React, { useState, useRef, useEffect } from "react";
import { Table, Grid, Button, Input, Icon } from "semantic-ui-react";

const AdmZip = window.require("adm-zip");

const Store = window.require("electron-store");
const addonStore = new Store();

// const fs = window.require("fs");

// onClick={() =>
//     fs.readdir("/tmp/addons", (err, files) => {
//         if (err) {
//             console.log("Unable to scan directory: " + err);
//         }
//         files.forEach(file => console.log(file));
//     })
// }

const Addon = props => {
    const [loading, setLoading] = useState(false);
    const refNew = useRef(props.new || false);
    const refNeedUpdate = useRef(props.version ? false : true);
    const refID = useRef(
        props.id ||
            Math.random()
                .toString(36)
                .substring(2, 15)
    );
    const refName = useRef(props.name);
    const refURL = useRef(props.url);
    const refVersion = useRef(props.version);

    const id = refID.current;

    const fetchInformations = () => {
        refNew.current = false;
        setLoading(true);
        fetch(refURL.current)
            .then(response => response.text())
            .then(html => {
                let match = null;
                // Get name
                match = html.match(/<title>(?<name>[^:]*) .*<\/title>/);
                refName.current = match.groups.name.trim();
                // Get version
                match = html.match(
                    /<div id="version">Version: (?<version>[\w.]+)<\/div>/
                );
                refVersion.current = match.groups.version;
                if (refVersion.current !== props.version) {
                    refNeedUpdate.current = true;
                }
            })
            .then(() => {
                addonStore.set(id, {
                    id: id,
                    name: refName.current,
                    url: refURL.current,
                    version: props.version
                });
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
            });
    };

    const install = async () => {
        setLoading(true);
        // Get URL domain
        let match = refURL.current.match(/(?<domain>https:\/\/[\w.]+)\/.*/);
        const domain = match.groups.domain;

        // Get download page
        let response = await fetch(refURL.current);
        let html = await response.text();
        match = html.match(
            /<a href="(?<path>\/downloads\/[\w-]+)">Download<\/a>/
        );
        const downloadPage = domain + match.groups.path;

        // Get download URL
        response = await fetch(downloadPage);
        html = await response.text();
        match = html.match(
            /(?<downloadUrl>https:\/\/cdn\.wowinterface\.com\/downloads\/.*\/(?<zipName>.*\.zip))/
        );
        const { downloadUrl, zipName } = match.groups;

        // Download ZIP
        console.log(downloadUrl);
        response = await fetch(downloadUrl);
        const zipData = await response.arrayBuffer();
        console.log(zipData.byteLength);

        let buf = Buffer.alloc(zipData.byteLength);
        let view = new Uint8Array(zipData);
        for (let i = 0; i < buf.length; ++i) {
            buf[i] = view[i];
        }

        console.log(Buffer.isBuffer(buf));

        const zip = new AdmZip(buf);
        console.log(zip.getEntries());
        // zip.extractAllTo("/tmp/addons/");

        setLoading(false);
    };

    const urlField = refNew.current ? (
        <Input
            fluid
            placeholder="URL"
            defaultValue={refURL.current}
            onChange={(e, data) => (refURL.current = data.value)}
        />
    ) : (
        <a href={refURL.current} target="_blank" rel="noopener noreferrer">
            {refURL.current}
        </a>
    );

    const installButton = refNew.current ? (
        // Setup URL
        <Button
            color="green"
            icon="check"
            loading={loading}
            disabled={loading}
            onClick={() => fetchInformations()}
        />
    ) : refNeedUpdate.current ? (
        !props.version ? (
            // First install
            <Button
                color="green"
                icon="download"
                loading={loading}
                disabled={loading}
                onClick={() => install()}
            />
        ) : (
            // Update available
            <Button
                color="green"
                loading={loading}
                disabled={loading}
                onClick={() => install()}
            >
                <Icon name="download" />
                {props.version + " -> " + refVersion.current}
            </Button>
        )
    ) : (
        // Check for updates
        <Button
            color="blue"
            loading={loading}
            disabled={loading}
            onClick={() => fetchInformations()}
        >
            <Icon name="refresh" />
            {refVersion.current}
        </Button>
    );

    return (
        <Table.Row>
            <Table.Cell collapsing>
                <Button
                    color="red"
                    icon="trash alternate"
                    onClick={() => addonStore.delete(id)}
                />
            </Table.Cell>
            <Table.Cell collapsing>{refName.current}</Table.Cell>
            <Table.Cell>{urlField}</Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {installButton}
            </Table.Cell>
        </Table.Row>
    );
};

const App = () => {
    const [addons, setAddons] = useState([]);

    addonStore.onDidAnyChange((newValue, oldValue) => {
        setAddons(Object.values(newValue));
    });

    useEffect(() => {
        setAddons(Object.values(addonStore.store));
    }, []);

    return (
        <Grid centered style={{ marginTop: "5vh" }}>
            <Grid.Column width={14}>
                <Table selectable celled>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell />
                            <Table.HeaderCell collapsing>Name</Table.HeaderCell>
                            <Table.HeaderCell>URL</Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center" />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {addons.map(addon => (
                            <Addon key={addon.id || "unknown"} {...addon} />
                        ))}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell colSpan={10}>
                                <Button
                                    floated="right"
                                    color="red"
                                    icon="delete"
                                    onClick={() => {
                                        addonStore.clear();
                                        setAddons([]);
                                    }}
                                />
                                <Button
                                    floated="right"
                                    color="blue"
                                    icon="plus"
                                    onClick={() => {
                                        setAddons([...addons, { new: true }]);
                                    }}
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
