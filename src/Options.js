import React, { useState, useRef } from "react";
import {
    Dropdown,
    Icon,
    Modal,
    Form,
    TextArea,
    Button
} from "semantic-ui-react";

import { AddonStore } from "./utils";

const ExportOption = () => {
    const [exportValue, setExportValue] = useState("");

    const exportStore = () => {
        const addons = AddonStore.get("addons");
        const sites = [];
        if (addons.curseforge)
            sites.push(
                "curseforge:" + Object.keys(addons.curseforge).join(",")
            );
        if (addons.wowinterface)
            sites.push(
                "wowinterface:" + Object.keys(addons.wowinterface).join(",")
            );
        if (addons.tukui)
            sites.push("tukui:" + Object.keys(addons.tukui).join(","));
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
        values.map(item => {
            const data = item.split(":");
            const key = "addons." + data[0] + ".";
            data[1].split(",").map(id => {
                AddonStore.set(key + id, { id: id });
                return null;
            });
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
        AddonStore.delete("addons.curseforge");
        AddonStore.delete("addons.wowinterface");
        AddonStore.delete("addons.tukui");
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
