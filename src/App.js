import React, { useState, useRef, useEffect } from "react";
import { Table, Grid, Input } from "semantic-ui-react";

import { AddonStore } from "./Store";
// import { WIAddonSearch, WIAddon } from "./WowInterface";
import { CFAddonSearch, CFAddon } from "./CurseForge";

const App = () => {
    const [addons, setAddons] = useState([]);
    // const [addonList, setAddonList] = useState([]);
    const refPathTimeout = useRef(null);

    // AddonStore.clear();

    AddonStore.onDidAnyChange((newValue, oldValue) => {
        if (newValue.addons) setAddons(Object.values(newValue.addons));
    });

    useEffect(() => {
        setAddons(Object.values(AddonStore.get("addons", {})));
        // fetch("https://api.mmoui.com/v3/game/WOW/filelist.json")
        //     .then(response => response.json())
        //     .then(data =>
        //         setAddonList(
        //             data.map(item => ({
        //                 key: item.UID,
        //                 value: item.UID,
        //                 text: item.UIName,
        //                 description:
        //                     "Monthly downloads: " + item.UIDownloadMonthly
        //             }))
        //         )
        //     );
    }, []);

    const updatePath = path => {
        clearTimeout(refPathTimeout.current);
        refPathTimeout.current = setTimeout(() => {
            AddonStore.set("path", path);
            refPathTimeout.current = null;
        }, 500);
    };

    return (
        <Grid centered style={{ marginTop: "5vh" }}>
            <Grid.Column width={14}>
                <CFAddonSearch />
                <Table selectable celled>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell />
                            <Table.HeaderCell collapsing>Name</Table.HeaderCell>
                            <Table.HeaderCell>Summary</Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center">
                                Downloads
                            </Table.HeaderCell>
                            <Table.HeaderCell collapsing textAlign="center" />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {addons.map(addon => (
                            <CFAddon key={addon.id} {...addon} />
                        ))}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell colSpan={10}>
                                <Input
                                    fluid
                                    defaultValue={AddonStore.get("path")}
                                    placeholder="Path to WoW addons folder"
                                    onChange={(e, { value }) =>
                                        updatePath(value)
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
