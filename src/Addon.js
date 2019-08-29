import React, { useState, useEffect, useRef } from "react";
import { Table, Button, Icon } from "semantic-ui-react";

import { AddonStore, InstallButton } from "./utils";

const numberWithSpaces = s =>
    s ? s.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

export const Addon = props => {
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState(props.version);
    const refLatestVersion = useRef(null);

    const checkForUpdate = props.checkForUpdate;

    useEffect(() => {
        const stopListening = AddonStore.onDidChange(
            [props.storeKey, props.id, "version"].join("."),
            (newValue, oldValue) => {
                // Avoid if this is a deletion event
                if (newValue !== undefined) {
                    setVersion(newValue);
                }
            }
        );
        return () => stopListening();
    }, [props.storeKey, props.id]);

    useEffect(() => {
        setLoading(true);
        checkForUpdate(props.id, props.version).then(v => {
            refLatestVersion.current = v;
            setLoading(false);
        });
    }, [checkForUpdate, props.id, props.version]);

    return (
        <Table.Row>
            <Table.Cell collapsing>
                <Button
                    color="red"
                    icon="trash alternate"
                    onClick={() =>
                        AddonStore.delete(props.storeKey + "." + props.id)
                    }
                />
            </Table.Cell>
            <Table.Cell>
                {props.websiteUrl ? (
                    <a
                        href={props.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Icon name="external alternate" />
                        {props.name}
                    </a>
                ) : (
                    props.name
                )}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                {numberWithSpaces(props.downloadCount)}
            </Table.Cell>
            <Table.Cell collapsing textAlign="center">
                <InstallButton
                    storeKey={props.storeKey}
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
