import React, { useState, useRef, useEffect } from "react";
import { Table, Button, Icon, Dropdown, Tab } from "semantic-ui-react";

import { AddonStore } from "../Store";

const ipcRenderer = window.require("electron").ipcRenderer;
const fs = window.require("fs");
const extract = window.require("extract-zip");

/*
Unofficial twitch api doc:
	https://twitchappapi.docs.apiary.io
*/

const updateAddon = async (id, currentVersion) => {
	const response = await fetch(
		"https://addons-ecs.forgesvc.net/api/v2/addon/" + id
	);
	const data = await response.json();
	const latestFile = data.latestFiles[0] || {};
	AddonStore.set("addons.cf." + id, {
		id: id,
		name: data.name,
		summary: data.summary,
		version: currentVersion || latestFile.displayName,
		downloadUrl: latestFile.downloadUrl,
		downloadCount: data.downloadCount
	});
	return latestFile.displayName;
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

	const install = () => {
		setLoading(true);
		ipcRenderer.send("download", {
			url: props.downloadUrl,
			properties: { directory: AddonStore.get("path") }
		});
		ipcRenderer.on("download complete", (event, file) => {
			extract(file, { dir: AddonStore.get("path") }, err => {
				if (err) console.log(err);
				// Cleanup zip file silently
				setTimeout(() => {
					try {
						fs.unlinkSync(file);
					} catch (err) {
						console.log(err);
					}
				}, 1000);
				refVersion.current = refLatestVersion.current;
				AddonStore.set("addons.cf." + props.id, {
					id: props.id,
					name: props.name,
					version: refVersion.current,
					summary: props.summary,
					downloadUrl: props.downloadUrl,
					downloadCount: props.downloadCount
				});
				setLoading(false);
			});
		});
	};

	const installButton =
		refLatestVersion.current !== props.version ? (
			// Update available
			<Button
				color="green"
				loading={loading}
				disabled={loading || props.downloadUrl === null}
				onClick={() => install()}
			>
				<Icon name="download" />
				{props.version + " -> " + refLatestVersion.current}
			</Button>
		) : (
			<Button
				color="blue"
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
					onClick={() => AddonStore.delete("addons.cf." + props.id)}
				/>
			</Table.Cell>
			<Table.Cell collapsing>{props.name}</Table.Cell>
			<Table.Cell>{props.summary}</Table.Cell>
			<Table.Cell collapsing textAlign="center">
				{props.downloadCount}
			</Table.Cell>
			<Table.Cell collapsing textAlign="center">
				{installButton}
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
				"https://addons-ecs.forgesvc.net/api/v2/addon/search?gameId=1&searchFilter=" +
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
			onChange={(_, { value }) => updateAddon(value, null)}
		/>
	);
};

export const CFTab = props => {
	const [addons, setAddons] = useState([]);
	const refTimer = useRef(null);

	AddonStore.onDidChange("addons.cf", (newValue, oldValue) => {
		clearTimeout(refTimer.current);
		refTimer.current = setTimeout(() => {
			if (newValue) setAddons(Object.values(newValue));
			refTimer.current = null;
		}, 100);
	});

	useEffect(() => {
		setAddons(Object.values(AddonStore.get("addons.cf", {})));
	}, []);

	return (
		<Tab.Pane {...props}>
			<AddonSearch />
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
						<Addon key={addon.id} {...addon} />
					))}
				</Table.Body>
			</Table>
		</Tab.Pane>
	);
};
