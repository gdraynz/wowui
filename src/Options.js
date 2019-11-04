import React, { useState, useRef } from "react";
import {
    Dropdown,
    Icon,
    Modal,
    Form,
    TextArea,
    Button
} from "semantic-ui-react";

import { AddonStore, availableGameVersions } from "./utils";

const SITENAMES = ["curseforge", "wowinterface", "tukui"];

const ExportOption = () => {
    const [exportValue, setExportValue] = useState("");

    const exportStore = () => {
        const sites = [];
        Object.keys(availableGameVersions).forEach(version => {
            const addons = AddonStore.get([version, "addons"].join("."));
            SITENAMES.forEach(site => {
                if (
                    addons &&
                    addons[site] &&
                    Object.keys(addons[site]).length > 0
                )
                    sites.push(
                        [
                            version,
                            site,
                            Object.keys(addons[site]).join(",")
                        ].join(":")
                    );
            });
        });
        setExportValue(btoa(sites.join("|")));
    };

    return (
        <Modal
            onOpen={exportStore}
            trigger={
                <Dropdown.Item>
                    <Icon name="upload" />
                    Export
                </Dropdown.Item>
            }
        >
            <Modal.Header>Export</Modal.Header>
            <Modal.Content>
                <Form>
                    <TextArea disabled value={exportValue} />
                </Form>
            </Modal.Content>
        </Modal>
    );
};

const ImportOption = () => {
    const [opened, setOpened] = useState(false);
    const refValue = useRef("");

    const importStore = () => {
        const string = atob(refValue.current);
        const values = string.split("|");

        Object.keys(availableGameVersions).forEach(key =>
            AddonStore.delete([key, "addons"].join("."))
        );

        values.map(item => {
            /*
             * Split into:
             * <version>:<site>:<addon1>,<addon2>,...
             */
            const data = item.split(":");
            const addons = {};
            data[2].split(",").map(id => {
                addons[id] = { id: id };
                return null;
            });
            AddonStore.set([data[0], "addons", data[1]].join("."), addons);
            return null;
        });
        setOpened(false);
    };

    const close = () => setOpened(false);

    return (
        <React.Fragment>
            <Dropdown.Item onClick={() => setOpened(true)}>
                <Icon name="download" />
                Import
            </Dropdown.Item>
            <Modal onClose={close} open={opened}>
                <Modal.Header>Import</Modal.Header>
                <Modal.Content>
                    <Form>
                        <TextArea
                            placeholder="Exported text"
                            onChange={(e, { value }) =>
                                (refValue.current = value)
                            }
                        />
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button color="green" onClick={importStore}>
                        Import
                    </Button>
                </Modal.Actions>
            </Modal>
        </React.Fragment>
    );
};

const ResetOption = () => {
    const [opened, setOpened] = useState(false);

    const resetData = () => {
        Object.keys(availableGameVersions).forEach(key =>
            AddonStore.delete([key, "addons"].join("."))
        );
        setOpened(false);
    };

    const close = () => setOpened(false);

    return (
        <React.Fragment>
            <Dropdown.Item onClick={() => setOpened(true)}>
                <Icon name="refresh" color="red" />
                <span style={{ color: "red" }}>Reset data</span>
            </Dropdown.Item>
            <Modal onClose={close} open={opened} size="mini">
                <Modal.Content>Are you sure ?</Modal.Content>
                <Modal.Actions>
                    <Button color="green" onClick={resetData}>
                        Reset
                    </Button>
                    <Button color="red" onClick={close}>
                        Cancel
                    </Button>
                </Modal.Actions>
            </Modal>
        </React.Fragment>
    );
};

export const Options = () => {
    return (
        <Dropdown className="button icon" icon="options">
            <Dropdown.Menu>
                <ExportOption />
                <ImportOption />
                <Dropdown.Divider />
                <ResetOption />
            </Dropdown.Menu>
        </Dropdown>
    );
};

/*
Y2xhc3NpYzpjdXJzZWZvcmdlOjMyNzc2NXxjbGFzc2ljOndvd2ludGVyZmFjZTozODk2LDU1NDF8Y2xhc3NpYzp0dWt1aToyMywyNnxyZXRhaWw6Y3Vyc2Vmb3JnZTp8cmV0YWlsOnR1a3VpOjM0
*/
