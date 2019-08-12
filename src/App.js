import React, { useState, useRef, useEffect } from "react";
import { Table, Grid, Button, Input } from "semantic-ui-react";

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
    const [editing, setEditing] = useState(props.editing || false);
    const [loading, setLoading] = useState(false);
    const refName = useRef(props.name);
    const refURL = useRef(props.url);
    const refVersion = useRef(props.version);

    const validate = editing => {
        setEditing(false);
        setLoading(true);
        fetch(refURL.current)
            .then(response => response.text())
            // Get name
            .then(html => {
                const results = html.match(/<title>(?<name>[^:]*) .*<\/title>/);
                refName.current = results.groups.name.trim();
                return html;
            })
            // Get version
            .then(html => {
                const results = html.match(
                    /<div id="version">Version: (?<version>[\w.]+)<\/div>/
                );
                refVersion.current = results.groups.version;
                return html;
            })
            .then(() => setLoading(false))
            .then(() =>
                props.addAddon({
                    name: refName.current,
                    url: refURL.current,
                    version: refVersion.current
                })
            )
            .catch(err => {
                console.log(err);
                setLoading(false);
            });
    };

    const urlField = editing ? (
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

    return (
        <Table.Row>
            <Table.Cell collapsing>
                <Button
                    color="red"
                    icon="trash alternate"
                    onClick={() => props.removeAddon(refName.current)}
                />
            </Table.Cell>
            <Table.Cell collapsing>{refName.current}</Table.Cell>
            <Table.Cell>{urlField}</Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {refVersion.current}
            </Table.Cell>
            <Table.Cell collapsing>
                <Button
                    color={editing ? "green" : "blue"}
                    icon={editing ? "check" : "edit outline"}
                    loading={loading}
                    disabled={loading}
                    onClick={() => (editing ? validate() : setEditing(true))}
                />
            </Table.Cell>
        </Table.Row>
    );
};

const App = () => {
    const [addons, setAddons] = useState([]);

    addonStore.onDidAnyChange((newValue, oldValue) => {
        setAddons(Object.values(newValue));
    });

    const addAddon = addon => {
        addonStore.set(addon.name, addon);
    };

    const removeAddon = addonName => {
        addonStore.delete(addonName);
    };

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
                            <Table.HeaderCell collapsing>
                                Version
                            </Table.HeaderCell>
                            <Table.HeaderCell />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {addons.map((addon, i) => (
                            <Addon
                                key={addon.name || "unknown"}
                                {...addon}
                                addAddon={addAddon}
                                removeAddon={removeAddon}
                            />
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
                                        setAddons([
                                            ...addons,
                                            { editing: true }
                                        ]);
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
